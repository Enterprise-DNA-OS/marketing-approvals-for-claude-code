import fs from 'node:fs';
import {parseCsv} from './csv.mjs';
export const reads={
 briefs:'select code,name,campaign,owner,due_on,state,current_version from briefs order by due_on,code',
 'review-queue':"select brief,role,reviewer,due_on,decision,finding from v_reviews where state not in ('released','withdrawn') order by due_on,brief,role",
 'claim-evidence':'select brief,code,statement,kind,valid_until,finding from v_claims order by brief,code',
 'expiry-watch':"select brief,code,valid_until,finding from v_claims where state<>'withdrawn' and (valid_until is null or valid_until<=current_date+30) order by valid_until nulls first,brief",
 'launch-readiness':'select code,name,due_on,state,claim_count,evidence_gaps,review_gaps,review_roles from v_readiness order by due_on,code',
 compliance:'select * from v_compliance order by brief,rule,item',
 attention:"select code,name,owner,due_on,state,evidence_gaps,review_gaps from v_readiness where state not in ('released','withdrawn') and (due_on<current_date or evidence_gaps>0 or review_gaps>0 or review_roles<2 or claim_count=0) order by due_on,code",
 'owner-load':"select owner,count(*)::int as open_briefs,count(*) filter(where due_on<current_date)::int as overdue from briefs where state not in ('released','withdrawn') group by owner order by owner",
 releases:'select b.code,v.version,r.location,r.released_on,r.reference,b.state from release_records r join versions v on v.id=r.version_id join briefs b on b.id=v.brief_id order by r.released_on,b.code',
 history:'select action,entity_id,actor,detail,created_at from audit_log order by created_at,id'
};
export const questions=[
 ['Which overdue launches still have evidence gaps?',"select code,owner,due_on,evidence_gaps from v_readiness where due_on<current_date and evidence_gaps>0 and state<>'withdrawn' order by code"],
 ['Which environmental claims have expired support?',"select brief,code,statement,valid_until from v_claims where kind='environmental' and finding='evidence expired' and state<>'withdrawn' order by code"],
 ['Which reviewers are holding up more than one brief?',"select reviewer,count(distinct brief)::int as waiting from v_reviews where decision<>'approved' and state not in ('released','withdrawn') group by reviewer having count(distinct brief)>1 order by reviewer"],
 ['Which campaigns have overdue work?',"select campaign,count(*)::int as overdue from briefs where due_on<current_date and state not in ('released','withdrawn') group by campaign order by campaign"],
 ['Which briefs have no claim inventory?',"select code,name from v_readiness where claim_count=0 and state<>'withdrawn' order by code"],
 ['Which current versions are missing a required review role?',"select code,current_version,review_roles from v_readiness where review_roles<2 and state<>'withdrawn' order by code"],
 ['Which approved claims need evidence renewed within a month?',"select c.brief,c.code,c.valid_until from v_claims c join v_readiness r on r.code=c.brief where c.valid_until between current_date and current_date+30 and r.review_roles=2 and r.review_gaps=0 and r.state<>'withdrawn' order by c.valid_until,c.code"],
 ['Which owners have both late work and missing evidence?',"select owner,count(*)::int as briefs from v_readiness where due_on<current_date and evidence_gaps>0 and state not in ('released','withdrawn') group by owner order by owner"],
 ['Which briefs need changes rather than another reminder?',"select brief,role,reviewer,decision from v_reviews where decision in ('changes','rejected') and state not in ('released','withdrawn') order by brief,role"],
 ['Which imported briefs still need local review?',"select code,name,source_id,state from briefs where source_id is not null and state in ('draft','review') order by code"]
];
export const tables=['briefs','versions','claims','substantiations','review_requests','decisions','release_records','notes','audit_log'];
export function required(o,k){const v=String(o[k]??'').trim();if(!v)throw Error(`Missing --${k}`);return v;}
export function day(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Use a real date YYYY-MM-DD');return v;}
const today=()=>new Date().toISOString().slice(0,10);
function past(v){day(v);if(v>today())throw Error('Recorded event cannot be in the future');return v;}
const canonical=x=>JSON.stringify(Object.entries(x).sort(([a],[b])=>a.localeCompare(b)));
export async function match(db,entity,value){
 const fields={briefs:['code','name'],claims:['code','statement']}[entity];if(!fields)throw Error('Unknown entity');
 const rows=await db.query(`select * from ${entity} order by id`);const q=String(value).toLowerCase();
 let found=rows.filter(r=>[r.id,...fields.map(f=>r[f])].some(x=>String(x).toLowerCase()===q));
 if(!found.length)found=rows.filter(r=>String(r.id).startsWith(q)||fields.some(f=>String(r[f]).toLowerCase().includes(q)));
 if(found.length!==1)throw Error(`${found.length?'Ambiguous':'No'} ${entity} match: ${value}\n`+(found.length?found:rows).map(r=>`${r.id} | ${fields.map(f=>r[f]).join(' | ')}`).join('\n'));
 return found[0];
}
async function current(db,b){return (await db.query('select * from versions where brief_id=$1 and version=$2',[b.id,b.current_version]))[0];}
export async function run(db,cmd,args=[],o={}){
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='insights'){const results=[];for(const [question,sql]of questions)results.push({question,rows:await db.query(sql)});return results;}
 if(cmd==='brief'){const b=await match(db,'briefs',args[0]||required(o,'brief'));return {brief:b,versions:await db.query('select * from versions where brief_id=$1 order by version',[b.id]),claims:await db.query('select * from v_claims where brief=$1',[b.code]),reviews:await db.query('select * from v_reviews where brief=$1',[b.code]),notes:await db.query('select * from notes where brief_id=$1 order by created_at',[b.id])};}
 if(cmd==='export'){await db.exec('BEGIN READ ONLY');try{const data={format:'marketing-approvals-v1',exported_at:new Date().toISOString()};for(const t of tables)data[t]=await db.query(`select * from ${t} order by id`);return data;}finally{await db.exec('ROLLBACK');}}
 const actor=required(o,'actor');
 await db.exec('BEGIN');
 try{
 const insert=async(sql,p)=>(await db.query(sql+' returning *',p))[0];let result,entity;
 const create=async d=>{
 const b=await insert('insert into briefs(code,name,owner,campaign,jurisdiction,due_on,source_id,source_data) values($1,$2,$3,$4,$5,$6,$7,$8)',[d.code,d.name,d.owner,d.campaign,d.jurisdiction,day(d.due),d.source_id||null,d.source_data||null]);
 await insert('insert into versions(brief_id,version,copy,channel,evidence_ref) values($1,1,$2,$3,$4)',[b.id,d.copy,d.channel,d.reference]);return b;
 };
 if(cmd==='add')result=await create(Object.fromEntries(['code','name','owner','campaign','jurisdiction','due','copy','channel','reference'].map(k=>[k,required(o,k)])));
 else if(cmd==='import'){
 if(args[0]!=='intelligencebank'||!args[1])throw Error('Use import intelligencebank <CSV> --map=<JSON> --actor=<operator>');
 const map=JSON.parse(fs.readFileSync(required(o,'map'),'utf8'));const rows=parseCsv(fs.readFileSync(args[1],'utf8'));if(!rows.length)throw Error('CSV has no records');
 const keys=['source_id','code','name','owner','campaign','jurisdiction','due','copy','channel','reference'];
 for(const k of keys)if(!map[k]||!Object.hasOwn(rows[0],map[k]))throw Error(`Missing mapped CSV column for ${k}`);
 let imported=0,unchanged=0;const seen=new Set();
 for(const row of rows){const d=Object.fromEntries(keys.map(k=>[k,String(row[map[k]]??'').trim()]));for(const k of keys)if(!d[k])throw Error(`Empty ${k}`);day(d.due);if(seen.has(d.source_id))throw Error(`Repeated source ID ${d.source_id}`);seen.add(d.source_id);
 const old=(await db.query('select * from briefs where source_id=$1',[d.source_id]))[0];
 if(old){if(canonical(old.source_data)!==canonical(row))throw Error(`Changed source ${d.source_id}: reconcile before re-import`);unchanged++;continue;}
 await create({...d,source_data:row});imported++;
 }result={imported,unchanged,dry_run:Boolean(o['dry-run'])};
 }else{
 const b=await match(db,'briefs',required(o,'brief'));await db.query('select id from briefs where id=$1 for update',[b.id]);
 // Reload after acquiring the lock so decisions cannot attach to a stale version.
 const fresh=(await db.query('select * from briefs where id=$1',[b.id]))[0];const v=await current(db,fresh);entity=b.id;
 if(cmd==='log')result=await insert('insert into notes(brief_id,body,actor) values($1,$2,$3)',[b.id,required(o,'body'),actor]);
 else if(cmd==='withdraw'){
 required(o,'reference');required(o,'reason');result=(await db.query("update briefs set state='withdrawn' where id=$1 returning *",[b.id]))[0];
 }else{
 if(fresh.state==='withdrawn')throw Error('Withdrawn brief: create a new brief for new work');
 if(cmd==='revise'){
 const version=fresh.current_version+1;result=await insert('insert into versions(brief_id,version,copy,channel,evidence_ref) values($1,$2,$3,$4,$5)',[b.id,version,required(o,'copy'),required(o,'channel'),required(o,'reference')]);
 await db.query("update briefs set current_version=$2,state='draft' where id=$1",[b.id,version]);
 }else if(cmd==='record-release'){
 const r=(await db.query('select * from v_readiness where id=$1',[b.id]))[0];
 if(!r.claim_count||r.evidence_gaps||r.review_gaps||r.review_roles!==2)throw Error('Not ready: inventory claims, renew evidence and record brand/legal approvals for this version');
 const released=past(required(o,'date'));
 const approvals=await db.query('select decided_on from v_reviews where brief=$1',[b.code]);
 if(approvals.some(x=>x.decided_on>released))throw Error('Release predates recorded approval');
 const evidence=await db.query('select checked_on,valid_until from v_claims where brief=$1',[b.code]);
 if(evidence.some(x=>x.checked_on>released||x.valid_until<released))throw Error('Evidence must cover the release date');
 result=await insert('insert into release_records(version_id,location,released_on,reference,actor) values($1,$2,$3,$4,$5)',[v.id,required(o,'location'),released,required(o,'reference'),actor]);
 await db.query("update briefs set state='released' where id=$1",[b.id]);
 }else{
 if(fresh.state==='released')throw Error('Revise the released brief before changing its review records');
 if(cmd==='add-claim'){
 if((await db.query('select 1 from review_requests where version_id=$1',[v.id])).length)throw Error('Claims are frozen once review starts: revise first');
 result=await insert('insert into claims(version_id,code,statement,kind) values($1,$2,$3,$4)',[v.id,required(o,'code'),required(o,'statement'),required(o,'kind')]);
 }else if(cmd==='evidence'){
 const c=await match(db,'claims',required(o,'claim'));if(c.version_id!==v.id)throw Error('Claim is not on this current brief version');
 // New evidence after decisions changes the basis of approval and requires a new version.
 if((await db.query('select 1 from decisions d join review_requests r on r.id=d.request_id where r.version_id=$1',[v.id])).length)throw Error('Decisions already exist: revise before changing evidence');
 result=await insert('insert into substantiations(claim_id,reference,explanation,checked_on,valid_until,reviewer) values($1,$2,$3,$4,$5,$6)',[c.id,required(o,'reference'),required(o,'explanation'),past(required(o,'date')),day(required(o,'until')),required(o,'reviewer')]);
 }else if(cmd==='request-review'){
 result=await insert('insert into review_requests(version_id,reviewer,role,due_on) values($1,$2,$3,$4)',[v.id,required(o,'reviewer'),required(o,'role'),day(required(o,'due'))]);
 await db.query("update briefs set state='review' where id=$1",[b.id]);
 }else if(cmd==='decision'){
 const r=(await db.query('select * from review_requests where version_id=$1 and lower(reviewer)=lower($2) and role=$3',[v.id,required(o,'reviewer'),required(o,'role')]))[0];if(!r)throw Error('No matching review request on current version');
 result=await insert('insert into decisions(request_id,decision,reference,rationale,decided_on) values($1,$2,$3,$4,$5)',[r.id,required(o,'decision'),required(o,'reference'),required(o,'rationale'),past(required(o,'date'))]);
 }else throw Error(`Unknown command ${cmd}`);
 }
 }
 }
 await db.query('insert into audit_log(action,entity_id,actor,detail) values($1,$2,$3,$4)',[cmd,entity||result?.id||null,actor,{args,options:o,result}]);
 await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(error){await db.exec('ROLLBACK');throw error;}
}

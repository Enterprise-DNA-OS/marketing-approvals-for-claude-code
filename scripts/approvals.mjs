#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {run,reads} from './lib/domain.mjs';
import {table} from './lib/format.mjs';
const [cmd,...rest]=process.argv.slice(2);const options={},args=[];
for(const x of rest){if(x.startsWith('--')){const i=x.indexOf('=');options[x.slice(2,i<0?undefined:i)]=i<0?true:x.slice(i+1);}else args.push(x);}
export function display(data){
 if(Array.isArray(data)){if(!data.length)return '(none)';if(data[0].question)return data.map(x=>x.question+'\n'+display(x.rows)).join('\n\n');return table(data,Object.keys(data[0]).filter(k=>!['id','source_data','created_at','updated_at','copy'].includes(k)).map(key=>({key,label:key,width:72})));}
 if(data&&typeof data==='object')return Object.entries(data).map(([k,v])=>`${k}: ${typeof v==='object'?'\n'+display(v):v??''}`).join('\n');return String(data??'');
}
if(!cmd||cmd==='help'){console.log('Read: '+[...Object.keys(reads),'brief','insights'].join(', ')+'\nWrite: add, revise, add-claim, evidence, request-review, decision, record-release, withdraw, log, import intelligencebank <CSV> --map=<JSON>\nFiles: export --out=<JSON>, draft-chase, draft-brief --brief=<code>, weekly-review\nAll writes need --actor=<operator>. Flags use --name=value. --json prints machine-readable output.');process.exit(0);}
let db;
try{
 db=await getDb();let data;
 if(['draft-chase','draft-brief','weekly-review'].includes(cmd)){
 const sections=cmd==='draft-brief'?{brief:await run(db,'brief',[],options)}:cmd==='draft-chase'?{'review queue':await run(db,'review-queue')}:{attention:await run(db,'attention'),'claim evidence':await run(db,'claim-evidence'),'review queue':await run(db,'review-queue')};
 const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true,mode:0o700});
 const file=path.join(dir,`${cmd}-${Date.now()}-${process.pid}.md`);fs.writeFileSync(file,`# ${cmd}\n\nDRAFT. Recorded data only. Review before using. Nothing has been sent or published.\n\n`+display(sections)+'\n',{flag:'wx',mode:0o600});data={file};
 }else{
 data=await run(db,cmd,args,options);
 if(cmd==='export'&&options.out){fs.writeFileSync(path.resolve(options.out),JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});data={file:path.resolve(options.out)};}
 }
 console.log(options.json?JSON.stringify(data,null,2):display(data));
}catch(error){console.error(error.message);process.exitCode=1;}finally{if(db)await db.close();}

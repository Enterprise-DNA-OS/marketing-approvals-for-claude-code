create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create function immutable_record() returns trigger language plpgsql as $$ begin raise exception 'Append a correction; evidence history cannot be overwritten'; end $$;
create table briefs (
 id uuid primary key default gen_random_uuid(), code text not null unique check(length(trim(code))>0),
 name text not null, owner text not null, campaign text not null, jurisdiction text not null check(jurisdiction in ('NZ','AU','other')),
 due_on date not null, state text not null default 'draft' check(state in ('draft','review','released','withdrawn')),
 current_version integer not null default 1 check(current_version>0), source_id text unique, source_data jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table versions (
 id uuid primary key default gen_random_uuid(), brief_id uuid not null references briefs(id), version integer not null check(version>0),
 copy text not null check(length(trim(copy))>0), channel text not null, evidence_ref text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(brief_id,version)
);
create table claims (
 id uuid primary key default gen_random_uuid(), version_id uuid not null references versions(id), code text not null unique,
 statement text not null check(length(trim(statement))>0), kind text not null check(kind in ('performance','price','environmental','other')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table substantiations (
 id uuid primary key default gen_random_uuid(), claim_id uuid not null references claims(id), reference text not null check(length(trim(reference))>0),
 explanation text not null check(length(trim(explanation))>0), checked_on date not null, valid_until date not null, reviewer text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(valid_until>=checked_on)
);
create table review_requests (
 id uuid primary key default gen_random_uuid(), version_id uuid not null references versions(id), reviewer text not null,
 role text not null check(role in ('brand','legal')), due_on date not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(version_id,role,reviewer)
);
create table decisions (
 id uuid primary key default gen_random_uuid(), sequence bigint generated always as identity unique,
 request_id uuid not null references review_requests(id), decision text not null check(decision in ('approved','changes','rejected')),
 reference text not null check(length(trim(reference))>0), rationale text not null check(length(trim(rationale))>0), decided_on date not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table release_records (
 id uuid primary key default gen_random_uuid(), version_id uuid not null references versions(id), location text not null,
 released_on date not null, reference text not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table notes (
 id uuid primary key default gen_random_uuid(), brief_id uuid not null references briefs(id), body text not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table audit_log (
 id uuid primary key default gen_random_uuid(), action text not null, entity_id uuid, actor text not null, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger briefs_touch before update on briefs for each row execute function touch_updated();
do $$ declare t text; begin
 foreach t in array array['versions','claims','substantiations','review_requests','decisions','release_records','notes','audit_log'] loop
 execute format('create trigger keep_history before update or delete on %I for each row execute function immutable_record()',t);
 end loop;
 foreach t in array array['briefs','versions','claims','substantiations','review_requests','decisions','release_records','notes','audit_log'] loop
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
end $$;
create index on versions(brief_id);
create index on claims(version_id);
create index on substantiations(claim_id);
create index on review_requests(version_id);
create index on decisions(request_id,sequence desc);
create view v_claims as
 select b.code as brief,b.owner,b.state,b.jurisdiction,v.version,c.id,c.code,c.statement,c.kind,
 e.reference,e.checked_on,e.valid_until,e.reviewer,
 case when e.id is null then 'missing evidence' when e.valid_until<current_date then 'evidence expired' else 'evidence recorded' end as finding
 from briefs b join versions v on v.brief_id=b.id and v.version=b.current_version join claims c on c.version_id=v.id
 left join lateral(select * from substantiations s where s.claim_id=c.id order by checked_on desc,created_at desc,id desc limit 1)e on true;
create view v_reviews as
 select b.code as brief,b.name,b.owner,b.state,v.version,r.id,r.role,r.reviewer,r.due_on,
 coalesce(d.decision,'pending') as decision,d.reference,d.decided_on,
 case when d.decision='approved' then 'recorded approval' when d.decision in ('changes','rejected') then d.decision when r.due_on<current_date then 'overdue' else 'pending' end as finding
 from briefs b join versions v on v.brief_id=b.id and v.version=b.current_version join review_requests r on r.version_id=v.id
 left join lateral(select * from decisions d where d.request_id=r.id order by sequence desc limit 1)d on true;
create view v_readiness as
 select b.id,b.code,b.name,b.campaign,b.owner,b.due_on,b.state,b.current_version,
 (select count(*)::int from v_claims c where c.brief=b.code) as claim_count,
 (select count(*)::int from v_claims c where c.brief=b.code and c.finding<>'evidence recorded') as evidence_gaps,
 (select count(*)::int from v_reviews r where r.brief=b.code and r.decision<>'approved') as review_gaps,
 (select count(distinct role)::int from v_reviews r where r.brief=b.code) as review_roles
 from briefs b;
create view v_compliance as
 select brief,'NZ-FTA-12A / AU-ACL-18'::text as rule,finding,code as item from v_claims where finding<>'evidence recorded' and state<>'withdrawn'
 union all select code,'LOCAL-CLAIM-INVENTORY','No claims inventoried',code from v_readiness where claim_count=0 and state<>'withdrawn'
 union all select code,'LOCAL-TWO-REVIEWS','Brand and legal review required',code from v_readiness where review_roles<2 and state<>'withdrawn'
 union all select brief,'LOCAL-VERSION-REVIEW',finding,role||': '||reviewer from v_reviews where decision<>'approved' and state<>'withdrawn';
revoke all on v_claims,v_reviews,v_readiness,v_compliance from public;

insert into briefs(id,code,name,owner,campaign,jurisdiction,due_on,state) values
 ('10000000-0000-4000-8000-000000000001','PACK-01','Refill pack launch','Maya Chen','Spring refill','NZ',current_date-3,'review'),
 ('10000000-0000-4000-8000-000000000002','TRADE-02','Wholesale delivery promise','Alex Reed','Trade launch','AU',current_date+4,'review'),
 ('10000000-0000-4000-8000-000000000003','PACK-03','Refill pack follow-up','Maya Chen','Spring refill','NZ',current_date+10,'draft') on conflict do nothing;
insert into versions(id,brief_id,version,copy,channel,evidence_ref)
 select ('20000000-0000-4000-8000-'||lpad(row_number() over(order by code)::text,12,'0'))::uuid,id,1,
 case code when 'PACK-01' then 'Our refill uses 40% less packaging by weight than our standard pack.' when 'TRADE-02' then 'Delivery in two working days to metro destinations.' else 'Refill pack follow-up announcement.' end,
 'email draft','fictional://creative/'||code from briefs where code in ('PACK-01','TRADE-02','PACK-03') on conflict do nothing;
insert into claims(id,version_id,code,statement,kind)
 select ('30000000-0000-4000-8000-'||case b.code when 'PACK-01' then '000000000001' else '000000000002' end)::uuid,v.id,b.code||'-C1',v.copy,case b.code when 'PACK-01' then 'environmental' else 'performance' end
 from versions v join briefs b on b.id=v.brief_id where b.code in ('PACK-01','TRADE-02') on conflict do nothing;
insert into substantiations(id,claim_id,reference,explanation,checked_on,valid_until,reviewer) values
 ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','fictional://lab/pack-weight-v1','Comparison on an older packaging specification',current_date-120,current_date-10,'Riley Shah') on conflict do nothing;
insert into review_requests(id,version_id,role,reviewer,due_on)
 select ('50000000-0000-4000-8000-'||lpad(row_number()over(order by b.code,r.role)::text,12,'0'))::uuid,v.id,r.role,r.reviewer,current_date-2
 from versions v join briefs b on b.id=v.brief_id cross join (values ('brand','Jo Hall'),('legal','Riley Shah'))r(role,reviewer) where b.code in ('PACK-01','TRADE-02') on conflict do nothing;
insert into decisions(id,request_id,decision,reference,rationale,decided_on)
 select '60000000-0000-4000-8000-000000000001',r.id,'changes','fictional://review/pack-v1','Refresh the weight comparison before this claim is used',current_date-1 from review_requests r join versions v on v.id=r.version_id join briefs b on b.id=v.brief_id where b.code='PACK-01' and r.role='legal' on conflict do nothing;

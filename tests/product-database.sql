-- All fixtures, including accounts, are rolled back. No messages or payments.
begin;
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); ba uuid; bb uuid; ja uuid; jb uuid; ca uuid; qa uuid;
begin
 insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values(a,'product-test-'||a||'@example.test','{"first_name":"Test","last_name":"A"}','{}'),(b,'product-test-'||b||'@example.test','{"first_name":"Test","last_name":"B"}','{}');
 update auth.users set email_confirmed_at=now() where id in(a,b);
 insert into public.businesses(owner_id,name,profession,onboarding_completed,onboarding_step,default_profit_margin,minimum_profit_margin) values(a,'Product test A','Camcı',true,4,30,20) returning id into ba;
 insert into public.businesses(owner_id,name,profession,onboarding_completed,onboarding_step,default_profit_margin,minimum_profit_margin) values(b,'Product test B','Camcı',true,4,30,20) returning id into bb;
 -- Transaction-only plan fixture lets search cover more than the production free quota.
 insert into public.subscriptions(business_id,plan_id,status,provider,provider_subscription_id,current_period_end) values(ba,'usta','active','test',a::text,now()+interval '1 month');
 insert into public.customers(business_id,name) values(ba,'Aranan Müşteri') returning id into ca;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 ja:=public.save_manual_job(null,ca,'Manual test','Description','[{"name":"Cam","category":"material","quantity":2,"unit_cost":1234.56},{"name":"İşçilik","category":"labor","quantity":1,"unit_cost":500}]');
 if (select estimated_cost from public.jobs where id=ja)<>2969.12 then raise exception 'Manual cents regression';end if;
 perform public.save_job_pricing(ja,30,20,4300,false);
 qa:=public.save_quote_with_tax_rate(null,ja,'ready','Base quote','Description','[{"name":"Cam montajı","description":"Test"}]','[]','1 gün','İş bitiminde',current_date+7,'',null,false,'included',20);
 insert into public.quotes(business_id,job_id,customer_id,quote_number,status,title,sale_price,estimated_cost_snapshot,estimated_profit_snapshot,profit_margin_snapshot,target_margin_snapshot,minimum_margin_snapshot,valid_until,created_at)
 select ba,ja,ca,'TEST-'||i,case when i=1 then 'rejected' else 'ready' end,case when i=250 then 'OldestUnique' else 'Test quote '||i end,4300,2969.12,1330.88,30.95,30,20,case when i=2 then current_date-1 else current_date+7 end,now()-i*interval '1 hour' from generate_series(1,250) i;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 jb:=public.save_manual_job(null,null,'Other owner job','','[{"name":"Other cost","category":"other","quantity":1,"unit_cost":100}]');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 perform set_config('test.a',a::text,true);perform set_config('test.b',b::text,true);perform set_config('test.ba',ba::text,true);perform set_config('test.bb',bb::text,true);perform set_config('test.ja',ja::text,true);perform set_config('test.jb',jb::text,true);perform set_config('test.qa',qa::text,true);
end $$;
set local role authenticated;
do $$
declare result jsonb; cloned uuid; revision uuid; entry uuid; blocked boolean; public_data jsonb;
begin
 result:=public.search_my_quotes('OldestUnique','all',1);
 if (result->>'count')::integer<>1 or jsonb_array_length(result->'rows')<>1 then raise exception 'Oldest quote search failed';end if;
 result:=public.search_my_quotes('Aranan Müşteri','all',1);
 if (result->>'count')::integer<>251 or jsonb_array_length(result->'rows')<>30 then raise exception 'Customer search or paging failed';end if;
 result:=public.search_my_quotes('','all',9);
 if jsonb_array_length(result->'rows')<>11 then raise exception 'Last page failed';end if;
 if (public.search_my_quotes('','expired',1)->>'count')::integer<>1 then raise exception 'Expired filter failed';end if;
 if (public.search_my_quotes('','rejected',1)->>'count')::integer<>1 then raise exception 'Rejected filter failed';end if;
 result:=public.create_service_packages(current_setting('test.qa')::uuid,'[{"name":"Ekonomik","scope":"Temel montaj","cost":2000,"price":3000},{"name":"Standart","scope":"Standart montaj","cost":3000,"price":4500},{"name":"Kapsamlı","scope":"Ek işler dahil","cost":4000,"price":6000}]',false);
 perform set_config('test.package',(result->0->>'id'),true);
 if jsonb_array_length(result)<>3 or (select count(*) from public.quotes where id in(select (value->>'id')::uuid from jsonb_array_elements(result)) and status='draft')<>3 then raise exception 'Package drafts failed';end if;
 if exists(select 1 from public.jobs where id=current_setting('test.jb')::uuid) then raise exception 'Cross owner jobs readable';end if;
 cloned:=public.copy_my_job(current_setting('test.ja')::uuid);
 if (select estimated_cost from public.jobs where id=cloned)<>2969.12 or (select count(*) from public.job_cost_breakdown where job_id=cloned)<>2 then raise exception 'Job clone failed';end if;
 if (select selected_sale_price from public.jobs where id=cloned) is not null then raise exception 'Clone carried stale price';end if;
 revision:=public.copy_my_quote(current_setting('test.qa')::uuid,true);
 if not exists(select 1 from public.quotes where id=revision and parent_quote_id=current_setting('test.qa')::uuid and revision_number=2 and status='draft' and sent_at is null and tax_mode='included' and tax_rate=20) then raise exception 'Revision clone failed';end if;
 insert into public.work_entries(business_id,job_id,quote_id,kind,title) values(current_setting('test.ba')::uuid,current_setting('test.ja')::uuid,current_setting('test.qa')::uuid,'followup','Test followup') returning id into entry;
 blocked:=false;begin insert into public.work_entries(business_id,job_id,kind,title) values(current_setting('test.ba')::uuid,current_setting('test.jb')::uuid,'note','Bad link');exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Foreign job accepted';end if;
 blocked:=false;begin perform public.copy_my_job(current_setting('test.jb')::uuid);exception when raise_exception then blocked:=true;end;
 if not blocked then raise exception 'Foreign clone accepted';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.b'),'role','authenticated')::text,true);
 if exists(select 1 from public.work_entries where id=entry) then raise exception 'Foreign work entry readable';end if;
 update public.work_entries set status='done' where id=entry;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.a'),'role','authenticated')::text,true);
 if not exists(select 1 from public.work_entries where id=entry and status='open') then raise exception 'Foreign work entry modified';end if;
 blocked:=false;begin
 insert into public.job_viewers(business_id,job_id,invited_email) values(current_setting('test.ba')::uuid,current_setting('test.jb')::uuid,'invalid@example.test');
 exception when insufficient_privilege then blocked:=true;end;
 if not blocked then raise exception 'Foreign team assignment permitted';end if;
 insert into public.job_viewers(business_id,job_id,invited_email,token_hash) values(current_setting('test.ba')::uuid,current_setting('test.ja')::uuid,'product-test-'||current_setting('test.b')||'@example.test',encode(extensions.digest(repeat('a',64),'sha256'),'hex'));
 if public.accept_job_invite(repeat('a',64)) then raise exception 'Wrong email accepted invite';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.b'),'role','authenticated')::text,true);
 if not public.accept_job_invite(repeat('a',64)) then raise exception 'Correct invite denied';end if;
 result:=public.get_assigned_jobs();
 if jsonb_array_length(result)<>1 or result->0->>'title'<>'Manual test' or result->0 ? 'estimated_cost' or result->0 ? 'salePrice' then raise exception 'Team projection failed';end if;
 if exists(select 1 from public.jobs where id=current_setting('test.ja')::uuid) then raise exception 'Member could read full owner job';end if;
 if public.accept_job_invite(repeat('a',64)) then raise exception 'Invite reuse permitted';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.a'),'role','authenticated')::text,true);
 delete from public.job_viewers where job_id=current_setting('test.ja')::uuid;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.b'),'role','authenticated')::text,true);
 if jsonb_array_length(public.get_assigned_jobs())<>0 then raise exception 'Revoked member retained access';end if;
end $$;
reset role;
do $$ declare payload jsonb; begin
 payload:=public.get_public_quote_details((select public_token from public.quotes where id=current_setting('test.qa')::uuid));
 if payload->>'taxMode'<>'included' or (payload->>'taxRate')::numeric<>20 or payload ? 'estimated_cost_snapshot' or payload ? 'profit_margin_snapshot' then raise exception 'Public projection failed';end if;
 if has_function_privilege('anon','public.save_manual_job(uuid,uuid,text,text,jsonb)','execute') then raise exception 'Anonymous write permitted';end if;
 if has_function_privilege('authenticated','public.get_product_cohorts()','execute') then raise exception 'Owner admin analytics permitted';end if;
end $$;

set local role authenticated;
do $$ begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.a'),'role','authenticated')::text,true);
 perform public.publish_service_packages(current_setting('test.package')::uuid,false);
end $$;
reset role;
do $$ declare token uuid;other_token uuid;p jsonb;blocked boolean;begin
 select public_token into token from public.quotes where id=current_setting('test.package')::uuid;
 p:=public.get_public_quote_details(token);
 if jsonb_array_length(p->'packageOptions')<>3 or p->'packageOptions'->0 ? 'estimated_cost_snapshot' then raise exception 'Package projection failed';end if;
 select public_token into other_token from public.quotes where package_group_id=(select package_group_id from public.quotes where public_token=token) and public_token<>token limit 1;
 if public.respond_to_package_quote(token,'accept',null,null)<>'accepted' then raise exception 'Package selection failed';end if;
 blocked:=false;begin perform public.respond_to_package_quote(other_token,'accept',null,null);exception when raise_exception then blocked:=true;end;
 if not blocked then raise exception 'Second package selected';end if;
 if (select count(*) from public.quotes where package_group_id=(select package_group_id from public.quotes where public_token=token) and status='cancelled')<>2 then raise exception 'Alternative packages remained open';end if;
end $$;
-- Automatic expenses and explicit team note permission.
update public.quotes set status='accepted',accepted_at=now() where id=current_setting('test.qa')::uuid;
update public.jobs set status='in_progress',accepted_quote_id=current_setting('test.qa')::uuid where id=current_setting('test.ja')::uuid;
set local role authenticated;
do $$ declare lines jsonb; blocked boolean; e uuid; begin
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.a'),'role','authenticated')::text,true);
 select jsonb_agg(jsonb_build_object('estimatedId',id,'totalCost',total_cost::text)) into lines from public.job_cost_breakdown where job_id=current_setting('test.ja')::uuid;
 insert into public.work_entries(business_id,job_id,kind,title,amount) values(current_setting('test.ba')::uuid,current_setting('test.ja')::uuid,'expense','Parking',100) returning id into e;
 perform public.save_actual_job_costs(current_setting('test.ja')::uuid,lines,'');
 if (select actual_cost from public.jobs where id=current_setting('test.ja')::uuid)<>3069.12 then raise exception 'Expense omitted'; end if;
 perform public.save_actual_job_costs(current_setting('test.ja')::uuid,lines,'');
 if (select actual_cost from public.jobs where id=current_setting('test.ja')::uuid)<>3069.12 then raise exception 'Expense duplicated'; end if;
 update public.work_entries set amount=150 where id=e;
 if (select actual_cost from public.jobs where id=current_setting('test.ja')::uuid)<>3119.12 then raise exception 'Expense update stale'; end if;
 delete from public.work_entries where id=e;
 if (select actual_cost from public.jobs where id=current_setting('test.ja')::uuid)<>2969.12 then raise exception 'Deleted expense retained'; end if;
 insert into public.job_viewers(business_id,job_id,invited_email,user_id) values(current_setting('test.ba')::uuid,current_setting('test.ja')::uuid,'product-test-'||current_setting('test.b')||'@example.test',current_setting('test.b')::uuid);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.b'),'role','authenticated')::text,true);
 blocked:=false; begin perform public.add_assigned_job_note(current_setting('test.ja')::uuid,'Blocked',''); exception when raise_exception then blocked:=true;end;
 if not blocked then raise exception 'View-only member wrote note';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.a'),'role','authenticated')::text,true);
 update public.job_viewers set can_add_notes=true where job_id=current_setting('test.ja')::uuid;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.b'),'role','authenticated')::text,true);
 perform public.add_assigned_job_note(current_setting('test.ja')::uuid,'Shared note','Installation done');
 if jsonb_array_length(public.get_assigned_jobs()->0->'notes')<>1 then raise exception 'Shared note missing';end if;
 blocked:=false;begin perform public.add_assigned_job_note(current_setting('test.jb')::uuid,'Other job','');exception when raise_exception then blocked:=true;end;
 if not blocked then raise exception 'Unassigned member wrote note';end if;
end $$;
reset role;
rollback;
select 'PASS: manual precision, 251 quote search/pagination, filters, copying, revisions, package drafts, cross-business denial, team invite identity/reuse/revocation, public projection and anonymous permissions; fixtures rolled back' as result;

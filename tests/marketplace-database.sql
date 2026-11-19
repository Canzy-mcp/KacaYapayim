begin;

do $$
declare
  relation regclass;
begin
  foreach relation in array array[
    'private.market_categories'::regclass, 'private.market_providers'::regclass,
    'private.market_requests'::regclass, 'private.market_offers'::regclass,
    'private.market_messages'::regclass, 'private.market_reviews'::regclass,
    'private.market_favorites'::regclass, 'private.market_notices'::regclass,
    'private.market_reports'::regclass, 'private.market_moderation_actions'::regclass
  ] loop
    if not (select relrowsecurity from pg_class where oid=relation)
      or has_table_privilege('anon', relation, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE')
      or has_table_privilege('authenticated', relation, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE')
    then raise exception 'Marketplace table access configuration changed for %', relation; end if;
  end loop;
end;
$$;

insert into auth.users(id,email,raw_user_meta_data) values
  ('91000000-0000-0000-0000-000000000001','market-buyer@example.test','{"first_name":"Müşteri"}'),
  ('91000000-0000-0000-0000-000000000002','market-provider1@example.test','{}'),
  ('91000000-0000-0000-0000-000000000003','market-provider2@example.test','{}'),
  ('91000000-0000-0000-0000-000000000004','market-other@example.test','{}'),
  ('91000000-0000-0000-0000-000000000005','market-admin@example.test','{}');
insert into public.businesses(owner_id,name,onboarding_completed,onboarding_step) values
  ('91000000-0000-0000-0000-000000000002','Test Tesisat',true,4),
  ('91000000-0000-0000-0000-000000000003','Diğer Tesisat',true,4);
insert into public.platform_admins(user_id) values ('91000000-0000-0000-0000-000000000005');
insert into private.market_reports(id,reporter_id,reason,created_at)
  values ('91000000-0000-0000-0000-000000000099','91000000-0000-0000-0000-000000000005','Queue ordering fixture',now()-interval '1 day');

set local role anon;
do $$
begin
  if public.market_directory('{}')->'categories' is null then raise exception 'Anonymous directory unavailable'; end if;
  if has_function_privilege('anon','public.market_write(text,jsonb)','execute')
    or has_function_privilege('anon','public.market_read(text,uuid,integer)','execute')
    then raise exception 'Private marketplace data exposed directly'; end if;
end;
$$;
reset role;
set local role authenticated;

do $$
declare
  customer uuid := '91000000-0000-0000-0000-000000000001';
  tradesperson uuid := '91000000-0000-0000-0000-000000000002';
  competitor uuid := '91000000-0000-0000-0000-000000000003';
  stranger uuid := '91000000-0000-0000-0000-000000000004';
  admin uuid := '91000000-0000-0000-0000-000000000005';
  listing uuid := gen_random_uuid();
  direct uuid := gen_random_uuid();
  provider uuid;
  other_provider uuid;
  job uuid;
  copied uuid;
  accepted jsonb;
  detail jsonb;
  proposal text := to_char((now() at time zone 'Europe/Istanbul') + interval '1 day','YYYY-MM-DD"T"HH24:MI');
  report uuid;
  payload jsonb := '{"category":"tesisat","title":"Musluk değişimi","body":"Mutfak musluğu sökülüp yenisi takılacak.","city":"İstanbul","district":"Kadıköy","address":"Gizli adres 12","amount":"375.50"}';
  denied boolean;
begin
  if has_table_privilege('authenticated','private.market_requests','select')
    or has_table_privilege('authenticated','private.market_messages','select')
    then raise exception 'Private marketplace tables visible to authenticated'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',tradesperson,'role','authenticated','aal','aal1')::text,true);
  provider := public.market_write('profile','{"title":"Test Ustası","body":"Musluk ve su tesisatı","city":"İstanbul","districts":["Kadıköy"],"categories":["tesisat"],"published":true}');
  perform set_config('request.jwt.claims',jsonb_build_object('sub',competitor,'role','authenticated','aal','aal1')::text,true);
  other_provider := public.market_write('profile','{"title":"İkinci Usta","city":"İstanbul","districts":[],"categories":["tesisat"],"published":true}');
  if jsonb_array_length(public.market_directory('{"city":"istanbul","district":"kadıköy","category":"tesisat"}')->'providers')<>2
    or public.market_directory(jsonb_build_object('id',provider))->'providers'->0 ? 'business_id'
    then raise exception 'Directory filtering or privacy failed'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',customer,'role','authenticated','aal','aal1')::text,true);
  if public.market_write('create',payload||jsonb_build_object('id',listing))<>listing
    or public.market_write('create',payload||jsonb_build_object('id',listing))<>listing then raise exception 'Request retry failed'; end if;
  perform public.market_write('create',payload||jsonb_build_object('id',direct,'provider',provider));
  perform public.market_write('favorite',jsonb_build_object('provider',provider));
  if public.market_read('favorite',provider) <> 'true'::jsonb then raise exception 'Favorite missing'; end if;
  perform public.market_write('unfavorite',jsonb_build_object('provider',provider));
  if public.market_read('favorite',provider) <> 'false'::jsonb then raise exception 'Favorite not removed'; end if;
  perform public.market_write('edit',payload||jsonb_build_object('id',listing,'title','Düzenlenmiş musluk ilanı'));
  if jsonb_array_length(public.market_read('own'))<>2 then raise exception 'Customer request list wrong'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',stranger,'role','authenticated','aal','aal1')::text,true);
  if public.market_read('detail',listing) is not null or jsonb_array_length(public.market_read('thread',direct))<>0
    then raise exception 'Request revealed to an unrelated user'; end if;
  denied := false;
  begin perform public.market_write('cancel',jsonb_build_object('id',listing)); exception when raise_exception then denied := true; end;
  if not denied then raise exception 'Unrelated user cancelled listing'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',competitor,'role','authenticated','aal','aal1')::text,true);
  if public.market_read('detail',direct) is not null or jsonb_array_length(public.market_read('feed'))<>1
    then raise exception 'Private call visible to competitor'; end if;
  denied := false;
  begin perform public.market_write('offer',jsonb_build_object('id',direct,'amount','1.25','body','Test offer')); exception when raise_exception then denied := true; end;
  if not denied then raise exception 'Competitor offered on a direct call'; end if;
  perform public.market_write('offer',jsonb_build_object('id',listing,'amount','500.65','body','İkinci ustanın iş kapsamı'));

  perform set_config('request.jwt.claims',jsonb_build_object('sub',tradesperson,'role','authenticated','aal','aal1')::text,true);
  if jsonb_array_length(public.market_read('feed'))<>2 or public.market_read('detail',direct)->'request'->>'address' is not null
    then raise exception 'Matching or address privacy failed'; end if;
  perform public.market_write('decline',jsonb_build_object('id',direct));
  perform public.market_write('offer',jsonb_build_object('id',listing,'amount','450.20','body','İşçilik ve montaj dahil'));
  perform public.market_write('message',jsonb_build_object('id',listing,'provider',provider,'body','Ölçüyü öğrenebilir miyim?'));
  accepted := public.market_read('detail',listing)->'offers'->0;
  if jsonb_array_length(public.market_read('detail',listing)->'offers')<>1 then raise exception 'Competitor price visible'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',competitor,'role','authenticated','aal','aal1')::text,true);
  if jsonb_array_length(public.market_read('thread',listing))<>0 then raise exception 'Competitor read private messages'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',customer,'role','authenticated','aal','aal1')::text,true);
  if jsonb_array_length(public.market_read('detail',listing)->'offers')<>2 or jsonb_array_length(public.market_read('thread',listing))<>1
    then raise exception 'Customer missing offers or conversation'; end if;
  denied := false;
  begin
    perform public.market_write('award',jsonb_build_object('id',listing,'offer',accepted->>'id','version',now()-interval '1 day'));
  exception when raise_exception then denied := true; end;
  if not denied then raise exception 'Stale offer accepted'; end if;
  perform public.market_write('award',jsonb_build_object('id',listing,'offer',accepted->>'id','version',accepted->>'updated_at'));
  if public.market_read('detail',listing)->'request'->>'job_id' is not null
    or public.market_read('detail',listing)->>'winner_name'<>'Test Ustası' then raise exception 'Award projection failed'; end if;
  perform public.market_write('address',jsonb_build_object('id',listing,'body','Yalnızca seçilen usta adresi','share',true));
  perform public.market_write('appointment',jsonb_build_object('id',listing,'at',proposal));
  detail := public.market_read('detail',listing);
  denied := false;
  begin
    perform public.market_write('confirm_appointment',jsonb_build_object('id',listing,'version',detail->'request'->>'appointment_at'));
  exception when raise_exception then denied := true; end;
  if not denied then raise exception 'Appointment proposal self-approved'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',competitor,'role','authenticated','aal','aal1')::text,true);
  if public.market_read('detail',listing)->'request'->>'address' is not null then raise exception 'Address exposed to rejected competitor'; end if;
  if (public.market_read('detail',listing)->'request') ?| array['appointment_at','appointment_proposer','appointment_confirmed','address_shared']
    or exists(select 1 from jsonb_array_elements(public.market_archive('market_requests',null,now())) entry
      where entry->>'key'=listing::text and (entry->'record') ?| array['appointment_at','appointment_proposer','appointment_confirmed','address_shared'])
    then raise exception 'Private scheduling details included in competitor projection'; end if;
  if public.market_archive('market_requests',null,now())->0->'record'->>'address' is not null
    or jsonb_array_length(public.market_archive('market_messages',null,now()))<>0
    then raise exception 'Archive exposed another participant data'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',tradesperson,'role','authenticated','aal','aal1')::text,true);
  detail := public.market_read('detail',listing);
  job := (detail->'request'->>'job_id')::uuid;
  if detail->'request'->>'address'<>'Yalnızca seçilen usta adresi'
    or not exists(select 1 from public.jobs where id=job and status='accepted' and selected_sale_price=450.20)
    then raise exception 'Selected price or allocated job missing'; end if;
  perform public.market_write('confirm_appointment',jsonb_build_object('id',listing,'version',detail->'request'->>'appointment_at'));
  perform public.market_write('start',jsonb_build_object('id',listing));
  perform public.market_write('finish',jsonb_build_object('id',listing));

  perform set_config('request.jwt.claims',jsonb_build_object('sub',customer,'role','authenticated','aal','aal1')::text,true);
  perform public.market_write('complete',jsonb_build_object('id',listing));
  perform public.market_write('address',jsonb_build_object('id',listing,'body','','share',false));
  if public.market_read('detail',listing)->'request'->>'address' is distinct from ''
    then raise exception 'Completed request retained the cleared address'; end if;
  perform public.market_write('review',jsonb_build_object('id',listing,'rating','5','body','İş zamanında tamamlandı.'));
  if public.market_directory(jsonb_build_object('id',provider))->'providers'->0->>'review_count'<>'1'
    then raise exception 'Verified review missing'; end if;
  report := public.market_write('report',jsonb_build_object('id',listing,'body','İncelenmesi istenen kayıt.'));
  perform public.market_write('mark_read','{}');
  if exists(select 1 from jsonb_array_elements(public.market_read('notices')) n where n->>'read_at' is null)
    then raise exception 'Notifications not marked read'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin,'role','authenticated','aal','aal1')::text,true);
  denied := false;
  begin perform public.market_write('moderate',jsonb_build_object('id',report,'decision','suspend')); exception when raise_exception then denied := true; end;
  if not denied then raise exception 'Admin AAL1 moderation accepted'; end if;
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin,'role','authenticated','aal','aal2')::text,true);
  perform public.market_write('moderate',jsonb_build_object('id',report,'decision','hide_review'));
  if jsonb_array_length(public.market_directory(jsonb_build_object('id',provider))->'reviews')<>0
    then raise exception 'Hidden review remains visible'; end if;
  perform public.market_write('moderate',jsonb_build_object('id',report,'decision','suspend'));
  if jsonb_array_length(public.market_directory(jsonb_build_object('id',provider))->'providers')<>0
    then raise exception 'Suspended provider remains visible'; end if;
  perform public.market_write('moderate',jsonb_build_object('id',report,'decision','restore'));
  detail := public.market_read('moderation');
  if detail->0->>'state' is distinct from 'open' or not exists(
    select from jsonb_array_elements(detail) item where item->>'id'=report::text
      and item->>'latest_action'='restore' and item->>'latest_action_at' is not null
  ) then raise exception 'Open-first moderation queue or latest action missing'; end if;
  denied := false;
  begin perform public.market_write('moderate',jsonb_build_object('id',report,'decision','dismiss'));
  exception when raise_exception then denied := sqlerrm='MARKET_STALE'; end;
  if not denied then raise exception 'Closed report accepted stale disposition'; end if;
  denied := false;
  begin perform public.market_write('moderate',jsonb_build_object('id',gen_random_uuid(),'decision','resolve'));
  exception when raise_exception then denied := sqlerrm='MARKET_UNAVAILABLE'; end;
  if not denied then raise exception 'Missing report accepted disposition'; end if;

  perform set_config('request.jwt.claims',jsonb_build_object('sub',tradesperson,'role','authenticated','aal','aal1')::text,true);
  if not exists(select 1 from public.jobs where id=job and status='completed' and completed_at is not null)
    then raise exception 'Completed service job did not reach owner workflow'; end if;
  if public.market_read('detail',listing)->'request'->>'address' is not null
    or exists(select 1 from jsonb_array_elements(public.market_archive('market_requests',null,now())) entry
      where entry->>'key'=listing::text and entry->'record'->>'address' is not null)
    then raise exception 'Revoked address remained available to provider'; end if;
  perform public.save_actual_job_costs(job,'[{"name":"Malzeme","category":"material","totalCost":"50.15"}]');
  if not exists(select 1 from public.jobs where id=job and actual_profit=400.05)
    then raise exception 'Agreed platform price was not used for net profit'; end if;
  copied := public.copy_my_job(job);
  if exists(select 1 from public.jobs where id=copied and input_data ? 'market_request')
    then raise exception 'A copied job inherited the private request link'; end if;
end;
$$;

reset role;
do $$
declare
  provider uuid := (select p.id from private.market_providers p join public.businesses b on b.id=p.business_id
    where b.owner_id='91000000-0000-0000-0000-000000000002');
  listing uuid := (select id from private.market_requests where state='completed');
  buyer uuid := '91000000-0000-0000-0000-000000000001';
  other_reporter uuid := '91000000-0000-0000-0000-000000000004';
begin
  if (select array_agg(action order by id) from private.market_moderation_actions
      where admin_id='91000000-0000-0000-0000-000000000005') is distinct from array['hide_review','suspend','restore']
    then raise exception 'Moderation history differs from committed decisions'; end if;
  delete from auth.users where id='91000000-0000-0000-0000-000000000005';
  if (select count(*) from private.market_moderation_actions where admin_id is null)<>3
    then raise exception 'Deleting a moderator lost decision history'; end if;
  insert into private.market_reports(reporter_id,provider_id,request_id,reason) values
    (buyer,provider,null,'Directory report'), (buyer,provider,listing,'Request report'),
    (other_reporter,provider,null,'Another directory report');
  delete from private.market_requests where id=listing;
  if not exists(select from private.market_reports where reason='Request report' and request_id is null and state='resolved')
    then raise exception 'Removed request did not close its report'; end if;
  delete from auth.users where id in (buyer,other_reporter);
  if (select count(*) from private.market_reports where reporter_id is null and provider_id=provider and state='open')<>2
    then raise exception 'Reporter deletion did not preserve independent open reports'; end if;
end;
$$;
rollback;
select 'PASS: customer listing, private provider call, matching, offer selection, private address and messages, appointment, completion, verified review, notifications and moderation' as result;

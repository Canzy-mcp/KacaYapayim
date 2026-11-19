-- A deleted reporter no longer has an account under which to deduplicate.
-- Close reports when a referenced target disappears so distinct reports do
-- not collapse onto the same remaining target during foreign-key cleanup.
drop index private.market_report_once;
create unique index market_report_once on private.market_reports(reporter_id,provider_id,request_id)
  nulls not distinct where state='open' and reporter_id is not null;

create table private.market_moderation_actions (
  id bigint generated always as identity primary key,
  report_id uuid not null references private.market_reports(id) on delete cascade,
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('resolve','dismiss','hide_review','suspend','restore')),
  created_at timestamptz not null default clock_timestamp()
);
create index market_moderation_actions_latest on private.market_moderation_actions(report_id,id desc);
alter table private.market_moderation_actions enable row level security;
revoke all on private.market_moderation_actions from public,anon,authenticated;
revoke all on sequence private.market_moderation_actions_id_seq from public,anon,authenticated;

create function private.market_report_target_removed() returns trigger
language plpgsql set search_path='' as $$
begin
  new.state := 'resolved';
  return new;
end;
$$;
revoke all on function private.market_report_target_removed() from public,anon,authenticated;
create trigger market_report_target_removed before update of request_id,provider_id on private.market_reports
  for each row when (old.state='open' and (
    (old.request_id is not null and new.request_id is null)
    or (old.provider_id is not null and new.provider_id is null)
  )) execute function private.market_report_target_removed();

-- Both detail and export use the same field allowlist. Appointment and
-- address-sharing details belong only to the customer and the selected provider.
create function private.market_request_record(r private.market_requests, customer boolean, winner boolean) returns jsonb
language sql stable set search_path='' as $$
  select jsonb_build_object(
    'id',r.id,'target_id',r.target_id,'is_direct',r.is_direct,'category',r.category,
    'title',r.title,'description',r.description,'city',r.city,'district',r.district,
    'preferred_date',r.preferred_date,'budget',r.budget,'state',r.state,
    'winner_id',r.winner_id,'created_at',r.created_at,
    'address',case when customer or winner and r.address_shared then r.address end
  ) || case when customer or winner then jsonb_build_object(
    'address_shared',r.address_shared,'appointment_at',r.appointment_at,
    'appointment_confirmed',r.appointment_confirmed,'appointment_proposer',r.appointment_proposer
  ) else '{}'::jsonb end;
$$;
revoke all on function private.market_request_record(private.market_requests,boolean,boolean) from public,anon,authenticated;

create or replace function private.market_read(p_view text,p_id uuid,p_page integer) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
  uid uuid := auth.uid();
  provider private.market_providers;
  req private.market_requests;
  is_customer boolean;
  rows jsonb;
  skipped integer := greatest(0,least(coalesce(p_page,1),101)-1)*20;
begin
  if uid is null or not exists(select 1 from public.profiles where id=uid) then
    raise exception using errcode='42501', message='MARKET_AUTH';
  end if;
  perform private.require_mfa();
  select p.* into provider from private.market_providers p join public.businesses b on b.id=p.business_id
    where b.owner_id=uid and b.onboarding_completed;
  case p_view
  when 'provider' then
    return jsonb_build_object('profile',to_jsonb(provider)-'business_id','business',(select
      jsonb_build_object('name',b.name,'city',b.city) from public.businesses b where b.owner_id=uid and b.onboarding_completed));
  when 'favorite' then
    return to_jsonb(exists(select 1 from private.market_favorites where user_id=uid and provider_id=p_id));
  when 'favorites' then
    select coalesce(jsonb_agg(to_jsonb(x) order by x.display_name,x.id),'[]'::jsonb) into rows from (
      select p.id,p.display_name,p.city,p.districts,p.categories,p.bio
      from private.market_favorites f join private.market_providers p on p.id=f.provider_id
      where f.user_id=uid and p.published and not p.suspended order by p.display_name,p.id limit 21 offset skipped
    ) x;
    return rows;
  when 'notices' then
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id),'[]'::jsonb) into rows from (
      select n.id,n.request_id,n.event,n.read_at,n.created_at,r.title
      from private.market_notices n join private.market_requests r on r.id=n.request_id
      where n.user_id=uid order by n.created_at desc,n.id limit 21 offset skipped
    ) x;
    return rows;
  when 'admin' then
    return to_jsonb(coalesce(auth.jwt()->>'aal'='aal2',false)
      and exists(select 1 from public.platform_admins where user_id=uid));
  when 'moderation' then
    if auth.jwt()->>'aal' is distinct from 'aal2' or not exists(select 1 from public.platform_admins where user_id=uid) then
      raise exception using errcode='42501', message='MARKET_ACCESS';
    end if;
    select coalesce(jsonb_agg(to_jsonb(x) order by (x.state='open') desc,x.created_at desc,x.id),'[]'::jsonb) into rows from (
      select t.id,t.provider_id,t.request_id,t.reason,t.state,t.created_at,p.display_name,p.suspended,r.title,
        latest.action as latest_action,latest.created_at as latest_action_at,
        exists(select 1 from private.market_reviews v where v.request_id=t.request_id and v.provider_id=t.provider_id and not v.hidden) as can_hide_review
      from private.market_reports t left join private.market_providers p on p.id=t.provider_id
      left join private.market_requests r on r.id=t.request_id
      left join lateral (
        select a.action,a.created_at from private.market_moderation_actions a
        where a.report_id=t.id order by a.id desc limit 1
      ) latest on true
      order by (t.state='open') desc,t.created_at desc,t.id limit 21 offset skipped
    ) x;
    return rows;
  when 'own','feed','work' then
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id),'[]'::jsonb) into rows from (
      select r.id,r.title,r.category,r.city,r.district,r.state,r.is_direct,r.created_at,r.preferred_date,r.budget,
        (select count(*) from private.market_offers o where o.request_id=r.id and o.state in ('active','accepted')
          and (r.customer_id=uid or o.provider_id=provider.id)) as offer_count
      from private.market_requests r
      where case p_view
        when 'own' then r.customer_id=uid
        when 'feed' then provider.id is not null and r.customer_id<>uid and r.state='open'
          and (r.target_id=provider.id or not r.is_direct and private.market_match(provider,r))
        else provider.id is not null and (r.winner_id=provider.id or r.target_id=provider.id or exists(
          select 1 from private.market_offers o where o.request_id=r.id and o.provider_id=provider.id))
        end
      order by r.created_at desc,r.id limit 21 offset skipped
    ) x;
    return rows;
  when 'detail' then
    select * into req from private.market_requests where id=p_id;
    is_customer := req.customer_id=uid;
    if req.id is null or not (is_customer or coalesce(provider.id is not null and (
      req.target_id=provider.id or req.winner_id=provider.id or exists(
        select 1 from private.market_offers o where o.request_id=req.id and o.provider_id=provider.id
      ) or (req.state='open' and not req.is_direct and private.market_match(provider,req))
    ),false)) then return null; end if;
    return jsonb_build_object(
      'request',private.market_request_record(req,is_customer,req.winner_id=provider.id)
        || jsonb_build_object('job_id',case when req.winner_id=provider.id then req.job_id end),
      'is_customer',is_customer,'provider_id',provider.id,'provider_suspended',coalesce(provider.suspended,false),
      'target_name',(select display_name from private.market_providers where id=req.target_id),
      'winner_name',(select display_name from private.market_providers where id=req.winner_id),
      'offers',coalesce((select jsonb_agg(to_jsonb(x) order by x.updated_at desc) from (
        select o.*,p.display_name from private.market_offers o join private.market_providers p on p.id=o.provider_id
        where o.request_id=req.id and (is_customer or o.provider_id=provider.id)
        order by o.updated_at desc
      ) x),'[]'::jsonb),
      'has_review',exists(select 1 from private.market_reviews where request_id=req.id)
    );
  when 'thread' then
    select r.* into req from private.market_requests r where r.id=p_id;
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id),'[]'::jsonb) into rows from (
      select m.id,m.provider_id,m.sender,m.body,m.created_at,p.display_name
      from private.market_messages m join private.market_providers p on p.id=m.provider_id
      where m.request_id=req.id and (req.customer_id=uid or m.provider_id=provider.id)
      order by m.created_at desc,m.id limit 51 offset skipped/20*50
    ) x;
    return rows;
  else raise exception 'MARKET_INVALID';
  end case;
end;
$$;

create or replace function private.market_archive(p_table text,p_cursor uuid,p_cutoff timestamptz) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare
  uid uuid := auth.uid();
  provider uuid;
  result jsonb;
begin
  if uid is null then raise exception using errcode='42501',message='MARKET_AUTH'; end if;
  perform private.require_mfa();
  select p.id into provider from private.market_providers p join public.businesses b on b.id=p.business_id where b.owner_id=uid;
  select coalesce(jsonb_agg(jsonb_build_object('key',a.id,'record',a.record) order by a.id),'[]'::jsonb) into result
  from (
    select x.id,x.record from (
      select p.id,to_jsonb(p)-'suspended' as record
      from private.market_providers p where p_table='market_profile' and p.id=provider
      union all
      select r.id,private.market_request_record(r,r.customer_id=uid,r.winner_id=provider)
      from private.market_requests r where p_table='market_requests' and r.created_at<=p_cutoff
        and (r.customer_id=uid or r.winner_id=provider or r.target_id=provider or exists(
          select 1 from private.market_offers o where o.request_id=r.id and o.provider_id=provider))
      union all
      select o.id,to_jsonb(o) from private.market_offers o join private.market_requests r on r.id=o.request_id
      where p_table='market_offers' and r.created_at<=p_cutoff and (r.customer_id=uid or o.provider_id=provider)
      union all
      select m.id,to_jsonb(m) from private.market_messages m join private.market_requests r on r.id=m.request_id
      where p_table='market_messages' and m.created_at<=p_cutoff and (r.customer_id=uid or m.provider_id=provider)
      union all
      select v.request_id,to_jsonb(v)-'hidden' from private.market_reviews v join private.market_requests r on r.id=v.request_id
      where p_table='market_reviews' and v.created_at<=p_cutoff and (r.customer_id=uid or v.provider_id=provider and not v.hidden)
      union all
      select f.provider_id,jsonb_build_object('provider_id',f.provider_id) from private.market_favorites f
      where p_table='market_favorites' and f.user_id=uid
      union all
      select n.id,to_jsonb(n)-'user_id' from private.market_notices n
      where p_table='market_notices' and n.user_id=uid and n.created_at<=p_cutoff
      union all
      select t.id,to_jsonb(t)-'reporter_id' from private.market_reports t
      where p_table='market_reports' and t.reporter_id=uid and t.created_at<=p_cutoff
    ) x where p_cursor is null or x.id>p_cursor order by x.id limit 500
  ) a;
  return result;
end;
$$;

create or replace function private.market_write(p_action text,p jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  uid uuid := auth.uid();
  id_arg uuid := nullif(p->>'id','')::uuid;
  provider_arg uuid := nullif(p->>'provider','')::uuid;
  provider private.market_providers;
  target private.market_providers;
  req private.market_requests;
  offer private.market_offers;
  report private.market_reports;
  decision text := p->>'decision';
  business uuid;
  work_id uuid;
  recipient uuid;
  result uuid;
  place_city text := btrim(coalesce(p->>'city',''));
  place_district text := btrim(coalesce(p->>'district',''));
  label text := btrim(coalesce(p->>'title',''));
  body text := btrim(coalesce(p->>'body',''));
  amount numeric;
  day date;
  appointment timestamptz;
  is_customer boolean;
  is_winner boolean;
begin
  if uid is null or not exists(select 1 from public.profiles where id=uid) then
    raise exception using errcode='42501',message='MARKET_AUTH';
  end if;
  perform private.require_mfa();
  if octet_length(p::text)>24000 or p_action not in (
    'profile','create','edit','favorite','unfavorite','mark_read','report','moderate',
    'offer','withdraw','award','message','address','appointment','confirm_appointment',
    'start','finish','complete','reopen','cancel','review','decline'
  ) then raise exception 'MARKET_INVALID'; end if;
  if not public.consume_rate_limit('market-'||p_action,encode(sha256(convert_to(uid::text,'UTF8')),'hex'),3600,
    case p_action when 'create' then 12 when 'report' then 10 when 'message' then 100 else 60 end)
  then raise exception 'MARKET_RATE'; end if;
  select b.id into business from public.businesses b where b.owner_id=uid and b.onboarding_completed;
  select * into provider from private.market_providers where business_id=business;

  if p_action='profile' then
    if business is null then raise exception 'MARKET_ACCESS'; end if;
    if jsonb_typeof(p->'categories') is distinct from 'array' or jsonb_typeof(p->'districts') is distinct from 'array'
      or exists(select 1 from jsonb_array_elements_text(p->'categories') c
        where not exists(select 1 from private.market_categories k where k.slug=c))
      or exists(select 1 from jsonb_array_elements_text(p->'districts') d where char_length(btrim(d)) not between 2 and 80)
    then raise exception 'MARKET_INVALID'; end if;
    insert into private.market_providers(business_id,display_name,bio,city,districts,categories,published)
      values(business,label,body,place_city,
        array(select distinct btrim(d) from jsonb_array_elements_text(p->'districts') d),
        array(select distinct c from jsonb_array_elements_text(p->'categories') c),coalesce((p->>'published')::boolean,false))
    on conflict(business_id) do update set display_name=excluded.display_name,bio=excluded.bio,city=excluded.city,
      districts=excluded.districts,categories=excluded.categories,published=excluded.published,updated_at=now()
    returning private.market_providers.id into result;
    return result;
  elsif p_action in ('favorite','unfavorite') then
    if p_action='favorite' then
      if not exists(select 1 from private.market_providers where id=provider_arg and published and not suspended)
        then raise exception 'MARKET_UNAVAILABLE'; end if;
      insert into private.market_favorites(user_id,provider_id) values(uid,provider_arg) on conflict do nothing;
    else delete from private.market_favorites where user_id=uid and provider_id=provider_arg;
    end if;
    return provider_arg;
  elsif p_action='mark_read' then
    update private.market_notices set read_at=now() where user_id=uid and read_at is null and (id_arg is null or id=id_arg);
    return id_arg;
  elsif p_action='moderate' then
    if auth.jwt()->>'aal' is distinct from 'aal2' or not exists(select 1 from public.platform_admins where user_id=uid)
      then raise exception 'MARKET_ACCESS'; end if;
    if decision is null or decision not in ('suspend','restore','hide_review','resolve','dismiss')
      then raise exception 'MARKET_INVALID'; end if;
    select * into report from private.market_reports where id=id_arg for update;
    if not found then raise exception 'MARKET_UNAVAILABLE'; end if;
    if decision in ('resolve','dismiss','hide_review') and report.state<>'open'
      then raise exception 'MARKET_STALE'; end if;
    if decision in ('suspend','restore') then
      if report.provider_id is null then raise exception 'MARKET_UNAVAILABLE'; end if;
      update private.market_providers set suspended=(decision='suspend')
        where id=report.provider_id and suspended<>(decision='suspend');
      if not found then raise exception 'MARKET_STALE'; end if;
    elsif decision='hide_review' then
      update private.market_reviews set hidden=true
        where request_id=report.request_id and provider_id=report.provider_id and not hidden;
      if not found then raise exception 'MARKET_UNAVAILABLE'; end if;
    end if;
    update private.market_reports set state=case when decision='dismiss' then 'dismissed' else 'resolved' end
      where id=id_arg;
    insert into private.market_moderation_actions(report_id,admin_id,action) values (id_arg,uid,decision);
    return id_arg;
  end if;

  if p_action='report' and id_arg is null then
    if not exists(select 1 from private.market_providers where id=provider_arg and published and not suspended)
      then raise exception 'MARKET_UNAVAILABLE'; end if;
    insert into private.market_reports(reporter_id,provider_id,reason) values(uid,provider_arg,body) on conflict do nothing
      returning id into result;
    return result;
  end if;

  if p_action in ('create','edit') then
    day := nullif(p->>'date','')::date;
    amount := nullif(p->>'amount','')::numeric;
    if day < (now() at time zone 'Europe/Istanbul')::date or day > (now() at time zone 'Europe/Istanbul')::date+365
      or amount is not null and (amount<=0 or amount>9999999999.99 or scale(amount)>2)
      or not exists(select 1 from private.market_categories where slug=p->>'category')
      then raise exception 'MARKET_INVALID'; end if;
  end if;

  if p_action='create' then
    if id_arg is null then raise exception 'MARKET_INVALID'; end if;
    perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
    if exists(select 1 from private.market_requests where id=id_arg and customer_id=uid) then return id_arg; end if;
    if (select count(*) from private.market_requests where customer_id=uid and state='open') >= 20
      then raise exception 'MARKET_RATE'; end if;
    if provider_arg is not null then
      select * into target from private.market_providers where id=provider_arg and published and not suspended;
      if target.id is null or target.id=provider.id or not (p->>'category'=any(target.categories))
        or private.market_place(target.city)<>private.market_place(place_city) or (cardinality(target.districts)>0
          and not exists(select 1 from unnest(target.districts) d where private.market_place(d)=private.market_place(place_district)))
        then raise exception 'MARKET_UNAVAILABLE'; end if;
      recipient := private.market_owner(target.id);
    end if;
    insert into private.market_requests(id,customer_id,target_id,is_direct,category,title,description,city,district,address,preferred_date,budget)
      values(id_arg,uid,provider_arg,provider_arg is not null,p->>'category',label,body,place_city,place_district,
        btrim(coalesce(p->>'address','')),day,amount);
    if recipient is not null then
      insert into private.market_notices(user_id,request_id,event) values(recipient,id_arg,'direct');
    end if;
    return id_arg;
  end if;

  select * into req from private.market_requests where id=id_arg for update;
  if req.id is null then raise exception 'MARKET_ACCESS'; end if;
  is_customer := req.customer_id=uid;
  is_winner := coalesce(req.winner_id=provider.id,false);

  case p_action
  when 'edit' then
    if not is_customer or req.state<>'open' or req.is_direct or exists(
      select 1 from private.market_offers where request_id=req.id
    ) then raise exception 'MARKET_STATE'; end if;
    update private.market_requests set category=p->>'category',title=label,description=body,city=place_city,
      district=place_district,address=btrim(coalesce(p->>'address','')),preferred_date=day,budget=amount
      where id=req.id;
  when 'offer','withdraw' then
    if is_customer or provider.id is null or req.state<>'open' then raise exception 'MARKET_STATE'; end if;
    if p_action='withdraw' then
      update private.market_offers set state='withdrawn',updated_at=now() where request_id=req.id and provider_id=provider.id and state='active';
      if not found then raise exception 'MARKET_STATE'; end if;
    else
      if not coalesce(private.market_match(provider,req) and (not req.is_direct or req.target_id=provider.id),false)
        then raise exception 'MARKET_ACCESS'; end if;
      amount := nullif(p->>'amount','')::numeric;
      if amount is null or amount<=0 or amount>9999999999.99 or scale(amount)>2 then raise exception 'MARKET_INVALID'; end if;
      insert into private.market_offers(request_id,provider_id,amount,scope) values(req.id,provider.id,amount,body)
        on conflict(request_id,provider_id) do update set amount=excluded.amount,scope=excluded.scope,state='active',updated_at=clock_timestamp();
    end if;
    recipient := req.customer_id;
  when 'award' then
    if not is_customer or req.state<>'open' then raise exception 'MARKET_STATE'; end if;
    select * into offer from private.market_offers where id=nullif(p->>'offer','')::uuid and request_id=req.id and state='active' for update;
    if offer.id is null or offer.updated_at is distinct from nullif(p->>'version','')::timestamptz then
      raise exception 'MARKET_STALE';
    end if;
    select * into target from private.market_providers where id=offer.provider_id and not suspended for update;
    if target.id is null then raise exception 'MARKET_UNAVAILABLE'; end if;
    insert into public.jobs(business_id,profession_id,title,description,status,selected_sale_price,input_data)
      values(target.business_id,(select id from public.professions where slug='manual'),req.title,req.description,'accepted',
        offer.amount,jsonb_build_object('manual',true,'market_request',req.id))
      returning id into work_id;
    update private.market_requests set state='awarded',winner_id=offer.provider_id,job_id=work_id where id=req.id;
    update private.market_offers set state=case when id=offer.id then 'accepted' else 'rejected' end
      where request_id=req.id and state='active';
    insert into private.market_notices(user_id,request_id,event)
      select private.market_owner(o.provider_id),req.id,'not_selected'
      from private.market_offers o where o.request_id=req.id and o.state='rejected';
    recipient := private.market_owner(offer.provider_id);
  when 'message' then
    if is_customer then
      if provider_arg is null then raise exception 'MARKET_ACCESS'; end if;
      select * into target from private.market_providers where id=provider_arg and not suspended;
    else
      target := provider;
      if target.suspended or provider_arg is distinct from target.id then raise exception 'MARKET_ACCESS'; end if;
    end if;
    if target.id is null or not coalesce((req.state='open' and (req.target_id=target.id or exists(
      select 1 from private.market_offers o where o.request_id=req.id and o.provider_id=target.id and o.state='active'
    ))) or (req.state in ('awarded','in_progress','awaiting_completion') and req.winner_id=target.id),false)
      then raise exception 'MARKET_STATE'; end if;
    insert into private.market_messages(request_id,provider_id,sender,body) values(req.id,target.id,
      case when is_customer then 'customer' else 'provider' end,body);
    recipient := case when is_customer then private.market_owner(target.id) else req.customer_id end;
  when 'address' then
    if not is_customer or req.winner_id is null or not (
      req.state in ('awarded','in_progress') or (
        req.state in ('awaiting_completion','completed') and body='' and not coalesce((p->>'share')::boolean,false)
      )
    ) then raise exception 'MARKET_STATE'; end if;
    if coalesce((p->>'share')::boolean,false) and char_length(body)<5 then raise exception 'MARKET_INVALID'; end if;
    update private.market_requests set address=body,address_shared=coalesce((p->>'share')::boolean,false) where id=req.id;
    recipient := private.market_owner(req.winner_id);
  when 'appointment' then
    if (not is_winner and not is_customer) or req.state<>'awarded' or req.winner_id is null then raise exception 'MARKET_STATE'; end if;
    if p->>'at' is null or p->>'at' !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$' then raise exception 'MARKET_INVALID'; end if;
    appointment := (p->>'at')::timestamp at time zone 'Europe/Istanbul';
    if appointment<=now() or appointment>now()+interval '365 days' then raise exception 'MARKET_INVALID'; end if;
    update private.market_requests set appointment_at=appointment,appointment_confirmed=false,
      appointment_proposer=case when is_customer then 'customer' else 'provider' end where id=req.id;
    recipient := case when is_customer then private.market_owner(req.winner_id) else req.customer_id end;
  when 'confirm_appointment' then
    if (not is_winner and not is_customer) or req.state<>'awarded' or req.appointment_at is null
      or req.appointment_confirmed or req.appointment_at<=now() then raise exception 'MARKET_STATE'; end if;
    if req.appointment_proposer is not distinct from (case when is_customer then 'customer' else 'provider' end)
      then raise exception 'MARKET_ACCESS'; end if;
    if req.appointment_at is distinct from nullif(p->>'version','')::timestamptz then raise exception 'MARKET_STALE'; end if;
    perform 1 from private.market_providers where id=req.winner_id for update;
    if exists(select 1 from private.market_requests r where r.winner_id=req.winner_id and r.id<>req.id
      and r.state in ('awarded','in_progress') and r.appointment_confirmed
      and abs(extract(epoch from (r.appointment_at-req.appointment_at)))<3600) then raise exception 'MARKET_CONFLICT'; end if;
    update private.market_requests set appointment_confirmed=true where id=req.id;
    recipient := case when is_customer then private.market_owner(req.winner_id) else req.customer_id end;
  when 'start','finish','complete','reopen','cancel','decline' then
    if p_action='start' and is_winner and req.state='awarded' and (req.appointment_at is null or req.appointment_confirmed) then
      update private.market_requests set state='in_progress' where id=req.id;
      update public.jobs set status='in_progress',started_at=coalesce(started_at,now()) where id=req.job_id and status='accepted';
      recipient := req.customer_id;
    elsif p_action='finish' and is_winner and req.state='in_progress' then
      update private.market_requests set state='awaiting_completion' where id=req.id;
      recipient := req.customer_id;
    elsif p_action='complete' and is_customer and req.state='awaiting_completion' then
      update private.market_requests set state='completed' where id=req.id;
      update public.jobs set status='completed',completed_at=coalesce(completed_at,now()) where id=req.job_id and status in ('accepted','in_progress');
      recipient := private.market_owner(req.winner_id);
    elsif p_action='reopen' and is_customer and req.state='awaiting_completion' then
      update private.market_requests set state='in_progress' where id=req.id;
      recipient := private.market_owner(req.winner_id);
    elsif (p_action='cancel' and ((is_customer and req.state in ('open','awarded')) or (is_winner and req.state='awarded')))
      or (p_action='decline' and not is_customer and coalesce(req.target_id=provider.id,false) and req.state='open') then
      update private.market_requests set state='cancelled',address_shared=false where id=req.id;
      update public.jobs set status='cancelled' where id=req.job_id and status='accepted';
      if is_customer and req.state='open' then
        insert into private.market_notices(user_id,request_id,event)
          select distinct private.market_owner(x.provider_id),req.id,'cancel' from (
            select provider_id from private.market_offers where request_id=req.id and state='active'
            union select req.target_id where req.target_id is not null
          ) x;
      else recipient := case when is_customer then private.market_owner(req.winner_id) else req.customer_id end;
      end if;
      update private.market_offers set state='rejected' where request_id=req.id and state='active';
    else raise exception 'MARKET_STATE';
    end if;
  when 'review' then
    if not is_customer or req.state<>'completed' or req.winner_id is null then raise exception 'MARKET_STATE'; end if;
    insert into private.market_reviews(request_id,provider_id,rating,body) values(req.id,req.winner_id,(p->>'rating')::smallint,body);
    recipient := private.market_owner(req.winner_id);
  when 'report' then
    if not (is_customer or is_winner or coalesce(req.target_id=provider.id,false) or exists(
      select 1 from private.market_offers o where o.request_id=req.id and o.provider_id=provider.id
    ) or (provider.id is not null and req.state='open' and not req.is_direct and private.market_match(provider,req)))
      then raise exception 'MARKET_ACCESS'; end if;
    if is_customer then
      provider_arg := coalesce(provider_arg,req.winner_id,req.target_id);
      if provider_arg is not null and not (coalesce(provider_arg=req.winner_id or provider_arg=req.target_id,false) or exists(
        select 1 from private.market_offers o where o.request_id=req.id and o.provider_id=provider_arg
      )) then raise exception 'MARKET_ACCESS'; end if;
    else provider_arg := null;
    end if;
    insert into private.market_reports(reporter_id,provider_id,request_id,reason)
      values(uid,provider_arg,req.id,body) on conflict do nothing returning id into result;
    return result;
  else raise exception 'MARKET_INVALID';
  end case;

  if recipient is not null then
    insert into private.market_notices(user_id,request_id,event) values(recipient,req.id,p_action);
  end if;
  return req.id;
end;
$$;

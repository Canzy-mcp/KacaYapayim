create table private.market_categories (
  slug text primary key,
  name text not null
);

insert into private.market_categories values
  ('boya','Boya ve badana'), ('elektrik','Elektrik'), ('tesisat','Su tesisatı'),
  ('klima','Klima ve havalandırma'), ('isitma','Kombi ve ısıtma'),
  ('mobilya','Mobilya ve montaj'), ('tadilat','Tadilat'), ('seramik','Fayans ve seramik'),
  ('zemin','Parke ve zemin'), ('cati','Çatı ve yalıtım'), ('cam','Cam ve doğrama'),
  ('celik','Çilingir ve kapı'), ('bahce','Bahçe ve peyzaj'), ('cihaz','Beyaz eşya servisi'),
  ('temizlik','Temizlik'), ('nakliye','Nakliye'), ('diger','Diğer');

create function private.market_place(value text) returns text
language sql immutable set search_path = '' as $$
  select lower(translate(regexp_replace(btrim(value), '[[:space:]]+', ' ', 'g'),
    'İIıŞşĞğÜüÖöÇç', 'iiissgguuoocc'));
$$;

create table private.market_providers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 120),
  bio text not null default '' check (char_length(bio) <= 1600),
  city text not null check (char_length(city) between 2 and 80),
  districts text[] not null default '{}' check (cardinality(districts) <= 20),
  categories text[] not null check (cardinality(categories) between 1 and 17),
  published boolean not null default false,
  suspended boolean not null default false,
  updated_at timestamptz not null default now()
);
create index market_providers_region on private.market_providers(private.market_place(city)) where published and not suspended;
create index market_providers_categories on private.market_providers using gin(categories);

create table private.market_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles on delete cascade,
  target_id uuid references private.market_providers on delete set null,
  is_direct boolean not null,
  category text not null references private.market_categories,
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 15 and 3000),
  city text not null check (char_length(city) between 2 and 80),
  district text not null check (char_length(district) between 2 and 80),
  address text not null default '' check (char_length(address) <= 500),
  address_shared boolean not null default false,
  preferred_date date,
  budget numeric(12,2) check (budget > 0),
  state text not null default 'open' check (state in ('open','awarded','in_progress','awaiting_completion','completed','cancelled')),
  winner_id uuid references private.market_providers on delete set null,
  job_id uuid unique references public.jobs on delete set null,
  appointment_at timestamptz,
  appointment_proposer text check (appointment_proposer in ('customer','provider')),
  appointment_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);
create index market_requests_customer on private.market_requests(customer_id,created_at desc);
create index market_requests_feed on private.market_requests(category,private.market_place(city),created_at desc) where state='open' and not is_direct;
create index market_requests_target on private.market_requests(target_id,created_at desc);
create index market_requests_winner on private.market_requests(winner_id,created_at desc);

create table private.market_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references private.market_requests on delete cascade,
  provider_id uuid not null references private.market_providers on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  scope text not null check (char_length(scope) between 5 and 1600),
  state text not null default 'active' check (state in ('active','withdrawn','accepted','rejected')),
  updated_at timestamptz not null default now(),
  unique(request_id,provider_id)
);
create index market_offers_provider on private.market_offers(provider_id,request_id);

create table private.market_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references private.market_requests on delete cascade,
  provider_id uuid not null references private.market_providers on delete cascade,
  sender text not null check (sender in ('customer','provider')),
  body text not null check (char_length(body) between 1 and 1600),
  created_at timestamptz not null default now()
);
create index market_messages_thread on private.market_messages(request_id,provider_id,created_at desc);

create table private.market_reviews (
  request_id uuid primary key references private.market_requests on delete cascade,
  provider_id uuid not null references private.market_providers on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 5 and 1000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index market_reviews_provider on private.market_reviews(provider_id,created_at desc) where not hidden;

create table private.market_favorites (
  user_id uuid not null references public.profiles on delete cascade,
  provider_id uuid not null references private.market_providers on delete cascade,
  primary key(user_id,provider_id)
);

create table private.market_notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  request_id uuid not null references private.market_requests on delete cascade,
  event text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index market_notices_user on private.market_notices(user_id,created_at desc);

create table private.market_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles on delete set null,
  provider_id uuid references private.market_providers on delete set null,
  request_id uuid references private.market_requests on delete set null,
  reason text not null check (char_length(reason) between 5 and 1200),
  state text not null default 'open' check (state in ('open','resolved','dismissed')),
  created_at timestamptz not null default now()
);
create unique index market_report_once on private.market_reports(reporter_id,provider_id,request_id) nulls not distinct where state='open';

revoke all on private.market_categories,private.market_providers,private.market_requests,private.market_offers,
  private.market_messages,private.market_reviews,private.market_favorites,private.market_notices,private.market_reports from public,anon,authenticated;

create function private.market_owner(p_provider uuid) returns uuid
language sql stable set search_path='' as $$
  select b.owner_id from private.market_providers p join public.businesses b on b.id=p.business_id where p.id=p_provider;
$$;

create function private.market_match(p private.market_providers, r private.market_requests) returns boolean
language sql stable set search_path='' as $$
  select p.published and not p.suspended and r.category=any(p.categories)
    and private.market_place(r.city)=private.market_place(p.city)
    and (cardinality(p.districts)=0 or exists(
      select 1 from unnest(p.districts) d where private.market_place(d)=private.market_place(r.district)
    ));
$$;

create function private.market_directory(p_filters jsonb) returns jsonb
language sql stable security definer set search_path='' as $$
  with matches as (
    select p.id,p.display_name,p.bio,p.city,p.districts,p.categories,p.updated_at,
      (select round(avg(r.rating),1) from private.market_reviews r where r.provider_id=p.id and not r.hidden) as rating,
      (select count(*) from private.market_reviews r where r.provider_id=p.id and not r.hidden) as review_count
    from private.market_providers p
    where p.published and not p.suspended
      and (nullif(p_filters->>'id','') is null or p.id::text=lower(p_filters->>'id'))
      and (nullif(p_filters->>'city','') is null or private.market_place(p.city)=private.market_place(p_filters->>'city'))
      and (nullif(p_filters->>'category','') is null or (p_filters->>'category')=any(p.categories))
      and (nullif(p_filters->>'district','') is null or cardinality(p.districts)=0 or exists(
        select 1 from unnest(p.districts) d where private.market_place(d)=private.market_place(p_filters->>'district')
      ))
      and (nullif(p_filters->>'q','') is null or strpos(private.market_place(p.display_name),private.market_place(left(p_filters->>'q',100)))>0)
    order by rating desc nulls last,review_count desc,p.updated_at desc,p.id
    limit 21 offset (case when p_filters->>'page' ~ '^[0-9]{1,3}$'
      then least(2000,greatest(0,(p_filters->>'page')::int-1)*20) else 0 end)
  )
  select jsonb_build_object(
    'categories',(select jsonb_agg(to_jsonb(c) order by c.name) from private.market_categories c),
    'providers',coalesce((select jsonb_agg(to_jsonb(m)-'updated_at' order by rating desc nulls last,review_count desc,updated_at desc,id) from matches m),'[]'::jsonb),
    'reviews',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select r.rating,r.body,r.created_at from private.market_reviews r
      join matches m on m.id=r.provider_id where not r.hidden and nullif(p_filters->>'id','') is not null
      order by r.created_at desc limit 30
    ) x),'[]'::jsonb)
  );
$$;

create function public.market_directory(p_filters jsonb default '{}') returns jsonb
language sql stable security definer set search_path='' as $$ select private.market_directory(p_filters); $$;
revoke all on function private.market_directory(jsonb),public.market_directory(jsonb) from public,anon,authenticated;
grant execute on function public.market_directory(jsonb) to anon,authenticated;
revoke all on function private.market_place(text),private.market_owner(uuid),
  private.market_match(private.market_providers,private.market_requests) from public,anon,authenticated;

create function private.market_provider_removed() returns trigger
language plpgsql set search_path='' as $$
begin
  if (old.winner_id is not null and new.winner_id is null and old.state in ('awarded','in_progress','awaiting_completion'))
    or (old.target_id is not null and new.target_id is null and old.state='open') then
    new.state := 'cancelled';
    new.address_shared := false;
  end if;
  return new;
end;
$$;
create trigger market_provider_removed before update of winner_id,target_id on private.market_requests
  for each row execute function private.market_provider_removed();

create function private.market_read(p_view text,p_id uuid,p_page integer) returns jsonb
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
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc,x.id),'[]'::jsonb) into rows from (
      select t.id,t.provider_id,t.request_id,t.reason,t.state,t.created_at,p.display_name,p.suspended,r.title,
        exists(select 1 from private.market_reviews v where v.request_id=t.request_id and v.provider_id=t.provider_id and not v.hidden) as can_hide_review
      from private.market_reports t left join private.market_providers p on p.id=t.provider_id
      left join private.market_requests r on r.id=t.request_id
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
      'request',to_jsonb(req)-'customer_id'-'address'-'job_id'
        || jsonb_build_object('address',case when is_customer or req.address_shared and req.winner_id=provider.id then req.address end,
          'job_id',case when req.winner_id=provider.id then req.job_id end),
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

create function public.market_read(p_view text,p_id uuid default null,p_page integer default 1) returns jsonb
language sql stable security invoker set search_path='' as $$ select private.market_read(p_view,p_id,p_page); $$;
revoke all on function private.market_read(text,uuid,integer),public.market_read(text,uuid,integer) from public,anon,authenticated;
grant execute on function private.market_read(text,uuid,integer),public.market_read(text,uuid,integer) to authenticated;

create function private.market_write(p_action text,p jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  uid uuid := auth.uid();
  id_arg uuid := nullif(p->>'id','')::uuid;
  provider_arg uuid := nullif(p->>'provider','')::uuid;
  provider private.market_providers;
  target private.market_providers;
  req private.market_requests;
  offer private.market_offers;
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
    if p->>'decision' in ('suspend','restore') then
      update private.market_providers set suspended=p->>'decision'='suspend'
        where id=(select t.provider_id from private.market_reports t where t.id=id_arg);
      if not found then raise exception 'MARKET_UNAVAILABLE'; end if;
    end if;
    if p->>'decision'='hide_review' then
      update private.market_reviews v set hidden=true from private.market_reports t
        where t.id=id_arg and t.request_id=v.request_id and t.provider_id=v.provider_id;
      if not found then raise exception 'MARKET_UNAVAILABLE'; end if;
    end if;
    if p->>'decision' is null or p->>'decision' not in ('suspend','restore','hide_review','resolve','dismiss')
      then raise exception 'MARKET_INVALID'; end if;
    update private.market_reports set state=case when p->>'decision'='dismiss' then 'dismissed' else 'resolved' end
      where id=id_arg returning id into result;
    return result;
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
    if not is_customer or req.state not in ('awarded','in_progress') or req.winner_id is null then raise exception 'MARKET_STATE'; end if;
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

create function public.market_write(p_action text,p_payload jsonb) returns uuid
language sql security invoker set search_path='' as $$ select private.market_write(p_action,p_payload); $$;
revoke all on function private.market_write(text,jsonb),public.market_write(text,jsonb) from public,anon,authenticated;
grant execute on function private.market_write(text,jsonb),public.market_write(text,jsonb) to authenticated;

create function private.market_archive(p_table text,p_cursor uuid,p_cutoff timestamptz) returns jsonb
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
      select r.id,to_jsonb(r)-'customer_id'-'job_id'-'address'
        || jsonb_build_object('address',case when r.customer_id=uid or r.winner_id=provider and r.address_shared then r.address end)
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
create function public.market_archive(p_table text,p_cursor uuid,p_cutoff timestamptz) returns jsonb
language sql stable security invoker set search_path='' as $$ select private.market_archive(p_table,p_cursor,p_cutoff); $$;
revoke all on function public.market_archive(text,uuid,timestamptz),private.market_archive(text,uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.market_archive(text,uuid,timestamptz),private.market_archive(text,uuid,timestamptz) to authenticated;

create function private.completed_market_sale(p_job uuid) returns numeric
language sql stable set search_path='' as $$
  select o.amount from private.market_requests r
  join private.market_offers o on o.request_id=r.id and o.provider_id=r.winner_id and o.state='accepted'
  where r.job_id=p_job and r.state='completed';
$$;
revoke all on function private.completed_market_sale(uuid) from public,anon,authenticated;

-- Keep the existing financial validation and calculations for both job types.
do $$
declare
  source text;
  updated text;
begin
  select pg_get_functiondef('public.save_actual_job_costs(uuid,jsonb,text)'::regprocedure) into source;
  updated := replace(source,
    'if not found or v_quote.sale_price <= 0 then raise exception ''Accepted quote unavailable''; end if;',
    'if not found then v_quote.sale_price := private.completed_market_sale(v_job.id); end if;
     if v_quote.sale_price is null or v_quote.sale_price <= 0 then raise exception ''Accepted quote unavailable''; end if;');
  if updated=source then raise exception 'Actual cost sale validation changed'; end if;
  execute updated;
  select pg_get_functiondef('private.sync_expense_actuals()'::regprocedure) into source;
  updated := replace(source,'actual_profit=v_sale-manual_actual_cost-v_total,',
    'actual_profit=coalesce(v_sale,private.completed_market_sale(v_job))-manual_actual_cost-v_total,');
  updated := replace(updated,'(v_sale-manual_actual_cost-v_total)/nullif(v_sale,0)',
    '(coalesce(v_sale,private.completed_market_sale(v_job))-manual_actual_cost-v_total)/nullif(coalesce(v_sale,private.completed_market_sale(v_job)),0)');
  if updated=source then raise exception 'Expense profit validation changed'; end if;
  execute updated;
  select pg_get_functiondef('private.copy_my_job(uuid)'::regprocedure) into source;
  updated := replace(source,'v_job.input_data,v_job.profession_template_version',
    'v_job.input_data-''market_request'',v_job.profession_template_version');
  if updated=source then raise exception 'Job copy snapshot changed'; end if;
  execute updated;
end;
$$;

create index if not exists market_requests_job_idx on private.market_requests(job_id) where job_id is not null;

create view private.dashboard_job_agreements as
  select j.id as job_id, j.business_id, coalesce(q.sale_price, o.amount) as sale_price,
    coalesce(q.estimated_profit_snapshot, o.amount - j.estimated_cost) as estimated_profit,
    case when q.id is not null then q.accepted_at else j.created_at end as accepted_at
  from public.jobs j
  left join public.quotes q on q.id = j.accepted_quote_id and q.job_id = j.id
  left join private.market_requests r on r.job_id = j.id and q.id is null
  left join private.market_offers o on o.request_id = r.id and o.provider_id = r.winner_id and o.state = 'accepted'
  where q.id is not null or o.id is not null;
revoke all on private.dashboard_job_agreements from public, anon, authenticated;

create or replace function public.get_dashboard_overview(p_start_date date, p_end_date date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_business_id uuid;
  v_from timestamptz;
  v_to timestamptz;
  v_volume jsonb;
  v_decisions jsonb;
  v_completed jsonb;
  v_active jsonb;
  v_lost jsonb;
  v_pending jsonb;
  v_funnel jsonb;
  v_statuses jsonb;
  v_recent_quotes jsonb;
  v_active_jobs jsonb;
  v_top_jobs jsonb;
  v_reasons jsonb;
  v_activity jsonb;
  v_has_any_quote boolean;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select b.id into v_business_id from public.businesses b
    where b.owner_id = auth.uid() and b.onboarding_completed;
  if v_business_id is null then raise exception 'Business unavailable'; end if;
  if p_start_date is null or p_end_date is null or p_start_date >= p_end_date or
     p_end_date > current_date + 2 or p_end_date - p_start_date > 3660 then
    raise exception 'Invalid date range';
  end if;
  v_from := p_start_date::timestamp at time zone 'Europe/Istanbul';
  v_to := p_end_date::timestamp at time zone 'Europe/Istanbul';
  select exists(select 1 from public.quotes q where q.business_id = v_business_id)
    or exists(select 1 from private.dashboard_job_agreements a where a.business_id = v_business_id)
    into v_has_any_quote;

  select jsonb_build_object('amount',coalesce(sum(q.sale_price),0),'count',count(*)) into v_volume
  from public.quotes q where q.business_id = v_business_id
    and q.created_at >= v_from and q.created_at < v_to and q.status not in ('draft','cancelled');

  select jsonb_build_object(
    'acceptedAmount',coalesce(sum(q.sale_price) filter (where q.status = 'accepted' and j.accepted_quote_id = q.id),0),
    'acceptedCount',count(*) filter (where q.status = 'accepted' and j.accepted_quote_id = q.id),
    'rejectedCount',count(*) filter (where q.status = 'rejected')) into v_decisions
  from public.quotes q left join public.jobs j on j.id = q.job_id and j.business_id = v_business_id
  where q.business_id = v_business_id and
    ((q.accepted_at >= v_from and q.accepted_at < v_to) or
     (q.rejected_at >= v_from and q.rejected_at < v_to));

  select jsonb_build_object(
    'actualProfit',coalesce(sum(j.actual_profit),0),
    'estimatedProfit',coalesce(sum(a.estimated_profit),0),
    'completedAmount',coalesce(sum(a.sale_price),0),
    'count',count(*)) into v_completed
  from public.jobs j join private.dashboard_job_agreements a on a.job_id = j.id
  where j.business_id = v_business_id and j.status = 'completed' and j.actual_profit is not null
    and j.completed_at >= v_from and j.completed_at < v_to;

  select jsonb_build_object('count',count(*),'volume',coalesce(sum(a.sale_price),0),
    'expectedProfit',coalesce(sum(a.estimated_profit),0)) into v_active
  from public.jobs j join private.dashboard_job_agreements a on a.job_id = j.id
  where j.business_id = v_business_id and j.status in ('accepted','scheduled','in_progress')
    and a.accepted_at >= v_from and a.accepted_at < v_to;

  select jsonb_build_object('count',count(*),'amount',coalesce(sum(q.sale_price),0)) into v_lost
  from public.quotes q where q.business_id = v_business_id and q.status = 'rejected'
    and q.rejected_at >= v_from and q.rejected_at < v_to;

  select jsonb_build_object('count',count(*),'amount',coalesce(sum(q.sale_price),0)) into v_pending
  from public.quotes q where q.business_id = v_business_id and q.status in ('ready','sent','viewed')
    and q.valid_until >= (now() at time zone 'Europe/Istanbul')::date
    and q.created_at >= v_from and q.created_at < v_to;

  select jsonb_build_object(
    'sent',count(*) filter (where q.sent_at >= v_from and q.sent_at < v_to),
    'viewed',count(*) filter (where q.viewed_at >= v_from and q.viewed_at < v_to),
    'accepted',count(*) filter (where q.accepted_at >= v_from and q.accepted_at < v_to),
    'rejected',count(*) filter (where q.rejected_at >= v_from and q.rejected_at < v_to)) into v_funnel
  from public.quotes q where q.business_id = v_business_id;

  select jsonb_build_object(
    'accepted',count(*) filter (where j.status = 'accepted'),
    'scheduled',count(*) filter (where j.status = 'scheduled'),
    'inProgress',count(*) filter (where j.status = 'in_progress'),
    'completed',count(*) filter (where j.status = 'completed'),
    'cancelled',count(*) filter (where j.status = 'cancelled')) into v_statuses
  from public.jobs j where j.business_id = v_business_id;

  select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'number',r.quote_number,
    'title',r.title,'customer',r.customer_name,'amount',r.sale_price,
    'status',r.status,'validUntil',r.valid_until,'date',r.created_at) order by r.created_at desc), '[]'::jsonb)
  into v_recent_quotes from (
    select q.id,q.quote_number,q.title,coalesce(c.name,'Müşteri seçilmedi') as customer_name,
      q.sale_price,q.status,q.valid_until,q.created_at
    from public.quotes q left join public.customers c on c.id = q.customer_id and c.business_id = v_business_id
    where q.business_id = v_business_id and q.created_at >= v_from and q.created_at < v_to
    order by q.created_at desc limit 5
  ) r;

  select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'customer',r.customer_name,
    'amount',r.sale_price,'status',r.status,'startedAt',r.started_at) order by r.accepted_at desc), '[]'::jsonb)
  into v_active_jobs from (
    select j.id,j.title,coalesce(c.name,'Müşteri') as customer_name,a.sale_price,j.status,j.started_at,a.accepted_at
    from public.jobs j join private.dashboard_job_agreements a on a.job_id = j.id
    left join public.customers c on c.id = j.customer_id and c.business_id = v_business_id
    where j.business_id = v_business_id and j.status in ('accepted','scheduled','in_progress')
      and a.accepted_at >= v_from and a.accepted_at < v_to
    order by a.accepted_at desc limit 4
  ) r;

  select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'customer',r.customer_name,
    'salePrice',r.sale_price,'profit',r.actual_profit,'margin',r.actual_profit_margin)
    order by r.actual_profit desc), '[]'::jsonb)
  into v_top_jobs from (
    select j.id,j.title,coalesce(c.name,'Müşteri') as customer_name,a.sale_price,j.actual_profit,j.actual_profit_margin
    from public.jobs j join private.dashboard_job_agreements a on a.job_id = j.id
    left join public.customers c on c.id = j.customer_id and c.business_id = v_business_id
    where j.business_id = v_business_id and j.status = 'completed' and j.actual_profit is not null
      and j.completed_at >= v_from and j.completed_at < v_to
    order by j.actual_profit desc limit 5
  ) r;

  select coalesce(jsonb_agg(jsonb_build_object('reason',r.rejection_reason,'count',r.reason_count)
    order by r.reason_count desc,r.rejection_reason), '[]'::jsonb) into v_reasons from (
    select q.rejection_reason,count(*) as reason_count from public.quotes q
    where q.business_id = v_business_id and q.status = 'rejected' and q.rejection_reason is not null
      and q.rejected_at >= v_from and q.rejected_at < v_to
    group by q.rejection_reason
  ) r;

  select coalesce(jsonb_agg(jsonb_build_object('type',r.event_type,'at',r.event_at,
    'id',r.target_id,'customer',r.customer_name,'title',r.title) order by r.event_at desc), '[]'::jsonb)
  into v_activity from (
    select e.* from (
      select 'quote_created' as event_type,q.created_at as event_at,q.id as target_id,
        coalesce(c.name,'Müşteri') as customer_name,q.title
      from public.quotes q left join public.customers c on c.id = q.customer_id and c.business_id = v_business_id
      where q.business_id = v_business_id and q.created_at >= v_from and q.created_at < v_to
      union all
      select 'quote_viewed',q.viewed_at,q.id,coalesce(c.name,'Müşteri'),q.title
      from public.quotes q left join public.customers c on c.id = q.customer_id and c.business_id = v_business_id
      where q.business_id = v_business_id and q.viewed_at >= v_from and q.viewed_at < v_to
      union all
      select 'quote_sent',q.sent_at,q.id,coalesce(c.name,'Müşteri'),q.title
      from public.quotes q left join public.customers c on c.id = q.customer_id and c.business_id = v_business_id
      where q.business_id = v_business_id and q.sent_at >= v_from and q.sent_at < v_to
      union all
      select 'quote_accepted',q.accepted_at,q.id,coalesce(c.name,'Müşteri'),q.title
      from public.quotes q left join public.customers c on c.id = q.customer_id and c.business_id = v_business_id
      where q.business_id = v_business_id and q.accepted_at >= v_from and q.accepted_at < v_to
      union all
      select 'quote_rejected',q.rejected_at,q.id,coalesce(c.name,'Müşteri'),q.title
      from public.quotes q left join public.customers c on c.id = q.customer_id and c.business_id = v_business_id
      where q.business_id = v_business_id and q.rejected_at >= v_from and q.rejected_at < v_to
      union all
      select 'job_started',j.started_at,j.id,coalesce(c.name,'Müşteri'),j.title
      from public.jobs j left join public.customers c on c.id = j.customer_id and c.business_id = v_business_id
      where j.business_id = v_business_id and j.started_at >= v_from and j.started_at < v_to
      union all
      select 'job_completed',j.completed_at,j.id,coalesce(c.name,'Müşteri'),j.title
      from public.jobs j left join public.customers c on c.id = j.customer_id and c.business_id = v_business_id
      where j.business_id = v_business_id and j.completed_at >= v_from and j.completed_at < v_to
    ) e order by e.event_at desc limit 8
  ) r;

  return jsonb_build_object('hasAnyQuote',v_has_any_quote,'volume',v_volume,'decisions',v_decisions,'completed',v_completed,
    'active',v_active,'lost',v_lost,'pending',v_pending,'funnel',v_funnel,'statuses',v_statuses,
    'recentQuotes',v_recent_quotes,'activeJobs',v_active_jobs,'topJobs',v_top_jobs,
    'reasons',v_reasons,'activity',v_activity);
end;
$$;

create or replace function public.respond_to_quote(p_token uuid, p_action text, p_reason text default null, p_note text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_quote public.quotes%rowtype;
  v_job public.jobs%rowtype;
begin
  if p_token is null or p_action is null or p_action not in ('accept','reject') then raise exception 'Invalid response'; end if;
  if p_action = 'reject' and (p_reason is not null and p_reason not in
    ('price_high','not_now','other_company','scope_mismatch','other') or
    p_note is not null and char_length(p_note) > 1000) then raise exception 'Invalid response'; end if;
  -- Lock the job before any quote rows so competing acceptances cannot deadlock.
  if p_action = 'accept' then
    select j.* into v_job from public.jobs j join public.quotes q on q.job_id = j.id
      where q.public_token = p_token for no key update of j;
  end if;
  select q.* into v_quote from public.quotes q where q.public_token = p_token for update;
  if not found or v_quote.status = 'draft' then raise exception 'Quote unavailable'; end if;
  if v_quote.status = 'accepted' and p_action = 'accept' then return 'accepted'; end if;
  if v_quote.status = 'rejected' and p_action = 'reject' then return 'rejected'; end if;
  if v_quote.status not in ('ready','sent','viewed') or
     v_quote.valid_until < (now() at time zone 'Europe/Istanbul')::date then
    raise exception 'Quote unavailable';
  end if;
  if p_action = 'accept' then
    if v_job.id is distinct from v_quote.job_id or v_job.status not in ('calculated','quoted') or
       v_job.accepted_quote_id is not null or v_quote.sale_price <= 0 then raise exception 'Job unavailable'; end if;
    update public.quotes set status = 'accepted', accepted_at = now(), accepted_via = 'public_link'
      where id = v_quote.id;
    update public.jobs set status = 'accepted', accepted_quote_id = v_quote.id where id = v_job.id;
    update public.quotes set status = 'cancelled'
      where job_id = v_job.id and id <> v_quote.id and status in ('ready','sent','viewed');
    return 'accepted';
  end if;
  update public.quotes set status = 'rejected', rejected_at = now(),
    rejection_reason = p_reason, rejection_note = nullif(btrim(p_note), '') where id = v_quote.id;
  return 'rejected';
end;
$$;

-- Close links left outstanding by acceptances made before this migration.
update public.quotes q set status = 'cancelled'
from public.jobs j
where q.job_id = j.id and j.accepted_quote_id is not null
  and q.id <> j.accepted_quote_id and q.status in ('ready','sent','viewed');

create or replace function public.mark_job_quoted_from_quote() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  accepted_id uuid;
begin
  if new.status in ('ready','sent','viewed') and
     (tg_op = 'INSERT' or old.status not in ('ready','sent','viewed')) then
    select j.accepted_quote_id into accepted_id from public.jobs j where j.id = new.job_id for no key update;
    if accepted_id is not null then raise exception 'Job already accepted'; end if;
    update public.jobs set status = 'quoted' where id = new.job_id and status in ('draft','calculated');
  end if;
  return new;
end;
$$;

-- Keep the same job-before-quote lock order in the existing publishing paths.
do $$
declare
  source text;
  updated text;
begin
  source := pg_get_functiondef('public.save_quote(uuid,uuid,text,text,text,jsonb,jsonb,text,text,date,text,numeric,boolean)'::regprocedure);
  updated := replace(source,
    'and j.business_id = v_business_id for share;',
    'and j.business_id = v_business_id for no key update;');
  if updated = source then raise exception 'Quote job lock changed'; end if;
  source := updated;
  updated := replace(source, 'if not found then raise exception ''Job not found''; end if;',
    'if not found then raise exception ''Job not found''; end if;
     if p_status = ''ready'' and v_job.accepted_quote_id is not null then raise exception ''Job already accepted''; end if;');
  if updated = source then raise exception 'Quote job validation changed'; end if;
  execute updated;

  source := pg_get_functiondef('private.copy_my_quote(uuid,boolean)'::regprocedure);
  updated := replace(source, ' select q.* into v_q',
    ' perform 1 from public.quotes q join public.businesses b on b.id=q.business_id
       join public.jobs j on j.id=q.job_id where q.id=p_quote_id and b.owner_id=auth.uid()
       for no key update of j;
     select q.* into v_q');
  if updated = source then raise exception 'Quote copy lock changed'; end if;
  execute updated;

  source := pg_get_functiondef('private.publish_service_packages(uuid,boolean)'::regprocedure);
  updated := replace(source, ' select count(*) into n',
    ' perform 1 from public.jobs j where j.id in
       (select q.job_id from public.quotes q where q.package_group_id=g)
       order by j.id for no key update;
     select count(*) into n');
  if updated = source then raise exception 'Package publishing lock changed'; end if;
  execute updated;
end;
$$;

-- Match the directory's public review aggregate while preserving favorite paging.
do $$
declare
  source text := pg_get_functiondef('private.market_read(text,uuid,integer)'::regprocedure);
  updated text;
begin
  updated := replace(source,
    'select p.id,p.display_name,p.city,p.districts,p.categories,p.bio
      from private.market_favorites',
    'select p.id,p.display_name,p.city,p.districts,p.categories,p.bio,
      (select round(avg(r.rating),1) from private.market_reviews r where r.provider_id=p.id and not r.hidden) as rating,
      (select count(*) from private.market_reviews r where r.provider_id=p.id and not r.hidden) as review_count
      from private.market_favorites');
  if updated = source then raise exception 'Favorites projection changed'; end if;
  execute updated;
end;
$$;

-- Keep expired tokens available to callbacks and webhook recovery.
create or replace function public.get_pending_iyzico_checkout(p_business_id uuid)
returns text language sql stable security invoker set search_path = '' as $$
  select token from private.billing_checkout_attempts
  where business_id = p_business_id and status = 'pending' and expires_at > now()
  order by created_at desc limit 1;
$$;

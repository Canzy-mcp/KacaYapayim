create index quotes_sent_business_idx on public.quotes(business_id, sent_at desc) where sent_at is not null;
create index quotes_viewed_business_idx on public.quotes(business_id, viewed_at desc) where viewed_at is not null;
create index jobs_started_business_idx on public.jobs(business_id, started_at desc) where started_at is not null;

-- One owner-scoped response supplies both aggregates and small dashboard lists.
-- All money is summed as PostgreSQL numeric before JSON serialization.
create function public.get_dashboard_overview(p_start_date date, p_end_date date)
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
  select exists(select 1 from public.quotes q where q.business_id = v_business_id) into v_has_any_quote;

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
    'estimatedProfit',coalesce(sum(q.estimated_profit_snapshot),0),
    'completedAmount',coalesce(sum(q.sale_price),0),
    'count',count(*)) into v_completed
  from public.jobs j join public.quotes q on q.id = j.accepted_quote_id and q.job_id = j.id
  where j.business_id = v_business_id and j.status = 'completed' and j.actual_profit is not null
    and j.completed_at >= v_from and j.completed_at < v_to;

  select jsonb_build_object('count',count(*),'volume',coalesce(sum(q.sale_price),0),
    'expectedProfit',coalesce(sum(q.estimated_profit_snapshot),0)) into v_active
  from public.jobs j join public.quotes q on q.id = j.accepted_quote_id and q.job_id = j.id
  where j.business_id = v_business_id and j.status in ('accepted','scheduled','in_progress')
    and q.accepted_at >= v_from and q.accepted_at < v_to;

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
    select j.id,j.title,coalesce(c.name,'Müşteri') as customer_name,q.sale_price,j.status,j.started_at,q.accepted_at
    from public.jobs j join public.quotes q on q.id = j.accepted_quote_id and q.job_id = j.id
    left join public.customers c on c.id = j.customer_id and c.business_id = v_business_id
    where j.business_id = v_business_id and j.status in ('accepted','scheduled','in_progress')
      and q.accepted_at >= v_from and q.accepted_at < v_to
    order by q.accepted_at desc limit 4
  ) r;

  select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'title',r.title,'customer',r.customer_name,
    'salePrice',r.sale_price,'profit',r.actual_profit,'margin',r.actual_profit_margin)
    order by r.actual_profit desc), '[]'::jsonb)
  into v_top_jobs from (
    select j.id,j.title,coalesce(c.name,'Müşteri') as customer_name,q.sale_price,j.actual_profit,j.actual_profit_margin
    from public.jobs j join public.quotes q on q.id = j.accepted_quote_id and q.job_id = j.id
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
revoke all on function public.get_dashboard_overview(date,date) from public, anon;
grant execute on function public.get_dashboard_overview(date,date) to authenticated;

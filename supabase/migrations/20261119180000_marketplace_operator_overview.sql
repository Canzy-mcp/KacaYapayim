create function private.market_operator_overview(p_days integer) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  days integer := greatest(1,least(coalesce(p_days,30),90));
  first_day date := (now() at time zone 'Europe/Istanbul')::date - days + 1;
  from_time timestamptz := first_day::timestamp at time zone 'Europe/Istanbul';
  result jsonb;
begin
  if auth.uid() is null or auth.jwt()->>'aal' is distinct from 'aal2'
    or not exists (select 1 from public.platform_admins a where a.user_id=auth.uid()) then
    raise exception using errcode='42501', message='MARKET_ACCESS';
  end if;

  select jsonb_build_object(
    'days', days,
    'new_accounts', (select count(*) from auth.users where email_confirmed_at>=from_time),
    'signed_in_accounts', (select count(*) from auth.users where last_sign_in_at>=from_time),
    'published_providers', (select count(*) from private.market_providers where published and not suspended),
    'listings', (select count(*) from private.market_requests where created_at>=from_time and not is_direct),
    'listings_with_offers', (select count(*) from private.market_requests r where created_at>=from_time and not is_direct
      and exists (select 1 from private.market_offers o where o.request_id=r.id and o.state<>'withdrawn')),
    'completed_listings', (select count(*) from private.market_requests where created_at>=from_time and not is_direct and state='completed'),
    'quotes', (select count(*) from public.quotes where created_at>=from_time),
    'open_reports', (select count(*) from private.market_reports where state='open'),
    'views', (select coalesce(sum(hits),0) from public.analytics_daily_events where day>=first_day and event_name in ('landing_view','pricing_viewed')),
    'channels', (select coalesce(jsonb_agg(to_jsonb(c) order by hits desc,channel),'[]'::jsonb) from (
      select channel,sum(hits) as hits from public.analytics_daily_events
      where day>=first_day and event_name in ('landing_view','pricing_viewed')
      group by channel order by hits desc,channel limit 10) c),
    'popular_pages', (select coalesce(jsonb_agg(to_jsonb(p) order by hits desc,path),'[]'::jsonb) from (
      select path,sum(hits) as hits from public.analytics_daily_events
      where day>=first_day and event_name in ('landing_view','pricing_viewed')
      group by path order by hits desc,path limit 10) p)
  ) into result;
  return result;
end;
$$;
create function public.market_operator_overview(p_days integer default 30) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select private.market_operator_overview(p_days);
$$;
revoke all on function public.market_operator_overview(integer), private.market_operator_overview(integer) from public,anon,authenticated;
grant execute on function public.market_operator_overview(integer), private.market_operator_overview(integer) to authenticated;

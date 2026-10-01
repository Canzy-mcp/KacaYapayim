-- Aggregate counters only: no business, user, IP, token, or customer fields.
create table if not exists public.analytics_daily_events (
  day date not null,
  event_name text not null,
  path text not null,
  channel text not null default 'unknown',
  hits bigint not null default 0,
  primary key (day, event_name, path, channel)
);
alter table public.analytics_daily_events enable row level security;
revoke all on public.analytics_daily_events from anon, authenticated;

create or replace function public.record_aggregate_event(p_event text, p_path text, p_channel text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(p_event) > 50 or length(p_path) > 100 or length(p_channel) > 30 then
    raise exception 'Invalid analytics event';
  end if;
  insert into public.analytics_daily_events(day,event_name,path,channel,hits)
  values ((now() at time zone 'Europe/Istanbul')::date,p_event,p_path,p_channel,1)
  on conflict (day,event_name,path,channel)
  do update set hits=public.analytics_daily_events.hits+1;
end; $$;
revoke all on function public.record_aggregate_event(text,text,text) from public, anon, authenticated;
grant execute on function public.record_aggregate_event(text,text,text) to service_role;

-- Atomic, server-only abuse protection. Keys are HMAC digests, never raw IPs.
create table if not exists public.request_rate_limits (
  scope text not null,
  identity_hash text not null,
  window_start bigint not null,
  hits integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (scope, identity_hash, window_start)
);
create index if not exists request_rate_limits_expiry_idx on public.request_rate_limits(created_at);
alter table public.request_rate_limits enable row level security;
revoke all on public.request_rate_limits from anon, authenticated;

create or replace function public.consume_rate_limit(p_scope text, p_identity_hash text, p_window_seconds integer, p_limit integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_window bigint; v_hits integer;
begin
  if length(p_scope) > 80 or length(p_identity_hash) <> 64 or p_window_seconds < 1 or p_window_seconds > 86400 or p_limit < 1 or p_limit > 1000 then
    raise exception 'Invalid rate limit parameters';
  end if;
  v_window := floor(extract(epoch from now()) / p_window_seconds)::bigint;
  insert into public.request_rate_limits(scope, identity_hash, window_start, hits)
  values (p_scope, p_identity_hash, v_window, 1)
  on conflict (scope, identity_hash, window_start)
  do update set hits = public.request_rate_limits.hits + 1
  returning hits into v_hits;
  return v_hits <= p_limit;
end; $$;
revoke all on function public.consume_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text,text,integer,integer) to service_role;

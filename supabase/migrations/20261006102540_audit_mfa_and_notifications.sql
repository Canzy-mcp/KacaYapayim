create function private.mfa_satisfied() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select auth.jwt()->>'aal')='aal2',false) or not exists(select 1 from auth.mfa_factors where user_id=(select auth.uid()) and status='verified');
$$;
revoke all on function private.mfa_satisfied() from public,anon;
grant execute on function private.mfa_satisfied() to authenticated;
create function private.require_mfa() returns void language plpgsql security definer set search_path='' as $$
begin if not private.mfa_satisfied() then raise exception 'MFA verification required';end if;end;$$;
revoke all on function private.require_mfa() from public,anon;
grant execute on function private.require_mfa() to authenticated;
-- The live project's default grants also exposed this owner-only RPC to anon.
-- This invoker RPC is protected by the MFA RLS policy; anonymous execute is unnecessary.
revoke execute on function public.update_my_settings(text,text,text,text,text,text,numeric,numeric) from public,anon;
do $$ declare t record; f record; d text;begin
 for t in select tablename from pg_tables where schemaname='public' and tablename not in('request_rate_limits','storage_upload_reservations','analytics_daily_events','product_usage_daily','marketing_campaign_daily','billing_events','platform_admins') loop
  execute format('create policy mfa_required on public.%I as restrictive for all to authenticated using ((select private.mfa_satisfied())) with check ((select private.mfa_satisfied()))',t.tablename);
 end loop;
 for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_language l on l.oid=p.prolang
 where n.nspname in('public','private') and p.prosecdef and l.lanname='plpgsql'
 and p.proname not in('require_mfa') and has_function_privilege('authenticated',p.oid,'execute')
 and not has_function_privilege('anon',p.oid,'execute') loop
  select pg_get_functiondef(f.oid) into d;
  if d !~* '\mbegin\M' then raise exception 'MFA guard contract changed';end if;
  execute regexp_replace(d,'\mbegin\M','begin perform private.require_mfa();','i');
 end loop;
end $$;

create table public.notifications (
 id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses(id) on delete cascade,
 event_key text not null unique,quote_id uuid references public.quotes(id) on delete cascade,
 title text not null,read_at timestamptz,created_at timestamptz not null default now()
);
create index notifications_business_time_idx on public.notifications(business_id,created_at desc);
create index notifications_quote_idx on public.notifications(quote_id);
alter table public.notifications enable row level security;
grant select,update(read_at) on public.notifications to authenticated;
create policy notifications_read_own on public.notifications for select to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())) and (select private.mfa_satisfied()));
create policy notifications_mark_own on public.notifications for update to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())) and (select private.mfa_satisfied())) with check(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())) and (select private.mfa_satisfied()));
create function private.notify_quote_decision() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status in('accepted','rejected') and old.status is distinct from new.status then
  insert into public.notifications(business_id,event_key,quote_id,title) values(new.business_id,new.id::text||':'||new.status,new.id,new.quote_number||case when new.status='accepted' then ' kabul edildi' else ' reddedildi' end) on conflict(event_key) do nothing;
 end if;return new;
end;$$;
create trigger quote_decision_notification after update of status on public.quotes for each row execute function private.notify_quote_decision();

create policy business_assets_mfa on storage.objects as restrictive for all to authenticated
using(bucket_id<>'business-assets' or (select private.mfa_satisfied()))
with check(bucket_id<>'business-assets' or (select private.mfa_satisfied()));
create or replace function public.get_my_payment_total(p_job_id uuid) returns numeric language sql security definer set search_path='' as $$
 select coalesce(sum(p.amount),0) from public.job_payments p join public.businesses b on b.id=p.business_id
 where p.job_id=p_job_id and b.owner_id=(select auth.uid()) and private.mfa_satisfied();
$$;

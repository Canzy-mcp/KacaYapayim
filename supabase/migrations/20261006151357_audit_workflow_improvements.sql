alter table public.business_cost_items add column is_favorite boolean not null default false;
-- Expense totals stay complete even when the activity list is paginated.
create function public.get_my_expense_total(p_job_id uuid) returns numeric language sql security definer set search_path='' as $$
 select coalesce(sum(e.amount),0) from public.work_entries e join public.businesses b on b.id=e.business_id
 where e.job_id=p_job_id and e.kind='expense' and e.status<>'declined' and b.owner_id=(select auth.uid()) and private.mfa_satisfied();
$$;
revoke all on function public.get_my_expense_total(uuid) from public,anon;
grant execute on function public.get_my_expense_total(uuid) to authenticated;

create table public.account_deletion_requests(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
alter table public.account_deletion_requests enable row level security;
revoke all on public.account_deletion_requests from anon,authenticated;
grant all on public.account_deletion_requests to service_role;
create function public.begin_account_deletion(p_user_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 if exists(select 1 from public.storage_upload_reservations where user_id=p_user_id and created_at>now()-interval '1 hour') then return false;end if;
 insert into public.account_deletion_requests(user_id) values(p_user_id) on conflict(user_id) do nothing;return true;
end;$$;
revoke all on function public.begin_account_deletion(uuid) from public,anon,authenticated;
grant execute on function public.begin_account_deletion(uuid) to service_role;
do $$ declare d text;begin
 select pg_get_functiondef('public.reserve_upload(uuid,text,bigint)'::regprocedure) into d;
 if strpos(d,'delete from public.storage_upload_reservations')=0 then raise exception 'Upload contract changed';end if;
 execute replace(d,'delete from public.storage_upload_reservations','if exists(select 1 from public.account_deletion_requests where user_id=p_user_id) then return false;end if; delete from public.storage_upload_reservations');
end $$;

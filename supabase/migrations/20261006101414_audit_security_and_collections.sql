-- Server upload reservations serialize quota checks. Never write storage.objects directly.
create table public.storage_upload_reservations (
 path text primary key, user_id uuid not null references auth.users(id) on delete cascade,
 bytes bigint not null check(bytes between 1 and 5242880), created_at timestamptz not null default now()
);
alter table public.storage_upload_reservations enable row level security;
revoke all on public.storage_upload_reservations from anon,authenticated;
grant select,insert,delete on public.storage_upload_reservations to service_role;
create index storage_reservations_user_idx on public.storage_upload_reservations(user_id);
create or replace function public.reserve_upload(p_user_id uuid,p_path text,p_bytes bigint)
returns boolean language plpgsql security definer set search_path='' as $$
declare total bigint;
begin
 if p_bytes<1 or p_bytes>5242880 or p_path not like p_user_id::text||'/%' then return false;end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 delete from public.storage_upload_reservations where user_id=p_user_id and created_at<now()-interval '1 hour';
 select coalesce(sum((metadata->>'size')::bigint),0) into total from storage.objects where bucket_id='business-assets' and name like p_user_id::text||'/%';
 select total+coalesce(sum(r.bytes),0) into total from public.storage_upload_reservations r where r.user_id=p_user_id
 and not exists(select 1 from storage.objects o where o.bucket_id='business-assets' and o.name=r.path);
 if total+p_bytes>104857600 then return false;end if;
 if (select count(*) from storage.objects where bucket_id='business-assets' and name like p_user_id::text||'/%')+
    (select count(*) from public.storage_upload_reservations r where r.user_id=p_user_id and not exists(select 1 from storage.objects o where o.bucket_id='business-assets' and o.name=r.path))>=1000 then return false;end if;
 insert into public.storage_upload_reservations(path,user_id,bytes) values(p_path,p_user_id,p_bytes);return true;
end;$$;
revoke all on function public.reserve_upload(uuid,text,bigint) from public,anon,authenticated;
grant execute on function public.reserve_upload(uuid,text,bigint) to service_role;

alter table public.quotes add column sharing_disabled boolean not null default false;
create or replace function private.guard_quote_revision() returns trigger language plpgsql security definer set search_path='' as $$
declare ancestor public.quotes%rowtype;
begin
 if new.status in('accepted','rejected') and old.status is distinct from new.status and new.sharing_disabled then raise exception 'Sharing disabled';end if;
 if new.status='ready' and old.status='draft' and new.parent_quote_id is not null then
   perform 1 from public.jobs where id=new.job_id for update;
   select * into ancestor from public.quotes where id=new.parent_quote_id and business_id=new.business_id and job_id=new.job_id for update;
   if not found or ancestor.status in('accepted','draft') then raise exception 'Revision cannot replace this quote';end if;
   if exists(select 1 from public.quotes where job_id=new.job_id and business_id=new.business_id and status='accepted') then raise exception 'Job already accepted';end if;
   update public.quotes set status='cancelled',sharing_disabled=true,updated_at=now()
    where business_id=new.business_id and job_id=new.job_id and id<>new.id
      and (id=new.parent_quote_id or status in('ready','sent','viewed'))
      and status in('ready','sent','viewed','rejected','expired','cancelled');
 end if;
 return new;
end;$$;
create trigger quote_revision_guard before update of status on public.quotes for each row execute function private.guard_quote_revision();

create or replace function public.manage_quote_link(p_quote_id uuid,p_action text)
returns uuid language plpgsql security definer set search_path='' as $$
declare q public.quotes%rowtype; t uuid;
begin
 select v.* into q from public.quotes v join public.businesses b on b.id=v.business_id where v.id=p_quote_id and b.owner_id=(select auth.uid()) for update of v;
 if not found or p_action not in('rotate','revoke') then raise exception 'Invalid request';end if;
 -- A published revision cannot revive the superseded link.
 if exists(select 1 from public.quotes c where c.parent_quote_id=q.id and c.status<>'draft') then raise exception 'Superseded quote';end if;
 t:=gen_random_uuid();
 update public.quotes set public_token=t,sharing_disabled=(p_action='revoke'),updated_at=now() where id=q.id;
 return t;
end;$$;
revoke all on function public.manage_quote_link(uuid,text) from public,anon;
grant execute on function public.manage_quote_link(uuid,text) to authenticated;

create table public.job_payments (
 id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses(id) on delete cascade,
 job_id uuid not null references public.jobs(id) on delete cascade,amount numeric(14,2) not null check(amount>0),
 paid_at date not null,method text not null check(method in('cash','bank','other')),note text not null default '' check(length(note)<=500),
 created_at timestamptz not null default now()
);
create index job_payments_business_job_idx on public.job_payments(business_id,job_id);
create index job_payments_job_idx on public.job_payments(job_id);
alter table public.job_payments enable row level security;
grant select,insert,delete on public.job_payments to authenticated;
create policy payments_read_own on public.job_payments for select to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create policy payments_insert_own on public.job_payments for insert to authenticated with check(exists(select 1 from public.jobs j join public.businesses b on b.id=j.business_id where j.id=job_id and j.business_id=job_payments.business_id and b.owner_id=(select auth.uid())));
create policy payments_delete_own on public.job_payments for delete to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));

create index if not exists bps_profession_idx on public.business_profession_settings(profession_id);
create index if not exists feedback_business_idx on public.feedback(business_id);
create index if not exists feedback_user_idx on public.feedback(user_id);
create index if not exists ptv_published_by_idx on public.profession_template_versions(published_by);
create index if not exists quotes_parent_idx on public.quotes(parent_quote_id);
create index if not exists spg_business_idx on public.service_package_groups(business_id);
create index if not exists spg_selected_quote_idx on public.service_package_groups(selected_quote_id);
create index if not exists subscriptions_pending_plan_idx on public.subscriptions(pending_plan_id);
create index if not exists subscriptions_plan_idx on public.subscriptions(plan_id);
create index if not exists work_entries_author_idx on public.work_entries(author_user_id);

create or replace function public.run_data_retention() returns void language plpgsql security definer set search_path='' as $$
begin
 delete from public.request_rate_limits where created_at<now()-interval '48 hours';
 delete from public.analytics_daily_events where day<current_date-90;
 delete from public.product_usage_daily where day<current_date-90;
 delete from public.marketing_campaign_daily where day<current_date-90;
 delete from public.storage_upload_reservations where created_at<now()-interval '1 hour';
end;$$;
revoke all on function public.run_data_retention() from public,anon,authenticated;
grant execute on function public.run_data_retention() to service_role;

-- Keep the verified customer DTO; add revocation at its database boundary.
do $$ declare d text;begin
 select pg_get_functiondef('public.get_public_quote(uuid)'::regprocedure) into d;
 if strpos(d,'q.status <> ''draft''')=0 then raise exception 'Public quote contract changed';end if;
 execute replace(d,'q.status <> ''draft''','q.status <> ''draft'' and not q.sharing_disabled');
 select pg_get_functiondef('private.get_public_quote_details(uuid)'::regprocedure) into d;
 if strpos(d,'o.status<>''draft''')=0 then raise exception 'Package DTO contract changed';end if;
 execute replace(d,'o.status<>''draft''','o.status<>''draft'' and not o.sharing_disabled');
end $$;

create extension if not exists pg_cron;
select cron.schedule('kacayapayim-data-retention','17 2 * * *','select public.run_data_retention()');

create or replace function public.get_my_payment_total(p_job_id uuid) returns numeric language sql security definer set search_path='' as $$
 select coalesce(sum(p.amount),0) from public.job_payments p join public.businesses b on b.id=p.business_id
 where p.job_id=p_job_id and b.owner_id=(select auth.uid());
$$;
revoke all on function public.get_my_payment_total(uuid) from public,anon;
grant execute on function public.get_my_payment_total(uuid) to authenticated;

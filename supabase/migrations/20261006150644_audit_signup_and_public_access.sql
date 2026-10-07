create table public.signup_settings(id boolean primary key default true check(id),enabled boolean not null default true);
insert into public.signup_settings values(true,true);
alter table public.signup_settings enable row level security;
grant select on public.signup_settings to anon,authenticated;
create policy signup_setting_read on public.signup_settings for select to anon,authenticated using(true);
create function public.before_user_created(event jsonb) returns jsonb language plpgsql set search_path='' as $$
begin
 if not coalesce((select enabled from public.signup_settings where id),false) then
  return jsonb_build_object('error',jsonb_build_object('http_code',403,'message','Yeni hesap açılışı şu anda kapalı.'));
 end if;return '{}'::jsonb;
end;$$;
revoke all on function public.before_user_created(jsonb) from public,anon,authenticated;
grant usage on schema public to supabase_auth_admin;
grant select on public.signup_settings to supabase_auth_admin;
create policy signup_hook_read on public.signup_settings for select to supabase_auth_admin using(true);
grant execute on function public.before_user_created(jsonb) to supabase_auth_admin;

create table public.quote_access_controls(quote_id uuid primary key references public.quotes(id) on delete cascade,code_hash text not null,version uuid not null);
alter table public.quote_access_controls enable row level security;
revoke all on public.quote_access_controls from anon,authenticated;
grant all on public.quote_access_controls to service_role;
create function public.set_quote_access_code(p_quote_id uuid,p_code text) returns boolean language plpgsql security definer set search_path='' as $$
declare q public.quotes%rowtype;v uuid:=gen_random_uuid();begin
 perform private.require_mfa();
 select t.* into q from public.quotes t join public.businesses b on b.id=t.business_id where t.id=p_quote_id and b.owner_id=(select auth.uid()) for update of t;
 if not found or p_code is not null and p_code !~ '^[0-9]{6}$' then raise exception 'Invalid access code';end if;
 if p_code is null then delete from public.quote_access_controls a where a.quote_id=q.id or a.quote_id in(select id from public.quotes where package_group_id=q.package_group_id and business_id=q.business_id);
 else
  insert into public.quote_access_controls(quote_id,code_hash,version)
  select id,extensions.crypt(p_code,extensions.gen_salt('bf',10)),v from public.quotes
  where id=q.id or package_group_id=q.package_group_id and business_id=q.business_id
  on conflict(quote_id) do update set code_hash=excluded.code_hash,version=excluded.version;
 end if;return true;
end;$$;
revoke all on function public.set_quote_access_code(uuid,text) from public,anon;
grant execute on function public.set_quote_access_code(uuid,text) to authenticated;
create function public.verify_quote_access_code(p_token uuid,p_code text) returns boolean language sql security definer set search_path='' as $$
 select coalesce((select a.code_hash=extensions.crypt(p_code,a.code_hash) from public.quote_access_controls a join public.quotes q on q.id=a.quote_id
 where q.public_token=p_token and not q.sharing_disabled and q.status<>'draft' and p_code ~ '^[0-9]{6}$'),false);
$$;
revoke all on function public.verify_quote_access_code(uuid,text) from public,anon,authenticated;
grant execute on function public.verify_quote_access_code(uuid,text) to service_role;

-- Fix the three existing per-row auth.uid() expressions without changing ownership semantics.
alter policy feedback_insert_own on public.feedback with check(user_id=(select auth.uid()) and (business_id is null or exists(select 1 from public.businesses b where b.id=feedback.business_id and b.owner_id=(select auth.uid()))));
alter policy owner_manage_job_viewers on public.job_viewers using(exists(select 1 from public.businesses b where b.id=job_viewers.business_id and b.owner_id=(select auth.uid())))
with check(exists(select 1 from public.businesses b join public.jobs j on j.business_id=b.id where b.id=job_viewers.business_id and b.owner_id=(select auth.uid()) and j.id=job_viewers.job_id));
alter policy owner_package_groups on public.service_package_groups using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));

-- Assigned-job viewing only. No access to prices, margins or customer contacts.
create table public.job_viewers (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 job_id uuid not null references public.jobs(id) on delete cascade, invited_email text not null check (length(invited_email)<=254),
 user_id uuid references auth.users(id) on delete cascade, token_hash text unique, expires_at timestamptz not null default now()+interval '7 days',
 created_at timestamptz not null default now(), unique(job_id,invited_email)
);
alter table public.job_viewers enable row level security;
create index job_viewers_business on public.job_viewers(business_id);
create index job_viewers_user on public.job_viewers(user_id);
create policy owner_manage_job_viewers on public.job_viewers for all to authenticated
 using (exists(select 1 from public.businesses b where b.id=job_viewers.business_id and b.owner_id=auth.uid()))
 with check (exists(select 1 from public.businesses b join public.jobs j on j.business_id=b.id where b.id=job_viewers.business_id and b.owner_id=auth.uid() and j.id=job_viewers.job_id));
grant select,insert,update,delete on public.job_viewers to authenticated;
create function private.accept_job_invite(p_token text) returns boolean language plpgsql security definer set search_path='' as $$
declare v_email text; v_id uuid;
begin
 if auth.uid() is null or p_token !~ '^[a-f0-9]{64}$' then return false; end if;
 select lower(email) into v_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if v_email is null then return false; end if;
 update public.job_viewers set user_id=auth.uid(),token_hash=null
 where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and invited_email=v_email and expires_at>now() and user_id is null returning id into v_id;
 return v_id is not null;
end; $$;
create function private.get_assigned_jobs() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',j.id,'title',j.title,'description',j.description,'status',j.status,'businessName',b.name,
 'visits',(select coalesce(jsonb_agg(jsonb_build_object('title',w.title,'scheduledAt',w.scheduled_at,'status',w.status) order by w.scheduled_at),'[]'::jsonb)
 from public.work_entries w where w.job_id=j.id and w.business_id=b.id and w.kind='visit')) order by j.created_at desc),'[]'::jsonb)
 from public.job_viewers v join public.jobs j on j.id=v.job_id and j.business_id=v.business_id join public.businesses b on b.id=v.business_id
 where v.user_id=auth.uid() and auth.uid() is not null;
$$;
revoke all on function private.accept_job_invite(text),private.get_assigned_jobs() from public,anon;
grant execute on function private.accept_job_invite(text),private.get_assigned_jobs() to authenticated;
create function public.accept_job_invite(p_token text) returns boolean language sql security invoker set search_path='' as $$select private.accept_job_invite(p_token);$$;
create function public.get_assigned_jobs() returns jsonb language sql stable security invoker set search_path='' as $$select private.get_assigned_jobs();$$;
revoke all on function public.accept_job_invite(text),public.get_assigned_jobs() from public,anon;
grant execute on function public.accept_job_invite(text),public.get_assigned_jobs() to authenticated;

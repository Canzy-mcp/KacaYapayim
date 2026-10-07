-- Minimal Supabase platform contract for isolated PostgreSQL tests. No network or production credentials.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role supabase_auth_admin nologin;
create schema auth;
create schema storage;
create schema extensions;
grant usage on schema public,auth,storage,extensions to anon,authenticated,service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}',email_confirmed_at timestamptz);
create table auth.mfa_factors(id uuid primary key,user_id uuid not null references auth.users(id),factor_type text not null,status text not null,created_at timestamptz not null,updated_at timestamptz not null);
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
create function auth.role() returns text language sql stable as $$select auth.jwt()->>'role'$$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,metadata jsonb);
alter table storage.objects enable row level security;
grant select,insert,update,delete on storage.objects to authenticated,service_role;
create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
-- Supabase installs this platform trigger helper; app migrations only revoke direct execution.
create function public.rls_auto_enable() returns event_trigger language plpgsql as $$begin return;end$$;
-- Scheduler registration is tested here; actual pg_cron execution needs the hosting smoke check.
create schema cron;
create table cron.job(jobid bigint generated always as identity primary key,jobname text unique,schedule text,command text);
create function cron.schedule(name text,expression text,statement text) returns bigint language sql as $$insert into cron.job(jobname,schedule,command) values(name,expression,statement) on conflict(jobname) do update set schedule=excluded.schedule,command=excluded.command returning jobid$$;

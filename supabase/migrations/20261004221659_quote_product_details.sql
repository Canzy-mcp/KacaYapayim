alter table public.quotes add column tax_mode text not null default 'unspecified' check(tax_mode in ('unspecified','included','excluded'));
do $$ declare v_definition text; begin
 select pg_get_functiondef('private.copy_my_quote(uuid,boolean)'::regprocedure) into v_definition;
 if strpos(v_definition,'set sale_price=v_q.sale_price,')=0 then raise exception 'Copy function contract changed'; end if;
 execute replace(v_definition,'set sale_price=v_q.sale_price,','set tax_mode=v_q.tax_mode,sale_price=v_q.sale_price,');
end $$;
create function private.save_quote_details(p_quote_id uuid,p_job_id uuid,p_status text,p_title text,p_description text,p_items jsonb,p_exclusions jsonb,p_duration text,p_payment_terms text,p_valid_until date,p_notes text,p_sale_price numeric,p_acknowledge_risk boolean,p_tax_mode text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 if p_tax_mode is null or p_tax_mode not in ('unspecified','included','excluded') then raise exception 'Invalid tax mode'; end if;
 v_id:=public.save_quote(p_quote_id,p_job_id,p_status,p_title,p_description,p_items,p_exclusions,p_duration,p_payment_terms,p_valid_until,p_notes,p_sale_price,p_acknowledge_risk);
 update public.quotes set tax_mode=p_tax_mode where id=v_id and business_id in(select id from public.businesses where owner_id=auth.uid());
 return v_id;
end $$;
revoke all on function private.save_quote_details(uuid,uuid,text,text,text,jsonb,jsonb,text,text,date,text,numeric,boolean,text) from public,anon;
grant execute on function private.save_quote_details(uuid,uuid,text,text,text,jsonb,jsonb,text,text,date,text,numeric,boolean,text) to authenticated;
create function public.save_quote_details(p_quote_id uuid,p_job_id uuid,p_status text,p_title text,p_description text,p_items jsonb,p_exclusions jsonb,p_duration text,p_payment_terms text,p_valid_until date,p_notes text,p_sale_price numeric,p_acknowledge_risk boolean,p_tax_mode text)
returns uuid language sql security invoker set search_path='' as $$ select private.save_quote_details(p_quote_id,p_job_id,p_status,p_title,p_description,p_items,p_exclusions,p_duration,p_payment_terms,p_valid_until,p_notes,p_sale_price,p_acknowledge_risk,p_tax_mode); $$;
revoke all on function public.save_quote_details(uuid,uuid,text,text,text,jsonb,jsonb,text,text,date,text,numeric,boolean,text) from public,anon;
grant execute on function public.save_quote_details(uuid,uuid,text,text,text,jsonb,jsonb,text,text,date,text,numeric,boolean,text) to authenticated;
create function private.copy_quote_tax_mode() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.parent_quote_id is not null and old.parent_quote_id is null then
  select q.tax_mode into new.tax_mode from public.quotes q where q.id=new.parent_quote_id and q.business_id=new.business_id;
 end if;
 return new;
end $$;
revoke all on function private.copy_quote_tax_mode() from public,anon,authenticated;
create trigger copy_quote_tax_mode before update of parent_quote_id on public.quotes for each row execute function private.copy_quote_tax_mode();

create table public.quote_templates (
 id uuid primary key default gen_random_uuid(),business_id uuid not null references public.businesses(id) on delete cascade,
 name text not null check(char_length(btrim(name)) between 1 and 100),content jsonb not null check(jsonb_typeof(content)='object' and octet_length(content::text)<=30000),
 created_at timestamptz not null default now(),unique(business_id,name)
);
alter table public.quote_templates enable row level security;
grant select,insert,update,delete on public.quote_templates to authenticated;
create policy quote_templates_owner on public.quote_templates for all to authenticated
 using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())))
 with check(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create function private.get_public_quote_details(p_token uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_result jsonb; v_tax text;
begin
 v_result:=public.get_public_quote(p_token);if v_result is null then return null;end if;
 select tax_mode into v_tax from public.quotes where public_token=p_token and status<>'draft';
 return v_result||jsonb_build_object('taxMode',v_tax);
end $$;
revoke all on function private.get_public_quote_details(uuid) from public,anon,authenticated;
grant execute on function private.get_public_quote_details(uuid) to service_role;
grant usage on schema private to service_role;
create function public.get_public_quote_details(p_token uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.get_public_quote_details(p_token); $$;
revoke all on function public.get_public_quote_details(uuid) from public,anon,authenticated;
grant execute on function public.get_public_quote_details(uuid) to service_role;

create table public.business_preferences (
 business_id uuid primary key references public.businesses(id) on delete cascade,
 followup_reminders boolean not null default true,decision_notifications boolean not null default true,cost_reminders boolean not null default true
);
alter table public.business_preferences enable row level security;
grant select,insert,update on public.business_preferences to authenticated;
create policy preferences_owner on public.business_preferences for all to authenticated
 using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())))
 with check(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));

create or replace function public.get_product_cohorts() returns jsonb language sql stable security invoker set search_path='' as $$
 with measurement as (select coalesce(min(day),current_date) as started from public.product_usage_daily),owners as (
 select b.id,b.created_at::date as joined,m.started,
   exists(select 1 from public.quotes q where q.business_id=b.id) as activated,
   exists(select 1 from public.product_usage_daily u where u.business_id=b.id and u.day>b.created_at::date and u.day<=b.created_at::date+7) as repeated7,
   exists(select 1 from public.product_usage_daily u where u.business_id=b.id and u.day>=b.created_at::date+8 and u.day<=b.created_at::date+30) as repeated30
 from public.businesses b cross join measurement m where b.onboarding_completed
 ),cohorts as (
 select to_char(joined,'YYYY-MM') as cohort,count(*) as businesses,count(*) filter(where activated) as activated,
 count(*) filter(where joined>=started and joined<=current_date-7) as eligible7,count(*) filter(where joined>=started and joined<=current_date-7 and repeated7) as repeated7,
 count(*) filter(where joined>=started and joined<=current_date-30) as eligible30,count(*) filter(where joined>=started and joined<=current_date-30 and repeated30) as repeated30
 from owners group by 1 order by 1 desc
 ) select coalesce(jsonb_agg(cohorts),'[]'::jsonb) from cohorts;
$$;

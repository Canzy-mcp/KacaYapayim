create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
-- Owner-scoped product improvements. No billing or payment changes.
create function public.search_my_quotes(p_query text default '', p_status text default 'all', p_page integer default 1)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with filtered as (
    select q.*, coalesce(c.name, 'Müşteri seçilmedi') as customer_name,
      case when q.status in ('ready','sent','viewed') and q.valid_until < (now() at time zone 'Europe/Istanbul')::date then 'expired' else q.status end as effective_status
    from public.quotes q left join public.customers c on c.id=q.customer_id and c.business_id=q.business_id
    where exists(select 1 from public.businesses b where b.id=q.business_id and b.owner_id=auth.uid())
  ), matched as (
    select * from filtered where (p_status='all' or effective_status=p_status)
      and (coalesce(p_query,'')='' or strpos(lower(quote_number || ' ' || title || ' ' || customer_name), lower(left(p_query,80)))>0)
  ), paged as (select * from matched order by created_at desc,id desc limit 30 offset (greatest(1,least(coalesce(p_page,1),100000))-1)*30)
  select jsonb_build_object('rows',coalesce((select jsonb_agg(jsonb_build_object('quote',to_jsonb(p)-'customer_name'-'effective_status','customerName',customer_name) order by created_at desc,id desc) from paged p),'[]'::jsonb),'count',(select count(*) from matched))
$$;
revoke all on function public.search_my_quotes(text,text,integer) from public,anon;
grant execute on function public.search_my_quotes(text,text,integer) to authenticated;

insert into public.professions(slug,name,description,icon,category,is_active,is_public,sort_order)
values('manual','Genel İş','Elle girilen maliyetlerle iş hesabı','wrench','Genel',true,false,999)
on conflict(slug) do nothing;

create function private.save_manual_job(p_job_id uuid,p_customer_id uuid,p_title text,p_description text,p_lines jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_business uuid; v_profession uuid; v_id uuid; v_line jsonb; v_total numeric:=0;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select id into v_business from public.businesses where owner_id=auth.uid() and onboarding_completed;
  if v_business is null then raise exception 'Business not found'; end if;
  select id into v_profession from public.professions where slug='manual';
  if char_length(btrim(p_title)) not between 1 and 160 or char_length(coalesce(p_description,''))>2000
    or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) not between 1 and 60 then raise exception 'Invalid input'; end if;
  if p_customer_id is not null and not exists(select 1 from public.customers where id=p_customer_id and business_id=v_business) then raise exception 'Customer mismatch'; end if;
  for v_line in select value from jsonb_array_elements(p_lines) loop
    if char_length(btrim(v_line->>'name')) not between 1 and 160 or (v_line->>'quantity')::numeric not between 0.001 and 1000000
      or (v_line->>'unit_cost')::numeric not between 0 and 1000000000 or v_line->>'category' not in ('material','labor','other') then raise exception 'Invalid line'; end if;
    v_total:=v_total+round((v_line->>'quantity')::numeric*(v_line->>'unit_cost')::numeric,2);
  end loop;
  if v_total<=0 or v_total>1000000000000 then raise exception 'Invalid total'; end if;
  if p_job_id is null then
    insert into public.jobs(business_id,profession_id,customer_id,title,description,status,estimated_cost,input_data,calculation_snapshot,calculated_at)
    values(v_business,v_profession,p_customer_id,btrim(p_title),p_description,'calculated',v_total,jsonb_build_object('manual',true,'lines',p_lines),
      jsonb_build_object('quoteScope',(select jsonb_agg(jsonb_build_object('name',x->>'name','description','')) from jsonb_array_elements(p_lines) x),'totalCost',v_total),now()) returning id into v_id;
  else
    select id into v_id from public.jobs where id=p_job_id and business_id=v_business and input_data->>'manual'='true' and status in ('draft','calculated') for update;
    if v_id is null then raise exception 'Job cannot be edited'; end if;
    update public.jobs set customer_id=p_customer_id,title=btrim(p_title),description=p_description,estimated_cost=v_total,calculated_at=now(),input_data=jsonb_build_object('manual',true,'lines',p_lines),
      calculation_snapshot=jsonb_build_object('quoteScope',(select jsonb_agg(jsonb_build_object('name',x->>'name','description','')) from jsonb_array_elements(p_lines) x),'totalCost',v_total) where id=v_id;
    delete from public.job_cost_breakdown where job_id=v_id;
  end if;
  for v_line in select value from jsonb_array_elements(p_lines) loop
    insert into public.job_cost_breakdown(job_id,name,category,unit,quantity,unit_cost,total_cost,source_type)
    values(v_id,v_line->>'name',v_line->>'category','piece',(v_line->>'quantity')::numeric,(v_line->>'unit_cost')::numeric,
      round((v_line->>'quantity')::numeric*(v_line->>'unit_cost')::numeric,2),case when v_line->>'category'='other' then 'extra' else v_line->>'category' end);
  end loop;
  return v_id;
end $$;
revoke all on function private.save_manual_job(uuid,uuid,text,text,jsonb) from public,anon;
grant execute on function private.save_manual_job(uuid,uuid,text,text,jsonb) to authenticated;

create table public.work_entries (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
 job_id uuid references public.jobs(id) on delete cascade, quote_id uuid references public.quotes(id) on delete cascade,
 kind text not null check(kind in ('followup','visit','note','expense','extra_work','attachment','revision_request')),
 title text not null check(char_length(btrim(title)) between 1 and 160), note text not null default '' check(char_length(note)<=2000),
 amount numeric(16,2) check(amount is null or amount between 0 and 1000000000000),
 scheduled_at timestamptz, status text not null default 'open' check(status in ('open','done','approved','declined')),
 metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object' and octet_length(metadata::text)<=10000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index work_entries_business_schedule_idx on public.work_entries(business_id,scheduled_at);
create index work_entries_job_idx on public.work_entries(job_id);
create index work_entries_quote_idx on public.work_entries(quote_id);
alter table public.work_entries enable row level security;
grant select,insert,update,delete on public.work_entries to authenticated;
create policy work_entries_owner on public.work_entries for all to authenticated
 using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())))
 with check(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))
   and (job_id is null or exists(select 1 from public.jobs j where j.id=job_id and j.business_id=work_entries.business_id))
   and (quote_id is null or exists(select 1 from public.quotes q where q.id=quote_id and q.business_id=work_entries.business_id)));
create trigger work_entries_updated before update on public.work_entries for each row execute function public.set_updated_at();

create function private.copy_my_job(p_job_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare v_job public.jobs%rowtype; v_id uuid;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 select j.* into v_job from public.jobs j join public.businesses b on b.id=j.business_id where j.id=p_job_id and b.owner_id=auth.uid();
 if not found then raise exception 'Job not found'; end if;
 insert into public.jobs(business_id,customer_id,profession_id,title,description,status,estimated_cost,input_data,profession_template_version,template_snapshot,settings_snapshot,calculation_snapshot,calculated_at)
 values(v_job.business_id,v_job.customer_id,v_job.profession_id,left(v_job.title||' (kopya)',160),v_job.description,'calculated',v_job.estimated_cost,v_job.input_data,v_job.profession_template_version,v_job.template_snapshot,v_job.settings_snapshot,v_job.calculation_snapshot,now()) returning id into v_id;
 insert into public.job_cost_breakdown(job_id,cost_item_id,name,category,unit,quantity,unit_cost,total_cost,source_type,metadata)
 select v_id,cost_item_id,name,category,unit,quantity,unit_cost,total_cost,source_type,metadata from public.job_cost_breakdown where job_id=p_job_id;
 insert into public.painter_job_details(job_id,wall_area,ceiling_area,wall_coats,ceiling_coats,primer_required,primer_coats,putty_required,putty_area,days,master_count,helper_count,include_consumables,include_transport,waste_percentage,notes,technical_settings_snapshot,extra_costs)
 select v_id,wall_area,ceiling_area,wall_coats,ceiling_coats,primer_required,primer_coats,putty_required,putty_area,days,master_count,helper_count,include_consumables,include_transport,waste_percentage,notes,technical_settings_snapshot,extra_costs from public.painter_job_details where job_id=p_job_id;
 return v_id;
end $$;
revoke all on function private.copy_my_job(uuid) from public,anon;
grant execute on function private.copy_my_job(uuid) to authenticated;

create function private.copy_my_quote(p_quote_id uuid,p_revision boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare v_q public.quotes%rowtype; v_id uuid;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 select q.* into v_q from public.quotes q join public.businesses b on b.id=q.business_id where q.id=p_quote_id and b.owner_id=auth.uid() for update of q;
 if not found then raise exception 'Quote not found'; end if;
 v_id:=public.save_quote(null,v_q.job_id,'draft',v_q.title,v_q.description,
   coalesce((select jsonb_agg(jsonb_build_object('name',name,'description',coalesce(description,'')) order by sort_order) from public.quote_items where quote_id=p_quote_id),'[]'::jsonb),
   coalesce((select jsonb_agg(text order by sort_order) from public.quote_exclusions where quote_id=p_quote_id),'[]'::jsonb),v_q.estimated_duration_text,v_q.payment_terms,
   (now() at time zone 'Europe/Istanbul')::date+7,v_q.notes,null,false);
 update public.quotes set sale_price=v_q.sale_price,estimated_cost_snapshot=v_q.estimated_cost_snapshot,estimated_profit_snapshot=v_q.estimated_profit_snapshot,
   profit_margin_snapshot=v_q.profit_margin_snapshot,target_margin_snapshot=v_q.target_margin_snapshot,minimum_margin_snapshot=v_q.minimum_margin_snapshot,
   parent_quote_id=case when p_revision then p_quote_id else null end,revision_number=case when p_revision then v_q.revision_number+1 else 1 end where id=v_id;
 return v_id;
end $$;
revoke all on function private.copy_my_quote(uuid,boolean) from public,anon;
grant execute on function private.copy_my_quote(uuid,boolean) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('business-assets','business-assets',false,5242880,array['image/png','image/jpeg','image/webp','application/pdf']) on conflict(id) do nothing;
create policy business_assets_read on storage.objects for select to authenticated using(bucket_id='business-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy business_assets_insert on storage.objects for insert to authenticated with check(bucket_id='business-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy business_assets_delete on storage.objects for delete to authenticated using(bucket_id='business-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);

create table public.product_usage_daily (
 business_id uuid not null references public.businesses(id) on delete cascade,
 day date not null, event_name text not null check(char_length(event_name)<=50),
 primary key(business_id,day,event_name)
);
alter table public.product_usage_daily enable row level security;
revoke all on public.product_usage_daily from anon,authenticated;
create table public.marketing_campaign_daily (
 day date not null, event_name text not null, path text not null, channel text not null,
 medium text not null, campaign text not null, hits bigint not null default 1,
 primary key(day,event_name,path,channel,medium,campaign)
);
alter table public.marketing_campaign_daily enable row level security;
revoke all on public.marketing_campaign_daily from anon,authenticated;
create function public.record_campaign_event(p_event text,p_path text,p_channel text,p_medium text,p_campaign text)
returns void language sql security invoker set search_path='' as $$
 insert into public.marketing_campaign_daily(day,event_name,path,channel,medium,campaign)
 values((now() at time zone 'Europe/Istanbul')::date,left(p_event,50),left(p_path,100),left(p_channel,30),left(p_medium,60),left(p_campaign,60))
 on conflict(day,event_name,path,channel,medium,campaign) do update set hits=public.marketing_campaign_daily.hits+1;
$$;
revoke all on function public.record_campaign_event(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.record_campaign_event(text,text,text,text,text) to service_role;
grant all on public.product_usage_daily,public.marketing_campaign_daily to service_role;
create function public.get_product_cohorts() returns jsonb language sql stable security invoker set search_path='' as $$
 with owners as (
 select b.id,b.created_at::date as joined,
   exists(select 1 from public.quotes q where q.business_id=b.id) as activated,
   exists(select 1 from public.product_usage_daily u where u.business_id=b.id and u.day>b.created_at::date and u.day<=b.created_at::date+7) as repeated7,
   exists(select 1 from public.product_usage_daily u where u.business_id=b.id and u.day>=b.created_at::date+8 and u.day<=b.created_at::date+30) as repeated30
 from public.businesses b where b.onboarding_completed
 ), cohorts as (
 select to_char(joined,'YYYY-MM') as cohort,count(*) as businesses,count(*) filter(where activated) as activated,
 count(*) filter(where joined<=current_date-7) as eligible7,count(*) filter(where joined<=current_date-7 and repeated7) as repeated7,
 count(*) filter(where joined<=current_date-30) as eligible30,count(*) filter(where joined<=current_date-30 and repeated30) as repeated30
 from owners group by 1 order by 1 desc
 ) select coalesce(jsonb_agg(cohorts),'[]'::jsonb) from cohorts;
$$;
revoke all on function public.get_product_cohorts() from public,anon,authenticated;
grant execute on function public.get_product_cohorts() to service_role;

create table public.business_branding (
 business_id uuid primary key references public.businesses(id) on delete cascade,
 storage_path text not null, updated_at timestamptz not null default now()
);
alter table public.business_branding enable row level security;
grant select,insert,update,delete on public.business_branding to authenticated;
create policy branding_owner on public.business_branding for all to authenticated
 using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())))
 with check(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())) and split_part(storage_path,'/',1)=(select auth.uid())::text);

create function public.save_manual_job(p_job_id uuid,p_customer_id uuid,p_title text,p_description text,p_lines jsonb) returns uuid language sql security invoker set search_path='' as $$ select private.save_manual_job(p_job_id,p_customer_id,p_title,p_description,p_lines); $$;
revoke all on function public.save_manual_job(uuid,uuid,text,text,jsonb) from public,anon;
grant execute on function public.save_manual_job(uuid,uuid,text,text,jsonb) to authenticated;

create function public.copy_my_job(p_job_id uuid) returns uuid language sql security invoker set search_path='' as $$ select private.copy_my_job(p_job_id); $$;
revoke all on function public.copy_my_job(uuid) from public,anon;
grant execute on function public.copy_my_job(uuid) to authenticated;

create function public.copy_my_quote(p_quote_id uuid,p_revision boolean default false) returns uuid language sql security invoker set search_path='' as $$ select private.copy_my_quote(p_quote_id,p_revision); $$;
revoke all on function public.copy_my_quote(uuid,boolean) from public,anon;
grant execute on function public.copy_my_quote(uuid,boolean) to authenticated;

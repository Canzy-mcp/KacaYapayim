-- SQL SECURITY DEFINER readers need the same assurance guard as PL/pgSQL RPCs.
do $$ declare definition text; begin
 select pg_get_functiondef('private.get_assigned_jobs()'::regprocedure) into definition;
 if strpos(definition,'where v.user_id=auth.uid() and auth.uid() is not null')=0 then raise exception 'Assigned jobs contract changed'; end if;
 execute replace(definition,'where v.user_id=auth.uid() and auth.uid() is not null','where v.user_id=auth.uid() and auth.uid() is not null and private.mfa_satisfied()');
end $$;

create table public.quote_decision_history (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 quote_id uuid not null references public.quotes(id) on delete cascade,
 decision text not null check(decision in('accepted','rejected')),
 revision_number integer not null, snapshot jsonb not null, content_hash text not null,
 access_requirement text not null check(access_requirement in('link','access_code')),
 decided_at timestamptz not null default now(), unique(quote_id,decision)
);
create index quote_decision_history_business_idx on public.quote_decision_history(business_id);
alter table public.quote_decision_history enable row level security;
revoke all on public.quote_decision_history from anon,authenticated;
grant select on public.quote_decision_history to authenticated,service_role;
create policy decision_history_owner on public.quote_decision_history for select to authenticated using(
 exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())) and (select private.mfa_satisfied())
);
create function private.record_quote_decision() returns trigger language plpgsql security definer set search_path='' as $$
declare content jsonb;
begin
 if new.status in('accepted','rejected') and old.status is distinct from new.status then
  content:=jsonb_build_object('quoteNumber',new.quote_number,'revision',new.revision_number,'title',new.title,'description',new.description,
    'salePrice',new.sale_price,'taxMode',new.tax_mode,'taxRate',new.tax_rate,'validUntil',new.valid_until,
    'estimatedDuration',new.estimated_duration_text,'paymentTerms',new.payment_terms,'notes',new.notes,
    'items',(select coalesce(jsonb_agg(jsonb_build_object('name',name,'description',description) order by sort_order,id),'[]'::jsonb) from public.quote_items where quote_id=new.id),
    'exclusions',(select coalesce(jsonb_agg(text order by sort_order,id),'[]'::jsonb) from public.quote_exclusions where quote_id=new.id));
  insert into public.quote_decision_history(business_id,quote_id,decision,revision_number,snapshot,content_hash,access_requirement,decided_at)
  values(new.business_id,new.id,new.status,new.revision_number,content,encode(extensions.digest(content::text,'sha256'),'hex'),
    case when exists(select 1 from public.quote_access_controls where quote_id=new.id) then 'access_code' else 'link' end,
    coalesce(case when new.status='accepted' then new.accepted_at else new.rejected_at end,now())) on conflict(quote_id,decision) do nothing;
 end if; return new;
end;$$;
revoke all on function private.record_quote_decision() from public,anon,authenticated;
create trigger quote_decision_history after update of status on public.quotes for each row execute function private.record_quote_decision();

create function private.notify_revision_request() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.kind='revision_request' then
  insert into public.notifications(business_id,event_key,quote_id,title)
  values(new.business_id,'revision_request:'||new.id,new.quote_id,'Teklif için revizyon istendi') on conflict(event_key) do nothing;
 end if; return new;
end;$$;
revoke all on function private.notify_revision_request() from public,anon,authenticated;
create trigger revision_request_notification after insert on public.work_entries for each row execute function private.notify_revision_request();

-- Branding mapping and business URL must commit together.
create function public.set_my_logo(p_path text,p_url text) returns text language plpgsql security definer set search_path='' as $$
declare b uuid; previous text;
begin
 perform private.require_mfa();
 select id into b from public.businesses where owner_id=(select auth.uid()) for update;
 if b is null then raise exception 'Business unavailable'; end if;
 if p_path is not null and (p_path not like auth.uid()::text||'/logo/%' or p_url not like '/api/business/logo/'||b::text||'?v=%') then raise exception 'Invalid branding path'; end if;
 select storage_path into previous from public.business_branding where business_id=b;
 if p_path is null then delete from public.business_branding where business_id=b;
 else
  if not exists(select 1 from storage.objects where bucket_id='business-assets' and name=p_path) then raise exception 'File unavailable'; end if;
  insert into public.business_branding(business_id,storage_path,updated_at) values(b,p_path,now())
   on conflict(business_id) do update set storage_path=excluded.storage_path,updated_at=excluded.updated_at;
 end if;
 update public.businesses set logo_url=case when p_path is null then null else p_url end where id=b;
 return previous;
end;$$;
revoke all on function public.set_my_logo(text,text) from public,anon;
grant execute on function public.set_my_logo(text,text) to authenticated;

create function public.save_approved_extra_job(p_entry_id uuid,p_title text,p_description text,p_lines jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare entry public.work_entries%rowtype; source public.jobs%rowtype; created uuid;
begin
 perform private.require_mfa();
 select w.* into entry from public.work_entries w join public.businesses b on b.id=w.business_id
 where w.id=p_entry_id and b.owner_id=(select auth.uid()) and w.kind='extra_work' and w.status='approved' for update of w;
 if not found or entry.job_id is null then raise exception 'Approved extra work unavailable';end if;
 select * into source from public.jobs where id=entry.job_id and business_id=entry.business_id;
 if not found then raise exception 'Source job unavailable';end if;
 if entry.metadata->>'related_job_id' is not null then
  select id into created from public.jobs where id=(entry.metadata->>'related_job_id')::uuid and business_id=entry.business_id;
  if created is not null then return created;end if;
 end if;
 created:=public.save_manual_job(null,source.customer_id,p_title,p_description,p_lines);
 update public.work_entries set metadata=metadata||jsonb_build_object('related_job_id',created) where id=entry.id;
 update public.jobs set input_data=input_data||jsonb_build_object('source_extra_work_id',entry.id,'source_job_id',source.id) where id=created;
 return created;
end;$$;
revoke all on function public.save_approved_extra_job(uuid,text,text,jsonb) from public,anon;
grant execute on function public.save_approved_extra_job(uuid,text,text,jsonb) to authenticated;

alter policy branding_owner on public.business_branding with check(
 exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()))
 and storage_path like (select auth.uid())::text||'/logo/%'
);

create function public.get_my_archive_page(p_table text,p_cursor uuid,p_cutoff timestamptz) returns jsonb
language plpgsql security definer set search_path='' as $$
declare ownership text; key_column text:='id'; cutoff text:='t.created_at <= $3'; result jsonb;
begin
 perform private.require_mfa();if auth.uid() is null then raise exception 'Not authenticated';end if;
 if p_table in('customers','quotes','business_cost_items','business_profession_settings','jobs','work_entries','job_payments','notifications','quote_templates','job_viewers','subscriptions','service_package_groups','quote_decision_history') then
  ownership:='exists(select 1 from public.businesses b where b.id=t.business_id and b.owner_id=$1)';
  if p_table='quote_decision_history' then cutoff:='t.decided_at <= $3';end if;
  if p_table='service_package_groups' then cutoff:='true';end if;
 elsif p_table in('business_branding','business_preferences') then
  key_column:='business_id';cutoff:='true';ownership:='exists(select 1 from public.businesses b where b.id=t.business_id and b.owner_id=$1)';
 elsif p_table in('painter_job_details','job_cost_breakdown','actual_job_costs') then
  ownership:='exists(select 1 from public.jobs j join public.businesses b on b.id=j.business_id where j.id=t.job_id and b.owner_id=$1)';
  if p_table='painter_job_details' then key_column:='job_id';end if;
 elsif p_table in('quote_items','quote_exclusions') then
  ownership:='exists(select 1 from public.quotes q join public.businesses b on b.id=q.business_id where q.id=t.quote_id and b.owner_id=$1)';
 elsif p_table='profiles' then ownership:='t.id=$1';
 elsif p_table='businesses' then ownership:='t.owner_id=$1';
 else raise exception 'Unsupported archive table';end if;
 execute format('select coalesce(jsonb_agg(jsonb_build_object(''key'',page.record_key,''record'',page.record) order by page.record_key),''[]''::jsonb) from (select t.%I record_key,to_jsonb(t)-''public_token''-''token_hash'' record from public.%I t where %s and %s and ($2 is null or t.%I>$2) order by t.%I limit 500) page',key_column,p_table,ownership,cutoff,key_column,key_column)
 into result using auth.uid(),p_cursor,p_cutoff;
 return result;
end;$$;
revoke all on function public.get_my_archive_page(text,uuid,timestamptz) from public,anon;
grant execute on function public.get_my_archive_page(text,uuid,timestamptz) to authenticated;

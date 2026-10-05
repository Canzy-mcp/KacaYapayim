-- Expense records are additional costs; manual actual lines remain independently editable.
alter table public.jobs add column manual_actual_cost numeric(16,2);
update public.jobs set manual_actual_cost=actual_cost where actual_cost is not null;
alter table public.job_viewers add column can_add_notes boolean not null default false;
alter table public.work_entries add column author_user_id uuid references auth.users(id) on delete set null;

create function private.sync_expense_actuals() returns trigger language plpgsql security definer set search_path='' as $$
declare v_job uuid; v_total numeric; v_sale numeric;
begin
 v_job:=case when tg_op='DELETE' then old.job_id else new.job_id end;
 if v_job is null then return null; end if;
 perform 1 from public.jobs where id=v_job for update;
 select coalesce(sum(w.amount),0) into v_total from public.work_entries w
 where w.job_id=v_job and w.kind='expense' and w.status<>'declined';
 select q.sale_price into v_sale from public.jobs j join public.quotes q on q.id=j.accepted_quote_id where j.id=v_job and q.status='accepted';
 update public.jobs set actual_cost=manual_actual_cost+v_total,
 actual_profit=v_sale-manual_actual_cost-v_total,
 actual_profit_margin=round((v_sale-manual_actual_cost-v_total)/nullif(v_sale,0)*100,4)
 where id=v_job and manual_actual_cost is not null;
 return null;
end $$;
revoke all on function private.sync_expense_actuals() from public,anon,authenticated;
create trigger expense_actuals after insert or update or delete on public.work_entries for each row execute function private.sync_expense_actuals();

-- Retain the existing validation and owner checks; add the expense total atomically.
do $$ declare d text; begin
 select pg_get_functiondef('public.save_actual_job_costs(uuid,jsonb,text)'::regprocedure) into d;
 d:=replace(d,'actual_cost = round(v_total,2),','manual_actual_cost = round(v_total,2), actual_cost = round(v_total + (select coalesce(sum(w.amount),0) from public.work_entries w where w.job_id=p_job_id and w.kind=''expense'' and w.status<>''declined''),2),');
 d:=replace(d,'actual_profit = round(v_quote.sale_price - v_total,2),','actual_profit = round(v_quote.sale_price - v_total - (select coalesce(sum(w.amount),0) from public.work_entries w where w.job_id=p_job_id and w.kind=''expense'' and w.status<>''declined''),2),');
 d:=replace(d,'(v_quote.sale_price - v_total) / v_quote.sale_price','(v_quote.sale_price - v_total - (select coalesce(sum(w.amount),0) from public.work_entries w where w.job_id=p_job_id and w.kind=''expense'' and w.status<>''declined'')) / v_quote.sale_price');
 execute d;
end $$;

create function private.add_assigned_job_note(p_job_id uuid,p_title text,p_note text) returns uuid language plpgsql security definer set search_path='' as $$
declare v_business uuid; v_id uuid;
begin
 if auth.uid() is null or char_length(btrim(p_title)) not between 1 and 160 or char_length(coalesce(p_note,''))>2000 then raise exception 'Invalid input'; end if;
 select v.business_id into v_business from public.job_viewers v join public.jobs j on j.id=v.job_id and j.business_id=v.business_id
 where v.job_id=p_job_id and v.user_id=auth.uid() and v.can_add_notes for update of v;
 if not found then raise exception 'Access denied'; end if;
 insert into public.work_entries(business_id,job_id,kind,title,note,author_user_id) values(v_business,p_job_id,'note',btrim(p_title),coalesce(p_note,''),auth.uid()) returning id into v_id;
 return v_id;
end $$;
revoke all on function private.add_assigned_job_note(uuid,text,text) from public,anon;
grant execute on function private.add_assigned_job_note(uuid,text,text) to authenticated;
create function public.add_assigned_job_note(p_job_id uuid,p_title text,p_note text) returns uuid language sql security invoker set search_path='' as $$select private.add_assigned_job_note(p_job_id,p_title,p_note);$$;
revoke all on function public.add_assigned_job_note(uuid,text,text) from public,anon;
grant execute on function public.add_assigned_job_note(uuid,text,text) to authenticated;

create or replace function private.get_assigned_jobs() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',j.id,'title',j.title,'description',j.description,'status',j.status,'businessName',b.name,'canAddNotes',v.can_add_notes,
 'notes',(select coalesce(jsonb_agg(jsonb_build_object('title',w.title,'note',w.note,'date',w.created_at) order by w.created_at desc),'[]'::jsonb) from public.work_entries w where w.job_id=j.id and w.business_id=b.id and w.kind='note' and w.author_user_id is not null and w.author_user_id<>b.owner_id),
 'visits',(select coalesce(jsonb_agg(jsonb_build_object('title',w.title,'scheduledAt',w.scheduled_at,'status',w.status) order by w.scheduled_at),'[]'::jsonb) from public.work_entries w where w.job_id=j.id and w.business_id=b.id and w.kind='visit')) order by j.created_at desc),'[]'::jsonb)
 from public.job_viewers v join public.jobs j on j.id=v.job_id and j.business_id=v.business_id join public.businesses b on b.id=v.business_id where v.user_id=auth.uid() and auth.uid() is not null;
$$;

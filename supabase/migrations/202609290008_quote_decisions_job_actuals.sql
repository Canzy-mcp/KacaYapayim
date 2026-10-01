alter table public.quotes
  add column rejection_reason text,
  add column rejection_note text,
  add column accepted_via text,
  add constraint quotes_rejection_reason_valid check (rejection_reason is null or rejection_reason in
    ('price_high','not_now','other_company','scope_mismatch','other')),
  add constraint quotes_rejection_note_valid check (rejection_note is null or char_length(rejection_note) <= 1000),
  add constraint quotes_accepted_via_valid check (accepted_via is null or accepted_via in ('public_link','manual','phone','whatsapp'));

alter table public.jobs drop constraint jobs_status_valid;
alter table public.jobs add constraint jobs_status_valid check (status in
  ('draft','calculated','quoted','accepted','scheduled','in_progress','completed','cancelled'));
alter table public.jobs
  add column accepted_quote_id uuid references public.quotes(id) on delete restrict,
  add column started_at timestamptz,
  add column completed_at timestamptz,
  add column actual_profit numeric(18,2),
  add column actual_profit_margin numeric(24,4),
  add column completion_notes text,
  add constraint jobs_completion_notes_valid check (completion_notes is null or char_length(completion_notes) <= 2000);

create table public.actual_job_costs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  estimated_breakdown_id uuid references public.job_cost_breakdown(id) on delete set null,
  name text not null,
  category text not null,
  unit text not null default 'fixed',
  quantity numeric(16,4) not null default 1,
  unit_cost numeric(16,2) not null default 0,
  total_cost numeric(16,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint actual_cost_name_valid check (char_length(btrim(name)) between 1 and 160),
  constraint actual_cost_category_valid check (category in ('material','labor','transport','consumable','overhead','other')),
  constraint actual_cost_unit_valid check (unit in ('piece','liter','kilogram','meter','square_meter','hour','day','kilometer','fixed','percent')),
  constraint actual_cost_values_valid check (quantity >= 0 and unit_cost >= 0 and total_cost >= 0),
  constraint actual_cost_notes_valid check (notes is null or char_length(notes) <= 500),
  constraint actual_cost_estimated_unique unique (estimated_breakdown_id)
);
create index actual_job_costs_job_idx on public.actual_job_costs(job_id);
create index jobs_status_idx on public.jobs(business_id, status);
create index jobs_accepted_quote_idx on public.jobs(accepted_quote_id) where accepted_quote_id is not null;
create index jobs_completed_idx on public.jobs(business_id, completed_at desc) where completed_at is not null;
create index quotes_accepted_idx on public.quotes(business_id, accepted_at desc) where accepted_at is not null;
create index quotes_rejected_idx on public.quotes(business_id, rejected_at desc) where rejected_at is not null;
create trigger actual_job_costs_updated_at before update on public.actual_job_costs
  for each row execute function public.set_updated_at();
alter table public.actual_job_costs enable row level security;
revoke all on public.actual_job_costs from anon, authenticated;
grant select on public.actual_job_costs to authenticated;
create policy "actual_job_costs_select_own" on public.actual_job_costs for select to authenticated
using (exists (select 1 from public.jobs j join public.businesses b on b.id = j.business_id
  where j.id = job_id and b.owner_id = (select auth.uid())));

-- A ready quote moves an unaccepted calculated job into the quoted stage.
create function public.mark_job_quoted_from_quote() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status in ('ready','sent','viewed') then
    update public.jobs set status = 'quoted' where id = new.job_id and status in ('draft','calculated');
  end if;
  return new;
end;
$$;
create trigger quote_marks_job_quoted after insert or update of status on public.quotes
  for each row execute function public.mark_job_quoted_from_quote();
revoke all on function public.mark_job_quoted_from_quote() from public, anon, authenticated;
update public.jobs j set status = 'quoted' where j.status in ('draft','calculated')
  and exists (select 1 from public.quotes q where q.job_id = j.id and q.status in ('ready','sent','viewed'));

-- Row locks serialize competing answers. Quote and job changes commit together.
create function public.respond_to_quote(p_token uuid, p_action text, p_reason text default null, p_note text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_quote public.quotes%rowtype;
  v_job public.jobs%rowtype;
begin
  if p_token is null or p_action is null or p_action not in ('accept','reject') then raise exception 'Invalid response'; end if;
  if p_action = 'reject' and (p_reason is not null and p_reason not in
    ('price_high','not_now','other_company','scope_mismatch','other') or
    p_note is not null and char_length(p_note) > 1000) then raise exception 'Invalid response'; end if;
  select q.* into v_quote from public.quotes q where q.public_token = p_token for update;
  if not found or v_quote.status = 'draft' then raise exception 'Quote unavailable'; end if;
  if v_quote.status = 'accepted' and p_action = 'accept' then return 'accepted'; end if;
  if v_quote.status = 'rejected' and p_action = 'reject' then return 'rejected'; end if;
  if v_quote.status not in ('ready','sent','viewed') or
     v_quote.valid_until < (now() at time zone 'Europe/Istanbul')::date then
    raise exception 'Quote unavailable';
  end if;
  if p_action = 'accept' then
    select j.* into v_job from public.jobs j where j.id = v_quote.job_id for update;
    if not found or v_job.status not in ('calculated','quoted') or
       v_job.accepted_quote_id is not null or v_quote.sale_price <= 0 then raise exception 'Job unavailable'; end if;
    update public.quotes set status = 'accepted', accepted_at = now(), accepted_via = 'public_link'
      where id = v_quote.id;
    update public.jobs set status = 'accepted', accepted_quote_id = v_quote.id where id = v_job.id;
    return 'accepted';
  end if;
  update public.quotes set status = 'rejected', rejected_at = now(),
    rejection_reason = p_reason, rejection_note = nullif(btrim(p_note), '') where id = v_quote.id;
  return 'rejected';
end;
$$;
revoke all on function public.respond_to_quote(uuid,text,text,text) from public;
grant execute on function public.respond_to_quote(uuid,text,text,text) to anon, authenticated;

create function public.start_job(p_job_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  update public.jobs j set status = 'in_progress', started_at = coalesce(j.started_at, now())
  where j.id = p_job_id and j.status in ('accepted','scheduled') and j.accepted_quote_id is not null
    and exists (select 1 from public.businesses b where b.id = j.business_id and b.owner_id = auth.uid());
  if not found then raise exception 'Job unavailable'; end if;
end;
$$;
revoke all on function public.start_job(uuid) from public, anon;
grant execute on function public.start_job(uuid) to authenticated;

-- The accepted quote is the canonical sale price. Every edit replaces all actual
-- lines and recomputes snapshots within the same transaction.
create function public.save_actual_job_costs(p_job_id uuid, p_lines jsonb, p_notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_job public.jobs%rowtype;
  v_quote public.quotes%rowtype;
  v_line jsonb;
  v_estimate public.job_cost_breakdown%rowtype;
  v_seen uuid[] := '{}'::uuid[];
  v_estimate_id uuid;
  v_total numeric := 0;
  v_amount numeric;
  v_name text;
  v_category text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select j.* into v_job from public.jobs j join public.businesses b on b.id = j.business_id
    where j.id = p_job_id and b.owner_id = auth.uid() and j.status in ('in_progress','completed') for update of j;
  if not found then raise exception 'Job unavailable'; end if;
  select q.* into v_quote from public.quotes q
    where q.id = v_job.accepted_quote_id and q.job_id = v_job.id and q.status = 'accepted';
  if not found or v_quote.sale_price <= 0 then raise exception 'Accepted quote unavailable'; end if;
  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) > 100 or
     p_notes is not null and char_length(p_notes) > 2000 then raise exception 'Invalid actual costs'; end if;
  delete from public.actual_job_costs where job_id = p_job_id;
  for v_line in select value from jsonb_array_elements(p_lines) loop
    if jsonb_typeof(v_line) is distinct from 'object' or
       v_line->>'totalCost' is null or
       (v_line->>'totalCost') !~ '^([0-9]+)(\.[0-9]{1,2})?$' then raise exception 'Invalid actual cost'; end if;
    v_amount := (v_line->>'totalCost')::numeric;
    if v_amount > 99999999999999.99 then raise exception 'Invalid actual cost'; end if;
    if nullif(v_line->>'estimatedId','') is not null then
      begin v_estimate_id := (v_line->>'estimatedId')::uuid;
      exception when invalid_text_representation then raise exception 'Invalid estimate'; end;
      if v_estimate_id = any(v_seen) then raise exception 'Duplicate estimate'; end if;
      select e.* into v_estimate from public.job_cost_breakdown e
        where e.id = v_estimate_id and e.job_id = p_job_id;
      if not found then raise exception 'Estimate unavailable'; end if;
      v_seen := array_append(v_seen, v_estimate_id);
      insert into public.actual_job_costs(job_id, estimated_breakdown_id, name, category, unit,
        quantity, unit_cost, total_cost)
      values (p_job_id, v_estimate_id, v_estimate.name, v_estimate.category, 'fixed',
        1, v_amount, v_amount);
    else
      v_name := btrim(coalesce(v_line->>'name',''));
      v_category := coalesce(v_line->>'category','other');
      if char_length(v_name) not between 1 and 160 or
         v_category not in ('material','labor','transport','consumable','overhead','other') then
        raise exception 'Invalid extra cost'; end if;
      insert into public.actual_job_costs(job_id, name, category, unit, quantity, unit_cost, total_cost)
        values (p_job_id, v_name, v_category, 'fixed', 1, v_amount, v_amount);
    end if;
    v_total := v_total + v_amount;
    if v_total > 99999999999999.99 then raise exception 'Actual total too large'; end if;
  end loop;
  if (select count(*) from public.job_cost_breakdown where job_id = p_job_id) <> coalesce(array_length(v_seen,1),0)
    then raise exception 'Estimated lines missing'; end if;
  update public.jobs j set
    status = 'completed', completed_at = coalesce(j.completed_at, now()),
    actual_cost = round(v_total,2), actual_profit = round(v_quote.sale_price - v_total,2),
    actual_profit_margin = round((v_quote.sale_price - v_total) / v_quote.sale_price * 100,4),
    completion_notes = nullif(btrim(p_notes),'')
  where j.id = p_job_id;
end;
$$;
revoke all on function public.save_actual_job_costs(uuid,jsonb,text) from public, anon;
grant execute on function public.save_actual_job_costs(uuid,jsonb,text) to authenticated;

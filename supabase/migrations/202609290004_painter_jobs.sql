create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  profession_id uuid not null references public.professions(id),
  title text not null,
  description text,
  status text not null default 'calculated',
  estimated_cost numeric(16,2) not null default 0,
  actual_cost numeric(16,2),
  currency text not null default 'TRY',
  calculated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_title_valid check (char_length(btrim(title)) between 1 and 160),
  constraint jobs_status_valid check (status in ('draft','calculated','quoted','accepted','in_progress','completed','cancelled')),
  constraint jobs_estimated_cost_nonnegative check (estimated_cost >= 0),
  constraint jobs_actual_cost_nonnegative check (actual_cost is null or actual_cost >= 0),
  constraint jobs_currency_length check (char_length(currency) = 3)
);

create table public.painter_job_details (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.jobs(id) on delete cascade,
  wall_area numeric(12,2) not null default 0,
  ceiling_area numeric(12,2) not null default 0,
  wall_coats smallint not null default 2,
  ceiling_coats smallint not null default 1,
  primer_required boolean not null default false,
  primer_coats smallint not null default 1,
  putty_required boolean not null default false,
  putty_area numeric(12,2) not null default 0,
  days numeric(8,2) not null default 1,
  master_count smallint not null default 1,
  helper_count smallint not null default 0,
  include_consumables boolean not null default true,
  include_transport boolean not null default true,
  waste_percentage numeric(5,2) not null default 10,
  notes text,
  technical_settings_snapshot jsonb not null default '{}'::jsonb,
  extra_costs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint painter_job_details_area_valid check (wall_area between 0 and 100000 and ceiling_area between 0 and 100000 and putty_area between 0 and 100000),
  constraint painter_job_details_coats_valid check (wall_coats between 1 and 10 and ceiling_coats between 1 and 10 and primer_coats between 1 and 10),
  constraint painter_job_details_labor_valid check (days > 0 and days <= 365 and master_count between 0 and 100 and helper_count between 0 and 100),
  constraint painter_job_details_waste_valid check (waste_percentage between 0 and 100),
  constraint painter_job_details_notes_length check (notes is null or char_length(notes) <= 2000),
  constraint painter_job_details_snapshot_object check (jsonb_typeof(technical_settings_snapshot) = 'object'),
  constraint painter_job_details_extra_array check (jsonb_typeof(extra_costs) = 'array')
);

create table public.job_cost_breakdown (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  cost_item_id uuid references public.business_cost_items(id) on delete set null,
  name text not null,
  category text not null,
  unit text not null,
  quantity numeric(16,4) not null,
  unit_cost numeric(16,2) not null,
  total_cost numeric(16,2) not null,
  source_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint job_cost_breakdown_source_valid check (source_type in ('material','labor','fixed','extra')),
  constraint job_cost_breakdown_category_valid check (category in ('material','labor','transport','consumable','overhead','other')),
  constraint job_cost_breakdown_unit_valid check (unit in ('piece','liter','kilogram','meter','square_meter','hour','day','kilometer','fixed','percent')),
  constraint job_cost_breakdown_values_nonnegative check (quantity >= 0 and unit_cost >= 0 and total_cost >= 0),
  constraint job_cost_breakdown_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index jobs_business_created_idx on public.jobs(business_id, created_at desc);
create index jobs_customer_idx on public.jobs(customer_id) where customer_id is not null;
create index jobs_profession_idx on public.jobs(profession_id);
create index painter_job_details_job_idx on public.painter_job_details(job_id);
create index job_cost_breakdown_job_idx on public.job_cost_breakdown(job_id);
create index job_cost_breakdown_cost_item_idx on public.job_cost_breakdown(cost_item_id) where cost_item_id is not null;

create trigger jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
create trigger painter_job_details_updated_at before update on public.painter_job_details for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;
alter table public.painter_job_details enable row level security;
alter table public.job_cost_breakdown enable row level security;
revoke all on public.jobs, public.painter_job_details, public.job_cost_breakdown from anon, authenticated;
grant select on public.jobs, public.painter_job_details, public.job_cost_breakdown to authenticated;

create policy "jobs_select_own" on public.jobs for select to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy "painter_details_select_own" on public.painter_job_details for select to authenticated
using (exists (select 1 from public.jobs j join public.businesses b on b.id = j.business_id where j.id = job_id and b.owner_id = (select auth.uid())));
create policy "job_breakdown_select_own" on public.job_cost_breakdown for select to authenticated
using (exists (select 1 from public.jobs j join public.businesses b on b.id = j.business_id where j.id = job_id and b.owner_id = (select auth.uid())));

-- Existing painter settings gain a separate putty consumption setting without replacing custom values.
update public.business_profession_settings s
set settings = s.settings || '{"putty_kg_per_square_meter":1}'::jsonb
from public.professions p
where p.id = s.profession_id and p.slug = 'painter' and not (s.settings ? 'putty_kg_per_square_meter');

-- The authenticated caller supplies work quantities only. Prices, coverage and totals are read and calculated here.
-- A function call is one PostgreSQL transaction, so recalculation cannot leave a partial breakdown.
create function public.save_painter_job(
  p_job_id uuid, p_customer_id uuid, p_title text, p_description text,
  p_details jsonb, p_extra_costs jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_profession_id uuid;
  v_job_id uuid;
  v_settings jsonb;
  v_wall_area numeric;
  v_ceiling_area numeric;
  v_wall_coats integer;
  v_ceiling_coats integer;
  v_primer_required boolean;
  v_primer_coats integer;
  v_putty_required boolean;
  v_putty_area numeric;
  v_days numeric;
  v_master_count integer;
  v_helper_count integer;
  v_consumables boolean;
  v_transport boolean;
  v_waste numeric;
  v_paint_coverage numeric;
  v_primer_coverage numeric;
  v_ceiling_coverage numeric;
  v_putty_coverage numeric;
  v_key text;
  v_quantity numeric;
  v_source text;
  v_metadata jsonb;
  v_cost public.business_cost_items%rowtype;
  v_extra jsonb;
  v_seen uuid[] := '{}'::uuid[];
  v_extra_id uuid;
  v_total numeric;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select b.id, p.id into v_business_id, v_profession_id
  from public.businesses b join public.professions p on p.id = b.profession_id
  where b.owner_id = auth.uid() and b.onboarding_completed and p.slug = 'painter';
  if v_business_id is null then raise exception 'Painter business not found'; end if;
  if p_customer_id is not null and not exists (
    select 1 from public.customers c where c.id = p_customer_id and c.business_id = v_business_id
  ) then raise exception 'Customer not found'; end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 160 then raise exception 'Invalid title'; end if;
  if p_description is not null and char_length(p_description) > 2000 then raise exception 'Invalid description'; end if;
  if jsonb_typeof(p_details) is distinct from 'object' or jsonb_typeof(p_extra_costs) is distinct from 'array' then
    raise exception 'Invalid job details';
  end if;
  if jsonb_array_length(p_extra_costs) > 20 then raise exception 'Too many extra costs'; end if;

  v_wall_area := coalesce((p_details->>'wall_area')::numeric, 0);
  v_ceiling_area := coalesce((p_details->>'ceiling_area')::numeric, 0);
  v_wall_coats := coalesce((p_details->>'wall_coats')::integer, 2);
  v_ceiling_coats := coalesce((p_details->>'ceiling_coats')::integer, 1);
  v_primer_required := coalesce((p_details->>'primer_required')::boolean, false);
  v_primer_coats := coalesce((p_details->>'primer_coats')::integer, 1);
  v_putty_required := coalesce((p_details->>'putty_required')::boolean, false);
  v_putty_area := coalesce((p_details->>'putty_area')::numeric, 0);
  v_days := coalesce((p_details->>'days')::numeric, 0);
  v_master_count := coalesce((p_details->>'master_count')::integer, 0);
  v_helper_count := coalesce((p_details->>'helper_count')::integer, 0);
  v_consumables := coalesce((p_details->>'include_consumables')::boolean, true);
  v_transport := coalesce((p_details->>'include_transport')::boolean, true);
  v_waste := (p_details->>'waste_percentage')::numeric;
  if v_wall_area not between 0 and 100000 or v_ceiling_area not between 0 and 100000 or
     (v_wall_area = 0 and v_ceiling_area = 0) or v_wall_coats not between 1 and 10 or
     v_ceiling_coats not between 1 and 10 or v_primer_coats not between 1 and 10 or
     v_putty_area not between 0 and 100000 or v_days <= 0 or v_days > 365 or
     v_master_count not between 0 and 100 or v_helper_count not between 0 and 100 or
     scale(v_wall_area) > 2 or scale(v_ceiling_area) > 2 or scale(v_putty_area) > 2 or scale(v_days) > 2 then
    raise exception 'Invalid job quantities';
  end if;
  if v_primer_required and v_wall_area = 0 then raise exception 'Primer needs wall area'; end if;
  if v_putty_required and (v_putty_area <= 0 or v_wall_area = 0) then raise exception 'Putty needs area'; end if;

  select s.settings into v_settings from public.business_profession_settings s
  where s.business_id = v_business_id and s.profession_id = v_profession_id;
  v_settings := coalesce(v_settings, '{}'::jsonb);
  v_paint_coverage := coalesce((v_settings->>'paint_coverage_per_liter')::numeric, 10);
  v_primer_coverage := coalesce((v_settings->>'primer_coverage_per_liter')::numeric, 10);
  v_ceiling_coverage := coalesce((v_settings->>'ceiling_paint_coverage_per_liter')::numeric, 10);
  v_putty_coverage := coalesce((v_settings->>'putty_kg_per_square_meter')::numeric, 1);
  v_waste := coalesce(v_waste, (v_settings->>'waste_percentage')::numeric, 10);
  if v_paint_coverage <= 0 or v_paint_coverage > 1000 or v_primer_coverage <= 0 or v_primer_coverage > 1000 or
     v_ceiling_coverage <= 0 or v_ceiling_coverage > 1000 or v_putty_coverage <= 0 or v_putty_coverage > 1000 or
     v_waste not between 0 and 100 or scale(v_waste) > 2 then
    raise exception 'Invalid profession settings';
  end if;

  if p_job_id is null then
    insert into public.jobs (business_id, customer_id, profession_id, title, description, status)
    values (v_business_id, p_customer_id, v_profession_id, btrim(p_title), nullif(btrim(p_description), ''), 'calculated')
    returning id into v_job_id;
  else
    select id into v_job_id from public.jobs
    where id = p_job_id and business_id = v_business_id and profession_id = v_profession_id
      and status in ('draft', 'calculated') for update;
    if v_job_id is null then raise exception 'Job not found or not editable'; end if;
    update public.jobs set customer_id = p_customer_id, title = btrim(p_title),
      description = nullif(btrim(p_description), ''), status = 'calculated'
    where id = v_job_id;
    delete from public.job_cost_breakdown where job_id = v_job_id;
  end if;

  insert into public.painter_job_details (
    job_id, wall_area, ceiling_area, wall_coats, ceiling_coats, primer_required, primer_coats,
    putty_required, putty_area, days, master_count, helper_count, include_consumables,
    include_transport, waste_percentage, notes, technical_settings_snapshot, extra_costs
  ) values (
    v_job_id, v_wall_area, v_ceiling_area, v_wall_coats, v_ceiling_coats, v_primer_required, v_primer_coats,
    v_putty_required, v_putty_area, v_days, v_master_count, v_helper_count, v_consumables,
    v_transport, v_waste, nullif(btrim(p_details->>'notes'), ''),
    jsonb_build_object('paint_coverage_per_liter', v_paint_coverage,
      'primer_coverage_per_liter', v_primer_coverage,
      'ceiling_paint_coverage_per_liter', v_ceiling_coverage,
      'putty_kg_per_square_meter', v_putty_coverage,
      'waste_percentage', v_waste), p_extra_costs
  ) on conflict (job_id) do update set
    wall_area = excluded.wall_area, ceiling_area = excluded.ceiling_area,
    wall_coats = excluded.wall_coats, ceiling_coats = excluded.ceiling_coats,
    primer_required = excluded.primer_required, primer_coats = excluded.primer_coats,
    putty_required = excluded.putty_required, putty_area = excluded.putty_area,
    days = excluded.days, master_count = excluded.master_count, helper_count = excluded.helper_count,
    include_consumables = excluded.include_consumables, include_transport = excluded.include_transport,
    waste_percentage = excluded.waste_percentage, notes = excluded.notes,
    technical_settings_snapshot = excluded.technical_settings_snapshot, extra_costs = excluded.extra_costs;

  for v_key, v_quantity, v_source, v_metadata in
    select x.key, x.quantity, x.source_type, x.metadata from (values
      ('interior_paint'::text, case when v_wall_area > 0 then round(v_wall_area * v_wall_coats / v_paint_coverage * (1 + v_waste / 100), 4) else 0 end, 'material'::text, '{}'::jsonb),
      ('primer', case when v_primer_required then round(v_wall_area * v_primer_coats / v_primer_coverage * (1 + v_waste / 100), 4) else 0 end, 'material', '{}'::jsonb),
      ('ceiling_paint', case when v_ceiling_area > 0 then round(v_ceiling_area * v_ceiling_coats / v_ceiling_coverage * (1 + v_waste / 100), 4) else 0 end, 'material', '{}'::jsonb),
      ('putty', case when v_putty_required then round(v_putty_area * v_putty_coverage * (1 + v_waste / 100), 4) else 0 end, 'material', '{}'::jsonb),
      ('master_labor', v_master_count * v_days, 'labor', jsonb_build_object('worker_count', v_master_count, 'days', v_days)),
      ('helper_labor', v_helper_count * v_days, 'labor', jsonb_build_object('worker_count', v_helper_count, 'days', v_days)),
      ('consumables', case when v_consumables then 1 else 0 end, 'fixed', '{}'::jsonb),
      ('transport', case when v_transport then 1 else 0 end, 'fixed', '{}'::jsonb)
    ) as x(key, quantity, source_type, metadata)
    where x.quantity > 0
  loop
    select * into v_cost from public.business_cost_items
    where business_id = v_business_id and key = v_key;
    if not found then raise exception 'MISSING_COST:%', v_key; end if;
    if not v_cost.is_active then raise exception 'INACTIVE_COST:%', v_key; end if;
    if (v_key in ('interior_paint','primer','ceiling_paint') and v_cost.unit <> 'liter') or
       (v_key = 'putty' and v_cost.unit <> 'kilogram') or
       (v_key in ('master_labor','helper_labor') and v_cost.unit <> 'day') or
       (v_key in ('consumables','transport') and v_cost.unit <> 'fixed') then
      raise exception 'INVALID_COST_UNIT:%', v_key;
    end if;
    insert into public.job_cost_breakdown
      (job_id, cost_item_id, name, category, unit, quantity, unit_cost, total_cost, source_type, metadata)
    values (v_job_id, v_cost.id, v_cost.name, v_cost.category, v_cost.unit, v_quantity,
      v_cost.unit_cost, round(v_quantity * v_cost.unit_cost, 2), v_source, v_metadata);
  end loop;

  for v_extra in select x.value from jsonb_array_elements(p_extra_costs) as x(value) loop
    v_extra_id := (v_extra->>'cost_item_id')::uuid;
    v_quantity := (v_extra->>'quantity')::numeric;
    if v_extra_id is null or v_quantity is null or v_quantity <= 0 or v_quantity > 100000 or scale(v_quantity) > 4 or
       v_extra_id = any(v_seen) then raise exception 'Invalid extra cost'; end if;
    v_seen := array_append(v_seen, v_extra_id);
    select * into v_cost from public.business_cost_items
    where id = v_extra_id and business_id = v_business_id and template_id is null;
    if not found then raise exception 'MISSING_EXTRA_COST'; end if;
    if not v_cost.is_active then raise exception 'INACTIVE_EXTRA_COST'; end if;
    insert into public.job_cost_breakdown
      (job_id, cost_item_id, name, category, unit, quantity, unit_cost, total_cost, source_type, metadata)
    values (v_job_id, v_cost.id, v_cost.name, v_cost.category, v_cost.unit, round(v_quantity, 4),
      v_cost.unit_cost, round(v_quantity * v_cost.unit_cost, 2), 'extra', '{}'::jsonb);
  end loop;

  select coalesce(sum(total_cost), 0) into v_total from public.job_cost_breakdown where job_id = v_job_id;
  update public.jobs set estimated_cost = v_total, calculated_at = now(), currency = 'TRY'
  where id = v_job_id;
  return v_job_id;
end;
$$;
revoke all on function public.save_painter_job(uuid,uuid,text,text,jsonb,jsonb) from public, anon;
grant execute on function public.save_painter_job(uuid,uuid,text,text,jsonb,jsonb) to authenticated;

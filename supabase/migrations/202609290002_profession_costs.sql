create table public.professions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professions_slug_format check (slug ~ '^[a-z][a-z0-9_]*$')
);

create table public.profession_cost_templates (
  id uuid primary key default gen_random_uuid(),
  profession_id uuid not null references public.professions(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  category text not null,
  unit text not null,
  input_type text not null default 'currency',
  default_value numeric(14,2) not null default 0,
  is_required boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profession_cost_templates_unique_key unique (profession_id, key),
  constraint profession_cost_templates_key_format check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint profession_cost_templates_category check (category in ('material','labor','transport','consumable','overhead','other')),
  constraint profession_cost_templates_unit check (unit in ('piece','liter','kilogram','meter','square_meter','hour','day','kilometer','fixed','percent')),
  constraint profession_cost_templates_input_type check (input_type in ('currency','number','percent')),
  constraint profession_cost_templates_default_nonnegative check (default_value >= 0)
);

alter table public.businesses
add column profession_id uuid references public.professions(id) on delete set null;

create table public.business_cost_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  template_id uuid references public.profession_cost_templates(id) on delete set null,
  key text not null,
  name text not null,
  category text not null,
  unit text not null,
  unit_cost numeric(14,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_cost_items_unique_key unique (business_id, key),
  constraint business_cost_items_unique_template unique (business_id, template_id),
  constraint business_cost_items_name_valid check (char_length(btrim(name)) between 1 and 120),
  constraint business_cost_items_key_format check (key ~ '^[a-z][a-z0-9_]*$'),
  constraint business_cost_items_category check (category in ('material','labor','transport','consumable','overhead','other')),
  constraint business_cost_items_unit check (unit in ('piece','liter','kilogram','meter','square_meter','hour','day','kilometer','fixed','percent')),
  constraint business_cost_items_unit_cost_nonnegative check (unit_cost >= 0),
  constraint business_cost_items_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.business_profession_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  profession_id uuid not null references public.professions(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_profession_settings_unique unique (business_id, profession_id),
  constraint business_profession_settings_object check (jsonb_typeof(settings) = 'object')
);

create index profession_cost_templates_profession_idx on public.profession_cost_templates(profession_id, sort_order);
create index business_cost_items_business_category_idx on public.business_cost_items(business_id, category, sort_order);
create index business_cost_items_template_idx on public.business_cost_items(template_id) where template_id is not null;
create index business_profession_settings_business_idx on public.business_profession_settings(business_id);
create index businesses_profession_id_idx on public.businesses(profession_id) where profession_id is not null;

create trigger professions_updated_at before update on public.professions
for each row execute function public.set_updated_at();
create trigger profession_cost_templates_updated_at before update on public.profession_cost_templates
for each row execute function public.set_updated_at();
create trigger business_cost_items_updated_at before update on public.business_cost_items
for each row execute function public.set_updated_at();
create trigger business_profession_settings_updated_at before update on public.business_profession_settings
for each row execute function public.set_updated_at();

alter table public.professions enable row level security;
alter table public.profession_cost_templates enable row level security;
alter table public.business_cost_items enable row level security;
alter table public.business_profession_settings enable row level security;

revoke all on public.professions from anon, authenticated;
revoke all on public.profession_cost_templates from anon, authenticated;
revoke all on public.business_cost_items from anon, authenticated;
revoke all on public.business_profession_settings from anon, authenticated;
grant select on public.professions, public.profession_cost_templates to authenticated;
grant select, insert, update, delete on public.business_cost_items, public.business_profession_settings to authenticated;

create policy "professions_read_active" on public.professions for select to authenticated
using (is_active);
create policy "profession_templates_read_active" on public.profession_cost_templates for select to authenticated
using (is_active and exists (select 1 from public.professions p where p.id = profession_id and p.is_active));

create policy "business_cost_items_select_own" on public.business_cost_items for select to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy "business_cost_items_insert_own" on public.business_cost_items for insert to authenticated
with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy "business_cost_items_update_own" on public.business_cost_items for update to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())))
with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy "business_cost_items_delete_own" on public.business_cost_items for delete to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

create policy "business_profession_settings_select_own" on public.business_profession_settings for select to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy "business_profession_settings_insert_own" on public.business_profession_settings for insert to authenticated
with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy "business_profession_settings_update_own" on public.business_profession_settings for update to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())))
with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy "business_profession_settings_delete_own" on public.business_profession_settings for delete to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

insert into public.professions (slug, name, description, icon, sort_order)
values ('painter', 'Boyacı', 'İç ve dış cephe boya işleri', 'paintbrush', 10)
on conflict (slug) do nothing;

insert into public.profession_cost_templates
  (profession_id, key, name, description, category, unit, input_type, default_value, is_required, sort_order)
select p.id, v.key, v.name, v.description, v.category, v.unit, 'currency', v.default_value, v.is_required, v.sort_order
from public.professions p
cross join (values
  ('interior_paint', 'İç Cephe Boyası', null::text, 'material', 'liter', 450::numeric, true, 10),
  ('primer', 'Astar', null::text, 'material', 'liter', 300::numeric, false, 20),
  ('ceiling_paint', 'Tavan Boyası', null::text, 'material', 'liter', 350::numeric, false, 30),
  ('putty', 'Macun', null::text, 'material', 'kilogram', 60::numeric, false, 40),
  ('master_labor', 'Usta', 'Kendi emeğin dahil, bir ustanın sana günlük gerçek maliyeti.', 'labor', 'day', 3000::numeric, true, 50),
  ('helper_labor', 'Yardımcı', null::text, 'labor', 'day', 1800::numeric, false, 60),
  ('consumables', 'Sarf Malzemeleri', 'Bant, naylon, zımpara, rulo, fırça gibi küçük malzemeler.', 'consumable', 'fixed', 750::numeric, false, 70),
  ('transport', 'Yol / Araç', null::text, 'transport', 'fixed', 800::numeric, false, 80)
) as v(key, name, description, category, unit, default_value, is_required, sort_order)
where p.slug = 'painter'
on conflict (profession_id, key) do nothing;

-- Internal function: trigger and owner-checked wrapper call it. Never grant it to app roles.
create function public.initialize_business_costs(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_profession_id uuid;
declare v_slug text;
begin
  select b.profession_id, p.slug into v_profession_id, v_slug
  from public.businesses b
  join public.professions p on p.id = b.profession_id
  where b.id = p_business_id and b.onboarding_completed;
  if v_profession_id is null then return; end if;

  insert into public.business_cost_items
    (business_id, template_id, key, name, category, unit, unit_cost, metadata, sort_order)
  select p_business_id, t.id, t.key, t.name, t.category, t.unit, t.default_value,
         case when t.description is null then '{}'::jsonb else jsonb_build_object('description', t.description) end,
         t.sort_order
  from public.profession_cost_templates t
  where t.profession_id = v_profession_id and t.is_active
  on conflict do nothing;

  if v_slug = 'painter' then
    insert into public.business_profession_settings (business_id, profession_id, settings)
    values (p_business_id, v_profession_id, jsonb_build_object(
      'paint_coverage_per_liter', 10,
      'primer_coverage_per_liter', 10,
      'ceiling_paint_coverage_per_liter', 10,
      'waste_percentage', 10
    ))
    on conflict (business_id, profession_id) do nothing;
  end if;
end;
$$;
revoke all on function public.initialize_business_costs(uuid) from public, anon, authenticated;

create function public.ensure_my_cost_defaults()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_business_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select id into v_business_id from public.businesses
  where owner_id = auth.uid() and onboarding_completed;
  if v_business_id is null then raise exception 'Business not found'; end if;
  perform public.initialize_business_costs(v_business_id);
end;
$$;
revoke all on function public.ensure_my_cost_defaults() from public, anon;
grant execute on function public.ensure_my_cost_defaults() to authenticated;

create function public.on_business_profession_ready()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.onboarding_completed and new.profession_id is not null then
    perform public.initialize_business_costs(new.id);
  end if;
  return new;
end;
$$;
revoke all on function public.on_business_profession_ready() from public, anon, authenticated;

create trigger businesses_profession_ready
after insert or update of profession_id, onboarding_completed on public.businesses
for each row execute function public.on_business_profession_ready();

-- Preserve the original profession text for custom occupations while linking known ones.
update public.businesses b
set profession_id = p.id
from public.professions p
where p.slug = 'painter' and b.profession = 'Boyacı' and b.profession_id is null;

-- Keep the existing Settings RPC atomic and link supported professions.
create or replace function public.update_my_settings(
  p_first_name text, p_last_name text, p_business_name text, p_phone text,
  p_city text, p_profession text, p_default_profit_margin numeric,
  p_minimum_profit_margin numeric
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  update public.profiles
  set first_name = btrim(p_first_name), last_name = btrim(p_last_name)
  where id = auth.uid();
  if not found then raise exception 'Profile not found'; end if;
  update public.businesses
  set name = btrim(p_business_name),
      phone = nullif(btrim(p_phone), ''),
      city = nullif(btrim(p_city), ''),
      profession = nullif(btrim(p_profession), ''),
      profession_id = (select id from public.professions where name = btrim(p_profession) and is_active limit 1),
      default_profit_margin = p_default_profit_margin,
      minimum_profit_margin = p_minimum_profit_margin
  where owner_id = auth.uid();
  if not found then raise exception 'Business not found'; end if;
end;
$$;

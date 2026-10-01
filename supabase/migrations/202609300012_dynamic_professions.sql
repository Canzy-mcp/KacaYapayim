-- Published templates are immutable. Drafts are private to platform administrators.
alter table public.professions add column category text not null default 'Genel';
alter table public.professions add column current_version integer;
alter table public.professions add column is_public boolean not null default true;

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;

create table public.profession_template_versions (
  id uuid primary key default gen_random_uuid(),
  profession_id uuid not null references public.professions(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null check (status in ('draft','published','archived')),
  template jsonb not null check (jsonb_typeof(template) = 'object'),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete set null,
  unique(profession_id, version)
);
create index profession_template_versions_current_idx on public.profession_template_versions(profession_id, status, version desc);
alter table public.profession_template_versions enable row level security;
revoke all on public.profession_template_versions from anon, authenticated;
grant select on public.profession_template_versions to authenticated;
create policy profession_templates_read_published on public.profession_template_versions
  for select to authenticated using (status = 'published' and exists (
    select 1 from public.professions p where p.id = profession_id and p.is_active and p.is_public));

-- Queryable published components. The complete versioned JSON remains the calculation contract.
create table public.profession_sections (
  template_version_id uuid not null references public.profession_template_versions(id) on delete cascade,
  key text not null, definition jsonb not null, sort_order integer not null default 0,
  primary key(template_version_id, key)
);
create table public.profession_fields (
  template_version_id uuid not null references public.profession_template_versions(id) on delete cascade,
  key text not null, section_key text not null, definition jsonb not null, sort_order integer not null default 0,
  primary key(template_version_id, key)
);
create table public.profession_formulas (
  template_version_id uuid not null references public.profession_template_versions(id) on delete cascade,
  key text not null, definition jsonb not null, sort_order integer not null default 0,
  primary key(template_version_id, key)
);
create table public.profession_setting_templates (
  template_version_id uuid not null references public.profession_template_versions(id) on delete cascade,
  key text not null, definition jsonb not null,
  primary key(template_version_id, key)
);
alter table public.profession_sections enable row level security;
alter table public.profession_fields enable row level security;
alter table public.profession_formulas enable row level security;
alter table public.profession_setting_templates enable row level security;
revoke all on public.profession_sections, public.profession_fields, public.profession_formulas, public.profession_setting_templates from anon, authenticated;
grant select on public.profession_sections, public.profession_fields, public.profession_formulas, public.profession_setting_templates to authenticated;
create policy published_sections on public.profession_sections for select to authenticated using (exists (select 1 from public.profession_template_versions v where v.id = template_version_id));
create policy published_fields on public.profession_fields for select to authenticated using (exists (select 1 from public.profession_template_versions v where v.id = template_version_id));
create policy published_formulas on public.profession_formulas for select to authenticated using (exists (select 1 from public.profession_template_versions v where v.id = template_version_id));
create policy published_settings on public.profession_setting_templates for select to authenticated using (exists (select 1 from public.profession_template_versions v where v.id = template_version_id));

create function public.sync_profession_template_components() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.profession_sections where template_version_id = new.id;
  delete from public.profession_fields where template_version_id = new.id;
  delete from public.profession_formulas where template_version_id = new.id;
  delete from public.profession_setting_templates where template_version_id = new.id;
  insert into public.profession_sections select new.id, item->>'key', item, coalesce((item->>'sortOrder')::integer, 0) from jsonb_array_elements(new.template->'sections') item;
  insert into public.profession_fields select new.id, item->>'key', item->>'section', item, coalesce((item->>'sortOrder')::integer, 0) from jsonb_array_elements(new.template->'fields') item;
  insert into public.profession_formulas select new.id, item->>'key', item, coalesce((item->>'sortOrder')::integer, 0) from jsonb_array_elements(new.template->'formulas') item;
  insert into public.profession_setting_templates select new.id, item->>'key', item from jsonb_array_elements(new.template->'settings') item;
  return new;
end $$;
create trigger sync_profession_template_components after insert or update of template on public.profession_template_versions
for each row execute function public.sync_profession_template_components();

create function public.prevent_published_template_change() returns trigger language plpgsql set search_path = '' as $$
begin
  if old.status in ('published','archived') and (new.template is distinct from old.template or new.version is distinct from old.version or new.profession_id is distinct from old.profession_id) then
    raise exception 'Published profession templates are immutable';
  end if;
  return new;
end $$;
create trigger prevent_published_template_change before update on public.profession_template_versions
for each row execute function public.prevent_published_template_change();

alter table public.jobs add column input_data jsonb not null default '{}'::jsonb check (jsonb_typeof(input_data) = 'object');
alter table public.jobs add column profession_template_version integer;
alter table public.jobs add column template_snapshot jsonb check (template_snapshot is null or jsonb_typeof(template_snapshot) = 'object');
alter table public.jobs add column calculation_snapshot jsonb check (calculation_snapshot is null or jsonb_typeof(calculation_snapshot) = 'object');
alter table public.jobs add column settings_snapshot jsonb check (settings_snapshot is null or jsonb_typeof(settings_snapshot) = 'object');

-- Existing painter records retain the painter details and their original cost lines.
update public.jobs j set input_data = jsonb_build_object(
  'wall_area',d.wall_area,'ceiling_area',d.ceiling_area,'wall_coats',d.wall_coats,
  'ceiling_coats',d.ceiling_coats,'primer_required',d.primer_required,'primer_coats',d.primer_coats,
  'putty_required',d.putty_required,'putty_area',d.putty_area,'days',d.days,
  'master_count',d.master_count,'helper_count',d.helper_count,
  'include_consumables',d.include_consumables,'include_transport',d.include_transport,
  'waste_percentage',d.waste_percentage,'notes',d.notes),
  settings_snapshot = d.technical_settings_snapshot,
  calculation_snapshot = jsonb_build_object('totalCost',j.estimated_cost,'legacyPainter',true)
from public.painter_job_details d where d.job_id = j.id;

-- Called only with the server's service role after it recalculates from trusted costs.
create function public.save_generic_job(
  p_user_id uuid, p_business_id uuid, p_job_id uuid, p_customer_id uuid,
  p_title text, p_description text, p_profession_id uuid, p_version integer,
  p_input_data jsonb, p_template_snapshot jsonb, p_settings_snapshot jsonb,
  p_calculation_snapshot jsonb, p_lines jsonb, p_total numeric
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_job_id uuid; v_line jsonb;
begin
  if auth.role() <> 'service_role' then raise exception 'Service role required'; end if;
  if not exists (select 1 from public.businesses b where b.id = p_business_id and b.owner_id = p_user_id and b.profession_id = p_profession_id) then raise exception 'Business or profession mismatch'; end if;
  if not exists (select 1 from public.profession_template_versions v where v.profession_id = p_profession_id and v.version = p_version and v.status = 'published' and v.template = p_template_snapshot) then raise exception 'Template version mismatch'; end if;
  if p_customer_id is not null and not exists (select 1 from public.customers c where c.id = p_customer_id and c.business_id = p_business_id) then raise exception 'Customer mismatch'; end if;
  if p_total < 0 or p_total > 1000000000000 or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) > 120 then raise exception 'Invalid calculation'; end if;
  if p_job_id is not null then
    select id into v_job_id from public.jobs where id = p_job_id and business_id = p_business_id and profession_id = p_profession_id and status in ('draft','calculated') for update;
    if v_job_id is null then raise exception 'Job cannot be edited'; end if;
    update public.jobs set customer_id = p_customer_id, title = p_title, description = p_description,
      status = 'calculated', estimated_cost = p_total, calculated_at = now(), input_data = p_input_data,
      profession_template_version = p_version, template_snapshot = p_template_snapshot,
      settings_snapshot = p_settings_snapshot, calculation_snapshot = p_calculation_snapshot,
      pricing_cost_changed = selected_sale_price is not null and estimated_cost is distinct from p_total
    where id = v_job_id;
    delete from public.job_cost_breakdown where job_id = v_job_id;
  else
    insert into public.jobs(business_id, customer_id, profession_id, title, description, status, estimated_cost,
      calculated_at, input_data, profession_template_version, template_snapshot, settings_snapshot, calculation_snapshot)
    values(p_business_id,p_customer_id,p_profession_id,p_title,p_description,'calculated',p_total,
      now(),p_input_data,p_version,p_template_snapshot,p_settings_snapshot,p_calculation_snapshot)
    returning id into v_job_id;
  end if;
  for v_line in select value from jsonb_array_elements(p_lines) loop
    if not exists (select 1 from public.business_cost_items c where c.id = (v_line->>'cost_item_id')::uuid and c.business_id = p_business_id) then raise exception 'Cost item mismatch'; end if;
    insert into public.job_cost_breakdown(job_id,cost_item_id,name,category,unit,quantity,unit_cost,total_cost,source_type,metadata)
    values(v_job_id,(v_line->>'cost_item_id')::uuid,v_line->>'name',v_line->>'category',v_line->>'unit',
      (v_line->>'quantity')::numeric,(v_line->>'unit_cost')::numeric,(v_line->>'total_cost')::numeric,
      v_line->>'source_type',coalesce(v_line->'metadata','{}'::jsonb));
  end loop;
  return v_job_id;
end $$;
revoke all on function public.save_generic_job(uuid,uuid,uuid,uuid,text,text,uuid,integer,jsonb,jsonb,jsonb,jsonb,jsonb,numeric) from public, anon, authenticated;
grant execute on function public.save_generic_job(uuid,uuid,uuid,uuid,text,text,uuid,integer,jsonb,jsonb,jsonb,jsonb,jsonb,numeric) to service_role;

create function public.publish_profession_template(p_admin_id uuid, p_profession_id uuid, p_version integer, p_template jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_slug text; v_cost jsonb;
begin
  if auth.role() <> 'service_role' or not exists(select 1 from public.platform_admins where user_id = p_admin_id) then raise exception 'Platform admin required'; end if;
  select slug into v_slug from public.professions where id = p_profession_id for update;
  if v_slug is null or p_template->>'slug' <> v_slug or (p_template->>'version')::integer <> p_version then raise exception 'Template identity mismatch'; end if;
  if not exists(select 1 from public.profession_template_versions where profession_id = p_profession_id and version = p_version and status = 'draft') then raise exception 'Draft version required'; end if;
  for v_cost in select value from jsonb_array_elements(p_template->'costs') loop
    if exists(select 1 from public.profession_cost_templates where profession_id = p_profession_id and key = v_cost->>'key' and unit <> v_cost->>'unit') then raise exception 'Existing cost unit cannot change'; end if;
    insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
    values(p_profession_id,v_cost->>'key',v_cost->>'name',v_cost->>'category',v_cost->>'unit',
      (v_cost->>'defaultValue')::numeric,coalesce((v_cost->>'required')::boolean,false),coalesce((v_cost->>'sortOrder')::integer,0))
    on conflict(profession_id,key) do update set name=excluded.name,category=excluded.category,
      default_value=excluded.default_value,is_required=excluded.is_required,sort_order=excluded.sort_order,is_active=true;
  end loop;
  update public.profession_template_versions set template = p_template, status = 'published', published_at = now(), published_by = p_admin_id
  where profession_id = p_profession_id and version = p_version and status = 'draft';
  update public.professions set name = p_template->>'name', description = p_template->>'description',
    icon = p_template->>'icon', category = p_template->>'category', current_version = p_version,
    is_active = true, is_public = true where id = p_profession_id;
end $$;
revoke all on function public.publish_profession_template(uuid,uuid,integer,jsonb) from public, anon, authenticated;
grant execute on function public.publish_profession_template(uuid,uuid,integer,jsonb) to service_role;

-- Built-in version 1 templates and cost defaults.
insert into public.professions(slug,name,description,icon,category,is_active,is_public,current_version,sort_order)
values('painter','Boyacı','İç ve dış cephe boya işleri','paintbrush','construction',true,true,1,10)
on conflict(slug) do update set category=excluded.category,current_version=greatest(coalesce(public.professions.current_version,0),1);
insert into public.profession_template_versions(profession_id,version,status,template,published_at)
select p.id,1,'published','{"slug":"painter","name":"Boyacı","description":"İç ve dış cephe boya işleri","icon":"paintbrush","category":"construction","version":1,"sections":[{"key":"surface","title":"Alanlar","sortOrder":10},{"key":"application","title":"Uygulamalar","sortOrder":20},{"key":"labor","title":"İşçilik","sortOrder":30},{"key":"extras","title":"Ek Giderler","sortOrder":40}],"fields":[{"key":"wall_area","label":"Duvar Alanı","section":"surface","sortOrder":10,"fieldType":"number","defaultValue":0,"minValue":0,"maxValue":100000,"unit":"m²","required":true},{"key":"ceiling_area","label":"Tavan Alanı","section":"surface","sortOrder":20,"fieldType":"number","defaultValue":0,"minValue":0,"maxValue":100000,"unit":"m²"},{"key":"wall_coats","label":"Duvar Kat Sayısı","section":"application","sortOrder":10,"fieldType":"integer","defaultValue":2,"minValue":1,"maxValue":10},{"key":"ceiling_coats","label":"Tavan Kat Sayısı","section":"application","sortOrder":20,"fieldType":"integer","defaultValue":2,"minValue":1,"maxValue":10,"visibilityCondition":{"field":"ceiling_area","operator":"greater_than","value":0}},{"key":"primer_required","label":"Astar Uygulanacak mı?","section":"application","sortOrder":30,"fieldType":"toggle","defaultValue":false},{"key":"primer_coats","label":"Astar Kat Sayısı","section":"application","sortOrder":40,"fieldType":"integer","defaultValue":1,"minValue":1,"maxValue":10,"visibilityCondition":{"field":"primer_required","operator":"is_true"}},{"key":"putty_required","label":"Macun Uygulanacak mı?","section":"application","sortOrder":50,"fieldType":"toggle","defaultValue":false},{"key":"putty_area","label":"Macun Alanı","section":"application","sortOrder":60,"fieldType":"number","defaultValue":0,"minValue":0,"maxValue":100000,"unit":"m²","visibilityCondition":{"field":"putty_required","operator":"is_true"}},{"key":"days","label":"İş Süresi","section":"labor","sortOrder":10,"fieldType":"number","defaultValue":3,"minValue":0.01,"maxValue":365,"unit":"gün","required":true},{"key":"master_count","label":"Usta Sayısı","section":"labor","sortOrder":20,"fieldType":"integer","defaultValue":1,"minValue":0,"maxValue":1000},{"key":"helper_count","label":"Yardımcı Sayısı","section":"labor","sortOrder":30,"fieldType":"integer","defaultValue":0,"minValue":0,"maxValue":1000},{"key":"include_consumables","label":"Sarf Malzemeleri","section":"extras","sortOrder":10,"fieldType":"toggle","defaultValue":true},{"key":"include_transport","label":"Yol / Araç","section":"extras","sortOrder":20,"fieldType":"toggle","defaultValue":true},{"key":"waste_percentage","label":"Fire Payı","section":"extras","sortOrder":30,"fieldType":"percentage","defaultValue":10,"minValue":0,"maxValue":100,"unit":"%"},{"key":"notes","label":"İş Notları","section":"extras","sortOrder":40,"fieldType":"textarea","defaultValue":""}],"validations":[{"key":"area_required","message":"Duvar veya tavan alanından en az birini gir.","expression":"field.wall_area + field.ceiling_area"},{"key":"primer_wall_required","message":"Astar için duvar alanı gir.","expression":"field.wall_area","condition":{"field":"primer_required","operator":"is_true"}},{"key":"putty_wall_required","message":"Macun için duvar alanı gir.","expression":"field.wall_area","condition":{"field":"putty_required","operator":"is_true"}},{"key":"putty_area_required","message":"Macun uygulanacak alanı gir.","expression":"field.putty_area","condition":{"field":"putty_required","operator":"is_true"}}],"settings":[{"key":"paint_coverage_per_liter","name":"Boya Örtücülüğü","defaultValue":10,"minValue":0.01,"maxValue":1000,"unit":"m²/L"},{"key":"primer_coverage_per_liter","name":"Astar Örtücülüğü","defaultValue":10,"minValue":0.01,"maxValue":1000,"unit":"m²/L"},{"key":"ceiling_paint_coverage_per_liter","name":"Tavan Boyası Örtücülüğü","defaultValue":10,"minValue":0.01,"maxValue":1000,"unit":"m²/L"},{"key":"putty_kg_per_square_meter","name":"Macun Tüketimi","defaultValue":1,"minValue":0.01,"maxValue":1000,"unit":"kg/m²"}],"costs":[{"key":"interior_paint","name":"İç Cephe Boyası","category":"material","unit":"liter","defaultValue":450,"sortOrder":10},{"key":"primer","name":"Astar","category":"material","unit":"liter","defaultValue":300,"sortOrder":20},{"key":"ceiling_paint","name":"Tavan Boyası","category":"material","unit":"liter","defaultValue":350,"sortOrder":30},{"key":"putty","name":"Macun","category":"material","unit":"kilogram","defaultValue":60,"sortOrder":40},{"key":"master_labor","name":"Usta","category":"labor","unit":"day","defaultValue":3000,"sortOrder":50},{"key":"helper_labor","name":"Yardımcı","category":"labor","unit":"day","defaultValue":1800,"sortOrder":60},{"key":"consumables","name":"Sarf Malzemeleri","category":"consumable","unit":"fixed","defaultValue":750,"sortOrder":70},{"key":"transport","name":"Yol / Araç","category":"transport","unit":"fixed","defaultValue":800,"sortOrder":80}],"formulas":[{"key":"paint_quantity","name":"Duvar boyası miktarı","expression":"round(field.wall_area * field.wall_coats / setting.paint_coverage_per_liter * (1 + field.waste_percentage / 100) * 10000) / 10000","sortOrder":10,"formulaType":"quantity","condition":{"field":"wall_area","operator":"greater_than","value":0}},{"key":"paint_cost","name":"Duvar boyası maliyeti","expression":"result.paint_quantity * cost.interior_paint","sortOrder":20,"formulaType":"cost","costTemplateKey":"interior_paint","quantityExpression":"result.paint_quantity","condition":{"field":"wall_area","operator":"greater_than","value":0}},{"key":"primer_quantity","name":"Astar miktarı","expression":"round(field.wall_area * field.primer_coats / setting.primer_coverage_per_liter * (1 + field.waste_percentage / 100) * 10000) / 10000","sortOrder":30,"formulaType":"quantity","condition":{"field":"primer_required","operator":"is_true"}},{"key":"primer_cost","name":"Astar maliyeti","expression":"result.primer_quantity * cost.primer","sortOrder":40,"formulaType":"cost","costTemplateKey":"primer","quantityExpression":"result.primer_quantity","condition":{"field":"primer_required","operator":"is_true"}},{"key":"ceiling_quantity","name":"Tavan boyası miktarı","expression":"round(field.ceiling_area * field.ceiling_coats / setting.ceiling_paint_coverage_per_liter * (1 + field.waste_percentage / 100) * 10000) / 10000","sortOrder":50,"formulaType":"quantity","condition":{"field":"ceiling_area","operator":"greater_than","value":0}},{"key":"ceiling_cost","name":"Tavan boyası maliyeti","expression":"result.ceiling_quantity * cost.ceiling_paint","sortOrder":60,"formulaType":"cost","costTemplateKey":"ceiling_paint","quantityExpression":"result.ceiling_quantity","condition":{"field":"ceiling_area","operator":"greater_than","value":0}},{"key":"putty_quantity","name":"Macun miktarı","expression":"round(field.putty_area * setting.putty_kg_per_square_meter * (1 + field.waste_percentage / 100) * 10000) / 10000","sortOrder":70,"formulaType":"quantity","condition":{"field":"putty_required","operator":"is_true"}},{"key":"putty_cost","name":"Macun maliyeti","expression":"result.putty_quantity * cost.putty","sortOrder":80,"formulaType":"cost","costTemplateKey":"putty","quantityExpression":"result.putty_quantity","condition":{"field":"putty_required","operator":"is_true"}},{"key":"master_cost","name":"Usta işçiliği","expression":"field.master_count * field.days * cost.master_labor","sortOrder":90,"formulaType":"cost","costTemplateKey":"master_labor","quantityExpression":"field.master_count * field.days","condition":{"field":"master_count","operator":"greater_than","value":0}},{"key":"helper_cost","name":"Yardımcı işçiliği","expression":"field.helper_count * field.days * cost.helper_labor","sortOrder":100,"formulaType":"cost","costTemplateKey":"helper_labor","quantityExpression":"field.helper_count * field.days","condition":{"field":"helper_count","operator":"greater_than","value":0}},{"key":"consumables_cost","name":"Sarf malzemeleri","expression":"cost.consumables","sortOrder":110,"formulaType":"cost","costTemplateKey":"consumables","quantityExpression":"1","condition":{"field":"include_consumables","operator":"is_true"}},{"key":"transport_cost","name":"Yol / araç","expression":"cost.transport","sortOrder":120,"formulaType":"cost","costTemplateKey":"transport","quantityExpression":"1","condition":{"field":"include_transport","operator":"is_true"}}],"quoteItems":[{"key":"surface_prep","name":"Duvar yüzey hazırlığı","description":"Uygulama öncesi temel yüzey hazırlığı.","condition":{"field":"wall_area","operator":"greater_than","value":0},"sortOrder":10},{"key":"putty","name":"Gerekli alanlarda macun uygulaması","condition":{"field":"putty_required","operator":"is_true"},"sortOrder":20},{"key":"primer","name":"kat astar uygulaması","nameFieldSuffix":"primer_coats","condition":{"field":"primer_required","operator":"is_true"},"sortOrder":30},{"key":"wall_paint","name":"kat iç cephe boya uygulaması","nameFieldSuffix":"wall_coats","condition":{"field":"wall_area","operator":"greater_than","value":0},"sortOrder":40},{"key":"ceiling_paint","name":"kat tavan boyası","nameFieldSuffix":"ceiling_coats","condition":{"field":"ceiling_area","operator":"greater_than","value":0},"sortOrder":50},{"key":"labor","name":"İşçilik","condition":{"field":"master_count","operator":"greater_than","value":0},"sortOrder":60},{"key":"consumables","name":"Temel sarf malzemeleri","condition":{"field":"include_consumables","operator":"is_true"},"sortOrder":70}],"quoteExclusions":["Mobilya taşıma","Elektrik ve tesisat onarımları","Büyük yüzey tamiratları","Özel iskele veya vinç işleri"]}'::jsonb,now() from public.professions p where p.slug='painter'
on conflict(profession_id,version) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'interior_paint','İç Cephe Boyası','material','liter',450,false,10
from public.professions p where p.slug='painter'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'primer','Astar','material','liter',300,false,20
from public.professions p where p.slug='painter'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'ceiling_paint','Tavan Boyası','material','liter',350,false,30
from public.professions p where p.slug='painter'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'putty','Macun','material','kilogram',60,false,40
from public.professions p where p.slug='painter'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'master_labor','Usta','labor','day',3000,false,50
from public.professions p where p.slug='painter'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'helper_labor','Yardımcı','labor','day',1800,false,60
from public.professions p where p.slug='painter'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'consumables','Sarf Malzemeleri','consumable','fixed',750,false,70
from public.professions p where p.slug='painter'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'transport','Yol / Araç','transport','fixed',800,false,80
from public.professions p where p.slug='painter'
on conflict(profession_id,key) do nothing;
insert into public.professions(slug,name,description,icon,category,is_active,is_public,current_version,sort_order)
values('electrician','Elektrikçi','Elektrik tesisatı ve montaj işleri','zap','technical',true,true,1,20)
on conflict(slug) do update set category=excluded.category,current_version=greatest(coalesce(public.professions.current_version,0),1);
insert into public.profession_template_versions(profession_id,version,status,template,published_at)
select p.id,1,'published','{"slug":"electrician","name":"Elektrikçi","description":"Elektrik tesisatı ve montaj işleri","icon":"zap","category":"technical","version":1,"sections":[{"key":"installation","title":"Tesisat","sortOrder":10},{"key":"labor","title":"İşçilik","sortOrder":20},{"key":"extras","title":"Ek Giderler","sortOrder":30}],"fields":[{"key":"socket_count","label":"Priz Sayısı","section":"installation","sortOrder":10,"fieldType":"integer","defaultValue":0,"minValue":0,"maxValue":1000},{"key":"switch_count","label":"Anahtar Sayısı","section":"installation","sortOrder":20,"fieldType":"integer","defaultValue":0,"minValue":0,"maxValue":1000},{"key":"cable_2_5_length","label":"2,5 mm Kablo","section":"installation","sortOrder":30,"fieldType":"number","defaultValue":0,"minValue":0,"maxValue":100000,"unit":"m"},{"key":"cable_4_length","label":"4 mm Kablo","section":"installation","sortOrder":40,"fieldType":"number","defaultValue":0,"minValue":0,"maxValue":100000,"unit":"m"},{"key":"breaker_count","label":"Sigorta Sayısı","section":"installation","sortOrder":50,"fieldType":"integer","defaultValue":0,"minValue":0,"maxValue":1000},{"key":"junction_box_count","label":"Buat Sayısı","section":"installation","sortOrder":60,"fieldType":"integer","defaultValue":0,"minValue":0,"maxValue":1000},{"key":"days","label":"İş Süresi","section":"labor","sortOrder":10,"fieldType":"number","defaultValue":1,"minValue":0.01,"maxValue":365,"unit":"gün","required":true},{"key":"electrician_count","label":"Elektrikçi Sayısı","section":"labor","sortOrder":20,"fieldType":"integer","defaultValue":1,"minValue":0,"maxValue":1000},{"key":"helper_count","label":"Yardımcı Sayısı","section":"labor","sortOrder":30,"fieldType":"integer","defaultValue":0,"minValue":0,"maxValue":1000},{"key":"include_transport","label":"Yol / Araç","section":"extras","sortOrder":10,"fieldType":"toggle","defaultValue":true},{"key":"include_consumables","label":"Sarf Malzemeleri","section":"extras","sortOrder":20,"fieldType":"toggle","defaultValue":true}],"settings":[{"key":"cable_waste_percentage","name":"Kablo Fire Payı","defaultValue":5,"minValue":0,"maxValue":100,"unit":"%"}],"costs":[{"key":"socket","name":"Priz","category":"material","unit":"piece","defaultValue":250,"sortOrder":10},{"key":"switch","name":"Anahtar","category":"material","unit":"piece","defaultValue":180,"sortOrder":20},{"key":"cable_2_5","name":"2,5 mm Kablo","category":"material","unit":"meter","defaultValue":18,"sortOrder":30},{"key":"cable_4","name":"4 mm Kablo","category":"material","unit":"meter","defaultValue":32,"sortOrder":40},{"key":"breaker","name":"Sigorta","category":"material","unit":"piece","defaultValue":320,"sortOrder":50},{"key":"junction_box","name":"Buat","category":"material","unit":"piece","defaultValue":65,"sortOrder":60},{"key":"electrician_labor","name":"Elektrikçi","category":"labor","unit":"day","defaultValue":3000,"sortOrder":70},{"key":"helper_labor","name":"Yardımcı","category":"labor","unit":"day","defaultValue":1800,"sortOrder":80},{"key":"consumables","name":"Sarf Malzemeleri","category":"consumable","unit":"fixed","defaultValue":450,"sortOrder":90},{"key":"transport","name":"Yol / Araç","category":"transport","unit":"fixed","defaultValue":800,"sortOrder":100}],"formulas":[{"key":"socket_cost","name":"Priz maliyeti","expression":"field.socket_count * cost.socket","sortOrder":10,"formulaType":"cost","costTemplateKey":"socket","quantityExpression":"field.socket_count","condition":{"field":"socket_count","operator":"greater_than","value":0}},{"key":"switch_cost","name":"Anahtar maliyeti","expression":"field.switch_count * cost.switch","sortOrder":20,"formulaType":"cost","costTemplateKey":"switch","quantityExpression":"field.switch_count","condition":{"field":"switch_count","operator":"greater_than","value":0}},{"key":"cable_2_5_qty","name":"2,5 mm kablo miktarı","expression":"round(field.cable_2_5_length * (1 + setting.cable_waste_percentage / 100) * 10000) / 10000","sortOrder":30,"formulaType":"quantity","condition":{"field":"cable_2_5_length","operator":"greater_than","value":0}},{"key":"cable_2_5_cost","name":"2,5 mm kablo maliyeti","expression":"result.cable_2_5_qty * cost.cable_2_5","sortOrder":40,"formulaType":"cost","costTemplateKey":"cable_2_5","quantityExpression":"result.cable_2_5_qty","condition":{"field":"cable_2_5_length","operator":"greater_than","value":0}},{"key":"cable_4_qty","name":"4 mm kablo miktarı","expression":"round(field.cable_4_length * (1 + setting.cable_waste_percentage / 100) * 10000) / 10000","sortOrder":50,"formulaType":"quantity","condition":{"field":"cable_4_length","operator":"greater_than","value":0}},{"key":"cable_4_cost","name":"4 mm kablo maliyeti","expression":"result.cable_4_qty * cost.cable_4","sortOrder":60,"formulaType":"cost","costTemplateKey":"cable_4","quantityExpression":"result.cable_4_qty","condition":{"field":"cable_4_length","operator":"greater_than","value":0}},{"key":"breaker_cost","name":"Sigorta maliyeti","expression":"field.breaker_count * cost.breaker","sortOrder":70,"formulaType":"cost","costTemplateKey":"breaker","quantityExpression":"field.breaker_count","condition":{"field":"breaker_count","operator":"greater_than","value":0}},{"key":"junction_cost","name":"Buat maliyeti","expression":"field.junction_box_count * cost.junction_box","sortOrder":80,"formulaType":"cost","costTemplateKey":"junction_box","quantityExpression":"field.junction_box_count","condition":{"field":"junction_box_count","operator":"greater_than","value":0}},{"key":"electrician_cost","name":"Elektrikçi işçiliği","expression":"field.electrician_count * field.days * cost.electrician_labor","sortOrder":90,"formulaType":"cost","costTemplateKey":"electrician_labor","quantityExpression":"field.electrician_count * field.days","condition":{"field":"electrician_count","operator":"greater_than","value":0}},{"key":"helper_cost","name":"Yardımcı işçiliği","expression":"field.helper_count * field.days * cost.helper_labor","sortOrder":100,"formulaType":"cost","costTemplateKey":"helper_labor","quantityExpression":"field.helper_count * field.days","condition":{"field":"helper_count","operator":"greater_than","value":0}},{"key":"consumables_cost","name":"Sarf malzemeleri","expression":"cost.consumables","sortOrder":110,"formulaType":"cost","costTemplateKey":"consumables","quantityExpression":"1","condition":{"field":"include_consumables","operator":"is_true"}},{"key":"transport_cost","name":"Yol / araç","expression":"cost.transport","sortOrder":120,"formulaType":"cost","costTemplateKey":"transport","quantityExpression":"1","condition":{"field":"include_transport","operator":"is_true"}}],"quoteItems":[{"key":"sockets","name":"Priz montajı","condition":{"field":"socket_count","operator":"greater_than","value":0},"sortOrder":10},{"key":"switches","name":"Anahtar montajı","condition":{"field":"switch_count","operator":"greater_than","value":0},"sortOrder":20},{"key":"cabling","name":"Elektrik kablolama","condition":{"field":"cable_2_5_length","operator":"greater_than","value":0},"sortOrder":30},{"key":"breakers","name":"Sigorta montajı","condition":{"field":"breaker_count","operator":"greater_than","value":0},"sortOrder":40},{"key":"labor","name":"Montaj ve işçilik","sortOrder":50}],"quoteExclusions":["Duvar sıva ve boya onarımı","Malzeme dışı ilave işler"]}'::jsonb,now() from public.professions p where p.slug='electrician'
on conflict(profession_id,version) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'socket','Priz','material','piece',250,false,10
from public.professions p where p.slug='electrician'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'switch','Anahtar','material','piece',180,false,20
from public.professions p where p.slug='electrician'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'cable_2_5','2,5 mm Kablo','material','meter',18,false,30
from public.professions p where p.slug='electrician'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'cable_4','4 mm Kablo','material','meter',32,false,40
from public.professions p where p.slug='electrician'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'breaker','Sigorta','material','piece',320,false,50
from public.professions p where p.slug='electrician'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'junction_box','Buat','material','piece',65,false,60
from public.professions p where p.slug='electrician'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'electrician_labor','Elektrikçi','labor','day',3000,false,70
from public.professions p where p.slug='electrician'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'helper_labor','Yardımcı','labor','day',1800,false,80
from public.professions p where p.slug='electrician'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'consumables','Sarf Malzemeleri','consumable','fixed',450,false,90
from public.professions p where p.slug='electrician'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'transport','Yol / Araç','transport','fixed',800,false,100
from public.professions p where p.slug='electrician'
on conflict(profession_id,key) do nothing;
insert into public.professions(slug,name,description,icon,category,is_active,is_public,current_version,sort_order)
values('plumber','Tesisatçı','Su tesisatı ve armatür montajı','wrench','technical',true,true,1,30)
on conflict(slug) do update set category=excluded.category,current_version=greatest(coalesce(public.professions.current_version,0),1);
insert into public.profession_template_versions(profession_id,version,status,template,published_at)
select p.id,1,'published','{"slug":"plumber","name":"Tesisatçı","description":"Su tesisatı ve armatür montajı","icon":"wrench","category":"technical","version":1,"sections":[{"key":"installation","title":"Tesisat","sortOrder":10},{"key":"labor","title":"İşçilik","sortOrder":20},{"key":"extras","title":"Ek Giderler","sortOrder":30}],"fields":[{"key":"pipe_length","label":"Boru Uzunluğu","section":"installation","sortOrder":10,"fieldType":"number","defaultValue":0,"minValue":0,"maxValue":100000,"unit":"m"},{"key":"fitting_count","label":"Bağlantı Parçası","section":"installation","sortOrder":20,"fieldType":"integer","defaultValue":0,"minValue":0,"maxValue":1000},{"key":"faucet_count","label":"Musluk / Armatür","section":"installation","sortOrder":30,"fieldType":"integer","defaultValue":0,"minValue":0,"maxValue":1000},{"key":"leak_test","label":"Kaçak Testi","section":"installation","sortOrder":40,"fieldType":"toggle","defaultValue":true},{"key":"days","label":"İş Süresi","section":"labor","sortOrder":10,"fieldType":"number","defaultValue":1,"minValue":0.01,"maxValue":365,"unit":"gün","required":true},{"key":"plumber_count","label":"Tesisatçı Sayısı","section":"labor","sortOrder":20,"fieldType":"integer","defaultValue":1,"minValue":0,"maxValue":1000},{"key":"helper_count","label":"Yardımcı Sayısı","section":"labor","sortOrder":30,"fieldType":"integer","defaultValue":0,"minValue":0,"maxValue":1000},{"key":"include_transport","label":"Yol / Araç","section":"extras","sortOrder":10,"fieldType":"toggle","defaultValue":true}],"settings":[{"key":"pipe_waste_percentage","name":"Boru Fire Payı","defaultValue":5,"minValue":0,"maxValue":100,"unit":"%"}],"costs":[{"key":"pipe","name":"Boru","category":"material","unit":"meter","defaultValue":95,"sortOrder":10},{"key":"fitting","name":"Bağlantı Parçası","category":"material","unit":"piece","defaultValue":45,"sortOrder":20},{"key":"faucet","name":"Musluk / Armatür","category":"material","unit":"piece","defaultValue":650,"sortOrder":30},{"key":"leak_test","name":"Kaçak Testi","category":"other","unit":"fixed","defaultValue":450,"sortOrder":40},{"key":"plumber_labor","name":"Tesisatçı","category":"labor","unit":"day","defaultValue":3000,"sortOrder":50},{"key":"helper_labor","name":"Yardımcı","category":"labor","unit":"day","defaultValue":1800,"sortOrder":60},{"key":"transport","name":"Yol / Araç","category":"transport","unit":"fixed","defaultValue":800,"sortOrder":70}],"formulas":[{"key":"pipe_qty","name":"Boru miktarı","expression":"round(field.pipe_length * (1 + setting.pipe_waste_percentage / 100) * 10000) / 10000","sortOrder":10,"formulaType":"quantity","condition":{"field":"pipe_length","operator":"greater_than","value":0}},{"key":"pipe_cost","name":"Boru maliyeti","expression":"result.pipe_qty * cost.pipe","sortOrder":20,"formulaType":"cost","costTemplateKey":"pipe","quantityExpression":"result.pipe_qty","condition":{"field":"pipe_length","operator":"greater_than","value":0}},{"key":"fitting_cost","name":"Bağlantı parçası maliyeti","expression":"field.fitting_count * cost.fitting","sortOrder":30,"formulaType":"cost","costTemplateKey":"fitting","quantityExpression":"field.fitting_count","condition":{"field":"fitting_count","operator":"greater_than","value":0}},{"key":"faucet_cost","name":"Armatür maliyeti","expression":"field.faucet_count * cost.faucet","sortOrder":40,"formulaType":"cost","costTemplateKey":"faucet","quantityExpression":"field.faucet_count","condition":{"field":"faucet_count","operator":"greater_than","value":0}},{"key":"leak_test_cost","name":"Kaçak testi","expression":"cost.leak_test","sortOrder":50,"formulaType":"cost","costTemplateKey":"leak_test","quantityExpression":"1","condition":{"field":"leak_test","operator":"is_true"}},{"key":"plumber_cost","name":"Tesisatçı işçiliği","expression":"field.plumber_count * field.days * cost.plumber_labor","sortOrder":60,"formulaType":"cost","costTemplateKey":"plumber_labor","quantityExpression":"field.plumber_count * field.days","condition":{"field":"plumber_count","operator":"greater_than","value":0}},{"key":"helper_cost","name":"Yardımcı işçiliği","expression":"field.helper_count * field.days * cost.helper_labor","sortOrder":70,"formulaType":"cost","costTemplateKey":"helper_labor","quantityExpression":"field.helper_count * field.days","condition":{"field":"helper_count","operator":"greater_than","value":0}},{"key":"transport_cost","name":"Yol / araç","expression":"cost.transport","sortOrder":80,"formulaType":"cost","costTemplateKey":"transport","quantityExpression":"1","condition":{"field":"include_transport","operator":"is_true"}}],"quoteItems":[{"key":"pipes","name":"Su borusu döşeme","condition":{"field":"pipe_length","operator":"greater_than","value":0},"sortOrder":10},{"key":"fittings","name":"Bağlantı parçalarının montajı","condition":{"field":"fitting_count","operator":"greater_than","value":0},"sortOrder":20},{"key":"faucets","name":"Armatür montajı","condition":{"field":"faucet_count","operator":"greater_than","value":0},"sortOrder":30},{"key":"leak","name":"Kaçak testi","condition":{"field":"leak_test","operator":"is_true"},"sortOrder":40},{"key":"labor","name":"Tesisat işçiliği","sortOrder":50}],"quoteExclusions":["Fayans ve boya onarımı","Kırma sonrası moloz taşıma"]}'::jsonb,now() from public.professions p where p.slug='plumber'
on conflict(profession_id,version) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'pipe','Boru','material','meter',95,false,10
from public.professions p where p.slug='plumber'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'fitting','Bağlantı Parçası','material','piece',45,false,20
from public.professions p where p.slug='plumber'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'faucet','Musluk / Armatür','material','piece',650,false,30
from public.professions p where p.slug='plumber'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'leak_test','Kaçak Testi','other','fixed',450,false,40
from public.professions p where p.slug='plumber'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'plumber_labor','Tesisatçı','labor','day',3000,false,50
from public.professions p where p.slug='plumber'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'helper_labor','Yardımcı','labor','day',1800,false,60
from public.professions p where p.slug='plumber'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'transport','Yol / Araç','transport','fixed',800,false,70
from public.professions p where p.slug='plumber'
on conflict(profession_id,key) do nothing;
insert into public.professions(slug,name,description,icon,category,is_active,is_public,current_version,sort_order)
values('hvac','Klimacı','Klima montajı ve bağlantı işleri','wind','technical',true,true,1,40)
on conflict(slug) do update set category=excluded.category,current_version=greatest(coalesce(public.professions.current_version,0),1);
insert into public.profession_template_versions(profession_id,version,status,template,published_at)
select p.id,1,'published','{"slug":"hvac","name":"Klimacı","description":"Klima montajı ve bağlantı işleri","icon":"wind","category":"technical","version":1,"sections":[{"key":"unit","title":"Klima Bilgileri","sortOrder":10},{"key":"installation","title":"Montaj","sortOrder":20},{"key":"electrical","title":"Elektrik","sortOrder":30},{"key":"labor","title":"İşçilik","sortOrder":40}],"fields":[{"key":"btu","label":"Klima Kapasitesi","section":"unit","sortOrder":10,"fieldType":"integer","defaultValue":12000,"minValue":3000,"maxValue":100000,"unit":"BTU"},{"key":"pipe_length","label":"Bakır Boru Uzunluğu","section":"installation","sortOrder":10,"fieldType":"number","defaultValue":0,"minValue":0,"maxValue":100000,"unit":"m"},{"key":"wall_holes","label":"Duvar Delme Sayısı","section":"installation","sortOrder":20,"fieldType":"integer","defaultValue":0,"minValue":0,"maxValue":1000},{"key":"installation_floor","label":"Montaj Katı","section":"installation","sortOrder":30,"fieldType":"integer","defaultValue":0,"minValue":0,"maxValue":1000},{"key":"difficult_access","label":"Dış Ünite Erişimi Zor","section":"installation","sortOrder":40,"fieldType":"toggle","defaultValue":false},{"key":"electrical_line","label":"Yeni Elektrik Hattı","section":"electrical","sortOrder":10,"fieldType":"toggle","defaultValue":false},{"key":"electrical_line_length","label":"Hat Uzunluğu","section":"electrical","sortOrder":20,"fieldType":"number","defaultValue":0,"minValue":0,"maxValue":100000,"unit":"m","visibilityCondition":{"field":"electrical_line","operator":"is_true"}},{"key":"days","label":"İş Süresi","section":"labor","sortOrder":10,"fieldType":"number","defaultValue":1,"minValue":0.01,"maxValue":365,"unit":"gün","required":true},{"key":"technician_count","label":"Teknisyen Sayısı","section":"labor","sortOrder":20,"fieldType":"integer","defaultValue":1,"minValue":0,"maxValue":1000},{"key":"include_transport","label":"Yol / Araç","section":"labor","sortOrder":30,"fieldType":"toggle","defaultValue":true}],"settings":[{"key":"standard_pipe_included","name":"Standart Dahil Boru","defaultValue":0,"minValue":0,"maxValue":100,"unit":"m"}],"costs":[{"key":"copper_pipe","name":"Bakır Boru","category":"material","unit":"meter","defaultValue":450,"sortOrder":10},{"key":"wall_drilling","name":"Duvar Delme","category":"other","unit":"piece","defaultValue":350,"sortOrder":20},{"key":"electrical_cable","name":"Elektrik Kablosu","category":"material","unit":"meter","defaultValue":75,"sortOrder":30},{"key":"technician_labor","name":"Teknisyen","category":"labor","unit":"day","defaultValue":3500,"sortOrder":40},{"key":"difficult_access","name":"Zorlu Erişim","category":"other","unit":"fixed","defaultValue":1200,"sortOrder":50},{"key":"transport","name":"Yol / Araç","category":"transport","unit":"fixed","defaultValue":800,"sortOrder":60}],"formulas":[{"key":"billable_pipe","name":"Faturalandırılan boru","expression":"max(0, field.pipe_length - setting.standard_pipe_included)","sortOrder":10,"formulaType":"quantity","condition":{"field":"pipe_length","operator":"greater_than","value":0}},{"key":"pipe_cost","name":"Bakır boru maliyeti","expression":"result.billable_pipe * cost.copper_pipe","sortOrder":20,"formulaType":"cost","costTemplateKey":"copper_pipe","quantityExpression":"result.billable_pipe","condition":{"field":"pipe_length","operator":"greater_than","value":0}},{"key":"drilling_cost","name":"Duvar delme maliyeti","expression":"field.wall_holes * cost.wall_drilling","sortOrder":30,"formulaType":"cost","costTemplateKey":"wall_drilling","quantityExpression":"field.wall_holes","condition":{"field":"wall_holes","operator":"greater_than","value":0}},{"key":"electrical_cost","name":"Elektrik hattı maliyeti","expression":"field.electrical_line_length * cost.electrical_cable","sortOrder":40,"formulaType":"cost","costTemplateKey":"electrical_cable","quantityExpression":"field.electrical_line_length","condition":{"field":"electrical_line","operator":"is_true"}},{"key":"technician_cost","name":"Teknisyen işçiliği","expression":"field.technician_count * field.days * cost.technician_labor","sortOrder":50,"formulaType":"cost","costTemplateKey":"technician_labor","quantityExpression":"field.technician_count * field.days","condition":{"field":"technician_count","operator":"greater_than","value":0}},{"key":"access_cost","name":"Zorlu erişim","expression":"cost.difficult_access","sortOrder":60,"formulaType":"cost","costTemplateKey":"difficult_access","quantityExpression":"1","condition":{"field":"difficult_access","operator":"is_true"}},{"key":"transport_cost","name":"Yol / araç","expression":"cost.transport","sortOrder":70,"formulaType":"cost","costTemplateKey":"transport","quantityExpression":"1","condition":{"field":"include_transport","operator":"is_true"}}],"quoteItems":[{"key":"unit_mount","name":"İç ve dış ünite montajı","sortOrder":10},{"key":"piping","name":"Bakır boru bağlantısı","condition":{"field":"pipe_length","operator":"greater_than","value":0},"sortOrder":20},{"key":"drilling","name":"Duvar delme","condition":{"field":"wall_holes","operator":"greater_than","value":0},"sortOrder":30},{"key":"electrical","name":"Elektrik hattı çekimi","condition":{"field":"electrical_line","operator":"is_true"},"sortOrder":40},{"key":"commission","name":"Çalıştırma ve kontrol","sortOrder":50}],"quoteExclusions":["Cihaz bedeli","İskele veya vinç hizmeti"]}'::jsonb,now() from public.professions p where p.slug='hvac'
on conflict(profession_id,version) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'copper_pipe','Bakır Boru','material','meter',450,false,10
from public.professions p where p.slug='hvac'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'wall_drilling','Duvar Delme','other','piece',350,false,20
from public.professions p where p.slug='hvac'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'electrical_cable','Elektrik Kablosu','material','meter',75,false,30
from public.professions p where p.slug='hvac'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'technician_labor','Teknisyen','labor','day',3500,false,40
from public.professions p where p.slug='hvac'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'difficult_access','Zorlu Erişim','other','fixed',1200,false,50
from public.professions p where p.slug='hvac'
on conflict(profession_id,key) do nothing;
insert into public.profession_cost_templates(profession_id,key,name,category,unit,default_value,is_required,sort_order)
select p.id,'transport','Yol / Araç','transport','fixed',800,false,60
from public.professions p where p.slug='hvac'
on conflict(profession_id,key) do nothing;

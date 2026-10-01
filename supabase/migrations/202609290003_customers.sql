create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  company_name text,
  address text,
  district text,
  city text,
  notes text,
  source text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_name_valid check (char_length(btrim(name)) between 1 and 120),
  constraint customers_phone_valid check (phone is null or phone ~ '^[+]90[2-5][0-9]{9}$'),
  constraint customers_email_length check (email is null or char_length(email) <= 254),
  constraint customers_company_length check (company_name is null or char_length(company_name) <= 160),
  constraint customers_address_length check (address is null or char_length(address) <= 500),
  constraint customers_district_length check (district is null or char_length(district) <= 100),
  constraint customers_city_length check (city is null or char_length(city) <= 100),
  constraint customers_notes_length check (notes is null or char_length(notes) <= 2000),
  constraint customers_source_valid check (source is null or source in ('referral','instagram','google','whatsapp','existing_customer','other'))
);

create index customers_business_status_created_idx on public.customers(business_id, is_archived, created_at desc);
create index customers_business_phone_idx on public.customers(business_id, phone) where phone is not null;
create index customers_business_name_idx on public.customers(business_id, name);
create index customers_business_company_idx on public.customers(business_id, company_name) where company_name is not null;

create trigger customers_updated_at before update on public.customers
for each row execute function public.set_updated_at();

alter table public.customers enable row level security;
revoke all on public.customers from anon, authenticated;
grant select, insert, update on public.customers to authenticated;

create policy "customers_select_own" on public.customers for select to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy "customers_insert_own" on public.customers for insert to authenticated
with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy "customers_update_own" on public.customers for update to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())))
with check (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

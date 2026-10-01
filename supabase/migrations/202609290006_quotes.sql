create table public.quote_counters (
  business_id uuid not null references public.businesses(id) on delete cascade,
  quote_year integer not null,
  last_number integer not null check (last_number > 0),
  primary key (business_id, quote_year)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete set null,
  quote_number text not null,
  status text not null default 'draft',
  title text not null,
  description text,
  sale_price numeric(18,2) not null,
  estimated_cost_snapshot numeric(18,2) not null,
  estimated_profit_snapshot numeric(18,2) not null,
  profit_margin_snapshot numeric(24,4),
  target_margin_snapshot numeric(6,2) not null,
  minimum_margin_snapshot numeric(6,2) not null,
  currency text not null default 'TRY',
  valid_until date not null,
  estimated_duration_text text,
  payment_terms text,
  notes text,
  public_token uuid not null default gen_random_uuid(),
  revision_number integer not null default 1,
  parent_quote_id uuid references public.quotes(id),
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_business_number_unique unique (business_id, quote_number),
  constraint quotes_public_token_unique unique (public_token),
  constraint quotes_status_valid check (status in ('draft','ready','sent','viewed','accepted','rejected','expired','cancelled')),
  constraint quotes_title_valid check (char_length(btrim(title)) between 1 and 160),
  constraint quotes_description_valid check (description is null or char_length(description) <= 2000),
  constraint quotes_sale_nonnegative check (sale_price >= 0 and estimated_cost_snapshot >= 0),
  constraint quotes_duration_valid check (estimated_duration_text is null or char_length(estimated_duration_text) <= 160),
  constraint quotes_payment_valid check (payment_terms is null or char_length(payment_terms) <= 1000),
  constraint quotes_notes_valid check (notes is null or char_length(notes) <= 2000),
  constraint quotes_revision_valid check (revision_number > 0)
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  name text not null,
  description text,
  quantity numeric(12,3),
  unit text,
  unit_price numeric(18,2),
  total_price numeric(18,2),
  is_optional boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_items_name_valid check (char_length(btrim(name)) between 1 and 160),
  constraint quote_items_description_valid check (description is null or char_length(description) <= 1000),
  constraint quote_items_prices_valid check ((quantity is null or quantity > 0) and (unit_price is null or unit_price >= 0) and (total_price is null or total_price >= 0))
);

create table public.quote_exclusions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  text text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint quote_exclusions_text_valid check (char_length(btrim(text)) between 1 and 500)
);

create index quotes_business_created_idx on public.quotes(business_id, created_at desc);
create index quotes_customer_idx on public.quotes(customer_id) where customer_id is not null;
create index quotes_job_idx on public.quotes(job_id);
create index quotes_status_idx on public.quotes(business_id, status);
create index quote_items_quote_order_idx on public.quote_items(quote_id, sort_order);
create index quote_exclusions_quote_order_idx on public.quote_exclusions(quote_id, sort_order);
create trigger quotes_updated_at before update on public.quotes for each row execute function public.set_updated_at();
create trigger quote_items_updated_at before update on public.quote_items for each row execute function public.set_updated_at();

alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.quote_exclusions enable row level security;
alter table public.quote_counters enable row level security;
revoke all on public.quotes, public.quote_items, public.quote_exclusions, public.quote_counters from anon, authenticated;
grant select on public.quotes, public.quote_items, public.quote_exclusions to authenticated;
create policy "quotes_select_own" on public.quotes for select to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));
create policy "quote_items_select_own" on public.quote_items for select to authenticated
using (exists (select 1 from public.quotes q join public.businesses b on b.id = q.business_id where q.id = quote_id and b.owner_id = (select auth.uid())));
create policy "quote_exclusions_select_own" on public.quote_exclusions for select to authenticated
using (exists (select 1 from public.quotes q join public.businesses b on b.id = q.business_id where q.id = quote_id and b.owner_id = (select auth.uid())));

-- One RPC writes the quote and its customer-facing children atomically. The caller
-- can edit copy, scope and terms; business ownership and monetary snapshots stay here.
create function public.save_quote(
  p_quote_id uuid, p_job_id uuid, p_status text, p_title text, p_description text,
  p_items jsonb, p_exclusions jsonb, p_duration text, p_payment_terms text,
  p_valid_until date, p_notes text, p_sale_price numeric default null,
  p_acknowledge_risk boolean default false
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_business_id uuid;
  v_job public.jobs%rowtype;
  v_quote public.quotes%rowtype;
  v_quote_id uuid;
  v_year integer;
  v_number integer;
  v_sale numeric;
  v_cost numeric;
  v_item jsonb;
  v_exclusion jsonb;
  v_order integer;
  v_today date := (now() at time zone 'Europe/Istanbul')::date;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select b.id into v_business_id from public.businesses b where b.owner_id = auth.uid() and b.onboarding_completed;
  if v_business_id is null then raise exception 'Business not found'; end if;
  if p_status is null or p_status not in ('draft','ready') or p_title is null or char_length(btrim(p_title)) not between 1 and 160 or
     p_description is not null and char_length(p_description) > 2000 or
     p_duration is not null and char_length(p_duration) > 160 or
     p_payment_terms is not null and char_length(p_payment_terms) > 1000 or
     p_notes is not null and char_length(p_notes) > 2000 or
     p_valid_until is null or p_valid_until < v_today or
     jsonb_typeof(p_items) is distinct from 'array' or jsonb_typeof(p_exclusions) is distinct from 'array' then
    raise exception 'Invalid quote input';
  end if;
  if jsonb_array_length(p_items) not between 1 and 30 or jsonb_array_length(p_exclusions) > 20 then
    raise exception 'Invalid quote input';
  end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) is distinct from 'object' or
       char_length(btrim(coalesce(v_item->>'name',''))) not between 1 and 160 or
       char_length(coalesce(v_item->>'description','')) > 1000 then raise exception 'Invalid quote item'; end if;
  end loop;
  for v_exclusion in select value from jsonb_array_elements(p_exclusions) loop
    if jsonb_typeof(v_exclusion) is distinct from 'string' or
       char_length(btrim(v_exclusion #>> '{}')) not between 1 and 500 then
      raise exception 'Invalid quote exclusion';
    end if;
  end loop;

  select j.* into v_job from public.jobs j where j.id = p_job_id and j.business_id = v_business_id for share;
  if not found then raise exception 'Job not found'; end if;
  if v_job.customer_id is not null and not exists (
    select 1 from public.customers c where c.id = v_job.customer_id and c.business_id = v_business_id
  ) then raise exception 'Customer not found'; end if;

  if p_quote_id is null then
    if v_job.selected_sale_price is null or v_job.estimated_cost <= 0 then raise exception 'Job price missing'; end if;
    if p_status = 'ready' and (v_job.customer_id is null or v_job.selected_sale_price <= 0) then
      raise exception 'Customer or price missing'; end if;
    v_sale := v_job.selected_sale_price;
    v_cost := v_job.estimated_cost;
    v_year := extract(year from v_today)::integer;
    insert into public.quote_counters as qc (business_id, quote_year, last_number)
    values (v_business_id, v_year, 1)
    on conflict (business_id, quote_year) do update
      set last_number = qc.last_number + 1
    returning last_number into v_number;
    insert into public.quotes (
      business_id, job_id, customer_id, quote_number, status, title, description,
      sale_price, estimated_cost_snapshot, estimated_profit_snapshot, profit_margin_snapshot,
      target_margin_snapshot, minimum_margin_snapshot,
      currency, valid_until, estimated_duration_text, payment_terms, notes
    ) values (
      v_business_id, v_job.id, v_job.customer_id, 'KY-' || v_year || '-' || repeat('0', greatest(4 - length(v_number::text), 0)) || v_number::text,
      p_status, btrim(p_title), nullif(btrim(p_description), ''),
      v_sale, v_cost, round(v_sale - v_cost, 2),
      case when v_sale = 0 then null else round((v_sale - v_cost) / v_sale * 100,4) end,
      coalesce(v_job.target_profit_margin, 30), coalesce(v_job.minimum_profit_margin, 20),
      v_job.currency, p_valid_until, nullif(btrim(p_duration), ''),
      nullif(btrim(p_payment_terms), ''), nullif(btrim(p_notes), '')
    ) returning id into v_quote_id;
  else
    select q.* into v_quote from public.quotes q
    where q.id = p_quote_id and q.business_id = v_business_id and q.job_id = p_job_id
      and q.status in ('draft','ready') for update;
    if not found then raise exception 'Quote not found or not editable'; end if;
    v_quote_id := v_quote.id;
    v_sale := coalesce(p_sale_price, v_quote.sale_price);
    v_cost := v_quote.estimated_cost_snapshot;
    if v_sale < 0 or v_sale > 99999999999999.99 or scale(v_sale) > 2 or
       p_status = 'ready' and (coalesce(v_quote.customer_id, v_job.customer_id) is null or v_sale <= 0) then
      raise exception 'Invalid quote price or customer';
    end if;
    if v_sale is distinct from v_quote.sale_price and not coalesce(p_acknowledge_risk, false) and
       (case when v_sale = 0 then true else v_sale < v_cost or
         (v_sale - v_cost) / v_sale * 100 < v_quote.minimum_margin_snapshot end) then
      raise exception 'Pricing risk confirmation required';
    end if;
    update public.quotes set status = p_status, customer_id = coalesce(v_quote.customer_id, v_job.customer_id), title = btrim(p_title),
      description = nullif(btrim(p_description), ''), sale_price = v_sale,
      estimated_profit_snapshot = round(v_sale - v_cost, 2),
      profit_margin_snapshot = case when v_sale = 0 then null else round((v_sale - v_cost) / v_sale * 100,4) end,
      valid_until = p_valid_until, estimated_duration_text = nullif(btrim(p_duration), ''),
      payment_terms = nullif(btrim(p_payment_terms), ''), notes = nullif(btrim(p_notes), '')
    where id = v_quote_id;
    delete from public.quote_items where quote_id = v_quote_id;
    delete from public.quote_exclusions where quote_id = v_quote_id;
  end if;

  v_order := 0;
  for v_item in select value from jsonb_array_elements(p_items) loop
    insert into public.quote_items (quote_id, name, description, sort_order)
    values (v_quote_id, btrim(v_item->>'name'), nullif(btrim(v_item->>'description'), ''), v_order);
    v_order := v_order + 1;
  end loop;
  v_order := 0;
  for v_exclusion in select value from jsonb_array_elements(p_exclusions) loop
    insert into public.quote_exclusions (quote_id, text, sort_order)
    values (v_quote_id, btrim(v_exclusion #>> '{}'), v_order);
    v_order := v_order + 1;
  end loop;
  return v_quote_id;
end;
$$;
revoke all on function public.save_quote(uuid,uuid,text,text,text,jsonb,jsonb,text,text,date,text,numeric,boolean) from public, anon;
grant execute on function public.save_quote(uuid,uuid,text,text,text,jsonb,jsonb,text,text,date,text,numeric,boolean) to authenticated;

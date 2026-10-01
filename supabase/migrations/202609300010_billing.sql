-- Plan catalog is public; subscriptions and event history belong to the server.
create table public.plans (
  id text primary key check (id in ('free', 'usta', 'pro')),
  name text not null,
  description text not null,
  monthly_price_kurus integer not null check (monthly_price_kurus >= 0),
  yearly_price_kurus integer not null check (yearly_price_kurus >= 0),
  currency text not null default 'TRY' check (currency = 'TRY'),
  features jsonb not null default '{}'::jsonb check (jsonb_typeof(features) = 'object'),
  limits jsonb not null default '{}'::jsonb check (jsonb_typeof(limits) = 'object'),
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into public.plans (id, name, description, monthly_price_kurus, yearly_price_kurus, features, limits, sort_order) values
  ('free', 'Ücretsiz', 'İlk tekliflerini güvenle hazırla.', 0, 0,
   '{"public_quotes":true,"pdf":true,"whatsapp":true,"actual_profit":false,"advanced_reports":false,"remove_branding":false,"business_logo":false}'::jsonb,
   '{"monthly_quotes":5,"active_customers":20,"businesses":1,"users":1}'::jsonb, 0),
  ('usta', 'Usta', 'Düzenli işler için sınırsız kullanım.', 39900, 399000,
   '{"public_quotes":true,"pdf":true,"whatsapp":true,"actual_profit":true,"advanced_reports":true,"remove_branding":false,"business_logo":false}'::jsonb,
   '{"monthly_quotes":null,"active_customers":null,"businesses":1,"users":1}'::jsonb, 1),
  ('pro', 'Pro', 'Markana özel teklifler ve kapsamlı raporlar.', 79900, 799000,
   '{"public_quotes":true,"pdf":true,"whatsapp":true,"actual_profit":true,"advanced_reports":true,"remove_branding":true,"business_logo":true}'::jsonb,
   '{"monthly_quotes":null,"active_customers":null,"businesses":1,"users":1}'::jsonb, 2)
on conflict (id) do nothing;

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  plan_id text not null references public.plans(id),
  status text not null check (status in ('free','trialing','active','past_due','cancelled','expired','incomplete')),
  billing_interval text check (billing_interval in ('monthly','yearly')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  pending_plan_id text references public.plans(id),
  last_provider_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_period_valid check (current_period_end is null or current_period_start is null or current_period_end > current_period_start),
  constraint paid_subscription_provider_required check (plan_id = 'free' or status = 'incomplete' or (provider is not null and provider_subscription_id is not null))
);
create unique index subscriptions_provider_subscription_unique on public.subscriptions(provider, provider_subscription_id) where provider_subscription_id is not null;
create index subscriptions_status_period_idx on public.subscriptions(status, current_period_end);
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();

create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  business_id uuid references public.businesses(id) on delete set null,
  event_type text not null,
  payload_hash text not null,
  occurred_at timestamptz not null,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);
create index billing_events_business_idx on public.billing_events(business_id, processed_at desc);

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;
revoke all on public.plans, public.subscriptions, public.billing_events from anon, authenticated;
grant select on public.plans to anon, authenticated;
grant select on public.subscriptions to authenticated;
create policy plans_read on public.plans for select to anon, authenticated using (is_active);
create policy subscriptions_owner_read on public.subscriptions for select to authenticated
using (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = (select auth.uid())));

-- Called only after a provider adapter verifies a signed server notification.
-- Event insertion and subscription update share one transaction. Older events
-- cannot overwrite a more recent subscription state.
create function public.apply_verified_billing_event(
  p_provider text, p_event_id text, p_event_type text, p_payload_hash text,
  p_occurred_at timestamptz, p_business_id uuid, p_plan_id text,
  p_status text, p_interval text, p_customer_id text, p_subscription_id text,
  p_period_start timestamptz, p_period_end timestamptz, p_cancel_at_period_end boolean
) returns boolean language plpgsql security definer set search_path = '' as $$
declare v_event_id uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'Forbidden'; end if;
  if p_provider is null or p_event_id is null or p_payload_hash is null or
     p_business_id is null or p_plan_id not in ('usta','pro') or
     p_status not in ('trialing','active','past_due','cancelled','expired','incomplete') or
     p_interval not in ('monthly','yearly') or p_subscription_id is null or
     p_period_start is null or p_period_end is null or p_period_end <= p_period_start or
     p_occurred_at is null then raise exception 'Invalid billing event'; end if;
  insert into public.billing_events(provider, provider_event_id, business_id, event_type, payload_hash, occurred_at)
  values (p_provider, p_event_id, p_business_id, p_event_type, p_payload_hash, p_occurred_at)
  on conflict (provider, provider_event_id) do nothing returning id into v_event_id;
  if v_event_id is null then return false; end if;
  insert into public.subscriptions(business_id, plan_id, status, billing_interval, provider,
    provider_customer_id, provider_subscription_id, current_period_start, current_period_end,
    cancel_at_period_end, last_provider_event_at)
  values (p_business_id, p_plan_id, p_status, p_interval, p_provider, p_customer_id,
    p_subscription_id, p_period_start, p_period_end, p_cancel_at_period_end, p_occurred_at)
  on conflict (business_id) do update set plan_id = excluded.plan_id, status = excluded.status,
    billing_interval = excluded.billing_interval, provider = excluded.provider,
    provider_customer_id = excluded.provider_customer_id,
    provider_subscription_id = excluded.provider_subscription_id,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    last_provider_event_at = excluded.last_provider_event_at
  where public.subscriptions.last_provider_event_at is null or
    excluded.last_provider_event_at > public.subscriptions.last_provider_event_at;
  return true;
end;
$$;
revoke all on function public.apply_verified_billing_event(text,text,text,text,timestamptz,uuid,text,text,text,text,text,timestamptz,timestamptz,boolean) from public;
grant execute on function public.apply_verified_billing_event(text,text,text,text,timestamptz,uuid,text,text,text,text,text,timestamptz,timestamptz,boolean) to service_role;

-- All decisions use the same effective plan. A missing/expired subscription is Free.
create function public.effective_plan_id(p_business_id uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select s.plan_id from public.subscriptions s
    where s.business_id = p_business_id and s.plan_id <> 'free'
      and s.status in ('active','trialing','past_due')
      and s.current_period_end > now()
  ), 'free')
$$;
revoke all on function public.effective_plan_id(uuid) from public;

create function public.enforce_quote_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_limit integer; v_start timestamptz; v_end timestamptz; v_used integer;
begin
  -- Serializes concurrent writes for the same business without changing existing quotes.
  perform 1 from public.businesses where id = new.business_id for update;
  select (limits->>'monthly_quotes')::integer into v_limit from public.plans
    where id = public.effective_plan_id(new.business_id);
  if v_limit is null then return new; end if;
  v_start := date_trunc('month', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul';
  v_end := (date_trunc('month', now() at time zone 'Europe/Istanbul') + interval '1 month') at time zone 'Europe/Istanbul';
  select count(*) into v_used from public.quotes where business_id = new.business_id and created_at >= v_start and created_at < v_end;
  if v_used >= v_limit then raise exception 'BILLING_QUOTE_LIMIT' using errcode = 'P0001'; end if;
  return new;
end;
$$;
create trigger quotes_plan_limit before insert on public.quotes for each row execute function public.enforce_quote_limit();

create function public.enforce_customer_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_limit integer; v_used integer;
begin
  if new.is_archived then return new; end if;
  if tg_op = 'UPDATE' and (old.is_archived = false or new.business_id <> old.business_id) then return new; end if;
  perform 1 from public.businesses where id = new.business_id for update;
  select (limits->>'active_customers')::integer into v_limit from public.plans
    where id = public.effective_plan_id(new.business_id);
  if v_limit is null then return new; end if;
  select count(*) into v_used from public.customers where business_id = new.business_id and not is_archived;
  if v_used >= v_limit then raise exception 'BILLING_CUSTOMER_LIMIT' using errcode = 'P0001'; end if;
  return new;
end;
$$;
create trigger customers_plan_limit before insert or update of is_archived on public.customers
for each row execute function public.enforce_customer_limit();

-- Public branding is always derived on the server from the current subscription.
create or replace function public.get_public_quote(p_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_quote public.quotes%rowtype; v_business public.businesses%rowtype;
  v_customer public.customers%rowtype; v_items jsonb; v_exclusions jsonb; v_branding boolean;
begin
  select q.* into v_quote from public.quotes q where q.public_token = p_token and q.status <> 'draft';
  if not found then return null; end if;
  select b.* into v_business from public.businesses b where b.id = v_quote.business_id;
  if v_quote.customer_id is not null then
    select c.* into v_customer from public.customers c where c.id = v_quote.customer_id and c.business_id = v_quote.business_id;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('name', i.name, 'description', i.description) order by i.sort_order, i.id), '[]'::jsonb)
    into v_items from public.quote_items i where i.quote_id = v_quote.id;
  select coalesce(jsonb_agg(e.text order by e.sort_order, e.id), '[]'::jsonb)
    into v_exclusions from public.quote_exclusions e where e.quote_id = v_quote.id;
  select not coalesce((features->>'remove_branding')::boolean, false) into v_branding
    from public.plans where id = public.effective_plan_id(v_quote.business_id);
  return jsonb_build_object(
    'business', jsonb_build_object('name', v_business.name, 'logoUrl',
      case when v_branding then null else v_business.logo_url end, 'phone', v_business.phone, 'city', v_business.city),
    'customer', case when v_customer.id is null then null else jsonb_build_object('name', v_customer.name, 'companyName', v_customer.company_name) end,
    'quoteNumber', v_quote.quote_number, 'date', to_char(v_quote.created_at at time zone 'Europe/Istanbul', 'YYYY-MM-DD'),
    'validUntil', v_quote.valid_until::text, 'title', v_quote.title, 'description', v_quote.description,
    'items', v_items, 'exclusions', v_exclusions, 'estimatedDuration', v_quote.estimated_duration_text,
    'salePrice', v_quote.sale_price, 'currency', v_quote.currency, 'paymentTerms', v_quote.payment_terms,
    'notes', v_quote.notes, 'status', v_quote.status, 'showBranding', coalesce(v_branding, true));
end;
$$;
revoke all on function public.get_public_quote(uuid) from public;
grant execute on function public.get_public_quote(uuid) to anon, authenticated;

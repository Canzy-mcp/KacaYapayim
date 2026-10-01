alter table public.quotes
  add column view_count integer not null default 0,
  add column last_viewed_at timestamptz,
  add constraint quotes_view_count_nonnegative check (view_count >= 0);

-- Event keys make duplicate client effects and retries idempotent. The table is
-- private; anonymous callers can only invoke the narrow tracking function.
create table public.quote_public_views (
  quote_id uuid not null references public.quotes(id) on delete cascade,
  event_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (quote_id, event_id)
);
create index quote_public_views_recent_idx on public.quote_public_views(quote_id, created_at desc);
alter table public.quote_public_views enable row level security;
revoke all on public.quote_public_views from anon, authenticated;

-- Only the customer-facing projection leaves this function. It never returns
-- cost, profit, margins, ownership IDs, token, or customer contact data.
create function public.get_public_quote(p_token uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_quote public.quotes%rowtype;
  v_business public.businesses%rowtype;
  v_customer public.customers%rowtype;
  v_items jsonb;
  v_exclusions jsonb;
begin
  select q.* into v_quote from public.quotes q
  where q.public_token = p_token and q.status <> 'draft';
  if not found then return null; end if;
  select b.* into v_business from public.businesses b where b.id = v_quote.business_id;
  if v_quote.customer_id is not null then
    select c.* into v_customer from public.customers c
    where c.id = v_quote.customer_id and c.business_id = v_quote.business_id;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('name', i.name, 'description', i.description)
    order by i.sort_order, i.id), '[]'::jsonb) into v_items
  from public.quote_items i where i.quote_id = v_quote.id;
  select coalesce(jsonb_agg(e.text order by e.sort_order, e.id), '[]'::jsonb) into v_exclusions
  from public.quote_exclusions e where e.quote_id = v_quote.id;
  return jsonb_build_object(
    'business', jsonb_build_object('name', v_business.name, 'logoUrl', v_business.logo_url,
      'phone', v_business.phone, 'city', v_business.city),
    'customer', case when v_customer.id is null then null else
      jsonb_build_object('name', v_customer.name, 'companyName', v_customer.company_name) end,
    'quoteNumber', v_quote.quote_number,
    'date', to_char(v_quote.created_at at time zone 'Europe/Istanbul', 'YYYY-MM-DD'),
    'validUntil', v_quote.valid_until::text,
    'title', v_quote.title,
    'description', v_quote.description,
    'items', v_items,
    'exclusions', v_exclusions,
    'estimatedDuration', v_quote.estimated_duration_text,
    'salePrice', v_quote.sale_price,
    'currency', v_quote.currency,
    'paymentTerms', v_quote.payment_terms,
    'notes', v_quote.notes,
    'status', v_quote.status
  );
end;
$$;
revoke all on function public.get_public_quote(uuid) from public;
grant execute on function public.get_public_quote(uuid) to anon, authenticated;

create function public.mark_quote_sent(p_quote_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  update public.quotes q set
    sent_at = coalesce(q.sent_at, now()),
    status = case when q.status = 'ready' then 'sent' else q.status end
  where q.id = p_quote_id and q.status in ('ready','sent','viewed')
    and exists (select 1 from public.businesses b where b.id = q.business_id and b.owner_id = auth.uid());
  if not found then raise exception 'Quote not ready or not owned'; end if;
end;
$$;
revoke all on function public.mark_quote_sent(uuid) from public, anon;
grant execute on function public.mark_quote_sent(uuid) to authenticated;

create function public.mark_quote_viewed(p_token uuid, p_event_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_quote_id uuid;
  v_inserted uuid;
begin
  if p_token is null or p_event_id is null then return false; end if;
  select q.id into v_quote_id from public.quotes q
  where q.public_token = p_token and q.status <> 'draft' for update;
  if not found then return false; end if;
  -- A modest per-quote limit avoids unbounded counter writes if a link is abused.
  if (select count(*) from public.quote_public_views v
      where v.quote_id = v_quote_id and v.created_at > now() - interval '1 hour') >= 60 then
    return false;
  end if;
  insert into public.quote_public_views (quote_id, event_id)
  values (v_quote_id, p_event_id) on conflict do nothing returning event_id into v_inserted;
  if v_inserted is null then return false; end if;
  update public.quotes q set
    viewed_at = coalesce(q.viewed_at, now()),
    last_viewed_at = now(),
    view_count = q.view_count + 1,
    status = case when q.status = 'sent' then 'viewed' else q.status end
  where q.id = v_quote_id;
  return true;
end;
$$;
revoke all on function public.mark_quote_viewed(uuid,uuid) from public;
grant execute on function public.mark_quote_viewed(uuid,uuid) to anon, authenticated;

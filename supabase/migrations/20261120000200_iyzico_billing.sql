create table private.billing_checkout_attempts (
  token text primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  plan_id text not null references public.plans(id) check (plan_id in ('usta', 'pro')),
  billing_interval text not null check (billing_interval in ('monthly', 'yearly')),
  plan_reference text not null,
  payment_url text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  provider_subscription_id text unique
);
create index billing_checkout_attempts_business_idx on private.billing_checkout_attempts(business_id, created_at desc);
alter table private.billing_checkout_attempts enable row level security;
revoke all on private.billing_checkout_attempts from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update on private.billing_checkout_attempts to service_role;
grant select on public.subscriptions, public.billing_events to service_role;
grant select (id), update (id) on public.businesses to service_role;

create function public.save_iyzico_checkout(
  p_business_id uuid, p_token text, p_plan_id text, p_interval text,
  p_plan_reference text, p_payment_url text, p_expires_at timestamptz
) returns text language plpgsql security invoker set search_path = '' as $$
declare v_pending private.billing_checkout_attempts%rowtype;
begin
  perform 1 from public.businesses where id = p_business_id for update;
  if exists (select 1 from public.subscriptions where business_id = p_business_id
    and provider_subscription_id is not null and status not in ('cancelled', 'expired', 'free')) then
    return null;
  end if;
  select * into v_pending from private.billing_checkout_attempts
    where business_id = p_business_id and status = 'pending' and expires_at > now()
    order by created_at desc limit 1;
  if found then
    if v_pending.plan_reference = p_plan_reference then return v_pending.payment_url; end if;
    return null;
  end if;
  insert into private.billing_checkout_attempts
    (token, business_id, plan_id, billing_interval, plan_reference, payment_url, expires_at)
  values (p_token, p_business_id, p_plan_id, p_interval, p_plan_reference, p_payment_url, p_expires_at);
  return p_payment_url;
end;
$$;

create function public.get_iyzico_checkout(p_token text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('business_id', business_id, 'plan_id', plan_id, 'billing_interval', billing_interval,
    'plan_reference', plan_reference, 'status', status)
  from private.billing_checkout_attempts where token = p_token;
$$;

create function public.get_pending_iyzico_checkout(p_business_id uuid)
returns text language sql stable security invoker set search_path = '' as $$
  select token from private.billing_checkout_attempts
    where business_id = p_business_id and status = 'pending' order by created_at desc limit 1;
$$;

create function public.get_iyzico_subscription_plan(p_subscription_id text)
returns text language sql stable security invoker set search_path = '' as $$
  select plan_reference from private.billing_checkout_attempts
  where provider_subscription_id = p_subscription_id and status = 'completed';
$$;

create function public.apply_iyzico_event(p_event jsonb, p_token text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  v_business_id uuid := (p_event->>'businessId')::uuid;
  v_subscription_id text := p_event->>'providerSubscriptionId';
  v_current public.subscriptions%rowtype;
  v_attempt private.billing_checkout_attempts%rowtype;
  v_applied boolean;
begin
  perform 1 from public.businesses where id = v_business_id for update;
  select * into v_current from public.subscriptions where business_id = v_business_id;
  if p_token is not null then
    select * into v_attempt from private.billing_checkout_attempts where token = p_token and business_id = v_business_id;
    if not found or v_attempt.plan_id is distinct from p_event->>'planId' or
      v_attempt.billing_interval is distinct from p_event->>'interval' or
      v_attempt.plan_reference is distinct from p_event->>'planReference' or p_event->>'status' is distinct from 'active' then
      return false;
    end if;
    if v_attempt.status = 'completed' then return v_attempt.provider_subscription_id = v_subscription_id; end if;
    if v_current.provider_subscription_id is not null and v_current.status not in ('cancelled', 'expired', 'free') then
      return false;
    end if;
  elsif v_current.provider is distinct from 'iyzico' or v_current.provider_subscription_id is distinct from v_subscription_id then
    return false;
  end if;

  v_applied := public.apply_verified_billing_event(
    'iyzico', p_event->>'eventId', p_event->>'eventType', p_event->>'payloadHash',
    (p_event->>'occurredAt')::timestamptz, v_business_id, p_event->>'planId',
    p_event->>'status', p_event->>'interval', p_event->>'providerCustomerId', v_subscription_id,
    (p_event->>'currentPeriodStart')::timestamptz, (p_event->>'currentPeriodEnd')::timestamptz,
    (p_event->>'cancelAtPeriodEnd')::boolean
  );
  if p_token is not null then
    if not exists (select 1 from public.subscriptions where business_id = v_business_id
      and provider = 'iyzico' and provider_subscription_id = v_subscription_id) then
      raise exception 'Checkout did not update the subscription';
    end if;
    update private.billing_checkout_attempts set status = 'completed', payment_url = null,
      provider_subscription_id = v_subscription_id where token = p_token;
  end if;
  return v_applied;
end;
$$;

revoke all on function public.save_iyzico_checkout(uuid,text,text,text,text,text,timestamptz),
  public.get_iyzico_checkout(text), public.get_pending_iyzico_checkout(uuid),
  public.get_iyzico_subscription_plan(text), public.apply_iyzico_event(jsonb,text)
  from public, anon, authenticated;
grant execute on function public.save_iyzico_checkout(uuid,text,text,text,text,text,timestamptz),
  public.get_iyzico_checkout(text), public.get_pending_iyzico_checkout(uuid),
  public.get_iyzico_subscription_plan(text), public.apply_iyzico_event(jsonb,text)
  to service_role;

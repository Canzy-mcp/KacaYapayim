-- One-time 199 TL usta entry fee replaces monthly/yearly subscriptions.
-- Run once in a single transaction. Nothing is dropped; old subscription data stays readable.
-- A paid entry is a public.subscriptions row: plan 'pro', status 'active', billing_interval NULL,
-- provider 'iyzico' (provider_subscription_id = iyzico paymentId), period end 2126-01-01.
-- Grandfathered businesses get the same row with provider 'grandfathered'.

-- Plan catalog. 'pro' is now the single paid "Usta Üyelik" (feature set unchanged). Its two
-- price columns carry the same fee only because they are NOT NULL; the app charges the server
-- constant ENTRY_FEE_KURUS and never displays them as monthly/yearly.
-- 'free' means "no membership": 0 quotes. active_customers stays 20 so an unpaid usta can still
-- set up a few customers while onboarding.
update public.plans set is_active = false, updated_at = now() where id = 'usta';
update public.plans set name = 'Usta Üyelik', description = 'Tek seferlik ödemeyle tüm özellikler, süresiz.',
  monthly_price_kurus = 19900, yearly_price_kurus = 19900, updated_at = now() where id = 'pro';
update public.plans set name = 'Üyelik yok', description = 'Teklif hazırlamak ve pazar yerinde teklif vermek için usta üyeliği gerekir.',
  limits = jsonb_set(limits, '{monthly_quotes}', '0'::jsonb), updated_at = now() where id = 'free';

-- Subscriptions still on the retired 'usta' plan move to the lifetime plan, keeping their row.
update public.subscriptions set plan_id = 'pro' where plan_id = 'usta';

-- Grandfather every onboarded business that has no active paid subscription.
insert into public.subscriptions(business_id, plan_id, status, billing_interval, provider,
  provider_subscription_id, current_period_start, current_period_end, cancel_at_period_end)
select b.id, 'pro', 'active', null, 'grandfathered', 'grandfathered-' || b.id, now(),
  timestamptz '2126-01-01 00:00:00+00', false
from public.businesses b where b.onboarding_completed
on conflict (business_id) do update set plan_id = 'pro', status = 'active', billing_interval = null,
  provider = 'grandfathered', provider_customer_id = null,
  provider_subscription_id = excluded.provider_subscription_id, current_period_start = excluded.current_period_start,
  current_period_end = excluded.current_period_end, cancel_at_period_end = false
where not (public.subscriptions.plan_id <> 'free' and public.subscriptions.status in ('active', 'trialing')
  and public.subscriptions.current_period_end > now());

-- Checkout attempts may use the one-time interval. The inline check from 20261120000200
-- has the auto-generated name below.
alter table private.billing_checkout_attempts drop constraint billing_checkout_attempts_billing_interval_check;
alter table private.billing_checkout_attempts add constraint billing_checkout_attempts_billing_interval_check
  check (billing_interval in ('monthly', 'yearly', 'once'));

-- Settles a verified entry-fee payment. The server has already re-read the payment from iyzico
-- and checked amount, currency, status and basket. Reuses apply_verified_billing_event
-- (a NULL interval passes its validation and is stored as NULL).
create function public.apply_entry_fee_event(p_event jsonb, p_token text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare
  v_business_id uuid := (p_event->>'businessId')::uuid;
  v_payment_id text := p_event->>'providerSubscriptionId';
  v_current public.subscriptions%rowtype;
  v_attempt private.billing_checkout_attempts%rowtype;
begin
  perform 1 from public.businesses where id = v_business_id for update;
  select * into v_attempt from private.billing_checkout_attempts where token = p_token and business_id = v_business_id;
  if not found or v_attempt.plan_id is distinct from 'pro' or v_attempt.billing_interval is distinct from 'once'
    or v_attempt.plan_reference is distinct from 'entry-fee' or v_payment_id is null
    or p_event->>'status' is distinct from 'active' or p_event->>'planId' is distinct from 'pro' then
    return false;
  end if;
  if v_attempt.status = 'completed' then return v_attempt.provider_subscription_id = v_payment_id; end if;
  select * into v_current from public.subscriptions where business_id = v_business_id;
  if not (found and v_current.plan_id <> 'free' and v_current.status in ('active', 'trialing')
    and v_current.current_period_end > now()) then
    perform public.apply_verified_billing_event(
      'iyzico', p_event->>'eventId', p_event->>'eventType', p_event->>'payloadHash',
      (p_event->>'occurredAt')::timestamptz, v_business_id, 'pro', 'active', null,
      null, v_payment_id, (p_event->>'currentPeriodStart')::timestamptz,
      (p_event->>'currentPeriodEnd')::timestamptz, false);
    if not exists (select 1 from public.subscriptions where business_id = v_business_id
      and provider = 'iyzico' and provider_subscription_id = v_payment_id) then
      raise exception 'Entry fee did not update the subscription';
    end if;
  end if;
  -- A business that already had access (e.g. grandfathered meanwhile) just closes the attempt.
  update private.billing_checkout_attempts set status = 'completed', payment_url = null,
    provider_subscription_id = v_payment_id where token = p_token;
  return true;
end;
$$;
revoke all on function public.apply_entry_fee_event(jsonb, text) from public, anon, authenticated;
grant execute on function public.apply_entry_fee_event(jsonb, text) to service_role;

-- Marketplace gating: publishing a provider profile and sending offers need the entry fee.
do $$
declare
  source text := pg_get_functiondef('private.market_write(text,jsonb)'::regprocedure);
  updated text;
  lit text;
begin
  lit := 'if business is null then raise exception ''MARKET_ACCESS''; end if;';
  updated := replace(source, lit, lit || ' if coalesce((p->>''published'')::boolean,false) and public.effective_plan_id(business)=''free'' then raise exception ''BILLING_ENTRY_REQUIRED'' using errcode=''P0001''; end if;');
  if updated = source then
    raise exception 'Market profile gate anchor changed';
  end if;
  source := updated;
  lit := '      amount := nullif(p->>''amount'','''')::numeric;';
  updated := replace(source, lit, '      if public.effective_plan_id(provider.business_id)=''free'' then raise exception ''BILLING_ENTRY_REQUIRED'' using errcode=''P0001''; end if;' || E'\n' || lit);
  if updated = source then raise exception 'Market offer gate anchor changed'; end if;
  execute updated;
end;
$$;

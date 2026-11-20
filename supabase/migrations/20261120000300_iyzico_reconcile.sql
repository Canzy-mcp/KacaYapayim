create index billing_checkout_attempts_pending_plan_idx
  on private.billing_checkout_attempts(plan_reference, token) where status = 'pending';

create function public.list_pending_iyzico_checkouts(p_plan_reference text, p_created_at timestamptz, p_after_token text)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(candidate.token order by candidate.token), '[]'::jsonb)
  from (
    select token from private.billing_checkout_attempts
    where status = 'pending' and plan_reference = p_plan_reference and token > p_after_token
      -- Use the subscription creation time, so delayed delivery can still find expired forms.
      and (p_created_at is null or p_created_at between created_at - interval '5 minutes' and expires_at + interval '5 minutes')
    order by token limit 8
  ) as candidate;
$$;

revoke all on function public.list_pending_iyzico_checkouts(text,timestamptz,text) from public, anon, authenticated;
grant execute on function public.list_pending_iyzico_checkouts(text,timestamptz,text) to service_role;

-- The server can settle a verified paid checkout even if the subscription has since ended.
create or replace function public.apply_iyzico_event(p_event jsonb, p_token text)
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
      v_attempt.plan_reference is distinct from p_event->>'planReference' or (p_event->>'status') is null or (p_event->>'status') not in ('active', 'past_due', 'cancelled', 'expired') then
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

import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";
import type { BillingInterval, VerifiedSubscriptionEvent } from "./provider";

type CheckoutAttempt = {
  business_id: string;
  plan_id: VerifiedSubscriptionEvent["planId"];
  billing_interval: BillingInterval;
  plan_reference: string;
  status: "pending" | "completed";
};

export type VerifiedIyzicoEvent = VerifiedSubscriptionEvent & {
  occurredAt: string;
  payloadHash: string;
  planReference: string;
};

// These service-only RPCs live in the billing migration, outside the shared database types.
export async function billingRpc<T>(name: string, args: Record<string, unknown>) {
  const client = createServiceClient();
  const { data, error } = await client.rpc(name as never, args as never);
  if (error) throw new Error("iyzico billing database operation failed");
  return data as T;
}

export function getCheckoutAttempt(token: string) {
  return billingRpc<CheckoutAttempt | null>("get_iyzico_checkout", { p_token: token });
}

export function applyIyzicoEvent(event: VerifiedIyzicoEvent, token: string | null = null) {
  return billingRpc<boolean>("apply_iyzico_event", { p_event: event, p_token: token });
}

export async function hasIyzicoEvent(eventId: string) {
  const { data, error } = await createServiceClient().from("billing_events").select("id")
    .eq("provider", "iyzico").eq("provider_event_id", eventId).maybeSingle();
  if (error) throw new Error("Could not look up iyzico event");
  return data !== null;
}

export async function findIyzicoSubscription(reference: string) {
  const { data, error } = await createServiceClient().from("subscriptions")
    .select("business_id,plan_id,billing_interval,provider_customer_id,current_period_start,current_period_end")
    .eq("provider", "iyzico").eq("provider_subscription_id", reference).maybeSingle();
  if (error) throw new Error("Could not look up iyzico subscription");
  return data;
}

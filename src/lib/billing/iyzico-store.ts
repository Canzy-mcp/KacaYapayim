import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";

export type CheckoutAttempt = {
  business_id: string;
  plan_id: "pro";
  billing_interval: "once";
  plan_reference: string;
  status: "pending" | "completed";
};

export type VerifiedEntryPayment = {
  businessId: string;
  eventId: string;
  eventType: "entry_fee.paid";
  planId: "pro";
  status: "active";
  providerSubscriptionId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  occurredAt: string;
  payloadHash: string;
};

// These service-only RPCs live in the billing migrations, outside the shared database types.
export async function billingRpc<T>(name: string, args: Record<string, unknown>) {
  const client = createServiceClient();
  const { data, error } = await client.rpc(name as never, args as never);
  if (error) throw new Error("iyzico billing database operation failed");
  return data as T;
}

export function getCheckoutAttempt(token: string) {
  return billingRpc<CheckoutAttempt | null>("get_iyzico_checkout", { p_token: token });
}

export function applyEntryPayment(event: VerifiedEntryPayment, token: string) {
  return billingRpc<boolean>("apply_entry_fee_event", { p_event: event, p_token: token });
}

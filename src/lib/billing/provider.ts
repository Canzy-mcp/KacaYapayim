import "server-only";
import { IyzicoBillingProvider } from "./iyzico";
import { readIyzicoConfig } from "./iyzico-protocol";
import type { PlanId, SubscriptionStatus } from "@/types/database";

export type BillingInterval = "monthly" | "yearly";
export type BillingDetails = {
  name: string;
  surname: string;
  email: string;
  city: string;
  address: string;
  gsmNumber?: string;
  identityNumber?: string;
};
export type VerifiedSubscriptionEvent = {
  provider: string;
  eventId: string;
  eventType: string;
  businessId: string;
  planId: Exclude<PlanId, "free">;
  status: SubscriptionStatus;
  interval: BillingInterval;
  providerCustomerId: string | null;
  providerSubscriptionId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
};

// A store adapter must verify its own signed server notification and purchase
// before returning a trusted event. UI redirects must never activate a plan.
export interface BillingProvider {
  readonly id: string;
  createCheckoutSession(input: { businessId: string; planId: Exclude<PlanId, "free">; interval: BillingInterval; amountKurus: number; currency: "TRY"; successUrl: string; cancelUrl: string; billingDetails: BillingDetails }): Promise<{ url: string }>;
  createCustomerPortal(input: { businessId: string; returnUrl: string }): Promise<{ url: string }>;
  cancelSubscription(input: { providerSubscriptionId: string }): Promise<void>;
  resumeSubscription(input: { providerSubscriptionId: string }): Promise<void>;
  handleWebhook(input: { body: Uint8Array; headers: Headers }): Promise<VerifiedSubscriptionEvent | null>;
  getSubscription(input: { providerSubscriptionId: string }): Promise<VerifiedSubscriptionEvent>;
}

export class BillingProviderUnavailableError extends Error {
  constructor() { super("Abonelik ödemeleri henüz kullanıma açılmadı."); }
}

export function billingAvailable(env = process.env): boolean {
  return readIyzicoConfig(env) !== null;
}

export function getBillingProvider(): IyzicoBillingProvider {
  const config = readIyzicoConfig(process.env);
  if (!config) throw new BillingProviderUnavailableError();
  return new IyzicoBillingProvider(config);
}

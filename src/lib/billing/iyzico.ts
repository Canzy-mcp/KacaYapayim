import "server-only";
import { randomUUID } from "node:crypto";
import type { BillingProvider, VerifiedSubscriptionEvent } from "./provider";
import { applyIyzicoEvent, billingRpc, findIyzicoSubscription, getCheckoutAttempt, hasIyzicoEvent, type VerifiedIyzicoEvent } from "./iyzico-store";
import { hashBillingValue, hostedCheckoutUrl, isReference, iyzicoAuthHeaders, iyzicoStatus, verifyIyzicoWebhook, webhookStatus, type readIyzicoConfig } from "./iyzico-protocol";

type Config = NonNullable<ReturnType<typeof readIyzicoConfig>>;
type ProviderOrder = { referenceCode: string; orderStatus: string; startPeriod: number; endPeriod: number };
type ProviderSubscription = {
  referenceCode: string;
  pricingPlanReferenceCode: string;
  customerReferenceCode: string;
  subscriptionStatus: string;
  orders?: ProviderOrder[];
  items?: ProviderSubscription[];
  startDate?: number;
  endDate?: number;
};

export class InvalidIyzicoSignatureError extends Error {}
export class IyzicoCheckoutInProgressError extends Error {}
export class IyzicoAdditionalDetailsError extends Error {}

function isoDate(ms: unknown) {
  if (typeof ms !== "number" || !Number.isSafeInteger(ms) || ms <= 0 || ms > 8.64e15) return null;
  return new Date(ms).toISOString();
}

function subscriptionPath(reference: string) {
  if (!isReference(reference)) throw new Error("Invalid iyzico subscription reference");
  return `/v2/subscription/subscriptions/${reference}`;
}

export class IyzicoBillingProvider implements BillingProvider {
  readonly id = "iyzico";
  readonly appUrl: string;
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
    this.appUrl = config.appUrl;
  }

  private async request<T>(path: string, payload?: Record<string, unknown>, allowDeclined = false) {
    const body = payload && JSON.stringify(payload);
    const response = await fetch(this.config.apiUrl + path, {
      method: body === undefined ? "GET" : "POST",
      headers: { ...iyzicoAuthHeaders(this.config.apiKey, this.config.secretKey, randomUUID(), path, body),
        "Content-Type": "application/json" },
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok && !(allowDeclined && response.status === 400)) throw new Error("iyzico API request failed");
    const result = await response.json() as T & { status?: string; systemTime?: number };
    if (allowDeclined && result?.status === "failure") return null;
    if (result?.status !== "success") throw new Error("iyzico API operation failed");
    return result;
  }

  async createCheckoutSession(input: Parameters<BillingProvider["createCheckoutSession"]>[0]) {
    const reference = this.config.plans[input.planId][input.interval];
    // Reconcile a previously issued form before allowing a fresh payment.
    const pendingToken = await billingRpc<string | null>("get_pending_iyzico_checkout", { p_business_id: input.businessId });
    if (pendingToken && await this.completeCheckout(pendingToken)) throw new IyzicoCheckoutInProgressError();
    const pricing = await this.request<{ data: { referenceCode: string; price: number; currencyCode: string;
      status: string; paymentInterval: string; paymentIntervalCount: number; trialPeriodDays?: number;
      planPaymentType: string } }>(`/v2/subscription/pricing-plans/${reference}`);
    const plan = pricing?.data;
    if (!plan || plan.referenceCode !== reference || typeof plan.price !== "number" ||
      Math.round(plan.price * 100) !== input.amountKurus || plan.currencyCode !== input.currency ||
      plan.status !== "ACTIVE" || plan.paymentInterval !== input.interval.toUpperCase() ||
      plan.paymentIntervalCount !== 1 || plan.planPaymentType !== "RECURRING" ||
      (plan.trialPeriodDays ?? 0) !== 0) throw new Error("iyzico pricing plan does not match the catalog");

    const { city, address, ...customer } = input.billingDetails;
    const result = await this.request<{ token: unknown; paymentPageUrl?: unknown; tokenExpireTime?: number }>(
      "/v2/subscription/checkoutform/initialize", {
        locale: "tr",
        conversationId: randomUUID(),
        callbackUrl: this.appUrl + "/api/billing/iyzico/callback",
        pricingPlanReferenceCode: reference,
        subscriptionInitialStatus: "ACTIVE",
        customer: { ...customer, billingAddress: { contactName: `${customer.name} ${customer.surname}`, city, country: "Turkey", address } },
      }, true);
    if (!result && (!customer.gsmNumber || !customer.identityNumber)) throw new IyzicoAdditionalDetailsError();
    if (!isReference(result?.token)) throw new Error("Missing iyzico checkout token");
    const url = hostedCheckoutUrl(this.config.mode, result.token, result.paymentPageUrl);
    const ttl = result.tokenExpireTime ?? 1800;
    if (!Number.isSafeInteger(ttl) || ttl <= 0 || ttl > 86400) throw new Error("Invalid iyzico token lifetime");
    const savedUrl = await billingRpc<string | null>("save_iyzico_checkout", {
      p_business_id: input.businessId, p_token: result.token, p_plan_id: input.planId, p_interval: input.interval,
      p_plan_reference: reference, p_payment_url: url, p_expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
    });
    if (!savedUrl) throw new IyzicoCheckoutInProgressError();
    return { url: savedUrl };
  }

  async createCustomerPortal() {
    return { url: this.appUrl + "/billing" };
  }

  async completeCheckout(token: string) {
    const attempt = await getCheckoutAttempt(token);
    if (!attempt) return false;
    if (attempt.status === "completed") return true;
    const result = await this.request<{ data: ProviderSubscription; token?: string }>(
      `/v2/subscription/checkoutform/${token}`, undefined, true);
    const checkout = result?.data;
    if (!checkout || checkout.subscriptionStatus !== "ACTIVE" || (result.token !== undefined && result.token !== token) ||
      checkout.pricingPlanReferenceCode !== attempt.plan_reference) return false;
    const event = await this.readSubscription(checkout.referenceCode, {
      businessId: attempt.business_id, planId: attempt.plan_id, interval: attempt.billing_interval,
      planReference: attempt.plan_reference, customerId: checkout.customerReferenceCode,
    });
    if (event.status !== "active") throw new Error("iyzico checkout subscription is not active");
    return applyIyzicoEvent({
      ...event, eventType: "subscription.checkout.completed", eventId: `checkout:${hashBillingValue(token)}`,
    }, token);
  }

  private async readSubscription(reference: string, target: Pick<VerifiedSubscriptionEvent, "businessId" | "planId" | "interval"> & {
    planReference: string; customerId?: string | null; previousStart?: string | null; previousEnd?: string | null;
  }, notice?: NonNullable<ReturnType<typeof verifyIyzicoWebhook>>): Promise<VerifiedIyzicoEvent> {
    const result = await this.request<{ data: ProviderSubscription }>(subscriptionPath(reference));
    const data = result?.data;
    const snapshot = Array.isArray(data?.items) ? data.items.find(item => item?.referenceCode === reference) : data;
    const status = iyzicoStatus(snapshot?.subscriptionStatus);
    const occurredAt = isoDate(result?.systemTime);
    if (!snapshot || snapshot.referenceCode !== reference || snapshot.pricingPlanReferenceCode !== target.planReference ||
      !isReference(snapshot.customerReferenceCode) || (target.customerId && snapshot.customerReferenceCode !== target.customerId) ||
      !status || status === "free" || !occurredAt) throw new Error("Invalid iyzico subscription snapshot");

    const orders = Array.isArray(snapshot.orders) ? snapshot.orders.filter(order =>
      order && isoDate(order.startPeriod) && isoDate(order.endPeriod) && order.endPeriod > order.startPeriod
    ).sort((a, b) => b.startPeriod - a.startPeriod) : [];
    if (notice?.orderReferenceCode && notice.iyziEventType.startsWith("subscription.order.")) {
      const order = orders.find(item => item.referenceCode === notice.orderReferenceCode);
      if (!order || (order.orderStatus !== "SUCCESS" && order.orderStatus !== "FAILED") ||
        (notice.iyziEventType === "subscription.order.success" && order.orderStatus !== "SUCCESS")) {
        throw new Error("iyzico order result is not ready");
      }
    }
    const paid = orders.find(order => order.orderStatus === "SUCCESS" && order.startPeriod <= Date.parse(occurredAt));
    const latest = orders.find(order => order.startPeriod <= Date.parse(occurredAt) && ["FAILED", "SUCCESS"].includes(order.orderStatus));
    const effectiveStatus = status === "active" && latest?.orderStatus === "FAILED" ? "past_due" : status;
    const periodStart = paid ? isoDate(paid.startPeriod) : target.previousStart ?? isoDate(orders[0]?.startPeriod ?? snapshot.startDate);
    const periodEnd = paid ? isoDate(paid.endPeriod) : target.previousEnd ?? isoDate(orders[0]?.endPeriod ?? snapshot.endDate);
    if (!periodStart || !periodEnd || Date.parse(periodEnd) <= Date.parse(periodStart) ||
      (effectiveStatus === "active" && !paid) ||
      (effectiveStatus === "past_due" && !paid && !target.previousEnd)) throw new Error("Missing verified iyzico billing period");
    return {
      provider: this.id, eventId: `snapshot:${reference}:${occurredAt}`, eventType: "subscription.snapshot",
      businessId: target.businessId, planId: target.planId, interval: target.interval,
      status: effectiveStatus, providerCustomerId: snapshot.customerReferenceCode, providerSubscriptionId: reference,
      currentPeriodStart: periodStart, currentPeriodEnd: periodEnd, cancelAtPeriodEnd: false,
      occurredAt, planReference: target.planReference,
      payloadHash: hashBillingValue(JSON.stringify([reference, target.planReference, snapshot.customerReferenceCode, effectiveStatus, periodStart, periodEnd])),
    };
  }

  private async lookupSubscription(reference: string, notice?: NonNullable<ReturnType<typeof verifyIyzicoWebhook>>) {
    const local = await findIyzicoSubscription(reference);
    if (!local || local.plan_id === "free" || !local.billing_interval) throw new Error("Unknown iyzico subscription");
    const planReference = await billingRpc<string | null>("get_iyzico_subscription_plan", { p_subscription_id: reference }) ??
      this.config.plans[local.plan_id][local.billing_interval];
    return this.readSubscription(reference, {
      businessId: local.business_id, planId: local.plan_id, interval: local.billing_interval, planReference,
      customerId: notice?.customerReferenceCode ?? local.provider_customer_id,
      previousStart: local.current_period_start, previousEnd: local.current_period_end,
    }, notice);
  }

  async handleWebhook(input: Parameters<BillingProvider["handleWebhook"]>[0]) {
    const body: Record<string, unknown> = JSON.parse(new TextDecoder().decode(input.body));
    const notice = verifyIyzicoWebhook(body, input.headers.get("X-IYZ-SIGNATURE-V3"), this.config.merchantId, this.config.secretKey);
    if (!notice) throw new InvalidIyzicoSignatureError();
    if (!webhookStatus(notice.iyziEventType) || await hasIyzicoEvent(notice.eventId)) return null;
    const event = await this.lookupSubscription(notice.subscriptionReferenceCode, notice);
    return { ...event, eventId: notice.eventId, eventType: notice.iyziEventType };
  }

  getSubscription({ providerSubscriptionId }: Parameters<BillingProvider["getSubscription"]>[0]) {
    return this.lookupSubscription(providerSubscriptionId);
  }

  async cancelSubscription(input: Parameters<BillingProvider["cancelSubscription"]>[0]) {
    await this.changeSubscription(input.providerSubscriptionId, "cancel", "cancelled");
  }

  async resumeSubscription(input: Parameters<BillingProvider["resumeSubscription"]>[0]) {
    await this.changeSubscription(input.providerSubscriptionId, "activate", "active");
  }

  private async changeSubscription(reference: string, operation: "cancel" | "activate", status: "cancelled" | "active") {
    let event = await this.lookupSubscription(reference);
    if (event.status !== status && !(operation === "cancel" && event.status === "expired")) {
      if (operation === "activate" && event.status !== "incomplete") throw new Error("Only pending iyzico subscriptions can be activated");
      await this.request(subscriptionPath(reference) + "/" + operation, { locale: "tr", conversationId: randomUUID() });
      event = await this.lookupSubscription(reference);
      if (event.status !== status) throw new Error("iyzico subscription change is not yet reflected");
    }
    await applyIyzicoEvent({ ...event, eventType: `subscription.${operation}`, eventId: `${operation}:${reference}:${event.occurredAt}` });
  }
}

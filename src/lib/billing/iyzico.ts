import "server-only";
import { randomUUID } from "node:crypto";
import type { BillingProvider, VerifiedSubscriptionEvent } from "./provider";
import { applyIyzicoEvent, billingRpc, findIyzicoSubscription, getCheckoutAttempt, hasIyzicoEvent, listPendingCheckoutTokens, type VerifiedIyzicoEvent } from "./iyzico-store";
import { hashBillingValue, hostedCheckoutUrl, isReference, iyzicoAuthHeaders, iyzicoStatus, verifyIyzicoWebhook, webhookStatus, type readIyzicoConfig } from "./iyzico-protocol";

type Config = NonNullable<ReturnType<typeof readIyzicoConfig>>;
type Notice = NonNullable<ReturnType<typeof verifyIyzicoWebhook>>;
type ProviderOrder = { referenceCode: string; orderStatus: string; startPeriod: number; endPeriod: number };
type ProviderSubscription = {
  referenceCode: string;
  pricingPlanReferenceCode: string;
  customerReferenceCode: string;
  subscriptionStatus: string;
  orders?: ProviderOrder[];
  items?: ProviderSubscription[];
  createdDate?: number;
  startDate?: number;
  endDate?: number;
};

export class InvalidIyzicoSignatureError extends Error {}
export class IyzicoCheckoutInProgressError extends Error {}
export class IyzicoAdditionalDetailsError extends Error {
  readonly field: "phone" | "identity";

  constructor(field: "phone" | "identity") {
    super("iyzico rejected a checkout detail");
    this.field = field;
  }
}

type SubscriptionRead = { event: VerifiedIyzicoEvent; orders: ProviderOrder[] };
const checkoutVerifications = new Map<string, Promise<SubscriptionRead | "completed" | null>>();

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

  private async request<T>(path: string, payload?: Record<string, unknown>, failure?: "checkout-init" | "checkout-result") {
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
    if (!response.ok && !(failure && response.status === 400)) throw new Error("iyzico API request failed");
    const result = await response.json() as T & { status?: string; systemTime?: number; errorCode?: string | number };
    if (result?.status === "failure") {
      if (failure === "checkout-result") return null;
      if (failure === "checkout-init") {
        // iyzico's documented general validation codes.
        const code = String(result.errorCode);
        if (["25", "26", "27"].includes(code)) throw new IyzicoAdditionalDetailsError("phone");
        if (["8", "9", "10"].includes(code)) throw new IyzicoAdditionalDetailsError("identity");
      }
    }
    if (result?.status !== "success") throw new Error("iyzico API operation failed");
    return result;
  }

  async createCheckoutSession(input: Parameters<BillingProvider["createCheckoutSession"]>[0]) {
    const reference = this.config.plans[input.planId][input.interval];
    // Reconcile a previously issued form before allowing a fresh payment.
    if (await this.reconcilePendingCheckout(input.businessId)) throw new IyzicoCheckoutInProgressError();
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
      }, "checkout-init");
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

  async reconcilePendingCheckout(businessId: string) {
    const token = await billingRpc<string | null>("get_pending_iyzico_checkout", { p_business_id: businessId });
    return token ? this.completeCheckout(token) : false;
  }

  private verifyCheckout(token: string) {
    const key = `${this.config.apiUrl}:${this.config.merchantId}:${token}`;
    const inflight = checkoutVerifications.get(key);
    if (inflight) return inflight;
    const verification = this.readCheckout(token).finally(() => checkoutVerifications.delete(key));
    checkoutVerifications.set(key, verification);
    return verification;
  }

  private async readCheckout(token: string): Promise<SubscriptionRead | "completed" | null> {
    if (!isReference(token)) return null;
    const attempt = await getCheckoutAttempt(token);
    if (!attempt) return null;
    if (attempt.status === "completed") return "completed";
    const result = await this.request<{ data: ProviderSubscription; token?: string }>(
      `/v2/subscription/checkoutform/${token}`, undefined, "checkout-result");
    const checkout = result?.data;
    const status = iyzicoStatus(checkout?.subscriptionStatus);
    if (!checkout || !status || status === "incomplete" || (result.token !== undefined && result.token !== token) ||
      !isReference(checkout.customerReferenceCode) || checkout.pricingPlanReferenceCode !== attempt.plan_reference) return null;
    return this.readSubscription(checkout.referenceCode, {
      businessId: attempt.business_id, planId: attempt.plan_id, interval: attempt.billing_interval,
      planReference: attempt.plan_reference, customerId: checkout.customerReferenceCode, requirePayment: true,
    });
  }

  async completeCheckout(token: string) {
    const checkout = await this.verifyCheckout(token);
    if (!checkout) return false;
    return checkout === "completed" || this.settleCheckout(token, checkout.event);
  }

  private settleCheckout(token: string, event: VerifiedIyzicoEvent) {
    return applyIyzicoEvent({
      ...event, eventType: "subscription.checkout.completed", eventId: `checkout:${hashBillingValue(token)}`,
    }, token);
  }

  private async fetchSubscription(reference: string) {
    const result = await this.request<{ data: ProviderSubscription }>(subscriptionPath(reference));
    const data = result?.data;
    const snapshot = Array.isArray(data?.items) ? data.items.find(item => item?.referenceCode === reference) : data;
    const occurredAt = isoDate(result?.systemTime);
    if (!snapshot || snapshot.referenceCode !== reference || !isReference(snapshot.customerReferenceCode) ||
      !isReference(snapshot.pricingPlanReferenceCode) || !occurredAt) throw new Error("Invalid iyzico subscription snapshot");
    return { snapshot, occurredAt };
  }

  private async readSubscription(reference: string, target: Pick<VerifiedSubscriptionEvent, "businessId" | "planId" | "interval"> & {
    planReference: string; customerId?: string | null; previousStart?: string | null; previousEnd?: string | null; requirePayment?: boolean;
  }): Promise<SubscriptionRead> {
    const { snapshot, occurredAt } = await this.fetchSubscription(reference);
    const status = iyzicoStatus(snapshot.subscriptionStatus);
    if (snapshot.pricingPlanReferenceCode !== target.planReference ||
      (target.customerId && snapshot.customerReferenceCode !== target.customerId) || !status || status === "free") {
      throw new Error("Invalid iyzico subscription snapshot");
    }

    const orders = Array.isArray(snapshot.orders) ? snapshot.orders.filter(order =>
      order && isoDate(order.startPeriod) && isoDate(order.endPeriod) && order.endPeriod > order.startPeriod
    ).sort((a, b) => b.startPeriod - a.startPeriod) : [];
    const paid = orders.find(order => order.orderStatus === "SUCCESS" && order.startPeriod <= Date.parse(occurredAt));
    const latest = orders.find(order => order.startPeriod <= Date.parse(occurredAt) && ["FAILED", "SUCCESS"].includes(order.orderStatus));
    const effectiveStatus = status === "active" && latest?.orderStatus === "FAILED" ? "past_due" : status;
    const periodStart = paid ? isoDate(paid.startPeriod) : target.previousStart ?? isoDate(orders[0]?.startPeriod ?? snapshot.startDate);
    const periodEnd = paid ? isoDate(paid.endPeriod) : target.previousEnd ?? isoDate(orders[0]?.endPeriod ?? snapshot.endDate);
    if (!periodStart || !periodEnd || Date.parse(periodEnd) <= Date.parse(periodStart) ||
      (target.requirePayment && (!paid || effectiveStatus === "incomplete")) ||
      (effectiveStatus === "active" && !paid) ||
      (effectiveStatus === "past_due" && !paid && !target.previousEnd)) throw new Error("Missing verified iyzico billing period");
    return { orders, event: {
      provider: this.id, eventId: `snapshot:${reference}:${occurredAt}`, eventType: "subscription.snapshot",
      businessId: target.businessId, planId: target.planId, interval: target.interval,
      status: effectiveStatus, providerCustomerId: snapshot.customerReferenceCode, providerSubscriptionId: reference,
      currentPeriodStart: periodStart, currentPeriodEnd: periodEnd, cancelAtPeriodEnd: false,
      occurredAt, planReference: target.planReference,
      payloadHash: hashBillingValue(JSON.stringify([reference, target.planReference, snapshot.customerReferenceCode, effectiveStatus, periodStart, periodEnd])),
    } };
  }

  private async readLocalSubscription(reference: string, local: NonNullable<Awaited<ReturnType<typeof findIyzicoSubscription>>>) {
    if (local.plan_id === "free" || !local.billing_interval) throw new Error("Unknown iyzico subscription");
    const planReference = await billingRpc<string | null>("get_iyzico_subscription_plan", { p_subscription_id: reference }) ??
      this.config.plans[local.plan_id][local.billing_interval];
    return this.readSubscription(reference, {
      businessId: local.business_id, planId: local.plan_id, interval: local.billing_interval, planReference,
      customerId: local.provider_customer_id,
      previousStart: local.current_period_start, previousEnd: local.current_period_end,
    });
  }

  private async reconcileWebhook(notice: Notice) {
    const reference = notice.subscriptionReferenceCode;
    const { snapshot } = await this.fetchSubscription(reference);
    if (snapshot.customerReferenceCode !== notice.customerReferenceCode) throw new Error("Invalid iyzico subscription customer");
    let cursor = "";
    for (;;) {
      const tokens = await listPendingCheckoutTokens(snapshot.pricingPlanReferenceCode, isoDate(snapshot.createdDate), cursor);
      if (!tokens.length) break;
      const candidates = await Promise.allSettled(tokens.map(token => this.verifyCheckout(token)));
      for (const [index, result] of candidates.entries()) {
        if (result.status !== "fulfilled" || !result.value || result.value === "completed") continue;
        const checkout = result.value;
        if (checkout.event.providerSubscriptionId !== reference ||
          checkout.event.providerCustomerId !== notice.customerReferenceCode ||
          checkout.event.planReference !== snapshot.pricingPlanReferenceCode) continue;
        this.assertWebhookReady(notice, checkout);
        if (await this.settleCheckout(tokens[index], checkout.event)) return checkout;
      }
      cursor = tokens[tokens.length - 1];
    }
    // Another request may have settled the checkout while the webhook was looking it up.
    const local = await findIyzicoSubscription(reference);
    if (local) return this.readLocalSubscription(reference, local);
    throw new Error("Unknown iyzico subscription");
  }

  private assertWebhookReady(notice: Notice, { event, orders }: SubscriptionRead) {
    if (event.providerCustomerId !== notice.customerReferenceCode) throw new Error("Invalid iyzico subscription customer");
    const expected = webhookStatus(notice.iyziEventType);
    if (notice.iyziEventType.startsWith("subscription.order.")) {
      const order = orders.find(item => item.referenceCode === notice.orderReferenceCode);
      if (order?.orderStatus !== (expected === "past_due" ? "FAILED" : "SUCCESS")) {
        throw new Error("iyzico order result is not ready");
      }
      // A historical renewal can arrive after the subscription has recovered.
      return;
    }
    if (expected !== "active" && event.status !== expected) throw new Error("iyzico subscription change is not yet reflected");
  }

  async handleWebhook(input: Parameters<BillingProvider["handleWebhook"]>[0]) {
    const body: Record<string, unknown> = JSON.parse(new TextDecoder().decode(input.body));
    const notice = verifyIyzicoWebhook(body, input.headers.get("X-IYZ-SIGNATURE-V3"), this.config.merchantId, this.config.secretKey);
    if (!notice) throw new InvalidIyzicoSignatureError();
    if (!webhookStatus(notice.iyziEventType) || await hasIyzicoEvent(notice.eventId)) return null;
    const reference = notice.subscriptionReferenceCode;
    const local = await findIyzicoSubscription(reference);
    const subscription = local ? await this.readLocalSubscription(reference, local) : await this.reconcileWebhook(notice);
    this.assertWebhookReady(notice, subscription);
    const { event } = subscription;
    return { ...event, eventId: notice.eventId, eventType: notice.iyziEventType };
  }

  async getSubscription({ providerSubscriptionId }: Parameters<BillingProvider["getSubscription"]>[0]) {
    const local = await findIyzicoSubscription(providerSubscriptionId);
    if (!local) throw new Error("Unknown iyzico subscription");
    return (await this.readLocalSubscription(providerSubscriptionId, local)).event;
  }

  async cancelSubscription(input: Parameters<BillingProvider["cancelSubscription"]>[0]) {
    await this.changeSubscription(input.providerSubscriptionId, "cancel", "cancelled");
  }

  async resumeSubscription(input: Parameters<BillingProvider["resumeSubscription"]>[0]) {
    await this.changeSubscription(input.providerSubscriptionId, "activate", "active");
  }

  private async changeSubscription(reference: string, operation: "cancel" | "activate", status: "cancelled" | "active") {
    let event = await this.getSubscription({ providerSubscriptionId: reference });
    if (event.status !== status && !(operation === "cancel" && event.status === "expired")) {
      if (operation === "activate" && event.status !== "incomplete") throw new Error("Only pending iyzico subscriptions can be activated");
      await this.request(subscriptionPath(reference) + "/" + operation, { locale: "tr", conversationId: randomUUID() });
      event = await this.getSubscription({ providerSubscriptionId: reference });
      if (event.status !== status) throw new Error("iyzico subscription change is not yet reflected");
    }
    await applyIyzicoEvent({ ...event, eventType: `subscription.${operation}`, eventId: `${operation}:${reference}:${event.occurredAt}` });
  }
}

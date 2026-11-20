import "server-only";
import { randomUUID } from "node:crypto";
import type { BillingDetails } from "./provider";
import { applyEntryPayment, billingRpc, getCheckoutAttempt, type VerifiedEntryPayment } from "./iyzico-store";
import { ENTRY_FEE_PERIOD_END, ENTRY_FEE_PLAN_REFERENCE, ENTRY_FEE_PRICE } from "./catalog";
import { entryBasketId, hashBillingValue, hostedCheckoutUrl, isReference, iyzicoAuthHeaders, verifyCheckoutFormWebhook, verifyEntryPayment, type CheckoutFormResult, type readIyzicoConfig } from "./iyzico-protocol";

type Config = NonNullable<ReturnType<typeof readIyzicoConfig>>;

export class InvalidIyzicoSignatureError extends Error {}
export class IyzicoCheckoutInProgressError extends Error {}
export class IyzicoAdditionalDetailsError extends Error {
  readonly field: "phone" | "identity";

  constructor(field: "phone" | "identity") {
    super("iyzico rejected a checkout detail");
    this.field = field;
  }
}

const checkoutVerifications = new Map<string, Promise<boolean>>();

// iyzico Checkout Form: https://docs.iyzico.com/en/payment-methods/checkoutform
export class IyzicoBillingProvider {
  readonly id = "iyzico";
  readonly appUrl: string;
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
    this.appUrl = config.appUrl;
  }

  private async request<T>(path: string, payload: Record<string, unknown>, failure: "checkout-init" | "checkout-result") {
    const body = JSON.stringify(payload);
    const response = await fetch(this.config.apiUrl + path, {
      method: "POST",
      headers: { ...iyzicoAuthHeaders(this.config.apiKey, this.config.secretKey, randomUUID(), path, body),
        "Content-Type": "application/json" },
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok && response.status !== 400) throw new Error("iyzico API request failed");
    const result = await response.json() as T & { status?: string; errorCode?: string | number };
    if (result?.status === "failure") {
      if (failure === "checkout-result") return null;
      // iyzico's documented general validation codes.
      const code = String(result.errorCode);
      if (["25", "26", "27"].includes(code)) throw new IyzicoAdditionalDetailsError("phone");
      if (["8", "9", "10"].includes(code)) throw new IyzicoAdditionalDetailsError("identity");
    }
    if (result?.status !== "success") throw new Error("iyzico API operation failed");
    return result;
  }

  async createEntryCheckout(input: { businessId: string; billingDetails: BillingDetails; ip?: string }) {
    // Settle a previously issued form before allowing a fresh payment.
    if (await this.reconcilePendingCheckout(input.businessId)) throw new IyzicoCheckoutInProgressError();
    const { city, address, ...buyer } = input.billingDetails;
    const basketId = entryBasketId(input.businessId);
    const result = await this.request<{ token: unknown; paymentPageUrl?: unknown; tokenExpireTime?: number }>(
      "/payment/iyzipos/checkoutform/initialize/auth/ecom", {
        locale: "tr",
        conversationId: basketId,
        price: ENTRY_FEE_PRICE,
        paidPrice: ENTRY_FEE_PRICE,
        currency: "TRY",
        basketId,
        paymentGroup: "PRODUCT",
        callbackUrl: this.appUrl + "/api/billing/iyzico/callback",
        enabledInstallments: [1],
        buyer: { id: input.businessId, ...buyer, registrationAddress: address, city, country: "Turkey",
          ...(input.ip ? { ip: input.ip } : {}) },
        billingAddress: { contactName: `${buyer.name} ${buyer.surname}`, city, country: "Turkey", address },
        basketItems: [{ id: ENTRY_FEE_PLAN_REFERENCE, name: "KaçaYapayım Usta Üyelik", category1: "Üyelik",
          itemType: "VIRTUAL", price: ENTRY_FEE_PRICE }],
      }, "checkout-init");
    if (!isReference(result?.token)) throw new Error("Missing iyzico checkout token");
    const url = hostedCheckoutUrl(this.config.mode, result.token, result.paymentPageUrl);
    const ttl = result.tokenExpireTime ?? 1800;
    if (!Number.isSafeInteger(ttl) || ttl <= 0 || ttl > 86400) throw new Error("Invalid iyzico token lifetime");
    const savedUrl = await billingRpc<string | null>("save_iyzico_checkout", {
      p_business_id: input.businessId, p_token: result.token, p_plan_id: "pro", p_interval: "once",
      p_plan_reference: ENTRY_FEE_PLAN_REFERENCE, p_payment_url: url,
      p_expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
    });
    if (!savedUrl) throw new IyzicoCheckoutInProgressError();
    return { url: savedUrl };
  }

  async reconcilePendingCheckout(businessId: string) {
    const token = await billingRpc<string | null>("get_pending_iyzico_checkout", { p_business_id: businessId });
    return token ? this.completeCheckout(token) : false;
  }

  // Retrieves the payment from iyzico and activates only a verified, exact entry-fee payment.
  completeCheckout(token: string) {
    if (!isReference(token)) return Promise.resolve(false);
    const key = `${this.config.apiUrl}:${this.config.merchantId}:${token}`;
    const inflight = checkoutVerifications.get(key);
    if (inflight) return inflight;
    const verification = this.verifyAndActivate(token).finally(() => checkoutVerifications.delete(key));
    checkoutVerifications.set(key, verification);
    return verification;
  }

  private async verifyAndActivate(token: string) {
    const attempt = await getCheckoutAttempt(token);
    if (!attempt || attempt.plan_id !== "pro" || attempt.billing_interval !== "once" ||
      attempt.plan_reference !== ENTRY_FEE_PLAN_REFERENCE) return false;
    if (attempt.status === "completed") return true;
    const result = await this.request<CheckoutFormResult>("/payment/iyzipos/checkoutform/auth/ecom/detail",
      { locale: "tr", conversationId: entryBasketId(attempt.business_id), token }, "checkout-result");
    const paymentId = verifyEntryPayment(result, token, attempt.business_id);
    if (!paymentId) return false;
    const now = new Date().toISOString();
    const event: VerifiedEntryPayment = {
      businessId: attempt.business_id, eventId: `entry:${paymentId}`, eventType: "entry_fee.paid", planId: "pro",
      status: "active", providerSubscriptionId: paymentId, currentPeriodStart: now,
      currentPeriodEnd: ENTRY_FEE_PERIOD_END, occurredAt: now,
      payloadHash: hashBillingValue(JSON.stringify([token, paymentId, attempt.business_id, ENTRY_FEE_PRICE])),
    };
    return applyEntryPayment(event, token);
  }

  // The signed webhook only says "look at this token"; the payment is always re-read from iyzico.
  async handleWebhook(body: Record<string, unknown>, signature: string | null) {
    const notice = verifyCheckoutFormWebhook(body, signature, this.config.secretKey);
    if (!notice) throw new InvalidIyzicoSignatureError();
    if (notice.status !== "SUCCESS") return false;
    return this.completeCheckout(notice.token);
  }
}

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { ENTRY_FEE_KURUS } from "./catalog.ts";

export function readIyzicoConfig(env: Record<string, string | undefined>) {
  const mode = env.IYZICO_ENV;
  const production = env.DEPLOYMENT_ENV === "production" || env.VERCEL_ENV === "production" ||
    (env.NODE_ENV === "production" && env.VERCEL_ENV !== "preview" && env.DEPLOYMENT_ENV !== "staging");
  if (env.BILLING_PROVIDER !== "iyzico" || (mode !== "sandbox" && mode !== "production") ||
    (mode === "sandbox" && production)) return null;
  const apiKey = env.IYZICO_API_KEY?.trim();
  const secretKey = env.IYZICO_SECRET_KEY?.trim();
  const merchantId = env.IYZICO_MERCHANT_ID?.trim();
  const app = parseHttpsUrl(env.APP_URL);
  if (!apiKey || !secretKey || !merchantId || !app) return null;
  return {
    apiKey, secretKey, merchantId, mode, appUrl: app.origin,
    apiUrl: mode === "sandbox" ? "https://sandbox-api.iyzipay.com" : "https://api.iyzipay.com",
  } as const;
}

export function isReference(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

function parseHttpsUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url : null;
  } catch { return null; }
}

export function hostedCheckoutUrl(mode: "sandbox" | "production", token: string, paymentPageUrl: unknown) {
  const prefix = mode === "sandbox" ? "sandbox-" : "";
  const hosted = new URL(`https://${prefix}cpp.iyzipay.com`);
  if (paymentPageUrl !== undefined && paymentPageUrl !== null && paymentPageUrl !== "") {
    const url = parseHttpsUrl(paymentPageUrl);
    if (!url || ![hosted.origin, `https://${prefix}api.iyzipay.com`, `https://${prefix}ode.iyzico.com`].includes(url.origin)) {
      throw new Error("Unexpected iyzico checkout URL");
    }
    return url.href;
  }
  hosted.searchParams.set("token", token);
  hosted.searchParams.set("lang", "tr");
  return hosted.href;
}

export function iyzicoAuthHeaders(apiKey: string, secretKey: string, rnd: string, uriPath: string, body = "") {
  const signature = createHmac("sha256", secretKey).update(rnd + uriPath.split("?")[0] + body).digest("hex");
  const auth = Buffer.from(`apiKey:${apiKey}&randomKey:${rnd}&signature:${signature}`).toString("base64");
  return { authorization: `IYZWSv2 ${auth}`, "x-iyzi-rnd": rnd };
}

// iyzico Checkout Form (HPP) webhook, header X-IYZ-SIGNATURE-V3:
// hex(HMAC-SHA256(secretKey, secretKey + iyziEventType + iyziPaymentId + token + paymentConversationId + status)).
// https://docs.iyzico.com/en/advanced/webhook
export function verifyCheckoutFormWebhook(body: Record<string, unknown>, signature: string | null, secretKey: string) {
  const { iyziEventType, token, paymentConversationId, status } = body;
  const iyziPaymentId = typeof body.iyziPaymentId === "number" ? String(body.iyziPaymentId) : body.iyziPaymentId;
  if (!signature || !/^[a-f\d]{64}$/i.test(signature) || typeof iyziEventType !== "string" ||
    !/^[A-Za-z_.]{1,128}$/.test(iyziEventType) || typeof iyziPaymentId !== "string" || !/^\d{1,20}$/.test(iyziPaymentId) ||
    !isReference(token) || typeof paymentConversationId !== "string" || paymentConversationId.length > 128 ||
    typeof status !== "string" || !/^[A-Za-z_]{1,32}$/.test(status)) return null;
  const message = secretKey + iyziEventType + iyziPaymentId + token + paymentConversationId + status;
  const expected = createHmac("sha256", secretKey).update(message).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) return null;
  return { iyziEventType, iyziPaymentId, token, paymentConversationId, status };
}

export function hashBillingValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function entryBasketId(businessId: string) {
  return `entry-${businessId}`;
}

export type CheckoutFormResult = {
  status?: unknown; paymentStatus?: unknown; paidPrice?: unknown; price?: unknown; currency?: unknown;
  basketId?: unknown; conversationId?: unknown; paymentId?: unknown; token?: unknown;
};

function kurus(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" && /^\d+(\.\d{1,2})?$/.test(value) ? Number(value) : NaN;
  return Number.isFinite(number) ? Math.round(number * 100) : NaN;
}

// Never trust the redirect: a payment counts only if iyzico itself reports exactly the entry fee.
export function verifyEntryPayment(result: CheckoutFormResult | null | undefined, token: string, businessId: string) {
  if (!result || result.status !== "success" || result.paymentStatus !== "SUCCESS" || result.currency !== "TRY" ||
    kurus(result.paidPrice) !== ENTRY_FEE_KURUS || kurus(result.price) !== ENTRY_FEE_KURUS ||
    result.basketId !== entryBasketId(businessId) || result.conversationId !== entryBasketId(businessId) ||
    (result.token !== undefined && result.token !== token)) return null;
  const paymentId = String(result.paymentId ?? "");
  return /^\d{1,20}$/.test(paymentId) ? paymentId : null;
}

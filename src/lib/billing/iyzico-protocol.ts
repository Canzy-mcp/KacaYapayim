import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { BillingInterval } from "./provider";
import type { SubscriptionStatus } from "@/types/database";

const planKeys = {
  usta: { monthly: "IYZICO_PLAN_USTA_MONTHLY", yearly: "IYZICO_PLAN_USTA_YEARLY" },
  pro: { monthly: "IYZICO_PLAN_PRO_MONTHLY", yearly: "IYZICO_PLAN_PRO_YEARLY" },
} as const;

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
  const plans = {
    usta: { monthly: env[planKeys.usta.monthly]?.trim(), yearly: env[planKeys.usta.yearly]?.trim() },
    pro: { monthly: env[planKeys.pro.monthly]?.trim(), yearly: env[planKeys.pro.yearly]?.trim() },
  };
  const codes = [...Object.values(plans.usta), ...Object.values(plans.pro)];
  if (!apiKey || !secretKey || !merchantId || !app || codes.some(code => !isReference(code)) ||
    new Set(codes).size !== codes.length) return null;
  return {
    apiKey, secretKey, merchantId, mode, appUrl: app.origin,
    apiUrl: mode === "sandbox" ? "https://sandbox-api.iyzipay.com" : "https://api.iyzipay.com",
    plans: plans as Record<keyof typeof planKeys, Record<BillingInterval, string>>,
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

export function verifyIyzicoWebhook(body: Record<string, unknown>, signature: string | null, merchantId: string, secretKey: string) {
  const { iyziEventType, subscriptionReferenceCode, customerReferenceCode } = body;
  const orderReferenceCode = body.orderReferenceCode ?? "";
  if (!signature || !/^[a-f\d]{64}$/i.test(signature) || typeof iyziEventType !== "string" ||
    !/^[a-z.]{1,128}$/.test(iyziEventType) || !isReference(subscriptionReferenceCode) ||
    !isReference(customerReferenceCode) ||
    !(isReference(orderReferenceCode) || (orderReferenceCode === "" && !iyziEventType.startsWith("subscription.order.")))) return null;
  const fields = [iyziEventType, subscriptionReferenceCode, orderReferenceCode, customerReferenceCode];
  const expected = createHmac("sha256", secretKey).update(merchantId + secretKey + fields.join("")).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, "hex"))) return null;
  // The provider's notification ID and timestamp are outside the signed fields.
  const eventId = `webhook:${hashBillingValue(fields.join(""))}`;
  return { eventId, iyziEventType, subscriptionReferenceCode, orderReferenceCode, customerReferenceCode };
}

export function hashBillingValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function webhookStatus(eventType: string): SubscriptionStatus | null {
  switch (eventType) {
    case "subscription.order.success":
    case "subscription.activate":
    case "subscription.activated": return "active";
    case "subscription.order.failure": return "past_due";
    case "subscription.cancel":
    case "subscription.cancelled":
    case "subscription.canceled": return "cancelled";
    case "subscription.expired": return "expired";
    default: return null;
  }
}

export function iyzicoStatus(value: unknown): SubscriptionStatus | null {
  switch (value) {
    case "ACTIVE": return "active";
    case "UNPAID": return "past_due";
    case "CANCELED":
    case "CANCELLED": return "cancelled";
    case "EXPIRED":
    case "UPGRADED": return "expired";
    case "PENDING": return "incomplete";
    default: return null;
  }
}

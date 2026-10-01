"use server";
import { logFailure } from "@/lib/observability/log";

import { requireCompletedViewer } from "@/lib/viewer";
import { createClient } from "@/lib/supabase/server";
import { BillingProviderUnavailableError, getBillingProvider, type BillingInterval } from "@/lib/billing/provider";
import type { PlanId } from "@/types/database";
import { consumeRateLimit } from "@/lib/security/rate-limit";

type Result = { ok: true; url: string } | { ok: false; error: string };
function providerError(error: unknown): Result {
  if (error instanceof BillingProviderUnavailableError) return { ok: false, error: error.message };
  logFailure("Billing provider operation failed");
  return { ok: false, error: "Ödeme işlemi başlatılamadı. Lütfen daha sonra tekrar dene." };
}

export async function startCheckout(planId: PlanId, interval: BillingInterval): Promise<Result> {
  if (!await consumeRateLimit("billing-checkout", 8, 300)) return { ok: false, error: "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene." };
  const viewer = await requireCompletedViewer();
  if (!(["usta", "pro"] as string[]).includes(planId) || !["monthly", "yearly"].includes(interval))
    return { ok: false, error: "Paket veya ödeme dönemi geçersiz." };
  const supabase = await createClient();
  const { data: plan, error } = await supabase.from("plans").select("*").eq("id", planId).eq("is_active", true).single();
  if (error || !plan) return { ok: false, error: "Paket bulunamadı." };
  const canonicalPrice = interval === "monthly" ? plan.monthly_price_kurus : plan.yearly_price_kurus;
  if (canonicalPrice <= 0 || plan.currency !== "TRY") return { ok: false, error: "Paket fiyatı kullanılamıyor." };
  const base = process.env.APP_URL;
  if (!base) return { ok: false, error: "Uygulama adresi ayarlanmamış." };
  try {
    const provider = getBillingProvider();
    const session = await provider.createCheckoutSession({ businessId: viewer.business!.id,
      planId: planId as Exclude<PlanId, "free">, interval, amountKurus: canonicalPrice, currency: "TRY",
      successUrl: `${base}/billing/success`, cancelUrl: `${base}/billing/cancel` });
    if (!session.url.startsWith("https://")) throw new Error("Invalid checkout URL");
    return { ok: true, url: session.url };
  } catch (providerFailure) { return providerError(providerFailure); }
}

export async function openBillingPortal(): Promise<Result> {
  const viewer = await requireCompletedViewer();
  const base = process.env.APP_URL;
  if (!base) return { ok: false, error: "Uygulama adresi ayarlanmamış." };
  try {
    const session = await getBillingProvider().createCustomerPortal({ businessId: viewer.business!.id, returnUrl: `${base}/billing` });
    if (!session.url.startsWith("https://")) throw new Error("Invalid portal URL");
    return { ok: true, url: session.url };
  } catch (providerFailure) { return providerError(providerFailure); }
}

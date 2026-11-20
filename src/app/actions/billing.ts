"use server";
import { logFailure } from "@/lib/observability/log";

import { requireCompletedViewer } from "@/lib/viewer";
import { createClient } from "@/lib/supabase/server";
import { BillingProviderUnavailableError, getBillingProvider, type BillingInterval } from "@/lib/billing/provider";
import { IyzicoAdditionalDetailsError, IyzicoCheckoutInProgressError } from "@/lib/billing/iyzico";
import type { PlanId } from "@/types/database";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { revalidatePath } from "next/cache";
import { readBillingDetails } from "@/lib/billing/details";

type Result = { ok: true; url: string } | { ok: false; error: string };
function providerError(error: unknown, message: string): Extract<Result, { ok: false }> {
  if (error instanceof BillingProviderUnavailableError) return { ok: false, error: error.message };
  if (error instanceof IyzicoCheckoutInProgressError) {
    return { ok: false, error: "Bu işletmenin açık bir ödeme oturumu veya aboneliği var. Lütfen paket durumunu kontrol et." };
  }
  if (error instanceof IyzicoAdditionalDetailsError) {
    return { ok: false, error: "iyzico ödeme formunu açamadı. Cep telefonu ve TCKN veya VKN alanlarını doldurup tekrar dene." };
  }
  logFailure("Billing provider operation failed");
  return { ok: false, error: message };
}

export async function startCheckout(planId: PlanId, interval: BillingInterval, details: FormData): Promise<Result> {
  if (!await consumeRateLimit("billing-checkout", 8, 300)) return { ok: false, error: "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene." };
  const viewer = await requireCompletedViewer();
  if (viewer.business?.owner_id !== viewer.id) return { ok: false, error: "Ödemeyi işletme sahibi başlatabilir." };
  if ((planId !== "usta" && planId !== "pro") || (interval !== "monthly" && interval !== "yearly")) {
    return { ok: false, error: "Paket veya ödeme dönemi geçersiz." };
  }
  const billingDetails = details instanceof FormData ? readBillingDetails(details) : null;
  if (!billingDetails) return { ok: false, error: "Fatura bilgilerini kontrol edip tekrar dene." };
  const supabase = await createClient();
  const { data: plan, error } = await supabase.from("plans").select("*").eq("id", planId).eq("is_active", true).single();
  if (error || !plan) return { ok: false, error: "Paket bulunamadı." };
  const canonicalPrice = interval === "monthly" ? plan.monthly_price_kurus : plan.yearly_price_kurus;
  if (canonicalPrice <= 0 || plan.currency !== "TRY") return { ok: false, error: "Paket fiyatı kullanılamıyor." };
  try {
    const provider = getBillingProvider();
    const session = await provider.createCheckoutSession({ businessId: viewer.business.id,
      planId, interval, amountKurus: canonicalPrice, currency: "TRY", billingDetails,
      successUrl: `${provider.appUrl}/billing/success`, cancelUrl: `${provider.appUrl}/billing/cancel` });
    return { ok: true, url: session.url };
  } catch (providerFailure) {
    return providerError(providerFailure, "Ödeme işlemi başlatılamadı. Lütfen daha sonra tekrar dene.");
  }
}

export async function openBillingPortal(): Promise<Result> {
  await requireCompletedViewer();
  try {
    const session = await getBillingProvider().createCustomerPortal();
    return { ok: true, url: session.url };
  } catch (providerFailure) {
    return providerError(providerFailure, "Abonelik yönetimi açılamadı.");
  }
}

export async function cancelBillingSubscription(confirmed: boolean): Promise<{ ok: true } | Extract<Result, { ok: false }>> {
  const viewer = await requireCompletedViewer();
  if (viewer.business?.owner_id !== viewer.id) return { ok: false, error: "Aboneliği işletme sahibi iptal edebilir." };
  if (confirmed !== true) return { ok: false, error: "Aboneliği iptal etmek için işlemi onayla." };
  if (!await consumeRateLimit("billing-cancel", 8, 300)) return { ok: false, error: "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene." };
  const supabase = await createClient();
  const { data: subscription, error } = await supabase.from("subscriptions")
    .select("provider,provider_subscription_id").eq("business_id", viewer.business.id).maybeSingle();
  if (error || subscription?.provider !== "iyzico" || !subscription.provider_subscription_id) {
    return { ok: false, error: "İptal edilebilir bir abonelik bulunamadı." };
  }
  try {
    await getBillingProvider().cancelSubscription({ providerSubscriptionId: subscription.provider_subscription_id });
    revalidatePath("/billing");
    return { ok: true };
  } catch (providerFailure) {
    return providerError(providerFailure, "Abonelik iptali doğrulanamadı. Birkaç dakika sonra durumunu kontrol et.");
  }
}

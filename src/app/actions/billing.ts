"use server";
import { headers } from "next/headers";
import { logFailure } from "@/lib/observability/log";
import { requireCompletedViewer } from "@/lib/viewer";
import { BillingProviderUnavailableError, getBillingProvider } from "@/lib/billing/provider";
import { IyzicoAdditionalDetailsError, IyzicoCheckoutInProgressError } from "@/lib/billing/iyzico";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { readBillingDetails } from "@/lib/billing/details";

type Result = { ok: true; url: string } | { ok: false; error: string };
function providerError(error: unknown, message: string): Extract<Result, { ok: false }> {
  if (error instanceof BillingProviderUnavailableError) return { ok: false, error: error.message };
  if (error instanceof IyzicoCheckoutInProgressError) {
    return { ok: false, error: "Bu işletmenin açık bir ödeme oturumu veya aktif üyeliği var. Lütfen üyelik durumunu kontrol et." };
  }
  if (error instanceof IyzicoAdditionalDetailsError) {
    return { ok: false, error: error.field === "phone"
      ? "Cep telefonu numaranı kontrol edip tekrar dene."
      : "TCKN veya VKN bilgini kontrol edip tekrar dene." };
  }
  logFailure("Billing provider operation failed");
  return { ok: false, error: message };
}

// The price is the server constant ENTRY_FEE_KURUS; nothing about the amount comes from the client.
export async function startEntryCheckout(details: FormData): Promise<Result> {
  if (!await consumeRateLimit("billing-checkout", 8, 300)) return { ok: false, error: "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene." };
  const viewer = await requireCompletedViewer();
  if (viewer.business?.owner_id !== viewer.id) return { ok: false, error: "Ödemeyi işletme sahibi başlatabilir." };
  const billingDetails = details instanceof FormData ? readBillingDetails(details) : null;
  if (!billingDetails) return { ok: false, error: "Fatura bilgilerini kontrol edip tekrar dene." };
  try {
    const provider = getBillingProvider();
    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0].trim() || undefined;
    const session = await provider.createEntryCheckout({ businessId: viewer.business.id, billingDetails, ip });
    return { ok: true, url: session.url };
  } catch (providerFailure) {
    return providerError(providerFailure, "Ödeme işlemi başlatılamadı. Lütfen daha sonra tekrar dene.");
  }
}

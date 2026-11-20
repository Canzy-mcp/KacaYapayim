"use server";
import { logFailure } from "@/lib/observability/log";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { isJobId } from "@/lib/jobs/service";
import { isQuoteId } from "@/lib/quotes/service";
import { todayInIstanbul } from "@/lib/quotes/defaults";
import { recordEvent } from "@/lib/analytics/events";
import { isCalendarDate } from "@kacayapayim/core/professions/schema";

export type QuoteSaveInput = {
  quoteId: string | null; jobId: string; status: "draft" | "ready";
  title: string; description: string; items: Array<{ name: string; description: string }>;
  exclusions: string[]; duration: string; paymentTerms: string; validUntil: string; notes: string;
  salePrice: number | null; acknowledgeRisk?: boolean; taxMode?: "unspecified" | "included" | "excluded";taxRate?:number|null;
};
export type QuoteSaveResult = { ok: true; id: string } | { ok: false; error: string; field?: string; needsConfirmation?: boolean; needsUpgrade?: boolean };

export async function saveQuote(input: QuoteSaveInput): Promise<QuoteSaveResult> {
  const viewer = await requireCompletedViewer();
  if (!isJobId(input.jobId) || input.quoteId && !isQuoteId(input.quoteId)) return { ok: false, error: "İş veya teklif bulunamadı." };
  if (input.status !== "draft" && input.status !== "ready") return { ok: false, error: "Teklif durumu geçersiz." };
  if (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 160)
    return { ok: false, error: "Teklif başlığını gir.", field: "title" };
  if (typeof input.description !== "string" || input.description.length > 2000 ||
      typeof input.duration !== "string" || input.duration.length > 160 ||
      typeof input.paymentTerms !== "string" || input.paymentTerms.length > 1000 ||
      typeof input.notes !== "string" || input.notes.length > 2000)
    return { ok: false, error: "Teklif metinlerini kontrol et." };
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 30 ||
      input.items.some((item) => !item || typeof item.name !== "string" || !item.name.trim() ||
        item.name.trim().length > 160 || typeof item.description !== "string" || item.description.length > 1000))
    return { ok: false, error: "En az bir geçerli kapsam maddesi ekle.", field: "items" };
  if (!Array.isArray(input.exclusions) || input.exclusions.length > 20 ||
      input.exclusions.some((item) => typeof item !== "string" || !item.trim() || item.trim().length > 500))
    return { ok: false, error: "Hariç tutulan işleri kontrol et.", field: "exclusions" };
  if (!isCalendarDate(input.validUntil))
    return { ok: false, error: "Geçerli bir tarih gir.", field: "validUntil" };
  if (input.validUntil < todayInIstanbul())
    return { ok: false, error: "Geçerlilik tarihi geçmiş bir tarih olamaz.", field: "validUntil" };
  if (input.salePrice !== null && (!Number.isFinite(input.salePrice) || input.salePrice < 0 ||
      input.salePrice > 99999999999999.99 || Math.abs(Math.round(input.salePrice * 100) - input.salePrice * 100) > 1e-6))
    return { ok: false, error: "Teklif fiyatını kontrol et.", field: "salePrice" };
  if (input.taxMode && !["unspecified","included","excluded"].includes(input.taxMode)) return {ok:false,error:"KDV durumunu kontrol et."};
  if(input.taxRate!=null&&(!Number.isFinite(input.taxRate)||input.taxRate<0||input.taxRate>100||Math.abs(input.taxRate*100-Math.round(input.taxRate*100))>1e-6))return {ok:false,error:"KDV oranını kontrol et."};
  const supabase = await createClient();
  if (input.status === "ready") {
    const { data: job, error } = await supabase.from("jobs").select("accepted_quote_id")
      .eq("id", input.jobId).eq("business_id", viewer.business!.id).maybeSingle();
    if (error || !job) return { ok: false, error: "İş bulunamadı." };
    if (job.accepted_quote_id) return { ok: false, error: "Bu iş için bir teklif zaten kabul edildi." };
  }
  const { data: id, error } = await supabase.rpc("save_quote_with_tax_rate", {
    p_tax_rate: input.taxRate??null,
    p_tax_mode: input.taxMode || "unspecified", p_quote_id: input.quoteId, p_job_id: input.jobId, p_status: input.status,
    p_title: input.title.trim(), p_description: input.description.trim() || null,
    p_items: input.items.map((item) => ({ name: item.name.trim(), description: item.description.trim() })),
    p_exclusions: input.exclusions.map((item) => item.trim()),
    p_duration: input.duration.trim() || null, p_payment_terms: input.paymentTerms.trim() || null,
    p_valid_until: input.validUntil, p_notes: input.notes.trim() || null,
    p_sale_price: input.quoteId ? input.salePrice : null, p_acknowledge_risk: Boolean(input.acknowledgeRisk),
  });
  if (error || !id) {
    logFailure("Quote save failed");
    const message = error?.message || "";
    if (message.includes("Job already accepted")) return { ok: false, error: "Bu iş için bir teklif zaten kabul edildi." };
    if (message.includes("BILLING_QUOTE_LIMIT")) return { ok: false, error: "Bu ayki teklif hakkını kullandın. Yeni teklif için paketini yükseltebilirsin.", needsUpgrade: true };
    if (message.includes("Pricing risk confirmation required")) return { ok: false, error: "Bu fiyatı onaylaman gerekiyor.", needsConfirmation: true };
    if (message.includes("Customer or price missing")) return { ok: false, error: "Teklifi hazırlamak için müşteri ve geçerli bir fiyat gerekli." };
    if (message.includes("Job price missing")) return { ok: false, error: "Önce iş fiyatını kaydetmelisin." };
    return { ok: false, error: input.quoteId ? "Teklif kaydedilemedi." : "Teklif oluşturulamadı." };
  }
  revalidatePath("/quotes"); revalidatePath(`/quotes/${id}`); revalidatePath(`/jobs/${input.jobId}`);
  revalidatePath("/dashboard");
  if (!input.quoteId) await recordEvent("quote_created", "/quotes");
  return { ok: true, id };
}

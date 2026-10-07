"use server";
import { requireCompletedViewer } from "@/lib/viewer";
import { createClient } from "@/lib/supabase/server";
import { isJobId } from "@/lib/jobs/service";
import { parsePrice } from "@/lib/money";
import { revalidatePath } from "next/cache";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export async function savePayment(form: FormData) {
  const viewer = await requireCompletedViewer();
  const jobId = String(form.get("jobId") || "");
  const requestId = String(form.get("requestId") || "");
  const amount = parsePrice(String(form.get("amount") || ""));
  const paidAt = String(form.get("paidAt") || "");
  const method = String(form.get("method") || "");
  const note = String(form.get("note") || "").trim();
  if (!isJobId(requestId) || !isJobId(jobId) || !amount || amount > 999999999999.99 || !/^\d{4}-\d{2}-\d{2}$/.test(paidAt) || !Number.isFinite(Date.parse(paidAt)) ||
    new Date(paidAt).toISOString().slice(0,10) !== paidAt || paidAt > new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }) ||
    !["cash", "bank", "other"].includes(method) || note.length > 500) return { ok: false, error: "Tutar, tarih ve ödeme yöntemini kontrol et." };
  if (!await consumeRateLimit("payment-record", 60, 3600, viewer.id)) return { ok: false, error: "Çok fazla kayıt denemesi yaptın." };
  const client = await createClient();
  const { error } = await client.from("job_payments").insert({ id: requestId, job_id: jobId, business_id: viewer.business!.id, amount, paid_at: paidAt, method, note });
  if(error?.code === "23505") {
    const existing=await client.from("job_payments").select("job_id,amount,paid_at,method,note").eq("id",requestId).eq("business_id",viewer.business!.id).maybeSingle();
    if(!existing.error && existing.data?.job_id===jobId && Number(existing.data.amount)===amount && existing.data.paid_at===paidAt && existing.data.method===method && existing.data.note===note) { revalidatePath(`/jobs/${jobId}`);return {ok:true}; }
    return {ok:false,error:"Önceki denemenin sonucu farklı. Ödeme listesini kontrol edip sayfayı yenile."};
  }
  revalidatePath(`/jobs/${jobId}`);
  return error ? { ok: false, error: "Ödeme kaydedilemedi." } : { ok: true };
}

export async function deletePayment(id: string, jobId: string) {
  const viewer = await requireCompletedViewer();
  if (!isJobId(id) || !isJobId(jobId)) return { ok: false };
  const client = await createClient();
  const { data, error } = await client.from("job_payments").delete().eq("id", id).eq("job_id", jobId).eq("business_id", viewer.business!.id).select("id").maybeSingle();
  revalidatePath(`/jobs/${jobId}`);
  return { ok: !error && !!data };
}

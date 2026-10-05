"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { isJobId } from "@/lib/jobs/service";
import { isQuoteId } from "@/lib/quotes/id";
import { entryKinds, type EntryKind, type WorkEntry } from "@/lib/work/types";

export async function listWorkEntries(jobId?: string, quoteId?: string): Promise<WorkEntry[]> {
  const viewer = await requireCompletedViewer();
  const client = await createClient();
  let request = client.from("work_entries").select("*").eq("business_id", viewer.business!.id);
  if (jobId) { if (!isJobId(jobId)) return []; request = request.eq("job_id", jobId); }
  if (quoteId) { if (!isQuoteId(quoteId)) return []; request = request.eq("quote_id", quoteId); }
  const entries: WorkEntry[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await request.order("created_at", { ascending: false }).order("id").range(offset, offset + 499);
    if (error) throw new Error("İş notları yüklenemedi.");
    entries.push(...(data || []) as WorkEntry[]);
    if (!data || data.length < 500) return entries;
  }
}

export async function saveWorkEntry(input: { jobId?: string; quoteId?: string; kind: EntryKind; title: string; note: string; amount?: number | null; scheduledAt?: string | null }) {
  const viewer = await requireCompletedViewer();
  if (input.kind === "expense" && (!input.jobId || input.amount == null)) return {ok:false,error:"Gideri iş detayından ekle ve bir tutar gir."};
  if (!Object.hasOwn(entryKinds, input.kind) || ["attachment", "revision_request"].includes(input.kind) || !input.title?.trim() || input.title.length > 160 || typeof input.note !== "string" || input.note.length > 2000 ||
      input.jobId && !isJobId(input.jobId) || input.quoteId && !isQuoteId(input.quoteId) ||
      input.amount != null && (!Number.isFinite(input.amount) || input.amount < 0 || input.amount > 1e12) ||
      input.scheduledAt && !Number.isFinite(Date.parse(input.scheduledAt))) return { ok: false, error: "Alanları kontrol et." };
  const client = await createClient();
  const { data, error } = await client.from("work_entries").insert({ business_id: viewer.business!.id, job_id: input.jobId || null, quote_id: input.quoteId || null,
    kind: input.kind, title: input.title.trim(), note: input.note.trim(), amount: input.amount ?? null, scheduled_at: input.scheduledAt || null }).select("*").single();
  if (error) return { ok: false, error: "Kayıt eklenemedi. Tekrar dene." };
  revalidatePath("/work"); revalidatePath("/dashboard");
  if (input.jobId) {revalidatePath(`/jobs/${input.jobId}`);revalidatePath(`/jobs/${input.jobId}/complete`);}
  return { ok: true, entry: data as WorkEntry };
}

export async function updateWorkEntry(id: string, status: WorkEntry["status"]) {
  const viewer = await requireCompletedViewer();
  if (!isJobId(id) || !["open", "done", "approved", "declined"].includes(status)) return { ok: false };
  const client = await createClient();
  const { data, error } = await client.from("work_entries").update({ status }).eq("id", id).eq("business_id", viewer.business!.id).select("id").maybeSingle();
  revalidatePath("/work"); revalidatePath("/dashboard");
  return { ok: !error && !!data };
}

export async function copyRecord(id: string, type: "job" | "quote" | "revision") {
  await requireCompletedViewer();
  if (!isJobId(id) || !["job", "quote", "revision"].includes(type)) return { ok: false, error: "Kayıt bulunamadı." };
  const client = await createClient();
  const result = type === "job" ? await client.rpc("copy_my_job", { p_job_id: id }) : await client.rpc("copy_my_quote", { p_quote_id: id, p_revision: type === "revision" });
  if (result.error || !result.data) return { ok: false, error: "Kopya oluşturulamadı. İşin durumu ve kullanım sınırlarını kontrol et." };
  revalidatePath("/jobs"); revalidatePath("/quotes");
  return { ok: true, id: result.data };
}

"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { isJobId } from "@/lib/jobs/service";
import { isQuoteId } from "@/lib/quotes/id";
import { entryKinds, type EntryKind, type WorkEntry } from "@/lib/work/types";

export async function getWorkEntriesPage(input:{jobId?:string;quoteId?:string;kind?:string;showDone?:boolean;day?:string;page?:number}) {
  const {jobId,quoteId}=input;
  const viewer = await requireCompletedViewer();
  const client = await createClient();
  let request = client.from("work_entries").select("*",{count:"exact"}).eq("business_id", viewer.business!.id);
  if (jobId) { if (!isJobId(jobId)) return {entries:[],count:0}; request = request.eq("job_id", jobId); }
  if (quoteId) { if (!isQuoteId(quoteId)) return {entries:[],count:0}; request = request.eq("quote_id", quoteId); }
  if(input.kind&&Object.hasOwn(entryKinds,input.kind))request=request.eq("kind",input.kind as EntryKind);
  if(!input.showDone)request=request.eq("status","open");
  if(input.day){if(!/^\d{4}-\d{2}-\d{2}$/.test(input.day)||!Number.isFinite(Date.parse(input.day))||new Date(input.day).toISOString().slice(0,10)!==input.day)return {entries:[],count:0};
    request=request.gte("scheduled_at",`${input.day}T00:00:00+03:00`).lte("scheduled_at",`${input.day}T23:59:59.999999+03:00`);}
  const page=Number.isSafeInteger(input.page)&&input.page! > 0?Math.min(input.page!,100000):1;
  const {data,error,count}=await request.order("scheduled_at",{ascending:true,nullsFirst:false}).order("created_at",{ascending:false}).order("id").range((page-1)*50,page*50-1);
  if(error)throw new Error("İş notları yüklenemedi.");return {entries:(data||[]) as WorkEntry[],count:count||0};
}

export async function listWorkEntries(jobId?:string,quoteId?:string){return (await getWorkEntriesPage({jobId,quoteId})).entries;}
export async function getExpenseTotal(jobId:string){
 await requireCompletedViewer();if(!isJobId(jobId))throw new Error("İş bulunamadı.");
 const r=await (await createClient()).rpc("get_my_expense_total",{p_job_id:jobId});if(r.error)throw new Error("Gider toplamı yüklenemedi.");return Number(r.data);
}

export async function saveWorkEntry(input: { jobId?: string; quoteId?: string; kind: EntryKind; title: string; note: string; amount?: number | null; scheduledAt?: string | null; acknowledgeConflict?:boolean }) {
  const viewer = await requireCompletedViewer();
  if (input.kind === "expense" && (!input.jobId || input.amount == null)) return {ok:false,error:"Gideri iş detayından ekle ve bir tutar gir."};
  if (!Object.hasOwn(entryKinds, input.kind) || ["attachment", "revision_request"].includes(input.kind) || !input.title?.trim() || input.title.length > 160 || typeof input.note !== "string" || input.note.length > 2000 ||
      input.jobId && !isJobId(input.jobId) || input.quoteId && !isQuoteId(input.quoteId) ||
      input.amount != null && (!Number.isFinite(input.amount) || input.amount < 0 || input.amount > 1e12) ||
      input.scheduledAt && !Number.isFinite(Date.parse(input.scheduledAt))) return { ok: false, error: "Alanları kontrol et." };
  const client = await createClient();
  if(input.kind==="visit"&&input.scheduledAt&&!input.acknowledgeConflict){
    const time=Date.parse(input.scheduledAt);
    const other=await client.from("work_entries").select("id",{head:true,count:"exact"}).eq("business_id",viewer.business!.id).eq("kind","visit").eq("status","open").gte("scheduled_at",new Date(time-3600000).toISOString()).lte("scheduled_at",new Date(time+3600000).toISOString());
    if(other.error)return {ok:false,error:"Randevu çakışması kontrol edilemedi."};
    if(other.count)return {ok:false,conflict:true,error:`Bu saatin bir saat yakınında ${other.count} keşif var. Çakışmayı kontrol edip tekrar kaydet.`};
  }
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

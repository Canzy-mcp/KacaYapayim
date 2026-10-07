import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { ButtonLink, Card } from "@/components/ui";
import { searchJobs } from "@/lib/jobs/service";
import { jobStatusLabel } from "@/lib/jobs/lifecycle";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { formatMoney } from "@/lib/costs/format";
import { formatCustomerDate } from "@/lib/customers/format";

export const metadata = { title: "İşlerim" };
const filters = [
  { key: "all", label: "Tümü" }, { key: "draft", label: "Taslak" }, { key: "calculated", label: "Hesaplandı" }, { key: "quoted", label: "Teklif Verildi" }, { key: "scheduled", label: "Planlandı" }, { key: "accepted", label: "Kabul Edildi" },
  { key: "in_progress", label: "Devam Ediyor" }, { key: "completed", label: "Tamamlandı" },
  { key: "cancelled", label: "İptal" },
] as const;

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string; from?: string; to?: string }> }) {
  const viewer = await requireCompletedViewer();
  const params = await searchParams;
  const { status: requested } = params;
  const active = filters.some((filter) => filter.key === requested) ? requested! : "all";
  const { jobs, count, page } = await searchJobs({ status: active, query: params.q, page: Number(params.page || 1), from: params.from, to: params.to });
  const visible = jobs;
  const href = (next: number, status = active) => `/jobs?${new URLSearchParams({status, q: params.q || "", from: params.from || "", to: params.to || "", page: String(next)})}`;
  const customerIds = [...new Set(jobs.map((job) => job.customer_id).filter((id): id is string => Boolean(id)))];
  const quoteIds = [...new Set(jobs.map((job) => job.accepted_quote_id).filter((id): id is string => Boolean(id)))];
  const supabase = await createClient();
  const [customerResult, quoteResult] = await Promise.all([
    customerIds.length ? supabase.from("customers").select("id,name").eq("business_id", viewer.business!.id).in("id", customerIds) : Promise.resolve({ data: [], error: null }),
    quoteIds.length ? supabase.from("quotes").select("id,sale_price").eq("business_id", viewer.business!.id).in("id", quoteIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (customerResult.error || quoteResult.error) throw new Error("İşler yüklenemedi.");
  const names = new Map((customerResult.data || []).map((customer) => [customer.id, customer.name]));
  const prices = new Map((quoteResult.data || []).map((quote) => [quote.id, quote.sale_price]));
  return <div className="mx-auto max-w-[1000px]"><header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-[34px] font-semibold tracking-[-0.055em] sm:text-[42px]">İşlerim</h1><p className="mt-2 text-[15px] text-[#6E6E73]">İşlerini ve gerçek kârlılığını buradan takip et.</p></div><ButtonLink href="/new-quote" className="min-h-12 w-full sm:w-auto"><Plus size={18} />Yeni İş</ButtonLink></header>
    {<form className="mb-5 grid gap-3 sm:grid-cols-4"><input type="hidden" name="status" value={active}/><label className="text-sm">İş ara<input name="q" defaultValue={params.q} maxLength={100} className="mt-2 min-h-11 w-full rounded-xl border bg-white px-3"/></label><label className="text-sm">Başlangıç<input type="date" name="from" defaultValue={params.from} className="mt-2 min-h-11 w-full rounded-xl border bg-white px-3"/></label><label className="text-sm">Bitiş<input type="date" name="to" defaultValue={params.to} className="mt-2 min-h-11 w-full rounded-xl border bg-white px-3"/></label><button className="min-h-11 self-end rounded-xl bg-[#0071e3] px-4 py-3 text-sm text-white">Ara</button></form>}{<><nav aria-label="İş durumu" className="mb-5 flex gap-2 overflow-x-auto pb-1">{filters.map((filter) => <Link key={filter.key} href={href(1, filter.key)} aria-current={active === filter.key ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium ${active === filter.key ? "bg-[#1D1D1F] text-white" : "border border-[#dedee2] bg-white text-[#5c5c64]"}`}>{filter.label}</Link>)}</nav><Card className="overflow-hidden">{visible.length ? visible.map((job) => <Link key={job.id} href={`/jobs/${job.id}`} className="flex min-h-20 items-center justify-between gap-3 border-b border-[#ececf0] px-5 py-4 last:border-0 hover:bg-[#fafafb] sm:px-6"><div className="min-w-0"><p className="truncate text-[15px] font-semibold">{job.title}</p><p className="mt-1 text-[12px] text-[#6E6E73]">{job.customer_id ? names.get(job.customer_id) || "Müşteri kaydı yok" : "Müşterisiz iş"} · {formatCustomerDate(job.created_at)}</p><p className="mt-1 text-[12px] font-medium text-[#2366a5]">{jobStatusLabel[job.status]}</p></div><div className="flex shrink-0 items-center gap-3"><span className="text-[14px] font-semibold tabular-nums">{job.accepted_quote_id ? (prices.has(job.accepted_quote_id) ? formatMoney(prices.get(job.accepted_quote_id)!) : "—") : job.selected_sale_price !== null ? formatMoney(job.selected_sale_price) : formatMoney(job.estimated_cost)}</span><ChevronRight size={17} className="text-[#a0a0a6]" /></div></Link>) : <p className="px-6 py-10 text-center text-sm text-[#6E6E73]">Bu durumda iş bulunamadı.</p>}</Card><nav aria-label="İş listesi sayfaları" className="mt-5 flex items-center justify-between text-sm">{page>1?<Link className="min-h-11 p-3 text-[#0071e3]" href={href(page-1)}>Önceki</Link>:<span/>}<span>{count} iş · Sayfa {page}</span>{page*25<count?<Link className="min-h-11 p-3 text-[#0071e3]" href={href(page+1)}>Sonraki</Link>:<span/>}</nav></>}
  </div>;
}

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { ButtonLink, Card } from "@/components/ui";
import { getRecentJobs } from "@/lib/jobs/service";
import { jobStatusLabel } from "@/lib/jobs/lifecycle";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { formatMoney } from "@/lib/costs/format";
import { formatCustomerDate } from "@/lib/customers/format";

export const metadata = { title: "İşlerim" };
const filters = [
  { key: "all", label: "Tümü" }, { key: "accepted", label: "Kabul Edildi" },
  { key: "in_progress", label: "Devam Ediyor" }, { key: "completed", label: "Tamamlandı" },
  { key: "cancelled", label: "İptal" },
] as const;

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const viewer = await requireCompletedViewer();
  const jobs = await getRecentJobs();
  const { status: requested } = await searchParams;
  const active = filters.some((filter) => filter.key === requested) ? requested! : "all";
  const visible = active === "all" ? jobs : jobs.filter((job) => job.status === active);
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
    {jobs.length ? <><nav aria-label="İş durumu" className="mb-5 flex gap-2 overflow-x-auto pb-1">{filters.map((filter) => <Link key={filter.key} href={`/jobs?status=${filter.key}`} aria-current={active === filter.key ? "page" : undefined} className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium ${active === filter.key ? "bg-[#1D1D1F] text-white" : "border border-[#dedee2] bg-white text-[#5c5c64]"}`}>{filter.label}</Link>)}</nav><Card className="overflow-hidden">{visible.length ? visible.map((job) => <Link key={job.id} href={`/jobs/${job.id}`} className="flex min-h-20 items-center justify-between gap-3 border-b border-[#ececf0] px-5 py-4 last:border-0 hover:bg-[#fafafb] sm:px-6"><div className="min-w-0"><p className="truncate text-[15px] font-semibold">{job.title}</p><p className="mt-1 text-[12px] text-[#6E6E73]">{job.customer_id ? names.get(job.customer_id) || "Müşteri kaydı yok" : "Müşterisiz iş"} · {formatCustomerDate(job.created_at)}</p><p className="mt-1 text-[12px] font-medium text-[#2366a5]">{jobStatusLabel[job.status]}</p></div><div className="flex shrink-0 items-center gap-3"><span className="text-[14px] font-semibold tabular-nums">{job.accepted_quote_id ? (prices.has(job.accepted_quote_id) ? formatMoney(prices.get(job.accepted_quote_id)!) : "—") : job.selected_sale_price !== null ? formatMoney(job.selected_sale_price) : formatMoney(job.estimated_cost)}</span><ChevronRight size={17} className="text-[#a0a0a6]" /></div></Link>) : <p className="px-6 py-10 text-center text-sm text-[#6E6E73]">Bu durumda iş bulunamadı.</p>}</Card></> : <Card className="px-6 py-12 text-center"><h2 className="text-[20px] font-semibold">Henüz iş kaydetmedin.</h2><p className="mt-2 text-[14px] text-[#6E6E73]">İlk işinin maliyetini hesapla.</p><ButtonLink href="/new-quote" className="mt-6">İş Oluştur</ButtonLink></Card>}
  </div>;
}

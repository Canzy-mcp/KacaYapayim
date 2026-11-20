import { PaymentPanel } from "@/components/jobs/payment-panel";
import { WorkPanel } from "@/components/work/work-panel";
import { RecordTools } from "@/components/work/record-tools";
import Link from "next/link";
import { validMarketId } from "@kacayapayim/core/marketplace";
import { ButtonLink, Card } from "@/components/ui";
import { JobCostSummary } from "@/components/jobs/job-cost-summary";
import { JobLifecycleActions } from "@/components/jobs/job-lifecycle-actions";
import { ActualProfitUpgrade } from "@/components/jobs/actual-profit-upgrade";
import { hasFeature } from "@/lib/billing/catalog";
import { getEffectivePlan } from "@/lib/billing/service";
import { QuoteStatusBadge } from "@/lib/quotes/format";
import { formatMoney, formatPercent } from "@/lib/costs/format";
import { jobStatusLabel, canStartJob, actualProfitSummary } from "@/lib/jobs/lifecycle";
import type { PainterCalculation } from "@/lib/jobs/painter-calculation";
import type { Customer, Job, JobCostBreakdown, Quote } from "@/types/database";
import type { ProfessionTemplate } from "@/lib/professions/schema";

export async function GenericJobDetail({ job, customer, breakdown, quotes, acceptedQuote }: {
  job: Job; customer: Customer | null; breakdown: JobCostBreakdown[]; quotes: Quote[]; acceptedQuote: Quote | null;
}) {
  const marketRequest = job.input_data?.market_request;
  const template = job.template_snapshot as unknown as ProfessionTemplate | null;
  const labels = new Map(template?.fields?.map((field) => [field.key, field.label]) || []);
  const sum = (type: JobCostBreakdown["source_type"]) => breakdown.filter((line) => line.source_type === type).reduce((total, line) => total + line.total_cost, 0);
  const calculation: PainterCalculation = { breakdown: breakdown.map((line) => ({ cost_item_id: line.cost_item_id || "", name: line.name,
    category: line.category, unit: line.unit, quantity: line.quantity, unit_cost: line.unit_cost, total_cost: line.total_cost,
    source_type: line.source_type, metadata: line.metadata as Record<string, number> })), material_total: sum("material"),
    labor_total: sum("labor"), other_total: sum("fixed") + sum("extra"), grand_total: job.estimated_cost, warnings: [] };
  const actual = acceptedQuote && job.actual_cost !== null ? actualProfitSummary(acceptedQuote.sale_price, acceptedQuote.estimated_cost_snapshot, job.actual_cost) : null;
  const canViewActualProfit = (actual || job.actual_profit != null) && hasFeature(await getEffectivePlan(job.business_id), "actual_profit");
  return <div className="mx-auto max-w-[900px]"><Link href="/jobs" className="text-[14px] font-medium text-[#6E6E73]">← İşlerim</Link>
    <div className="mt-6 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#0071E3]">{template?.name || "İş"} · {jobStatusLabel[job.status]}</p><h1 className="mt-2 text-[34px] font-semibold tracking-[-0.05em]">{job.title}</h1><p className="mt-2 text-sm text-[#6E6E73]">{customer?.name || "Müşterisiz iş"}</p></div>{["draft","calculated"].includes(job.status) && <ButtonLink href={`/new-quote?job_id=${job.id}`} variant="secondary">İşi Düzenle</ButtonLink>}</div>
    <RecordTools id={job.id} type="job" /><WorkPanel jobId={job.id} /><PaymentPanel jobId={job.id} />
    {validMarketId(marketRequest) && <Card className="mt-6 p-6"><p className="text-sm font-semibold">Hizmet platformundan gelen iş</p>
      <div className="mt-3 flex flex-wrap gap-2"><ButtonLink href={`/talepler/${marketRequest}`} variant="secondary">Talebi ve randevuyu aç</ButtonLink>
      {job.status === "completed" && <ButtonLink href={`/jobs/${job.id}/complete`}>Gerçek maliyeti kaydet</ButtonLink>}</div>
      {job.actual_profit != null && (canViewActualProfit
        ? <p className="mt-3 text-sm">Gerçek kâr {formatMoney(job.actual_profit)}</p>
        : <ActualProfitUpgrade />)}
    </Card>}
    {acceptedQuote && <Card className="mt-6 p-6"><p className="text-xs font-semibold uppercase text-[#6E6E73]">Kabul edilen teklif</p><p className="mt-2 text-2xl font-semibold">{formatMoney(acceptedQuote.sale_price)}</p>{canStartJob(job.status) ? <div className="mt-4"><JobLifecycleActions id={job.id} /></div> : job.status === "in_progress" || job.status === "completed" ? <ButtonLink href={`/jobs/${job.id}/complete`} className="mt-4">{job.status === "completed" ? "Gerçek Maliyeti Düzenle" : "İşi Tamamla"}</ButtonLink> : null}</Card>}
    {actual && <Card className="mt-5 p-6">{canViewActualProfit
      ? <><p className="text-xs uppercase text-[#6E6E73]">Gerçek kâr</p><p className="mt-2 text-2xl font-semibold">{formatMoney(actual.actualProfit)} · {formatPercent(actual.actualMargin)}</p></>
      : <ActualProfitUpgrade />}</Card>}
    <Card className="mt-6 p-6"><h2 className="text-lg font-semibold">İş bilgileri</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{Object.entries(job.input_data || {}).filter(([key,value]) => !["manual","lines","market_request"].includes(key) && value !== null && value !== "" && !(Array.isArray(value) && !value.length)).map(([key,value]) => <div key={key}><p className="text-xs text-[#6E6E73]">{labels.get(key) || key}</p><p className="mt-1 text-sm font-medium">{typeof value === "boolean" ? value ? "Evet" : "Hayır" : Array.isArray(value) ? value.join(", ") : String(value)}</p></div>)}</div>{job.description && <p className="mt-5 border-t border-[#ececf0] pt-4 text-sm text-[#515159]">{job.description}</p>}</Card>
    <div className="mt-5"><JobCostSummary calculation={calculation} /></div>
    <Card className="mt-6 p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase text-[#6E6E73]">Satış fiyatı</p><p className="mt-2 text-2xl font-semibold">{job.selected_sale_price === null ? "Henüz belirlenmedi" : formatMoney(job.selected_sale_price)}</p></div>{["draft","calculated"].includes(job.status) && <ButtonLink href={`/jobs/${job.id}/pricing`}>{job.selected_sale_price === null ? "Fiyatını Belirle" : "Fiyatı Düzenle"}</ButtonLink>}</div></Card>
    <Card className="mt-6 p-6"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-semibold">Teklifler</h2>{job.selected_sale_price !== null && ["draft","calculated","quoted"].includes(job.status) && <ButtonLink href={`/quotes/new?job_id=${job.id}`} variant="secondary">Teklif Oluştur</ButtonLink>}</div>{quotes.length ? <div className="mt-4 divide-y divide-[#ececf0]">{quotes.map((quote) => <Link href={`/quotes/${quote.id}`} key={quote.id} className="flex items-center justify-between py-4"><span className="font-medium">{quote.quote_number} · {formatMoney(quote.sale_price)}</span><QuoteStatusBadge quote={quote} /></Link>)}</div> : <p className="mt-4 text-sm text-[#6E6E73]">Henüz teklif hazırlanmadı.</p>}</Card>
  </div>;
}

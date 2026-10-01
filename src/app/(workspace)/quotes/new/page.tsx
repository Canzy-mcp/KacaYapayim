import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteForm } from "@/components/quotes/quote-form";
import { ButtonLink, Card } from "@/components/ui";
import { getJobBundle, isJobId } from "@/lib/jobs/service";
import { todayInIstanbul } from "@/lib/quotes/defaults";
import { requireCompletedViewer } from "@/lib/viewer";
import { getEffectivePlan } from "@/lib/billing/service";

export const metadata = { title: "Teklif Hazırla" };
export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ job_id?: string }> }) {
  const viewer = await requireCompletedViewer();
  const { job_id } = await searchParams;
  if (!job_id) return <Card className="mx-auto max-w-[600px] p-8 text-center"><h1 className="text-[24px] font-semibold">Önce bir iş seç.</h1><p className="mt-2 text-[14px] text-[#6E6E73]">Fiyatı belirlenmiş bir işten teklif hazırlayabilirsin.</p><ButtonLink href="/jobs" className="mt-5">İşlerim</ButtonLink></Card>;
  if (!isJobId(job_id)) notFound();
  const bundle = await getJobBundle(job_id);
  if (!bundle) notFound();
  if (bundle.job.selected_sale_price === null || bundle.job.estimated_cost <= 0)
    return <Card className="mx-auto max-w-[600px] p-8 text-center"><h1 className="text-[24px] font-semibold">Önce iş fiyatını kaydet.</h1><p className="mt-2 text-[14px] text-[#6E6E73]">Teklifin toplam fiyatını belirledikten sonra kapsamı hazırlayabilirsin.</p><ButtonLink href={`/new-quote?job_id=${job_id}&step=pricing`} className="mt-5">Fiyatını Belirle</ButtonLink></Card>;
  const plan = await getEffectivePlan(viewer.business!.id);
  return <QuoteForm job={bundle.job} details={bundle.details} customer={bundle.customer}
    business={viewer.business!} today={todayInIstanbul()} showBranding={!plan.features.remove_branding} showLogo={plan.features.business_logo} />;
}

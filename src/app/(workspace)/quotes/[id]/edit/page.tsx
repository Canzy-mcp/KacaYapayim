import { notFound } from "next/navigation";
import { QuoteForm } from "@/components/quotes/quote-form";
import { getJobBundle } from "@/lib/jobs/service";
import { getQuoteBundle } from "@/lib/quotes/service";
import { todayInIstanbul } from "@/lib/quotes/defaults";
import { getEffectivePlan } from "@/lib/billing/service";

export const metadata = { title: "Teklifi Düzenle" };
export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getQuoteBundle(id);
  if (!bundle || !["draft", "ready"].includes(bundle.quote.status)) notFound();
  const jobBundle = await getJobBundle(bundle.quote.job_id);
  if (!jobBundle) notFound();
  const plan = await getEffectivePlan(bundle.business.id);
  return <QuoteForm job={jobBundle.job} details={jobBundle.details} customer={bundle.customer ?? jobBundle.customer}
    business={bundle.business} today={todayInIstanbul()} quote={bundle.quote}
    savedItems={bundle.items} savedExclusions={bundle.exclusions} showBranding={!plan.features.remove_branding} showLogo={plan.features.business_logo} />;
}

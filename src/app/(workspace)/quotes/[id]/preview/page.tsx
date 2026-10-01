import { notFound } from "next/navigation";
import { QuotePreview } from "@/components/quotes/quote-preview";
import { toCustomerQuotePreview } from "@/lib/quotes/public-preview";
import { getQuoteBundle } from "@/lib/quotes/service";
import { getEffectivePlan } from "@/lib/billing/service";

export const metadata = { title: "Müşteri Görünümü", robots: { index: false, follow: false } };
export default async function QuoteOwnerPreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getQuoteBundle(id);
  if (!bundle) notFound();
  const plan = await getEffectivePlan(bundle.business.id);
  return <main className="mx-auto max-w-[760px] py-6 sm:py-10"><QuotePreview quote={toCustomerQuotePreview({ ...bundle, showBranding: !plan.features.remove_branding, showLogo: plan.features.business_logo })} /></main>;
}

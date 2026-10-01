import { notFound } from "next/navigation";
import { ProfessionPricing } from "@/components/jobs/profession-pricing";
import { getJobBundle } from "@/lib/jobs/service";
import { requireCompletedViewer } from "@/lib/viewer";

export const metadata = { title: "Satış Fiyatı" };
export default async function JobPricingPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireCompletedViewer();
  const { id } = await params;
  const bundle = await getJobBundle(id);
  if (!bundle || !["draft","calculated"].includes(bundle.job.status)) notFound();
  const job = { ...bundle.job, target_profit_margin: bundle.job.target_profit_margin ?? Math.max(viewer.business!.default_profit_margin,1),
    minimum_profit_margin: bundle.job.minimum_profit_margin ?? Math.min(viewer.business!.minimum_profit_margin,89) };
  return <ProfessionPricing job={job} customerName={bundle.customer?.name || "Müşterisiz iş"} />;
}

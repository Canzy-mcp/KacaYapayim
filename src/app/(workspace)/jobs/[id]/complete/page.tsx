import { getExpenseTotal } from "@/app/actions/work";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActualCostForm } from "@/components/jobs/actual-cost-form";
import { canSaveActualCosts } from "@/lib/jobs/lifecycle";
import { getJobBundle } from "@/lib/jobs/service";

export const metadata = { title: "Gerçek Maliyet" };
export default async function CompleteJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getJobBundle(id);
  if (!bundle || !canSaveActualCosts(bundle.job.status) || !bundle.acceptedQuote) notFound();
  const expenseTotal = await getExpenseTotal(id);
  return <main className="mx-auto max-w-[720px]"><Link href={`/jobs/${id}`} className="inline-flex min-h-11 items-center text-sm text-[#6E6E73]">← İş Detayı</Link><h1 className="mt-3 text-[32px] font-semibold tracking-[-0.05em]">{bundle.job.status === "completed" ? "Gerçek Maliyeti Düzenle" : "İşi Tamamla"}</h1><p className="mb-7 mt-2 text-sm text-[#6E6E73]">Bu iş gerçekte sana kaça mal oldu? Değişen tutarları güncelle; tahmini maliyetler korunacak.</p><ActualCostForm expenseTotal={expenseTotal} id={id} breakdown={bundle.breakdown} actualCosts={bundle.actualCosts} salePrice={bundle.acceptedQuote.sale_price} estimatedCost={bundle.job.estimated_cost} notes={bundle.job.completion_notes} completed={bundle.job.status === "completed"} /></main>;
}

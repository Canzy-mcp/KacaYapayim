import Link from "next/link";
import { PlanCards } from "@/components/billing/plan-cards";
import { PageHeader } from "@/components/layout";
import { getBillingSummary } from "@/lib/billing/service";
import { requireCompletedViewer } from "@/lib/viewer";
export const metadata = { title: "Paket ve Kullanım" };
export const dynamic = "force-dynamic";
function Usage({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit === null ? 0 : Math.min(100, Math.round(used / limit * 100));
  return <div><div className="flex items-center justify-between gap-3 text-[13px]"><span className="font-medium">{label}</span><span className="tabular-nums text-[#6E6E73]">{used} / {limit ?? "Sınırsız"}</span></div>{limit !== null && <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eaeaee]"><div className={`h-full rounded-full ${pct >= 100 ? "bg-[#db574d]" : pct >= 80 ? "bg-[#ed9b29]" : "bg-[#0071E3]"}`} style={{ width: `${pct}%` }} /></div>}</div>;
}
export default async function BillingPage() {
  const viewer = await requireCompletedViewer();
  const summary = await getBillingSummary(viewer.business!.id);
  const { plan, subscription, usage } = summary;
  return <div className="mx-auto max-w-[1180px]"><PageHeader title="Paket ve Kullanım" description="Kullanımını gör, işletmene uygun paketi incele." /><div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]"><section className="rounded-[20px] border border-[#e5e5e9] bg-white p-6"><p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6E6E73]">Mevcut paket</p><h2 className="mt-3 text-[27px] font-semibold tracking-tight">{plan.name}</h2><p className="mt-2 text-[13px] text-[#6E6E73]">{subscription?.status === "past_due" ? "Ödeme bekleniyor. Dönem sonuna kadar erişim sürer." : subscription?.cancel_at_period_end ? "Dönem sonunda Ücretsiz pakete geçecek." : plan.id === "free" ? "Ücretsiz kullanım" : "Aktif abonelik"}</p>{subscription?.current_period_end && <p className="mt-4 text-[13px] text-[#6E6E73]">Dönem sonu: {new Date(subscription.current_period_end).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}</p>}<p className="mt-4 text-[12px] leading-5 text-[#86868b]">Paket değişse de mevcut müşterilerin ve tekliflerin saklanır.</p></section><section className="rounded-[20px] border border-[#e5e5e9] bg-white p-6"><h2 className="text-[18px] font-semibold">Kullanımın</h2><p className="mt-1 text-[12px] text-[#6E6E73]">Teklif hakkı her takvim ayı başında yenilenir.</p><div className="mt-6 space-y-6"><Usage label="Bu ay oluşturulan teklifler" used={usage.monthlyQuotes} limit={plan.limits.monthly_quotes} /><Usage label="Aktif müşteriler" used={usage.activeCustomers} limit={plan.limits.active_customers} /></div></section></div><section id="plans" className="mt-12"><h2 className="mb-5 text-[26px] font-semibold tracking-tight">Paketleri karşılaştır</h2><PlanCards plans={summary.plans} currentPlan={plan.id} /><p className="mt-5 text-[13px] text-[#6E6E73]">Ödeme altyapısı açıldığında paket değişikliği ve ödeme yönetimi burada kullanılabilecek. <Link href="/settings" className="font-semibold text-[#0071E3]">Ayarlarına dön</Link></p></section></div>;
}

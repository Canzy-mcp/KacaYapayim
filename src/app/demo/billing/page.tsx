import { PageHeader } from "@/components/layout";
import { PlanCards } from "@/components/billing/plan-cards";
import { Card } from "@/components/ui";
import { fallbackPlans } from "@/lib/billing/catalog";

export const metadata = { title: "Demo Paket ve Kullanım" };
export default function DemoBillingPage() {
  return <><PageHeader title="Paket ve Kullanım" description="Kullanımını gör, işletmene uygun paketi incele." /><div className="grid gap-5 lg:grid-cols-2"><Card className="p-6"><p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6E6E73]">Mevcut paket</p><h2 className="mt-3 text-[27px] font-semibold">Ücretsiz</h2><p className="mt-2 text-[13px] text-[#6E6E73]">Örnek kullanım</p><p className="mt-5 text-[12px] text-[#8a8a91]">Paket değişse de mevcut müşterilerin ve tekliflerin saklanır.</p></Card><Card className="p-6"><h2 className="text-[18px] font-semibold">Kullanımın</h2><Usage label="Bu ay oluşturulan teklifler" used={3} limit={5} /><Usage label="Aktif müşteriler" used={3} limit={20} /></Card></div><section className="mt-12"><h2 className="mb-5 text-[26px] font-semibold tracking-tight">Paketleri karşılaştır</h2><PlanCards plans={fallbackPlans} currentPlan="free" /></section></>;
}
function Usage({ label, used, limit }: { label: string; used: number; limit: number }) { return <div className="mt-6"><div className="flex justify-between text-[13px]"><span className="font-medium">{label}</span><span className="text-[#6E6E73]">{used} / {limit}</span></div><div className="mt-2 h-2 rounded-full bg-[#eaeaee]"><div className="h-full rounded-full bg-[#0071E3]" style={{ width: `${used / limit * 100}%` }} /></div></div>; }

import { PageHeader } from "@/components/layout";
import { EntryOffer } from "@/components/billing/entry-offer";
import { Card } from "@/components/ui";

export const metadata = { title: "Demo Üyelik" };
export default function DemoBillingPage() {
  return <><PageHeader title="Üyelik" description="Usta üyeliğini ve kullanımını gör." /><div className="grid gap-5 lg:grid-cols-2"><Card className="p-6"><p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6E6E73]">Durum</p><h2 className="mt-3 text-[27px] font-semibold">Usta Üyelik</h2><p className="mt-2 text-[13px] text-[#6E6E73]">Örnek kullanım · tek seferlik ödeme, süresiz</p><p className="mt-5 text-[12px] text-[#62626a]">Müşterilerin ve tekliflerin her durumda saklanır.</p></Card><Card className="p-6"><h2 className="text-[18px] font-semibold">Kullanımın</h2><p className="mt-3 text-[13px] text-[#6E6E73]">Teklif ve müşteri sayısı sınırsız.</p></Card></div><section className="mt-12"><h2 className="mb-5 text-[26px] font-semibold tracking-tight">Usta Üyelik</h2><EntryOffer marketing /></section></>;
}

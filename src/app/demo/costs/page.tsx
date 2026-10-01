import { PageHeader } from "@/components/layout";
import { Card } from "@/components/ui";
import { formatMoney } from "@/lib/costs/format";

export const metadata = { title: "Demo Maliyetler" };
const groups = [
  { title: "Malzeme", items: [["İç cephe boyası", 2150, "15 L"], ["Tavan boyası", 1450, "15 L"], ["Astar", 950, "10 L"], ["Maskeleme bandı", 95, "adet"]] },
  { title: "İşçilik", items: [["Boyacı günlük ücreti", 2500, "gün"], ["Yardımcı günlük ücreti", 1700, "gün"]] },
  { title: "Diğer", items: [["Ulaşım", 750, "iş"], ["Sarf malzemesi", 400, "iş"]] },
] as const;
export default function DemoCostsPage() {
  return <><PageHeader title="Maliyetlerim" description="Sık kullandığın malzeme ve işçilik fiyatlarını burada tut." /><div className="grid gap-5 lg:grid-cols-2">{groups.map((group) => <Card key={group.title} className="overflow-hidden"><div className="border-b border-[#ececf0] px-5 py-4 sm:px-6"><h2 className="text-[18px] font-semibold">{group.title}</h2></div><div className="divide-y divide-[#ececf0]">{group.items.map(([name, amount, unit]) => <div key={name} className="flex items-center justify-between gap-4 px-5 py-4 text-[14px] sm:px-6"><span className="font-medium">{name}</span><div className="text-right"><p className="font-semibold tabular-nums">{formatMoney(amount)}</p><p className="mt-0.5 text-[12px] text-[#8a8a91]">/{unit}</p></div></div>)}</div></Card>)}</div><p className="mt-5 text-[13px] text-[#6E6E73]">Gerçek hesabında bu fiyatları kendi malzeme ve işçiliğine göre düzenleyebilirsin.</p></>;
}

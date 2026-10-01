import { PageHeader } from "@/components/layout";
import { Card } from "@/components/ui";

export const metadata = { title: "Demo Ayarlar" };
export default function DemoSettingsPage() {
  return <><PageHeader title="Ayarlar" description="Profilini, işletmeni ve kâr hedeflerini güncelle." /><div className="mx-auto max-w-[860px] space-y-5"><Card className="p-6 sm:p-7"><h2 className="text-[20px] font-semibold">Profil</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Ad" value="Örnek" /><Field label="Soyad" value="Usta" /></div></Card><Card className="p-6 sm:p-7"><h2 className="text-[20px] font-semibold">İşletme</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="İşletme adı" value="Örnek Boya Atölyesi" /><Field label="Meslek" value="Boyacı" /><Field label="Şehir" value="İstanbul" /><Field label="Para birimi" value="Türk Lirası" /></div></Card><Card className="p-6 sm:p-7"><h2 className="text-[20px] font-semibold">Kâr Hedefleri</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Hedef kâr marjı" value="%30" /><Field label="Minimum kâr marjı" value="%20" /></div></Card></div></>;
}
function Field({ label, value }: { label: string; value: string }) { return <div><p className="mb-2 text-[14px] font-medium">{label}</p><div className="flex min-h-12 items-center rounded-[13px] border border-[#D2D2D7] bg-[#fafafa] px-4 text-[15px]">{value}</div></div>; }

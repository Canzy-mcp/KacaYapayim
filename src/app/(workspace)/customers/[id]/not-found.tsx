import { ButtonLink, Card } from "@/components/ui";
export default function CustomerNotFound() {
  return <div className="mx-auto max-w-[720px]"><Card className="px-6 py-14 text-center"><h1 className="text-[23px] font-semibold tracking-tight">Müşteri bulunamadı.</h1><p className="mt-2 text-[14px] text-[#6E6E73]">Kayıt kaldırılmış veya bağlantı değişmiş olabilir.</p><ButtonLink href="/customers" className="mt-6">Müşterilere Dön</ButtonLink></Card></div>;
}

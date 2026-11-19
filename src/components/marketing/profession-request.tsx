import { Mail } from "lucide-react";
import { professionRequestHref, supportEmail } from "@/lib/marketing/contact";

export function ProfessionRequest() {
  return <aside className="mt-8 rounded-[28px] bg-[#f5f5f7] p-7 sm:p-10" aria-label="Yeni meslek talebi">
    <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.03em]">Mesleğin listede yok mu?</h2>
    <p className="mt-3 max-w-2xl text-[17px] leading-[1.47] text-[#6e6e73]">Eklenmesini istediğin mesleği bize yaz. Sık yaptığın işleri ve kullandığın maliyet kalemlerini de paylaşırsan, mesleğine uygun hesaplamayı hazırlamamıza yardımcı olursun.</p>
    <a href={professionRequestHref} className="marketing-primary mt-5 inline-flex min-h-11 gap-2"><Mail size={18} aria-hidden="true"/>Meslek eklenmesini iste</a>
    <p className="mt-3 break-words text-[12px] text-[#86868b]">E-posta uygulaman açılır. Bize {supportEmail} adresinden ulaşabilirsin.</p>
  </aside>;
}

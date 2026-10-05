import { Mail } from "lucide-react";
import { professionRequestHref, supportEmail } from "@/lib/marketing/contact";

export function ProfessionRequest() {
  return <aside className="mt-8 rounded-[24px] border border-[#d6e6f8] bg-[#eaf4ff] p-6 sm:p-8" aria-label="Yeni meslek talebi">
    <h2 className="text-2xl font-semibold tracking-tight">Mesleğin listede yok mu?</h2>
    <p className="mt-3 max-w-2xl leading-7 text-[#4b5563]">Eklenmesini istediğin mesleği bize yaz. Sık yaptığın işleri ve kullandığın maliyet kalemlerini de paylaşırsan, mesleğine uygun hesaplamayı hazırlamamıza yardımcı olursun.</p>
    <a href={professionRequestHref} className="marketing-primary mt-5 inline-flex min-h-11 gap-2"><Mail size={18} aria-hidden="true"/>Meslek eklenmesini iste</a>
    <p className="mt-3 break-words text-sm text-[#4b5563]">E-posta uygulaman açılır. Bize {supportEmail} adresinden ulaşabilirsin.</p>
  </aside>;
}

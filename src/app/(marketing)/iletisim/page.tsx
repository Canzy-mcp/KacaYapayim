import { PageIntro } from "@/components/marketing/shell";
import { ProfessionRequest } from "@/components/marketing/profession-request";
import { legalMetadata, supportEmail } from "@/lib/marketing/legal";
export const metadata=legalMetadata("İletişim","/iletisim");
export default function Page(){return <div className="mx-auto max-w-3xl px-5 py-16"><PageIntro eyebrow="İletişim" title="Bize ulaş." description="Ürünle ilgili soruların ve geri bildirimlerin için destek kanalını kullanabilirsin."/><div className="marketing-card mt-10"><h2 className="text-xl font-semibold">Destek</h2><p className="mt-3 leading-7">E-posta: <a href={`mailto:${supportEmail}`} className="marketing-text-link inline-flex min-h-11 items-center break-all">{supportEmail}</a></p><p className="mt-3 text-sm text-[#6e6e73]">Müşteri bilgisi, teklif bağlantısı veya şifreni e-postaya ekleme.</p></div><ProfessionRequest/></div>}

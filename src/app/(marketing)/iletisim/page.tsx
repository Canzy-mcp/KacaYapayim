import { ProfessionRequest } from "@/components/marketing/profession-request";
import { legalMetadata, supportEmail } from "@/lib/marketing/legal";
import { Band, PageHead, PageLd, textLink, tile, title } from "@/components/marketing/acquisition/parts";

export const metadata = legalMetadata("İletişim", "/iletisim");

export default function Page() {
  return <>
    <PageLd path="/iletisim" name="İletişim" description="KaçaYapayım destek kanalı." type="ContactPage" crumbs={[{ name: "Ana Sayfa", path: "/" }, { name: "İletişim", path: "/iletisim" }]} />
    <PageHead crumbs={[{ name: "Ana Sayfa", href: "/" }, { name: "İletişim" }]} eyebrow="İletişim" h="Bize ulaş." text="Soruların, geri bildirimlerin ve içerik düzeltmelerin için destek kanalını kullanabilirsin." />
    <Band tone="gray" label="support-title"><div className="mx-auto max-w-3xl">
      <div className={tile}><h2 id="support-title" className={title}>Destek</h2><p className="mt-3 leading-[1.6] text-[#515154]">E-posta: <a href={`mailto:${supportEmail}`} className={`${textLink} inline-flex min-h-11 items-center break-all`}>{supportEmail}</a></p><p className="mt-3 text-sm text-[#515154]">Müşteri bilgisi, teklif bağlantısı veya şifreni e-postaya ekleme.</p></div>
      <ProfessionRequest />
    </div></Band>
  </>;
}

import { ProfessionRequest } from "@/components/marketing/profession-request";
import { legalMetadata, supportEmail } from "@/lib/marketing/legal";
import { breadcrumbNode, graph, JsonLd, webPageNode } from "@/lib/marketing/seo";
import { card, Crumbs, Hero, PageShell } from "@/lib/marketing/blocks";

export const metadata = legalMetadata("İletişim", "/iletisim");

export default function Page() {
  return <PageShell><div className="mx-auto max-w-3xl">
    <JsonLd data={graph(webPageNode({ path: "/iletisim", name: "İletişim", description: "KaçaYapayım destek kanalı.", type: "ContactPage" }), breadcrumbNode([{ name: "Ana Sayfa", path: "/" }, { name: "İletişim", path: "/iletisim" }]))} />
    <Crumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "İletişim" }]} />
    <Hero eyebrow="İletişim" title="Bize ulaş." lead="Ürünle ilgili soruların ve geri bildirimlerin için destek kanalını kullanabilirsin." />
    <div className={`${card} mt-10`}><h2 className="text-xl font-semibold">Destek</h2><p className="mt-3 leading-7">E-posta: <a href={`mailto:${supportEmail}`} className="inline-flex min-h-11 items-center break-all font-semibold text-[#075D54] underline underline-offset-4">{supportEmail}</a></p><p className="mt-3 text-sm text-[#5B6460]">Müşteri bilgisi, teklif bağlantısı veya şifreni e-postaya ekleme.</p></div>
    <ProfessionRequest />
  </div></PageShell>;
}

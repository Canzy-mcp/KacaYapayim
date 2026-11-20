import Link from "next/link";
import { siteMetadata, JsonLd, graph, webPageNode, breadcrumbNode, siteOrigin } from "@/lib/marketing/seo";
import { ContentCta, PageIntro } from "@/components/marketing/shell";
import { ProfessionCards } from "@/components/marketing/visuals";
import { ProfessionRequest } from "@/components/marketing/profession-request";
import { guides } from "@/lib/marketing/content";
import { trades } from "@/lib/marketing/trades";

const title = "Meslekler: Usta Bul ve Fiyat Hesapla";
const description = "Boyacı, elektrikçi, tesisatçı ve klimacı için usta bul, iş ilanı ver ve maliyete dayalı teklif hesabını gör.";
export const metadata = siteMetadata(title, description, "/meslekler");

export default function Page() {
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Meslekler", path: "/meslekler" }];
  return <div className="marketing-container landing-section">
    <JsonLd data={graph(
      webPageNode({ path: "/meslekler", name: title, description, type: "CollectionPage" }),
      breadcrumbNode(crumbs),
      { "@type": "ItemList", itemListElement: trades.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: `${siteOrigin}/meslekler/${t.slug}` })) },
    )} />
    <PageIntro eyebrow="İşini bilen ustalar için" title="Her işin hesabı farklı." description="Boyacı, elektrikçi, tesisatçı ve klimacı için usta bul, iş ilanı ver ve maliyet kalemlerini gör. KaçaYapayım, Türkiye'de usta bulmayı ve maliyete dayalı teklif hazırlamayı kolaylaştıran bir platformdur."/>
    <section aria-label="Mesleğine uygun hesaplama"><h2 className="sr-only">Mesleğini seç</h2><ProfessionCards spacious/></section>
    <p className="visual-disclosure">Meslek görselleri temsili olarak hazırlanmıştır.</p>
    <section className="mt-14" aria-labelledby="guide-links"><h2 id="guide-links" className="text-2xl font-semibold">Fiyatlandırma rehberleri</h2>
      <ul className="mt-4 grid gap-1 sm:grid-cols-2">{guides.map(g => <li key={g.slug}><Link href={`/rehber/${g.slug}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{g.title}</Link></li>)}</ul></section>
    <ProfessionRequest/><ContentCta/></div>;
}

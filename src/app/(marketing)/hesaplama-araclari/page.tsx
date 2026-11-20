import Link from "next/link";
import { calculators } from "@/lib/marketing/calculators";
import { calcSeo } from "@/lib/marketing/calc-seo";
import { breadcrumbNode, graph, JsonLd, siteMetadata, siteOrigin, webPageNode } from "@/lib/marketing/seo";
import { card, Crumbs, Hero, PageShell } from "@/lib/marketing/blocks";

const title = "Ücretsiz Hesaplama Araçları";
const description = "Kâr marjı, teklif fiyatı, boya ve elektrik işi maliyeti için ücretsiz hesaplama araçları. Kayıt gerekmez.";
export const metadata = siteMetadata(title, description, "/hesaplama-araclari");

export default function Page() {
  return <PageShell>
    <JsonLd data={graph(
      webPageNode({ path: "/hesaplama-araclari", name: title, description, type: "CollectionPage" }),
      breadcrumbNode([{ name: "Ana Sayfa", path: "/" }, { name: "Hesaplama Araçları", path: "/hesaplama-araclari" }]),
      { "@type": "ItemList", itemListElement: calculators.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: calcSeo[c.slug].h1, url: `${siteOrigin}/hesaplama-araclari/${c.slug}` })) },
    )} />
    <Crumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Hesaplama Araçları" }]} />
    <Hero eyebrow="Hesaplama araçları" title="Önce hesabını gör." lead="Kayıt olmadan kendi rakamlarınla hesap yap. Kâr marjı hesaplama, teklif fiyatı, boya fiyatı ve elektrik yaklaşık maliyet araçları ücretsizdir." />
    <div className="mt-10 grid gap-5 sm:grid-cols-2">{calculators.map(c => <Link key={c.slug} className={`${card} block min-w-0 hover:border-[#075D54]`} href={`/hesaplama-araclari/${c.slug}`}><h2 className="text-xl font-semibold">{calcSeo[c.slug].h1}</h2><p className="mt-3 leading-7 text-[#3F4944]">{c.description}</p><span className="mt-4 inline-flex min-h-11 items-center font-semibold text-[#075D54]">Hesapla →</span></Link>)}</div>
  </PageShell>;
}

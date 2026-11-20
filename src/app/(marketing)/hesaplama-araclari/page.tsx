import Link from "next/link";
import { calculators } from "@/lib/marketing/calculators";
import { calcSeo } from "@/lib/marketing/calc-seo";
import { breadcrumbNode, graph, JsonLd, siteMetadata, siteOrigin, webPageNode } from "@/lib/marketing/seo";
import { Band, Display, EdCrumbs, Eyebrow, body, muted, proseLink } from "@/lib/marketing/editorial";

const title = "Ücretsiz Hesaplama Araçları";
const description = "Kâr marjı, teklif fiyatı, boya ve elektrik işi maliyeti için ücretsiz hesaplama araçları. Kayıt gerekmez.";
export const metadata = siteMetadata(title, description, "/hesaplama-araclari");

export default function Page() {
  return <>
    <JsonLd data={graph(
      webPageNode({ path: "/hesaplama-araclari", name: title, description, type: "CollectionPage" }),
      breadcrumbNode([{ name: "Ana Sayfa", path: "/" }, { name: "Hesaplama Araçları", path: "/hesaplama-araclari" }]),
      { "@type": "ItemList", itemListElement: calculators.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: calcSeo[c.slug].h1, url: `${siteOrigin}/hesaplama-araclari/${c.slug}` })) },
    )} />
    <Band>
      <EdCrumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Hesaplama Araçları" }]} />
      <div className="mt-6 max-w-[68ch]"><Eyebrow>Hesaplama araçları</Eyebrow><Display>Önce hesabını gör.</Display>
        <p className={`mt-6 ${body} ${muted}`}>Kayıt olmadan kendi rakamlarınla hesap yap. Kâr marjı hesaplama, teklif fiyatı, boya fiyatı ve elektrik yaklaşık maliyet araçları ücretsizdir. Yöntem için <Link href="/metodoloji" className={proseLink}>metodolojiye</Link> bak.</p></div>
    </Band>
    <Band tone="gray"><ul className="grid gap-5 sm:grid-cols-2">{calculators.map(c => <li key={c.slug} className="min-w-0"><Link className="block h-full rounded-[20px] border border-[#d2d2d7] bg-white p-6 no-underline transition-colors duration-150 hover:border-[#075d54] sm:p-8" href={`/hesaplama-araclari/${c.slug}`}><h2 className="text-[1.375rem] font-semibold tracking-[-.02em] text-[#1d1d1f]">{calcSeo[c.slug].h1}</h2><p className={`mt-3 ${muted} leading-[1.55]`}>{c.description}</p><span className="mt-5 inline-flex min-h-11 items-center font-medium text-[#075d54]">Hesapla →</span></Link></li>)}</ul></Band>
  </>;
}

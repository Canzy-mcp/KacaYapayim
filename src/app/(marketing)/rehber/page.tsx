import Link from "next/link";
import { guides } from "@/lib/marketing/content";
import { guideGroups, guideDates, formatDateTr } from "@/lib/marketing/guides-data";
import { breadcrumbNode, graph, JsonLd, siteMetadata, siteOrigin, siteSummary, webPageNode } from "@/lib/marketing/seo";
import { Band, Display, EdCrumbs, Eyebrow, body, h2, muted } from "@/lib/marketing/editorial";

const title = "Fiyatlandırma ve Teklif Rehberi";
const description = "Kâr marjı, iş maliyeti, işçilik, teklif fiyatı ve ustalardan fiyat alma için formüllü, örnekli rehberler.";
export const metadata = siteMetadata(title, description, "/rehber");

export default function Page() {
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Rehber", path: "/rehber" }];
  return <>
    <JsonLd data={graph(
      webPageNode({ path: "/rehber", name: title, description, type: "CollectionPage" }), breadcrumbNode(crumbs),
      { "@type": "ItemList", itemListElement: guides.map((g, i) => ({ "@type": "ListItem", position: i + 1, name: g.title, url: `${siteOrigin}/rehber/${g.slug}` })) },
    )} />
    <Band>
      <EdCrumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Rehber" }]} />
      <div className="mt-6 max-w-[68ch]"><Eyebrow>Rehber</Eyebrow><Display>İşinin hesabını açıkça yap.</Display>
        <p className={`mt-6 ${body} ${muted}`}>Sorunu seç, doğrudan cevabı, formülü ve çalışılmış örneği oku. {siteSummary}</p></div>
    </Band>
    {guideGroups.map((group, gi) => <Band key={group.id} tone={gi % 2 === 0 ? "gray" : "white"} label={`g-${group.id}`}>
      <h2 id={`g-${group.id}`} className={h2}>{group.question}</h2><p className={`mt-3 max-w-[56ch] ${body} ${muted}`}>{group.intro}</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-2">{group.slugs.map(slug => { const g = guides.find(x => x.slug === slug)!; return <li key={slug} className="min-w-0"><Link href={`/rehber/${slug}`} className="block h-full rounded-[20px] border border-[#d2d2d7] bg-white p-6 no-underline transition-colors duration-150 hover:border-[#075d54]">
        <h3 className="text-lg font-semibold tracking-[-.02em] text-[#1d1d1f]">{g.title}</h3><p className="mt-3 leading-[1.55] text-[#515154]">{g.answer}</p>
        <p className="mt-4 text-sm text-[#6e6e73]">Son güncelleme: {formatDateTr(guideDates[slug].modified)}</p><span className="mt-2 inline-flex min-h-11 items-center font-medium text-[#075d54]">Oku →</span></Link></li>; })}</ul>
    </Band>)}
  </>;
}

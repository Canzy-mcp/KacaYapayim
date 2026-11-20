import Link from "next/link";
import { guides } from "@/lib/marketing/content";
import { guideGroups, guideDates, formatDateTr } from "@/lib/marketing/guides-data";
import { breadcrumbNode, graph, JsonLd, siteMetadata, siteOrigin, siteSummary, webPageNode } from "@/lib/marketing/seo";
import { card, Crumbs, Hero, PageShell, h2Class } from "@/lib/marketing/blocks";

const title = "Fiyatlandırma ve Teklif Rehberi";
const description = "Kâr marjı, iş maliyeti, işçilik, teklif fiyatı ve ustalardan fiyat alma için formüllü, örnekli rehberler.";
export const metadata = siteMetadata(title, description, "/rehber");

export default function Page() {
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Rehber", path: "/rehber" }];
  return <PageShell>
    <JsonLd data={graph(
      webPageNode({ path: "/rehber", name: title, description, type: "CollectionPage" }), breadcrumbNode(crumbs),
      { "@type": "ItemList", itemListElement: guides.map((g, i) => ({ "@type": "ListItem", position: i + 1, name: g.title, url: `${siteOrigin}/rehber/${g.slug}` })) },
    )} />
    <Crumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Rehber" }]} />
    <Hero eyebrow="Rehber" title="İşinin hesabını açıkça yap." lead={`Sorunu seç, doğrudan cevabı, formülü ve çalışılmış örneği oku. ${siteSummary}`} />
    <div className="mt-12 grid gap-12">{guideGroups.map(group => <section key={group.id} aria-labelledby={`g-${group.id}`}>
      <h2 id={`g-${group.id}`} className={h2Class}>{group.question}</h2><p className="mt-2 max-w-2xl leading-7 text-[#5B6460]">{group.intro}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{group.slugs.map(slug => { const g = guides.find(x => x.slug === slug)!; return <Link key={slug} href={`/rehber/${slug}`} className={`${card} block min-w-0 hover:border-[#075D54]`}>
        <h3 className="text-lg font-semibold">{g.title}</h3><p className="mt-3 leading-7 text-[#3F4944]">{g.answer}</p>
        <p className="mt-4 text-sm text-[#5B6460]">Son güncelleme: {formatDateTr(guideDates[slug].modified)}</p><span className="mt-2 inline-flex min-h-11 items-center font-semibold text-[#075D54]">Oku →</span></Link>; })}</div>
    </section>)}</div>
  </PageShell>;
}

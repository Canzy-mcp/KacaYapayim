import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculator } from "@/components/marketing/calculator";
import { calculators } from "@/lib/marketing/calculators";
import { calcSeo } from "@/lib/marketing/calc-seo";
import { guides } from "@/lib/marketing/content";
import { marjMarkupTable } from "@/lib/marketing/guides-data";
import { tradeBySlug } from "@/lib/marketing/trades";
import { breadcrumbNode, faqNode, graph, JsonLd, organizationId, siteMetadata, siteOrigin, webPageNode } from "@/lib/marketing/seo";
import { Band, Byline, Callout, Display, EdCrumbs, Eyebrow, FaqList, Related, Table, body, h2, muted, pill, proseLink, type RelatedItem } from "@/lib/marketing/editorial";
import { formatDateTr, siteContentModified } from "@/lib/marketing/guides-data";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return calculators.map(c => ({ slug: c.slug })); }
export async function generateMetadata({ params }: Props) {
  const { slug } = await params; const s = calcSeo[slug];
  return s ? siteMetadata(s.metaTitle, s.metaDescription, `/hesaplama-araclari/${slug}`) : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params; const c = calculators.find(x => x.slug === slug); const s = calcSeo[slug]; if (!c || !s) notFound();
  const path = `/hesaplama-araclari/${c.slug}`; const url = `${siteOrigin}${path}`;
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Hesaplama Araçları", path: "/hesaplama-araclari" }, { name: s.h1, path }];
  const isMarj = slug === "kar-marji";
  const relGuides = s.guides.map(g => guides.find(x => x.slug === g)).filter(Boolean) as (typeof guides)[number][];
  const tradeSlug = s.trades.length === 1 ? s.trades[0] : undefined; const trade = tradeSlug ? tradeBySlug(tradeSlug) : undefined;
  const related: RelatedItem[] = [
    ...relGuides.slice(0, 2).map(g => ({ href: `/rehber/${g.slug}`, label: g.title, note: g.answer })),
    ...(trade ? [{ href: `/meslekler/${trade.slug}`, label: `${trade.name} sayfası`, note: "İş kapsamını ve örnek teklifi gör." }] : []),
    { href: trade ? `/usta-bul?category=${trade.category}` : "/usta-bul", label: trade ? `${trade.name} ustası bul` : "Usta bul", note: "Yayındaki profilleri gör." },
  ].slice(0, 4);
  return <>
    <JsonLd data={graph(
      webPageNode({ path, name: s.metaTitle, description: s.metaDescription }), breadcrumbNode(crumbs),
      { "@type": "WebApplication", "@id": `${url}#app`, name: s.h1, url, description: s.answer, applicationCategory: "BusinessApplication", operatingSystem: "Web", inLanguage: "tr-TR", isAccessibleForFree: true, offers: { "@type": "Offer", price: 0, priceCurrency: "TRY" }, publisher: { "@id": organizationId }, mainEntityOfPage: { "@id": `${url}#webpage` } },
      faqNode(path, s.faqs),
    )} />
    <Band>
      <EdCrumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Hesaplama Araçları", href: "/hesaplama-araclari" }, { name: s.h1 }]} />
      <div className="mt-6 max-w-[68ch]">
        <Eyebrow>Ücretsiz hesaplayıcı</Eyebrow>
        <Display>{s.h1}</Display>
        <Byline updatedLabel="Son güncelleme" modified={siteContentModified} formatted={formatDateTr(siteContentModified)} />
        <p className={`mt-6 ${body} text-[1.1875rem] font-medium sm:text-[1.375rem] sm:leading-[1.5]`}>{s.answer}</p>
      </div>
    </Band>
    <Band><div className="min-w-0"><Calculator kind={c.kind} analyticsEnabled={process.env.ANALYTICS_ENABLED === "true"} /></div></Band>
    <Band tone="gray" narrow label="how">
      <h2 id="how" className={h2}>Nasıl hesaplanır?</h2>
      <p className={`mt-4 ${body} font-medium`}>{s.formula}</p>
      <h3 className="mt-10 text-xl font-semibold tracking-[-.02em]">Örnek hesap</h3><p className={`mt-3 ${body}`}>{s.example}</p>
      <Callout tone="warn" title="Sınırlar"><p>Bu hesap piyasa fiyatı veya bağlayıcı teklif değildir; sonuç yalnızca girdiğin değerlere dayanır. Vergiler dahil değildir. <Link href="/metodoloji" className={proseLink}>Metodolojiyi oku</Link></p></Callout>
      {isMarj && <>
        <h2 className={`${h2} mt-14`}>Kâr marjı ve markup farkı</h2>
        <p className={`mt-4 ${body}`}>Aynı kâr, hangi tabana bölündüğüne göre iki farklı yüzde verir.</p>
        <Table caption={marjMarkupTable.caption} head={marjMarkupTable.head} rows={marjMarkupTable.rows} />
        <p className="mt-6"><Link href="/rehber/kar-marji-nasil-hesaplanir" className={pill}>Kâr marjı nasıl hesaplanır rehberi</Link></p>
      </>}
    </Band>
    <Band narrow label="faq-title"><FaqList items={s.faqs} /></Band>
    <Band tone="gray" label="more">
      <Related items={related} id="more" title="İlgili rehberler ve usta listesi" />
      <p className={`mt-8 ${muted}`}><Link href="/rehber" className={proseLink}>Tüm rehberler</Link> · <Link href="/hesaplama-araclari" className={proseLink}>Tüm hesaplama araçları</Link></p>
    </Band>
  </>;
}

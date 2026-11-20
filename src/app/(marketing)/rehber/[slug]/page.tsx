import Link from "next/link";
import { notFound } from "next/navigation";
import { guides, guideChecks } from "@/lib/marketing/content";
import { calculators } from "@/lib/marketing/calculators";
import { formatDateTr, guideMetaTitles, guideDates, guideFaqs, guideGroups, guideLeads, guideTables, guideTradeSlugs, marjGuideSlugs, marjMarkupTable, sourcesFor } from "@/lib/marketing/guides-data";
import { breadcrumbNode, faqNode, graph, JsonLd, organizationId, siteMetadata, siteOrigin, siteSummary, webPageNode, websiteId } from "@/lib/marketing/seo";
import { tradeBySlug } from "@/lib/marketing/trades";
import { Band, Byline, Callout, Display, EdCrumbs, Eyebrow, FaqList, Photo, Related, SourceList, Summary, Table, body, h2, imageNode, muted, pill, pillOutline, proseLink, type RelatedItem } from "@/lib/marketing/editorial";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return guides.map(g => ({ slug: g.slug })); }
export async function generateMetadata({ params }: Props) {
  const { slug } = await params; const g = guides.find(x => x.slug === slug);
  return g ? siteMetadata(guideMetaTitles[g.slug] ?? g.title, g.answer.length > 155 ? `${g.answer.slice(0, 152).trimEnd()}...` : g.answer, `/rehber/${g.slug}`, { type: "article", publishedTime: guideDates[g.slug].published, modifiedTime: guideDates[g.slug].modified }) : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params; const g = guides.find(x => x.slug === slug); if (!g) notFound();
  const path = `/rehber/${g.slug}`; const url = `${siteOrigin}${path}`; const dates = guideDates[g.slug];
  const checks = guideChecks[g.slug]; const table = guideTables[g.slug]; const faqs = guideFaqs[g.slug]; const sources = sourcesFor(g.slug); const lead = guideLeads[g.slug];
  const group = guideGroups.find(x => (x.slugs as readonly string[]).includes(g.slug))!;
  const siblings = guides.filter(x => x.slug !== g.slug && (group.slugs as readonly string[]).includes(x.slug)).slice(0, 2);
  const other = guides.find(x => x.slug !== g.slug && !siblings.includes(x) && !(group.slugs as readonly string[]).includes(x.slug));
  const calc = calculators.find(c => g.related === `/hesaplama-araclari/${c.slug}`);
  const trade = tradeBySlug(guideTradeSlugs(g.slug)[0]);
  const photo = ["boyaci-teklifi-nasil-hazirlanir", "elektrik-isi-nasil-fiyatlandirilir"].includes(g.slug) && trade ? { src: `/images/marketing/${trade.image}.webp`, alt: trade.imageAlt, caption: "Temsili görsel" } : null;
  const isCustomer = g.slug === "usta-yaklasik-fiyat-nasil-alinir";
  const isMarj = (marjGuideSlugs as readonly string[]).includes(g.slug);
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Rehber", path: "/rehber" }, { name: g.title, path }];
  const related: RelatedItem[] = [
    ...(calc ? [{ href: g.related, label: calc.title, note: "Kendi rakamlarınla hesapla." }] : []),
    ...siblings.map(s => ({ href: `/rehber/${s.slug}`, label: s.title })),
    trade ? { href: `/usta-bul?category=${trade.category}`, label: `${trade.name} ustası bul`, note: "İlgili hizmette yayındaki profilleri gör." } : { href: "/usta-bul", label: "Usta bul", note: "Hizmete ve ilçeye göre ustaları gör." },
  ].slice(0, 4);
  return <article>
    <JsonLd data={graph(
      webPageNode({ path, name: g.title, description: g.answer }), breadcrumbNode(crumbs),
      { "@type": "Article", "@id": `${url}#article`, headline: g.title, description: g.answer, datePublished: dates.published, dateModified: dates.modified, inLanguage: "tr-TR", isAccessibleForFree: true, author: { "@id": organizationId }, publisher: { "@id": organizationId }, publishingPrinciples: `${siteOrigin}/yayin-politikasi`, isPartOf: { "@id": websiteId }, mainEntityOfPage: { "@id": `${url}#webpage` }, image: photo ? { "@id": `${url}#photo` } : `${siteOrigin}/api/og?${new URLSearchParams({ title: g.title, description: g.answer })}`, citation: sources.map(s => ({ "@type": "CreativeWork", name: s.label, url: s.url.startsWith("http") ? s.url : `${siteOrigin}${s.url}` })) },
      ...(photo ? [imageNode(url, "photo", photo.src, photo.alt, photo.caption)] : []),
      ...(faqs ? [faqNode(path, faqs)] : []),
    )} />
    <Band>
      <div className="mx-auto max-w-[68ch]">
        <EdCrumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Rehber", href: "/rehber" }, { name: g.title }]} />
        <div className="mt-6"><Eyebrow>{group.question}</Eyebrow></div>
        <Display>{g.title}</Display>
        <Byline updatedLabel="Son güncelleme" modified={dates.modified} formatted={formatDateTr(dates.modified)} />
        <p className={`mt-8 ${body} text-[1.1875rem] font-medium sm:text-[1.375rem] sm:leading-[1.5]`}>{lead.direct}</p>
        <Summary items={lead.summary} />
        {photo && <div className="mt-8"><Photo src={photo.src} alt={photo.alt} caption={photo.caption} priority sizes="(min-width: 768px) 68ch, 100vw" /></div>}
        <p className={`mt-6 text-sm leading-6 ${muted}`}>{siteSummary} Bu yazıdaki rakamlar hesap örneğidir, piyasa fiyatı değildir.</p>
      </div>
    </Band>
    <Band tone="gray" narrow>
      <h2 className={h2}>Formül</h2><p className={`mt-4 ${body} font-medium`}>{g.formula}</p>
      <h2 className={`${h2} mt-14`}>Çalışılmış örnek</h2><p className={`mt-4 ${body}`}>{g.example}</p>
      {table && <Table caption={table.caption} head={table.head} rows={table.rows} />}
      <Callout tone="note" title="Örnekteki varsayımlar"><p>{lead.assumptions}</p></Callout>
      {isMarj && <>
        <h2 className={`${h2} mt-14`}>Kâr marjı ve markup farkı</h2>
        <p className={`mt-4 ${body}`}>İki yüzde aynı kârdan çıkar ama farklı tabana bölünür. Aşağıdaki tablo aynı 20.000 TL maliyeti iki yöntemle gösterir.</p>
        <Table caption={marjMarkupTable.caption} head={marjMarkupTable.head} rows={marjMarkupTable.rows} />
        <p className="mt-6"><Link href="/hesaplama-araclari/kar-marji" className={pill}>Kâr marjı hesaplama aracı</Link></p>
        <p className={`mt-4 ${body}`}>{g.slug === "kar-marji-nasil-hesaplanir" ? <>Farkı ayrıntısıyla <Link href="/rehber/markup-ve-marj-farki" className={proseLink}>markup ve marj rehberinde</Link> oku.</> : <>Marjın nasıl çıkarıldığını <Link href="/rehber/kar-marji-nasil-hesaplanir" className={proseLink}>kâr marjı nasıl hesaplanır rehberinde</Link> adım adım gör.</>}</p>
      </>}
    </Band>
    <Band narrow>
      <h2 className={h2}>Uygulamada neye dikkat etmeli?</h2><p className={`mt-4 ${body}`}>{g.detail}</p>
      <h2 className={`${h2} mt-14`}>{checks.heading}</h2>
      <ul className="mt-5 grid gap-3">{checks.items.map(item => <li key={item} className="flex gap-3 border-t border-[#d2d2d7] pt-4 leading-[1.6]"><span aria-hidden="true" className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-[#e4f0ed] text-xs font-bold text-[#075d54]">✓</span><span className="min-w-0">{item}</span></li>)}</ul>
      <Callout tone="warn" title="Sınırlar"><p>{checks.caution}</p></Callout>
      {isCustomer && <Callout tone="note" title="KaçaYapayım'da teklif al"><p>İşini tarif et, bölgendeki ustalardan teklif gelsin. Teklifleri kapsamlarıyla yan yana karşılaştır. Müşteri olarak kullanım ücretsizdir.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/talepler/yeni" className={pill}>İş ilanı ver</Link><Link href="/usta-bul" className={pillOutline}>Usta bul</Link></div></Callout>}
    </Band>
    {faqs && <Band tone="gray" narrow label="faq-title"><FaqList items={faqs} /></Band>}
    <Band tone={faqs ? "white" : "gray"} label="related">
      <Related items={related} title="Aynı konudaki rehberler ve araçlar" />
      <p className={`mt-8 ${muted}`}>Diğer rehberler: {other && <><Link href={`/rehber/${other.slug}`} className={proseLink}>{other.title}</Link>{" · "}</>}<Link href="/rehber" className={proseLink}>Tüm rehberler</Link></p>
      <div className="mt-12 max-w-[68ch]"><SourceList items={sources} /></div>
    </Band>
  </article>;
}

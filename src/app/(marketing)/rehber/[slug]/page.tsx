import Link from "next/link";
import { notFound } from "next/navigation";
import { guides, guideChecks, professions } from "@/lib/marketing/content";
import { calculators } from "@/lib/marketing/calculators";
import { formatDateTr, guideMetaTitles, guideDates, guideFaqs, guideGroups, guideTables, guideTradeSlugs, sourcesFor } from "@/lib/marketing/guides-data";
import { breadcrumbNode, faqNode, graph, JsonLd, organizationId, siteMetadata, siteOrigin, siteSummary, webPageNode, websiteId } from "@/lib/marketing/seo";
import { btnPrimary, btnSecondary, card, chip, DataTable, Eyebrow, Faq, h2Class, PageShell, Crumbs, Sources } from "@/lib/marketing/blocks";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return guides.map(g => ({ slug: g.slug })); }
export async function generateMetadata({ params }: Props) {
  const { slug } = await params; const g = guides.find(x => x.slug === slug);
  return g ? siteMetadata(guideMetaTitles[g.slug] ?? g.title, g.answer.length > 155 ? `${g.answer.slice(0, 152).trimEnd()}...` : g.answer, `/rehber/${g.slug}`, { type: "article", publishedTime: guideDates[g.slug].published, modifiedTime: guideDates[g.slug].modified }) : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params; const g = guides.find(x => x.slug === slug); if (!g) notFound();
  const path = `/rehber/${g.slug}`; const url = `${siteOrigin}${path}`; const dates = guideDates[g.slug];
  const checks = guideChecks[g.slug]; const table = guideTables[g.slug]; const faqs = guideFaqs[g.slug]; const sources = sourcesFor(g.slug);
  const group = guideGroups.find(x => (x.slugs as readonly string[]).includes(g.slug))!;
  const siblings = guides.filter(x => x.slug !== g.slug && (group.slugs as readonly string[]).includes(x.slug));
  const others = guides.filter(x => x.slug !== g.slug && !siblings.includes(x));
  const calc = calculators.find(c => g.related === `/hesaplama-araclari/${c.slug}`);
  const trades = guideTradeSlugs(g.slug).map(s => professions.find(p => p.slug === s)!);
  const isCustomer = g.slug === "usta-yaklasik-fiyat-nasil-alinir";
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Rehber", path: "/rehber" }, { name: g.title, path }];
  return <PageShell><article className="mx-auto max-w-3xl">
    <JsonLd data={graph(
      webPageNode({ path, name: g.title, description: g.answer }), breadcrumbNode(crumbs),
      { "@type": "Article", "@id": `${url}#article`, headline: g.title, description: g.answer, datePublished: dates.published, dateModified: dates.modified, inLanguage: "tr-TR", isAccessibleForFree: true, author: { "@id": organizationId }, publisher: { "@id": organizationId }, isPartOf: { "@id": websiteId }, mainEntityOfPage: { "@id": `${url}#webpage` }, image: `${siteOrigin}/api/og?${new URLSearchParams({ title: g.title, description: g.answer })}`, citation: sources.map(s => ({ "@type": "CreativeWork", name: s.label, url: s.url.startsWith("http") ? s.url : `${siteOrigin}${s.url}` })) },
      ...(faqs ? [faqNode(path, faqs)] : []),
    )} />
    <Crumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Rehber", href: "/rehber" }, { name: g.title }]} />
    <Eyebrow>{group.question}</Eyebrow>
    <h1 className="mt-3 text-[clamp(2rem,5vw,3rem)] font-bold leading-[1.1] tracking-[-.03em] text-balance">{g.title}</h1>
    <p className="mt-4 text-sm text-[#5B6460]">KaçaYapayım Editör Ekibi · İlk yayın: <time dateTime={dates.published}>{formatDateTr(dates.published)}</time> · Son güncelleme: <time dateTime={dates.modified}>{formatDateTr(dates.modified)}</time></p>
    <p className="mt-8 rounded-2xl border-l-4 border-[#075D54] bg-white p-6 text-lg leading-8">{g.answer}</p>
    <p className="mt-3 text-sm leading-6 text-[#5B6460]">{siteSummary} Bu yazıdaki rakamlar hesap örneğidir, piyasa fiyatı değildir.</p>
    <section className="mt-12"><h2 className={h2Class}>Formül</h2><p className="mt-4 rounded-2xl bg-[#E4F0ED] p-6 font-medium leading-8">{g.formula}</p></section>
    <section className="mt-12"><h2 className={h2Class}>Örnek hesap</h2><p className="mt-4 text-lg leading-8 text-[#3F4944]">{g.example}</p>{table && <DataTable caption={table.caption} head={table.head} rows={table.rows} />}</section>
    <section className="mt-12"><h2 className={h2Class}>Uygulamada neye dikkat etmeli?</h2><p className="mt-4 text-lg leading-8 text-[#3F4944]">{g.detail}</p></section>
    <section className="mt-12"><h2 className={h2Class}>{checks.heading}</h2><ul className="mt-5 grid gap-3">{checks.items.map(item => <li key={item} className="rounded-2xl border border-[#E7E1D6] bg-white p-5 leading-7 text-[#3F4944]">{item}</li>)}</ul><p className="mt-5 text-sm leading-7 text-[#5B6460]">{checks.caution}</p></section>
    {isCustomer && <section className="mt-12 rounded-2xl bg-[#F7EBD6] p-6"><h2 className="text-xl font-bold">KaçaYapayım&apos;da teklif al</h2><p className="mt-3 leading-7">İşini tarif et, bölgendeki ustalardan teklif gelsin. Teklifleri kapsamlarıyla yan yana karşılaştır.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/talepler/yeni" className={btnPrimary}>İş ilanı ver</Link><Link href="/usta-bul" className={btnSecondary}>Usta bul</Link></div></section>}
    {faqs && <Faq items={faqs} />}
    <section className="mt-12"><h2 className={h2Class}>İlgili içerikler</h2>
      <div className="mt-5 flex flex-wrap gap-3">{calc ? <Link className={btnPrimary} href={g.related}>{calc.title}</Link> : <Link className={btnPrimary} href="/talepler/yeni">İş ilanı ver</Link>}<Link className={btnSecondary} href="/metodoloji">Metodolojiyi oku</Link></div>
      <h3 className="mt-8 font-semibold">Meslekler</h3><div className="mt-3 flex flex-wrap gap-3">{trades.map(p => <Link key={p.slug} className={chip} href={`/meslekler/${p.slug}`}>{p.name} ustası bul</Link>)}</div>
      <h3 className="mt-8 font-semibold">Aynı konudaki rehberler</h3><div className="mt-3 grid gap-3">{siblings.map(s => <Link key={s.slug} href={`/rehber/${s.slug}`} className={`${card} block hover:border-[#075D54]`}><span className="font-semibold">{s.title}</span></Link>)}</div>
      <h3 className="mt-8 font-semibold">Diğer rehberler</h3><ul className="mt-2 grid gap-1">{others.map(s => <li key={s.slug}><Link href={`/rehber/${s.slug}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{s.title}</Link></li>)}</ul>
      <p className="mt-6"><Link href="/rehber" className="font-semibold text-[#075D54] underline underline-offset-4">Tüm rehberler</Link></p></section>
    <Sources items={sources} />
  </article></PageShell>;
}

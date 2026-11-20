import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculator } from "@/components/marketing/calculator";
import { calculators } from "@/lib/marketing/calculators";
import { calcSeo } from "@/lib/marketing/calc-seo";
import { guides, professions } from "@/lib/marketing/content";
import { breadcrumbNode, faqNode, graph, JsonLd, organizationId, siteMetadata, siteOrigin, webPageNode } from "@/lib/marketing/seo";
import { card, chip, Crumbs, Faq, h2Class, Hero, PageShell } from "@/lib/marketing/blocks";

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
  const relGuides = s.guides.map(g => guides.find(x => x.slug === g)).filter(Boolean) as (typeof guides)[number][];
  return <PageShell>
    <JsonLd data={graph(
      webPageNode({ path, name: s.metaTitle, description: s.metaDescription }), breadcrumbNode(crumbs),
      { "@type": "WebApplication", "@id": `${url}#app`, name: s.h1, url, applicationCategory: "BusinessApplication", operatingSystem: "Web", inLanguage: "tr-TR", isAccessibleForFree: true, offers: { "@type": "Offer", price: 0, priceCurrency: "TRY" }, provider: { "@id": organizationId }, mainEntityOfPage: { "@id": `${url}#webpage` } },
      faqNode(path, s.faqs),
    )} />
    <Crumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Hesaplama Araçları", href: "/hesaplama-araclari" }, { name: s.h1 }]} />
    <Hero eyebrow="Ücretsiz hesaplayıcı" title={s.h1} lead={s.answer} />
    <div className="mt-10 min-w-0"><Calculator kind={c.kind} analyticsEnabled={process.env.ANALYTICS_ENABLED === "true"} /></div>
    <section className="mt-14 max-w-3xl" aria-labelledby="how"><h2 id="how" className={h2Class}>Nasıl hesaplanır?</h2>
      <p className="mt-4 rounded-2xl bg-[#E4F0ED] p-6 font-medium leading-8">{s.formula}</p>
      <h3 className="mt-8 text-lg font-semibold">Örnek hesap</h3><p className="mt-2 text-lg leading-8 text-[#3F4944]">{s.example}</p>
      <p className="mt-4 text-sm leading-6 text-[#5B6460]">Bu hesap piyasa fiyatı veya bağlayıcı teklif değildir. <Link href="/metodoloji" className="font-semibold text-[#075D54] underline underline-offset-4">Metodolojiyi oku</Link></p></section>
    <Faq items={s.faqs} />
    <section className="mt-14" aria-labelledby="more"><h2 id="more" className={h2Class}>İlgili rehberler ve meslekler</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{relGuides.map(g => <Link key={g.slug} href={`/rehber/${g.slug}`} className={`${card} block hover:border-[#075D54]`}><span className="font-semibold">{g.title}</span></Link>)}</div>
      <div className="mt-5 flex flex-wrap gap-3">{s.trades.map(t => <Link key={t} href={`/meslekler/${t}`} className={chip}>{professions.find(p => p.slug === t)!.name} ustası bul</Link>)}<Link href="/rehber" className={chip}>Tüm rehberler</Link></div></section>
  </PageShell>;
}

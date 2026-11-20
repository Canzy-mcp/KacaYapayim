import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guides, professions } from "@/lib/marketing/content";
import { calculators } from "@/lib/marketing/calculators";
import { breadcrumbNode, faqNode, graph, JsonLd, organizationId, siteMetadata, siteOrigin, siteSummary, webPageNode } from "@/lib/marketing/seo";
import { quotePrice, tadilatImage, tl, tradeBySlug, trades } from "@/lib/marketing/trades";
import { btnPrimary, btnSecondary, card, chip, Checklist, Crumbs, DataTable, Eyebrow, Faq, h2Class, Hero, PageShell } from "@/lib/marketing/blocks";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return professions.map(p => ({ slug: p.slug })); }
export async function generateMetadata({ params }: Props) {
  const { slug } = await params; const t = tradeBySlug(slug);
  return t ? siteMetadata(t.metaTitle, t.metaDescription, `/meslekler/${t.slug}`) : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params; const t = tradeBySlug(slug); const p = professions.find(x => x.slug === slug);
  if (!t || !p) notFound();
  const path = `/meslekler/${t.slug}`; const url = `${siteOrigin}${path}`;
  const price = quotePrice(t.quote.cost, t.quote.margin);
  const related = t.guides.map(g => guides.find(x => x.slug === g)).filter(Boolean) as (typeof guides)[number][];
  const calcs = t.calculators.map(c => calculators.find(x => x.slug === c)).filter(Boolean) as (typeof calculators)[number][];
  const allGuides = guides.filter(g => !t.guides.includes(g.slug));
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Meslekler", path: "/meslekler" }, { name: t.name, path }];
  const quoteHref = `/usta-bul?category=${t.category}`; const jobHref = `/talepler/yeni?category=${t.category}`;
  return <PageShell>
    <JsonLd data={graph(
      webPageNode({ path, name: t.metaTitle, description: t.metaDescription }),
      breadcrumbNode(crumbs),
      { "@type": "Service", "@id": `${url}#service`, name: `${t.name} hizmeti`, serviceType: t.name, description: t.answer, url, image: `${siteOrigin}/images/marketing/${t.image}.webp`, areaServed: { "@type": "Country", name: "Türkiye" }, provider: { "@id": organizationId }, mainEntityOfPage: { "@id": `${url}#webpage` } },
      faqNode(path, t.faqs),
    )} />
    <Crumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Meslekler", href: "/meslekler" }, { name: t.name }]} />
    <div className="grid min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
      <Hero eyebrow={t.name} title={t.h1} lead={t.answer}>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href={quoteHref} className={btnPrimary}>Bu hizmette usta bul</Link>
          <Link href={jobHref} className={btnSecondary}>İş ilanı ver</Link>
        </div>
        <p className="mt-4 text-sm text-[#5B6460]">{siteSummary}</p>
      </Hero>
      <figure className="min-w-0"><div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#E7E1D6] bg-[#F4EFE4]"><Image src={`/images/marketing/${t.image}.webp`} alt={t.imageAlt} fill priority sizes="(min-width: 1024px) 440px, 100vw" className="object-cover" /></div><figcaption className="mt-2 text-xs text-[#5B6460]">Temsili görsel</figcaption></figure>
    </div>

    <section className="mt-16" aria-labelledby="drivers"><Eyebrow>Fiyatı ne belirler?</Eyebrow><h2 id="drivers" className={`mt-2 ${h2Class}`}>{t.name} işinde fiyatı etkileyen kalemler</h2>
      <DataTable caption={`${t.name} işi fiyat etkenleri`} head={["Etken", "Fiyata etkisi"]} rows={t.drivers} /></section>

    <section className="mt-16" aria-labelledby="scope"><Eyebrow>Keşifte sor</Eyebrow><h2 id="scope" className={`mt-2 ${h2Class}`}>Kapsam kontrol listesi</h2>
      <p className="mt-3 max-w-2xl leading-7 text-[#3F4944]">Teklifleri karşılaştırmadan önce bu maddelerin yazılı olduğundan emin ol. Eksik kalem, sonradan ek ücret demektir.</p>
      <Checklist items={t.scope} /></section>

    <section className="mt-16" aria-labelledby="example"><Eyebrow>Birlikte hesaplayalım</Eyebrow><h2 id="example" className={`mt-2 ${h2Class}`}>Örnek teklif hesabı</h2>
      <p className="mt-3 max-w-2xl leading-7 text-[#3F4944]">{p.example}</p>
      {t.quote.lines.length > 0 && <DataTable caption="Maliyet kalemleri" head={["Kalem", "Tutar"]} rows={[...t.quote.lines.map(([l, n]) => [l, tl(n)]), ["Toplam maliyet", tl(t.quote.cost)]]} />}
      <div className={`${card} mt-5 grid gap-2`}><p className="font-semibold">Toplam maliyet {tl(t.quote.cost)}, hedef marj %{t.quote.margin}</p><p className="leading-7 text-[#3F4944]">{tl(t.quote.cost)} ÷ {(1 - t.quote.margin / 100).toFixed(2).replace(".", ",")} = {tl(price.exact, 2)}. Yüz TL yukarı yuvarlanınca öneri {tl(price.rounded)} olur.</p></div>
      <p className="mt-3 text-sm text-[#5B6460]">Rakamlar açıklama amaçlı örnektir, piyasa fiyatı değildir. Kendi alış ve işçilik maliyetlerini girmen gerekir. <Link href="/metodoloji" className="font-semibold text-[#075D54] underline underline-offset-4">Yöntemi incele</Link></p>
    </section>

    <section className="mt-16" aria-labelledby="related"><h2 id="related" className={h2Class}>İlgili rehberler ve hesaplama araçları</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{related.map(g => <Link key={g.slug} href={`/rehber/${g.slug}`} className={`${card} block hover:border-[#075D54]`}><p className="font-semibold">{g.title}</p><p className="mt-2 text-sm leading-6 text-[#5B6460]">{g.answer}</p></Link>)}</div>
      <div className="mt-5 flex flex-wrap gap-3">{calcs.map(c => <Link key={c.slug} href={`/hesaplama-araclari/${c.slug}`} className={chip}>{c.title}</Link>)}</div>
      <details className="mt-5"><summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-[#075D54]">Tüm rehberleri göster</summary><ul className="mt-2 grid gap-1">{allGuides.map(g => <li key={g.slug}><Link href={`/rehber/${g.slug}`} className="inline-flex min-h-11 items-center underline underline-offset-4">{g.title}</Link></li>)}</ul></details>
    </section>

    <Faq items={t.faqs} />

    <aside className="mt-16 grid min-w-0 items-center gap-6 rounded-2xl border border-[#E7E1D6] bg-white p-5 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl"><Image src={tadilatImage.src} alt={tadilatImage.alt} fill sizes="200px" className="object-cover" /></div>
      <div><h2 className="text-xl font-bold">Tadilat işin de mi var?</h2><p className="mt-2 leading-7 text-[#3F4944]">Banyo, fayans ve genel tadilat için bölgendeki ustaları gör ya da işini tarif edip teklif al.</p><Link href={`/usta-bul?category=${tadilatImage.category}`} className={`${btnSecondary} mt-4`}>Tadilat ustası bul</Link></div>
    </aside>
    <p className="mt-8 text-sm text-[#5B6460]">Diğer meslekler: {trades.filter(o => o.slug !== t.slug).map((o, i) => <span key={o.slug}>{i > 0 && ", "}<Link href={`/meslekler/${o.slug}`} className="underline underline-offset-4">{o.name}</Link></span>)}</p>
  </PageShell>;
}

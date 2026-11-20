import Link from "next/link";
import { notFound } from "next/navigation";
import { guides, professions } from "@/lib/marketing/content";
import { calculators } from "@/lib/marketing/calculators";
import { breadcrumbNode, faqNode, graph, JsonLd, organizationId, siteMetadata, siteOrigin, siteSummary, webPageNode } from "@/lib/marketing/seo";
import { quotePrice, tadilatImage, tl, tradeBySlug, trades } from "@/lib/marketing/trades";
import { Band, Callout, Checks, Display, EdCrumbs, Eyebrow, FaqList, Photo, Related, Table, body, h2, imageNode, muted, pill, pillOutline, proseLink, type RelatedItem } from "@/lib/marketing/editorial";

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
  const guide = t.guides.map(g => guides.find(x => x.slug === g)).filter(Boolean) as (typeof guides)[number][];
  const calc = t.calculators.map(c => calculators.find(x => x.slug === c)).filter(Boolean)[0] as (typeof calculators)[number] | undefined;
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Meslekler", path: "/meslekler" }, { name: t.name, path }];
  const quoteHref = `/usta-bul?category=${t.category}`; const jobHref = `/talepler/yeni?category=${t.category}`;
  const heroSrc = `/images/marketing/${t.image}.webp`;
  // trade -> its guides -> calculator -> filtered directory, max four contextual links
  const related: RelatedItem[] = [
    ...guide.slice(0, 2).map(g => ({ href: `/rehber/${g.slug}`, label: g.title, note: g.answer })),
    ...(calc ? [{ href: `/hesaplama-araclari/${calc.slug}`, label: calc.title, note: calc.description }] : []),
    { href: quoteHref, label: `${t.name} ustası bul`, note: "Bu hizmette yayındaki profilleri filtrelenmiş olarak gör." },
  ];
  return <>
    <JsonLd data={graph(
      { ...webPageNode({ path, name: t.metaTitle, description: t.metaDescription }), primaryImageOfPage: { "@id": `${url}#photo` } },
      breadcrumbNode(crumbs),
      // KaçaYapayım is the platform (broker); the service itself is carried out by independent tradespeople listed on profiles.
      { "@type": "Service", "@id": `${url}#service`, name: `${t.name} hizmeti`, serviceType: t.name, description: t.answer, url, image: { "@id": `${url}#photo` }, areaServed: { "@type": "Country", name: "Türkiye" }, broker: { "@id": organizationId }, audience: { "@type": "Audience", audienceType: "Ev sahipleri ve kiracılar" }, mainEntityOfPage: { "@id": `${url}#webpage` } },
      imageNode(url, "photo", heroSrc, t.imageAlt, "Temsili görsel"),
      imageNode(url, "photo-tadilat", tadilatImage.src, tadilatImage.alt, "Temsili görsel"),
      faqNode(path, t.faqs),
    )} />
    <Band>
      <EdCrumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Meslekler", href: "/meslekler" }, { name: t.name }]} />
      <div className="mt-8 grid min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] lg:gap-16">
        <header className="min-w-0">
          <Eyebrow>{t.name}</Eyebrow>
          <Display>{t.h1}</Display>
          <p className={`mt-6 max-w-[56ch] ${body} ${muted}`}>{t.answer}</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href={quoteHref} className={pill}>Bu hizmette usta bul</Link><Link href={jobHref} className={pillOutline}>İş ilanı ver</Link></div>
          <p className={`mt-5 max-w-[56ch] text-sm leading-6 ${muted}`}>{siteSummary} Müşteri olarak kullanım ücretsizdir.</p>
        </header>
        <Photo src={heroSrc} alt={t.imageAlt} caption="Temsili görsel" priority sizes="(min-width: 1024px) 480px, 100vw" />
      </div>
    </Band>

    <Band tone="gray" label="scope">
      <Eyebrow>Keşifte sor</Eyebrow><h2 id="scope" className={`mt-2 ${h2}`}>Kapsam kontrol listesi</h2>
      <p className={`mt-4 max-w-[68ch] ${body} ${muted}`}>Teklifleri karşılaştırmadan önce bu maddelerin yazılı olduğundan emin ol. Eksik kalem, sonradan ek ücret demektir.</p>
      <Checks items={t.scope} />
    </Band>

    <Band label="drivers">
      <Eyebrow>Fiyatı ne belirler?</Eyebrow><h2 id="drivers" className={`mt-2 ${h2}`}>{t.name} işinde fiyatı etkileyen kalemler</h2>
      <div className="max-w-[68ch]"><Table caption={`${t.name} işi fiyat etkenleri`} head={["Etken", "Fiyata etkisi"]} rows={t.drivers} /></div>
    </Band>

    <Band tone="gray" label="example">
      <div className="max-w-[68ch]">
        <Eyebrow>Birlikte hesaplayalım</Eyebrow><h2 id="example" className={`mt-2 ${h2}`}>Örnek teklif hesabı</h2>
        <p className={`mt-4 ${body}`}>{p.example}</p>
        {t.quote.lines.length > 0 && <Table caption="Maliyet kalemleri (TRY)" head={["Kalem", "Tutar"]} rows={[...t.quote.lines.map(([l, n]) => [l, tl(n)]), ["Toplam maliyet", tl(t.quote.cost)]]} />}
        <Callout title="Hesap"><p className="font-semibold">Toplam maliyet {tl(t.quote.cost)}, hedef marj %{t.quote.margin}</p><p className="mt-2">{tl(t.quote.cost)} ÷ {(1 - t.quote.margin / 100).toFixed(2).replace(".", ",")} = {tl(price.exact, 2)}. Yüz TL yukarı yuvarlanınca öneri {tl(price.rounded)} olur.</p></Callout>
        <Callout tone="warn" title="Varsayımlar ve sınırlar"><p>Maliyet kalemleri açıklama amaçlı örnektir, piyasa fiyatı değildir. Marj, kârın satış fiyatına oranıdır; vergiler ve genel giderler hesaba katılmadı. Kendi alış ve işçilik maliyetlerini girmen gerekir. <Link href="/metodoloji" className={proseLink}>Yöntemi incele</Link></p></Callout>
        <p className={`mt-6 ${body}`}>Yüzde kafa karıştırıyorsa <Link href="/hesaplama-araclari/kar-marji" className={proseLink}>kâr marjı hesaplama aracını</Link> dene ya da <Link href="/rehber/kar-marji-nasil-hesaplanir" className={proseLink}>kâr marjı nasıl hesaplanır</Link> rehberini oku.</p>
      </div>
    </Band>

    <Band label="related">
      <Related items={related} title="Rehber, araç ve usta listesi" />
      <p className={`mt-8 ${muted}`}>Daha fazlası için <Link href="/rehber" className={proseLink}>tüm rehberlere</Link> göz at.</p>
    </Band>

    <Band tone="gray" narrow label="faq-title"><FaqList items={t.faqs} /></Band>

    <Band>
      <aside className="grid min-w-0 items-center gap-8 sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        <Photo src={tadilatImage.src} alt={tadilatImage.alt} caption="Temsili görsel" sizes="260px" />
        <div><h2 className={h2}>Tadilat işin de mi var?</h2><p className={`mt-3 ${body} ${muted}`}>Banyo, fayans ve genel tadilat için bölgendeki ustaları gör ya da işini tarif edip teklif al.</p><Link href={`/usta-bul?category=${tadilatImage.category}`} className={`${pillOutline} mt-6`}>Tadilat ustası bul</Link></div>
      </aside>
      <p className={`mt-12 text-sm ${muted}`}>Diğer meslekler: {trades.filter(o => o.slug !== t.slug).map((o, i) => <span key={o.slug}>{i > 0 && ", "}<Link href={`/meslekler/${o.slug}`} className="underline underline-offset-4">{o.name}</Link></span>)}</p>
    </Band>
  </>;
}

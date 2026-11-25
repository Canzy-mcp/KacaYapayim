import Image from "next/image";
import Link from "next/link";
import { siteMetadata, JsonLd, graph, webPageNode, breadcrumbNode, siteOrigin, siteSummary } from "@/lib/marketing/seo";
import { ProfessionRequest } from "@/components/marketing/profession-request";
import { trades } from "@/lib/marketing/trades";
import { Band, Display, EdCrumbs, Eyebrow, body, h2, muted, proseLink, pillOutline } from "@/lib/marketing/editorial";

const title = "Meslekler: Usta Bul ve Fiyat Hesapla";
const description = "Boyacı, elektrikçi, tesisatçı ve klimacı için usta bul, iş ilanı ver ve maliyete dayalı teklif hesabını gör.";
export const metadata = siteMetadata(title, description, "/meslekler");

export default function Page() {
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Meslekler", path: "/meslekler" }];
  return <>
    <JsonLd data={graph(
      webPageNode({ path: "/meslekler", name: title, description, type: "CollectionPage" }),
      breadcrumbNode(crumbs),
      { "@type": "ItemList", itemListElement: trades.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: `${siteOrigin}/meslekler/${t.slug}` })) },
    )} />
    <Band>
      <EdCrumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Meslekler" }]} />
      <div className="mt-6 max-w-[68ch]"><Eyebrow>İşini bilen ustalar için</Eyebrow><Display>Her işin hesabı farklı.</Display>
        <p className={`mt-6 ${body} ${muted}`}>Mesleği seç, kapsam listesini ve örnek teklif hesabını gör, sonra bölgendeki ustaları bul. {siteSummary}</p></div>
    </Band>
    <Band tone="gray" label="trades">
      <h2 id="trades" className="sr-only">Mesleğini seç</h2>
      <ul className="grid gap-5 sm:grid-cols-2">{trades.map(t => <li key={t.slug} className="min-w-0"><Link href={`/meslekler/${t.slug}`} className="block h-full overflow-hidden rounded-xl border border-line-strong bg-white no-underline transition-colors duration-150 hover:border-primary">
        <span className="relative block aspect-[4/3] bg-canvas"><Image src={`/images/marketing/${t.image}.webp`} alt={t.imageAlt} fill sizes="(min-width: 640px) 540px, 100vw" className="object-cover" /></span>
        <span className="block p-6"><span className="block text-[1.375rem] font-semibold tracking-heading text-ink">{t.name}</span><span className="mt-2 block leading-[1.5] text-ink-2">{t.metaDescription}</span><span className="mt-3 inline-flex min-h-11 items-center font-medium text-primary">Sayfayı aç →</span></span></Link></li>)}</ul>
      <p className="mt-6 text-sm text-muted">Meslek görselleri temsili olarak hazırlanmıştır.</p>
    </Band>
    <Band>
      <h2 className={h2}>Önce hesabını yap</h2>
      <p className={`mt-4 max-w-[56ch] ${body} ${muted}`}>Kendi maliyetinle fiyat hesabı için <Link href="/hesaplama-araclari/kar-marji" className={proseLink}>kâr marjı hesaplama aracını</Link> kullan. Adımları <Link href="/rehber" className={proseLink}>rehberlerde</Link> bulursun.</p>
      <div className="mt-6"><Link href="/usta-bul" className={pillOutline}>Tüm ustalara bak</Link></div>
    </Band>
    <Band tone="gray"><ProfessionRequest/></Band>
  </>;
}

import Link from "next/link";
import { breadcrumbNode, graph, JsonLd, siteMetadata, siteSummary, webPageNode } from "@/lib/marketing/seo";
import { card, Crumbs, Hero, PageShell, btnPrimary } from "@/lib/marketing/blocks";

const title = "Özellikler: Maliyet, Teklif ve Kâr Takibi";
const description = "Maliyet hesabı, hedef kâr, PDF teklif, teklif durumu ve gerçekleşen kâr takibi. Ustalar için KaçaYapayım özellikleri.";
export const metadata = siteMetadata(title, description, "/ozellikler");
const items = [["Maliyet hesabı", "Malzeme, işçilik, sarf ve yol giderlerini iş bazında topla."], ["Hedef kâr", "Satış fiyatı üzerinden hedef marjına göre öneri fiyatı gör."], ["Teklif hazırlama", "Kapsamı, ödeme koşullarını ve fiyatı açık bir belgede birleştir."], ["PDF ve paylaşım", "Teklifini PDF olarak indir veya bağlantıyla paylaş."], ["Teklif durumu", "Müşterinin görüntüleme ve kabul/red durumunu takip et."], ["Gerçek kâr", "İş bitince gerçek giderleri kaydedip tahminle karşılaştır."]];

export default function Page() {
  return <PageShell>
    <JsonLd data={graph(webPageNode({ path: "/ozellikler", name: title, description }), breadcrumbNode([{ name: "Ana Sayfa", path: "/" }, { name: "Özellikler", path: "/ozellikler" }]))} />
    <Crumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Özellikler" }]} />
    <Hero eyebrow="Özellikler" title="Hesabın başından işin sonuna." lead={`${siteSummary} Kendi maliyetlerinle teklif vermene ve iş tamamlandığında gerçekten ne kazandığını görmene yardım eder.`} />
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(([t, d]) => <section key={t} className={`${card} min-w-0`}><h2 className="text-xl font-semibold">{t}</h2><p className="mt-3 leading-7 text-[#3F4944]">{d}</p></section>)}</div>
    <p className="mt-8"><Link className="inline-flex min-h-11 items-center font-semibold text-[#075D54] underline underline-offset-4" href="/metodoloji">Fiyat hesabının nasıl yapıldığını öğren</Link></p>
    <Link href="/register" className={`${btnPrimary} mt-4`}>Ücretsiz Başla</Link>
  </PageShell>;
}

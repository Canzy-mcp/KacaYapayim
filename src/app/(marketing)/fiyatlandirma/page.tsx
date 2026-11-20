import Link from "next/link";
import { Check, Minus } from "lucide-react";
import type { Metadata } from "next";
import { getPlans } from "@/lib/billing/service";
import { billingAvailable } from "@/lib/billing/provider";
import { getViewer } from "@/lib/viewer";
import { siteMetadata, siteOrigin } from "@/lib/marketing/seo";
import { Band, Faq, Intro, PageHead, PageLd, headline, pillPrimary, pillSecondary, textLink, tile, title } from "@/components/marketing/acquisition/parts";
import type { Plan, PlanFeature } from "@/types/database";

const name = "Fiyatlandırma: Ücretsiz, Usta ve Pro Paketler";
const path = "/fiyatlandirma";
// Availability comes from billingAvailable(), the same check billing uses (BILLING_PROVIDER and iyzico settings).
export function generateMetadata(): Metadata {
  return siteMetadata(name, billingAvailable() ? "Ücretsiz, Usta ve Pro paketlerinin yıllık ve aylık fiyatlarını, teklif ve müşteri limitlerini karşılaştır." : "Ücretsiz, Usta ve Pro paketlerinin yıllık fiyatlarını, teklif ve müşteri limitlerini karşılaştır. Ücretli paketler çok yakında.", path);
}
export const dynamic = "force-dynamic";

const tl = (kurus: number) => `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(kurus / 100)} ₺`;
const limit = (v: number | null | undefined, one: string, many: (n: number) => string) => v === null || v === undefined ? "Sınırsız" : v === 1 ? one : many(v);
const featureRows: [PlanFeature, string][] = [["public_quotes", "Paylaşılabilir teklif bağlantısı"], ["pdf", "PDF teklif"], ["whatsapp", "WhatsApp ile paylaşım"], ["actual_profit", "Gerçek kâr takibi"], ["advanced_reports", "Gelişmiş raporlar"], ["remove_branding", "KaçaYapayım ibaresini kaldırma"], ["business_logo", "Teklifte işletme logosu"]];

export default async function Page() {
  const [plans, viewer] = await Promise.all([getPlans(), getViewer()]);
  const paidOpen = billingAvailable();
  const buyHref = viewer ? "/billing" : "/register?hesap=usta";
  const faqs: (readonly [string, string])[] = [
    paidOpen
      ? ["Paketi nasıl satın alırım?", "Usta hesabınla giriş yapıp faturalama sayfasından paketi ve ödeme dönemini seçersin. Tutarlar TL cinsindendir; vergi ve ödeme koşulları ödeme ekranında gösterilir."]
      : ["Ücretli paketler ne zaman açılıyor?", "Ücretli paketler çok yakında açılacak. O zamana kadar Ücretsiz paketle başlayabilirsin; ödeme açıldığında koşullar satın alma ekranında gösterilir."],
    ["Ücretsiz paketin sınırı nedir?", `Ücretsiz pakette ${limit(plans.find(p => p.id === "free")?.limits.monthly_quotes, "ayda 1 teklif", n => `ayda ${n} teklif`)} hazırlayabilir ve ${limit(plans.find(p => p.id === "free")?.limits.active_customers, "1 aktif müşteri", n => `${n} aktif müşteri`)} tutabilirsin.`],
    ["Yıllık ödeme neden öne çıkarılıyor?", "Yıllık fiyat, aylık fiyatın on ikiyle çarpımından düşüktür. Her pakette iki fiyatı da gösteriyoruz."],
    ["Paket almadan usta bulabilir miyim?", "Evet. Müşteriler için usta bulmak ve iş ilanı vermek her zaman ücretsiz ve paketlerden bağımsızdır."],
  ] as const;
  const cell = (on: boolean) => on ? <><Check size={18} aria-hidden="true" className="text-[#075d54]" /><span className="sr-only">Var</span></> : <><Minus size={18} aria-hidden="true" className="text-[#6e6e73]" /><span className="sr-only">Yok</span></>;
  const rows: { label: string; values: React.ReactNode[] }[] = [
    { label: "Aylık teklif", values: plans.map(p => limit(p.limits.monthly_quotes, "Ayda 1 teklif", n => `Ayda ${n} teklif`)) },
    { label: "Aktif müşteri", values: plans.map(p => limit(p.limits.active_customers, "1 müşteri", n => `${n} müşteri`)) },
    { label: "İşletme", values: plans.map(p => String(p.limits.businesses ?? "Sınırsız")) },
    { label: "Kullanıcı", values: plans.map(p => String(p.limits.users ?? "Sınırsız")) },
    ...featureRows.map(([key, label]) => ({ label, values: plans.map(p => cell(Boolean(p.features[key]))) })),
  ];
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Fiyatlandırma", path }];
  // FAQPage (faqNode) is emitted through PageLd and only for the FAQ visible below.
  // Offers only when paid plans can actually be bought; otherwise no Product/Offer markup at all.
  const offers = paidOpen ? plans.filter(p => p.id !== "free").map((p: Plan) => ({ "@type": "Product", "@id": `${siteOrigin}${path}#${p.id}`, name: `KaçaYapayım ${p.name}`, description: p.description, offers: { "@type": "Offer", price: p.yearly_price_kurus / 100, priceCurrency: "TRY", url: `${siteOrigin}${path}`, availability: "https://schema.org/InStock" } })) : [];
  return <>
    <PageLd path={path} name={name} description="Paket fiyatları ve limitleri." crumbs={crumbs} faqs={faqs} extra={offers} />
    <PageHead crumbs={[{ name: "Ana Sayfa", href: "/" }, { name: "Fiyatlandırma" }]} eyebrow="Fiyatlandırma" h="İşin büyüdükçe yanında." text="Müşteriler için usta bulmak ve ilan açmak ücretsiz. Ustalar için ilk teklifler ücretsiz; daha fazlası için yıllık ya da aylık paket.">
      {!paidOpen && <p role="note" className="rounded-full bg-[#f5f5f7] px-5 py-3 text-base font-semibold text-[#1d1d1f]">Ücretli paketler çok yakında. Şimdilik Ücretsiz paketle başlayabilirsin.</p>}
    </PageHead>

    <Band tone="gray" label="plans-title">
      <h2 id="plans-title" className="sr-only">Paketler</h2>
      <div className="grid gap-4 lg:grid-cols-3">{plans.map(p => { const paid = p.id !== "free"; return <section key={p.id} aria-labelledby={`plan-${p.id}`} className={`${tile} flex flex-col ${p.id === "usta" ? "border-2 border-[#075d54]" : ""}`}>
        <h3 id={`plan-${p.id}`} className={title}>{p.name}</h3><p className="mt-2 leading-[1.5] text-[#515154]">{p.description}</p>
        <p className="mt-6"><span className="text-5xl font-[650] tracking-[-.04em] text-[#1d1d1f]">{paid ? tl(Math.round(p.yearly_price_kurus / 12)) : "0 ₺"}</span><span className="ml-1 text-[#515154]">{paid ? "/ay" : ""}</span></p>
        {paid ? <p className="mt-2 text-sm leading-[1.45] text-[#515154]">Yıllık ödemede toplam {tl(p.yearly_price_kurus)}. Aylık ödemede {tl(p.monthly_price_kurus)}/ay.</p> : <p className="mt-2 text-sm text-[#515154]">Süresiz ücretsiz.</p>}
        <p className="mt-4 text-sm font-semibold text-[#1d1d1f]">{limit(p.limits.monthly_quotes, "Ayda 1 teklif", n => `Ayda ${n} teklif`)} · {limit(p.limits.active_customers, "1 müşteri", n => `${n} aktif müşteri`)}</p>
        <div className="mt-6 flex-1" />
        {paid ? (paidOpen ? <Link href={buyHref} className={pillPrimary}>{p.name} paketini seç</Link> : <span className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f5f5f7] px-5 text-center font-semibold text-[#515154]">Çok yakında</span>) : <Link href="/register?hesap=usta" className={pillSecondary}>Ücretsiz başla</Link>}
      </section>; })}</div>
      <p className="mt-5 text-sm text-[#515154]">Müşteriler için ücretsiz: usta aramak, talep göndermek ve ilan açmak için paket gerekmez. Fiyatlar TL cinsindendir; vergi ve ödeme koşulları ödeme ekranında gösterilir.</p>
    </Band>

    <Band label="matrix-title">
      <h2 id="matrix-title" className={headline}>Paketleri karşılaştır.</h2>
      <div className="relative mt-8 overflow-x-auto rounded-[20px] border border-[#d2d2d7]"><table className="w-full min-w-[34rem] border-collapse text-left text-[15px] leading-6">
        <caption className="sr-only">Paketlerin özellik ve limit karşılaştırması</caption>
        <thead><tr className="bg-[#f5f5f7]"><th scope="col" className="px-4 py-4 font-semibold text-[#1d1d1f]">Özellik</th>{plans.map(p => <th key={p.id} scope="col" className="px-4 py-4 font-semibold text-[#1d1d1f]">{p.name}</th>)}</tr></thead>
        <tbody>{rows.map(r => <tr key={r.label} className="border-t border-[#d2d2d7]"><th scope="row" className="px-4 py-3 align-middle font-semibold text-[#1d1d1f]">{r.label}</th>{r.values.map((v, i) => <td key={i} className="px-4 py-3 align-middle text-[#515154]"><span className="inline-flex items-center gap-1">{v}</span></td>)}</tr>)}</tbody>
      </table></div>
    </Band>

    <Band tone="gray" label="faq-title"><Faq items={faqs} /></Band>
    <Band label="calc-title"><div className="flex flex-wrap items-center justify-between gap-6"><Intro h="Önce bir işi hesapla." id="calc-title" text="Ücretsiz hesaplayıcıyla maliyetinin teklif fiyatına nasıl dönüştüğünü gör." /><Link href="/hesaplama-araclari/kar-marji" className={pillSecondary}>Kâr marjını hesapla</Link></div>
      <p className="mt-6"><Link href="/ustalar-icin" className={textLink}>Ustalar için ürün turu</Link></p></Band>
  </>;
}

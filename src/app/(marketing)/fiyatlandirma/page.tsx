import Link from "next/link";
import { Check } from "lucide-react";
import type { Metadata } from "next";
import { billingAvailable } from "@/lib/billing/provider";
import { ENTRY_FEATURES, ENTRY_FEE_KURUS, ENTRY_FEE_LABEL } from "@/lib/billing/catalog";
import { getViewer } from "@/lib/viewer";
import { siteMetadata, siteOrigin } from "@/lib/marketing/seo";
import { Band, Faq, Intro, PageHead, PageLd, pillPrimary, pillSecondary, textLink, tile, title } from "@/components/marketing/acquisition/parts";

const name = "Fiyatlandırma: Usta Üyelik 199 ₺, tek seferlik";
const path = "/fiyatlandirma";
// Availability comes from billingAvailable(), the same check billing uses (BILLING_PROVIDER and iyzico settings).
export function generateMetadata(): Metadata {
  return siteMetadata(name, billingAvailable() ? "Ustalar için tek seferlik 199 ₺ üyelik: sınırsız teklif ve müşteri, süresiz erişim, abonelik yok. Müşteriler için her şey ücretsiz." : "Ustalar için tek seferlik 199 ₺ üyelik, süresiz erişim, abonelik yok. Ödeme çok yakında açılıyor. Müşteriler için her şey ücretsiz.", path);
}
export const dynamic = "force-dynamic";

export default async function Page() {
  const viewer = await getViewer();
  const paidOpen = billingAvailable();
  const buyHref = viewer ? "/billing" : "/register?hesap=usta";
  const faqs: (readonly [string, string])[] = [
    ["Neden tek seferlik?", "Düzenli iş yapan ustaya her ay yeni bir fatura çıkarmak istemiyoruz. Bir kez 199 ₺ ödersin, üyeliğin süresiz açık kalır."],
    ["Abonelik var mı?", "Hayır. Aylık ya da yıllık ödeme, otomatik yenileme ve iptal gerekmez."],
    ["Müşteriler ödüyor mu?", "Hayır. Usta bulmak, ilan açmak ve teklif almak müşteriler için her zaman ücretsiz."],
    ["Mevcut ustalar ne yapacak?", "Bu değişiklikten önce hesabını kurmuş ustalar ücretsiz ve süresiz devam eder, ödeme yapmaz."],
    paidOpen
      ? ["Üyeliği nasıl başlatırım?", "Usta hesabınla giriş yapıp üyelik sayfasından fatura bilgilerini girer, ödemeyi iyzico sayfasında tamamlarsın. Tutar TL cinsindendir; ödeme koşulları ödeme ekranında gösterilir."]
      : ["Üyelik ödemesi ne zaman açılıyor?", "Ödeme çok yakında açılacak. Hesabını şimdi açıp profilini ve maliyetlerini hazırlayabilirsin; teklif hazırlamak ve pazar yerinde teklif vermek için üyelik gerekir."],
  ] as const;
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Fiyatlandırma", path }];
  // FAQPage (faqNode) is emitted through PageLd and only for the FAQ visible below.
  // Offer only when the membership can actually be bought; otherwise no Product/Offer markup at all.
  const offers = paidOpen ? [{ "@type": "Product", "@id": `${siteOrigin}${path}#usta-uyelik`, name: "KaçaYapayım Usta Üyelik", description: "Tek seferlik ödemeyle tüm özellikler, süresiz.", offers: { "@type": "Offer", price: ENTRY_FEE_KURUS / 100, priceCurrency: "TRY", url: `${siteOrigin}${path}`, availability: "https://schema.org/InStock" } }] : [];
  return <>
    <PageLd path={path} name={name} description="Usta Üyelik fiyatı: 199 ₺, tek seferlik." crumbs={crumbs} faqs={faqs} extra={offers} />
    <PageHead crumbs={[{ name: "Ana Sayfa", href: "/" }, { name: "Fiyatlandırma" }]} eyebrow="Fiyatlandırma" h="Tek ödeme, süresiz üyelik." text="Müşteriler için usta bulmak ve ilan açmak ücretsiz. Ustalar için tek seferlik 199 ₺; abonelik ve aylık ücret yok.">
      {!paidOpen && <p role="note" className="rounded-full bg-[#f5f5f7] px-5 py-3 text-base font-semibold text-[#1d1d1f]">Ödeme çok yakında açılıyor. Şimdilik hesabını açıp hazırlanabilirsin.</p>}
    </PageHead>

    <Band tone="gray" label="plans-title">
      <h2 id="plans-title" className="sr-only">Usta Üyelik</h2>
      <section aria-labelledby="plan-entry" className={`${tile} mx-auto flex max-w-xl flex-col border-2 border-[#075d54]`}>
        <h3 id="plan-entry" className={title}>Usta Üyelik</h3>
        <p className="mt-2 leading-[1.5] text-[#515154]">Tek seferlik ödemeyle tüm özellikler, süresiz.</p>
        <p className="mt-6"><span className="text-5xl font-[650] tracking-[-.04em] text-[#1d1d1f]">{ENTRY_FEE_LABEL}</span><span className="ml-2 text-[#515154]">tek seferlik · süresiz</span></p>
        <ul className="mt-6 space-y-3">{ENTRY_FEATURES.map(label => <li key={label} className="flex items-start gap-2 leading-6 text-[#1d1d1f]"><Check size={18} aria-hidden="true" className="mt-1 shrink-0 text-[#075d54]" />{label}</li>)}</ul>
        <div className="mt-8">{paidOpen
          ? <Link href={buyHref} className={pillPrimary}>Usta olarak katıl</Link>
          : <span className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f5f5f7] px-5 text-center font-semibold text-[#515154]">Çok yakında</span>}</div>
      </section>
      <p className="mt-5 text-center text-sm text-[#515154]">Müşteriler için ücretsiz: usta aramak, talep göndermek ve ilan açmak için üyelik gerekmez. Tutar TL cinsindendir; ödeme koşulları ödeme ekranında gösterilir.</p>
    </Band>

    <Band label="faq-title"><Faq items={faqs} /></Band>
    <Band tone="gray" label="calc-title"><div className="flex flex-wrap items-center justify-between gap-6"><Intro h="Önce bir işi hesapla." id="calc-title" text="Ücretsiz hesaplayıcıyla maliyetinin teklif fiyatına nasıl dönüştüğünü gör." /><Link href="/hesaplama-araclari/kar-marji" className={pillSecondary}>Kâr marjını hesapla</Link></div>
      <p className="mt-6"><Link href="/ustalar-icin" className={textLink}>Ustalar için ürün turu</Link></p></Band>
  </>;
}

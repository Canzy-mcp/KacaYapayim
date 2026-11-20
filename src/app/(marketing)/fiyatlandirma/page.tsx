import Link from "next/link";
import { getPlans } from "@/lib/billing/service";
import { breadcrumbNode, faqNode, graph, JsonLd, siteMetadata, siteOrigin, webPageNode } from "@/lib/marketing/seo";
import { btnPrimary, btnSecondary, card, Crumbs, DataTable, Faq, h2Class, Hero, PageShell } from "@/lib/marketing/blocks";
import type { Plan, PlanFeature } from "@/types/database";

const title = "Fiyatlandırma: Ücretsiz, Usta ve Pro Paketler";
const description = "Ücretsiz, Usta ve Pro paketlerinin yıllık fiyatlarını, teklif ve müşteri limitlerini karşılaştır. Ücretli paketler çok yakında.";
export const metadata = siteMetadata(title, description, "/fiyatlandirma");
export const dynamic = "force-dynamic";

const tl = (kurus: number) => `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(kurus / 100)} ₺`;
const limit = (v: number | null | undefined, one: string, many: (n: number) => string) => v === null || v === undefined ? "Sınırsız" : v === 1 ? one : many(v);
const featureRows: [PlanFeature, string][] = [["public_quotes", "Paylaşılabilir teklif bağlantısı"], ["pdf", "PDF teklif"], ["whatsapp", "WhatsApp ile paylaşım"], ["actual_profit", "Gerçek kâr takibi"], ["advanced_reports", "Gelişmiş raporlar"], ["remove_branding", "KaçaYapayım ibaresini kaldırma"], ["business_logo", "Teklifte işletme logosu"]];

const faqs = [
  ["Ücretli paketler ne zaman açılıyor?", "Ücretli paketler çok yakında açılacak. Ödeme altyapısı hazır olana kadar Ücretsiz paketle başlayabilirsin; ödeme açıldığında koşullar satın alma ekranında gösterilir."],
  ["Ücretsiz paketin sınırı nedir?", "Ücretsiz pakette ayda 5 teklif hazırlayabilir ve 20 aktif müşteri tutabilirsin. İşletme ve kullanıcı sayısı bir ile sınırlıdır."],
  ["Yıllık ödeme neden öne çıkarılıyor?", "Yıllık fiyat, aylık fiyatın on ikiyle çarpımından düşüktür. Tutarlar TL cinsindendir; vergi ve ödeme koşulları ödeme ekranında gösterilecektir."],
  ["Paket almadan usta bulabilir miyim?", "Evet. Usta bulmak ve iş ilanı vermek paketlerden bağımsızdır."],
] as const;

export default async function Page() {
  const plans = await getPlans();
  const paidOpen = Boolean(process.env.BILLING_PROVIDER?.trim());
  const rows: string[][] = [
    ["Aylık teklif", ...plans.map(p => limit(p.limits.monthly_quotes, "Ayda 1 teklif", n => `Ayda ${n} teklif`))],
    ["Aktif müşteri", ...plans.map(p => limit(p.limits.active_customers, "1 müşteri", n => `${n} müşteri`))],
    ["İşletme", ...plans.map(p => String(p.limits.businesses ?? "Sınırsız"))],
    ["Kullanıcı", ...plans.map(p => String(p.limits.users ?? "Sınırsız"))],
    ...featureRows.map(([key, label]) => [label, ...plans.map(p => p.features[key] ? "Var" : "Yok")]),
  ];
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Fiyatlandırma", path: "/fiyatlandirma" }];
  return <PageShell>
    <JsonLd data={graph(
      webPageNode({ path: "/fiyatlandirma", name: title, description }), breadcrumbNode(crumbs), faqNode("/fiyatlandirma", faqs),
      ...plans.filter(p => p.id !== "free").map((p: Plan) => ({ "@type": "Product", "@id": `${siteOrigin}/fiyatlandirma#${p.id}`, name: `KaçaYapayım ${p.name}`, description: p.description, offers: { "@type": "Offer", price: p.yearly_price_kurus / 100, priceCurrency: "TRY", url: `${siteOrigin}/fiyatlandirma`, availability: paidOpen ? "https://schema.org/InStock" : "https://schema.org/PreOrder" } })),
    )} />
    <Crumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Fiyatlandırma" }]} />
    <Hero eyebrow="Fiyatlandırma" title="İşin büyüdükçe yanında." lead="İlk işinin hesabını ücretsiz çıkar. Daha fazla teklif ve müşteri gerektiğinde yıllık paketle büyü." />
    {!paidOpen && <p role="note" className="mt-6 max-w-3xl rounded-2xl bg-[#F7EBD6] p-4 font-semibold leading-7">Ücretli paketler çok yakında. Şimdilik Ücretsiz paketle başlayabilirsin.</p>}
    <section className="mt-10" aria-label="Paket karşılaştırması"><h2 className="sr-only">Paketler</h2>
      <div className="grid gap-4 lg:grid-cols-3">{plans.map(p => { const paid = p.id !== "free"; return <section key={p.id} className={`${card} flex min-w-0 flex-col ${p.id === "usta" ? "border-[#075D54]" : ""}`}>
        <h3 className="text-xl font-bold">{p.name}</h3><p className="mt-1 leading-6 text-[#5B6460]">{p.description}</p>
        <p className="mt-5"><span className="text-4xl font-bold tracking-[-.03em]">{paid ? tl(p.yearly_price_kurus) : "0 ₺"}</span><span className="ml-1 text-[#5B6460]">{paid ? "/yıl" : ""}</span></p>
        {paid && <p className="mt-1 text-sm text-[#5B6460]">Aylık ödemeyle {tl(p.monthly_price_kurus)}/ay; yıllık ödeme aylık {tl(Math.round(p.yearly_price_kurus / 12))} eder.</p>}
        <p className="mt-4 text-sm font-semibold">{limit(p.limits.monthly_quotes, "Ayda 1 teklif", n => `Ayda ${n} teklif`)} · {limit(p.limits.active_customers, "1 müşteri", n => `${n} aktif müşteri`)}</p>
        <div className="mt-6 flex-1" />
        {paid ? (paidOpen ? <Link href="/register" className={btnPrimary}>{p.name} paketini seç</Link> : <span className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#F4EFE4] px-4 text-center font-semibold text-[#5B6460]">Çok yakında</span>) : <Link href="/register" className={btnPrimary}>Ücretsiz Başla</Link>}
      </section>; })}</div>
      <DataTable caption="Paketlerin özellik ve limit karşılaştırması" head={["Özellik", ...plans.map(p => p.name)]} rows={rows} />
      <p className="mt-3 text-sm text-[#5B6460]">Fiyatlar TL cinsindendir. Vergi ve ödeme koşulları ödeme ekranında gösterilir.</p>
    </section>
    <Faq items={faqs} />
    <aside className={`${card} mt-14 flex flex-wrap items-center justify-between gap-4`}><div><h2 className={h2Class}>Önce bir işi hesapla.</h2><p className="mt-2 text-[#3F4944]">Ücretsiz hesaplayıcıyla maliyetinin teklif fiyatına nasıl dönüştüğünü gör.</p></div><Link href="/hesaplama-araclari/kar-marji" className={btnSecondary}>Kâr marjını hesapla</Link></aside>
  </PageShell>;
}

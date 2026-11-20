import Link from "next/link";
import { breadcrumbNode, graph, JsonLd, siteMetadata, webPageNode } from "@/lib/marketing/seo";
import { card, Crumbs, h2Class, Hero, PageShell } from "@/lib/marketing/blocks";

const title = "Hesaplama Metodolojisi";
const description = "KaçaYapayım fiyatı senin girdiğin maliyet ve hedef kâr marjıyla hesaplar; piyasa rayici sunmaz. Formül ve yuvarlama kuralı.";
export const metadata = siteMetadata(title, description, "/metodoloji");
const sections = [
  ["1. Maliyet kalemleri", "Malzeme miktarı birim maliyetle çarpılır. İşçilik, çalışan sayısı ve iş günüyle hesaplanır. Sarf, yol ve işin diğer doğrudan giderleri eklenir. Meslek şablonları alan, kat sayısı veya metraj gibi farklı girdiler kullanabilir. Kaynak her zaman kullanıcının kaydettiği değerlerdir."],
  ["2. Hedef kâr marjı", "Marj, kârın satış fiyatına oranıdır. Hedef fiyat = toplam maliyet ÷ (1 − hedef marj / 100). Örneğin 20.000 TL maliyet ve %30 hedef marj için sonuç 28.571,43 TL'dir. Uygulama öneriyi 100 TL yukarı yuvarlayarak 28.600 TL gösterir."],
  ["3. Teklif ve gerçekleşen sonuç", "Önerilen fiyat, teklif kararına yardımcı olur; vergi, tahsilat riski ve kapsam değişiklikleri ayrıca değerlendirilmelidir. İş tamamlandıktan sonra gerçek giderler kaydedildiğinde gerçekleşen kâr = satış fiyatı − gerçekleşen maliyet olarak hesaplanır. Tahmin ile gerçekleşen sonuç farklı olabilir."],
] as const;
const link = "inline-flex min-h-11 items-center font-semibold text-[#075D54] underline underline-offset-4";

export default function Page() {
  return <PageShell><article className="mx-auto max-w-3xl">
    <JsonLd data={graph(webPageNode({ path: "/metodoloji", name: title, description }), breadcrumbNode([{ name: "Ana Sayfa", path: "/" }, { name: "Metodoloji", path: "/metodoloji" }]))} />
    <Crumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Metodoloji" }]} />
    <Hero eyebrow="Metodoloji" title="KaçaYapayım fiyatları nasıl hesaplar?" lead="Önerilen fiyat, senin girdiğin maliyetler ve hedeflediğin satış kâr marjı üzerinden üretilir. KaçaYapayım piyasa fiyatı veya resmi ücret tarifesi vermez." />
    {sections.map(([h, t]) => <section key={h} className="mt-10"><h2 className={h2Class}>{h}</h2><p className="mt-4 text-lg leading-8 text-[#3F4944]">{t}</p></section>)}
    <section className={`${card} mt-12`}><h2 className="text-xl font-semibold">Piyasa fiyatı mı?</h2><p className="mt-3 leading-7 text-[#3F4944]">Hayır. KaçaYapayım başka işletmelerin fiyatlarını tahmin etmez; şehir veya meslek için ortalama ücret iddiasında bulunmaz. Hesap senin işine ve girdilerine aittir.</p>
      <div className="mt-4 flex flex-wrap gap-x-6"><Link className={link} href="/rehber/kar-marji-nasil-hesaplanir">Kâr marjını örnekle öğren</Link><Link className={link} href="/hesaplama-araclari/kar-marji">Kâr marjı hesaplama aracı</Link></div></section>
  </article></PageShell>;
}

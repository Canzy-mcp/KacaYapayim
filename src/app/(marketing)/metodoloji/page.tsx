import Link from "next/link";
import { breadcrumbNode, graph, JsonLd, siteMetadata, webPageNode } from "@/lib/marketing/seo";
import { formatDateTr, siteContentModified, marjMarkupTable } from "@/lib/marketing/guides-data";
import { Band, Byline, Callout, Display, EdCrumbs, Eyebrow, Table, body, h2, muted, pill, pillOutline, proseLink } from "@/lib/marketing/editorial";

const title = "Hesaplama Metodolojisi";
const description = "KaçaYapayım fiyatı senin girdiğin maliyet ve hedef kâr marjıyla hesaplar; piyasa rayici sunmaz. Formül ve yuvarlama kuralı.";
export const metadata = siteMetadata(title, description, "/metodoloji");
const sections = [
  ["1. Maliyet kalemleri", "Malzeme miktarı birim maliyetle çarpılır. İşçilik, çalışan sayısı ve iş günüyle hesaplanır. Sarf, yol ve işin diğer doğrudan giderleri eklenir. Meslek şablonları alan, kat sayısı veya metraj gibi farklı girdiler kullanabilir. Kaynak her zaman kullanıcının kaydettiği değerlerdir."],
  ["2. Hedef kâr marjı", "Marj, kârın satış fiyatına oranıdır. Hedef fiyat = toplam maliyet ÷ (1 − hedef marj / 100). Örneğin 20.000 TL maliyet ve %30 hedef marj için sonuç 28.571,43 TL'dir. Uygulama öneriyi 100 TL yukarı yuvarlayarak 28.600 TL gösterir."],
  ["3. Teklif ve gerçekleşen sonuç", "Önerilen fiyat, teklif kararına yardımcı olur; vergi, tahsilat riski ve kapsam değişiklikleri ayrıca değerlendirilmelidir. İş tamamlandıktan sonra gerçek giderler kaydedildiğinde gerçekleşen kâr = satış fiyatı − gerçekleşen maliyet olarak hesaplanır. Tahmin ile gerçekleşen sonuç farklı olabilir."],
] as const;

export default function Page() {
  return <article>
    <JsonLd data={graph(webPageNode({ path: "/metodoloji", name: title, description }), breadcrumbNode([{ name: "Ana Sayfa", path: "/" }, { name: "Metodoloji", path: "/metodoloji" }]))} />
    <Band>
      <div className="mx-auto max-w-[68ch]">
        <EdCrumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Metodoloji" }]} />
        <div className="mt-6"><Eyebrow>Metodoloji</Eyebrow></div>
        <Display>KaçaYapayım fiyatları nasıl hesaplar?</Display>
        <Byline updatedLabel="Son güncelleme" modified={siteContentModified} formatted={formatDateTr(siteContentModified)} />
        <p className={`mt-8 ${body} text-[1.1875rem] font-medium sm:text-[1.375rem] sm:leading-[1.5]`}>Önerilen fiyat, senin girdiğin maliyetler ve hedeflediğin satış kâr marjı üzerinden üretilir: fiyat = maliyet ÷ (1 − marj). KaçaYapayım piyasa fiyatı veya resmi ücret tarifesi vermez.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/hesaplama-araclari/kar-marji" className={pill}>Kâr marjı hesaplama aracı</Link><Link href="/rehber/kar-marji-nasil-hesaplanir" className={pillOutline}>Kâr marjı rehberi</Link></div>
      </div>
    </Band>
    <Band tone="gray" narrow>
      {sections.map(([h, t], i) => <section key={h} className={i ? "mt-12" : ""}><h2 className={h2}>{h}</h2><p className={`mt-4 ${body}`}>{t}</p></section>)}
      <h2 className={`${h2} mt-12`}>Kâr marjı ve markup farkı</h2>
      <p className={`mt-4 ${body}`}>Uygulama marjı kullanır, markup'ı değil. İkisi aynı kârdan farklı yüzdeler çıkarır.</p>
      <Table caption={marjMarkupTable.caption} head={marjMarkupTable.head} rows={marjMarkupTable.rows} />
    </Band>
    <Band narrow>
      <Callout tone="warn" title="Sınırlar: piyasa fiyatı mı?"><p>Hayır. KaçaYapayım başka işletmelerin fiyatlarını tahmin etmez; şehir veya meslek için ortalama ücret iddiasında bulunmaz. Hesap senin işine ve girdilerine aittir. Örneklerdeki rakamlar açıklama amaçlıdır.</p></Callout>
      <h2 className={`${h2} mt-12`}>Kim yazar, nasıl düzeltilir?</h2>
      <p className={`mt-4 ${body} ${muted}`}>Yazım, hesap kontrolü ve düzeltme süreci <Link href="/yayin-politikasi" className={proseLink}>yayın politikasında</Link> anlatılır.</p>
    </Band>
  </article>;
}

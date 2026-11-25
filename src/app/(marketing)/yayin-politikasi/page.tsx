import Link from "next/link";
import { siteMetadata } from "@/lib/marketing/seo";
import { Band, Intro, PageHead, PageLd, textLink, tile, title } from "@/components/marketing/acquisition/parts";

const name = "Yayın politikası: rehberleri kim yazıyor?";
const description = "KaçaYapayım rehberlerini kimin yazdığı, hesapların nasıl kontrol edildiği, kaynaklar, düzeltme yolu, gözden geçirme sıklığı ve yapay zeka desteği.";
export const metadata = siteMetadata(name, description, "/yayin-politikasi");
const path = "/yayin-politikasi";

const sections = [
  { h: "Kim yazıyor?", text: "Rehberleri ve meslek sayfalarını KaçaYapayım editör ekibi hazırlar. Bireysel yazar adı yerine ekip olarak sorumluluk alırız." },
  { h: "Hesaplamalar nasıl kontrol ediliyor?", text: <>Her örnekteki miktar, birim fiyat ve toplam elle yeniden hesaplanır. Varsayımlar sayfada açıkça yazılır. Yöntemin tamamı <Link href="/metodoloji" className={textLink}>metodoloji</Link> sayfasındadır.</> },
  { h: "Kaynaklar", text: "Mümkün olduğunda resmi kurumların ve üreticilerin yayınladığı kaynaklara dayanırız ve kaynağı sayfada gösteririz. Piyasa fiyatı gibi hızlı değişen rakamlar örnek olarak sunulur, güncel fiyat vaadi sayılmaz." },
  { h: "Düzeltmeler", text: <>Hata gördüysen <Link href="/iletisim" className={textLink}>bize yaz</Link>. Doğruladığımız hatayı düzeltir, sayfadaki güncelleme tarihini yenileriz.</> },
  { h: "Gözden geçirme sıklığı", text: "İçerikleri düzenli aralıklarla ve fiyat, mevzuat veya ürün değişikliği olduğunda yeniden gözden geçiririz. Önemli değişiklikler sayfadaki tarihle belirtilir." },
  { h: "Yapay zeka desteği", text: "İçeriklerin bir kısmı yapay zeka desteğiyle hazırlanır. Yayımlanmadan önce ekibimiz metni ve rakamları gözden geçirir. Son sorumluluk editör ekibimizdedir." },
] as const;

export default function Page() {
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Yayın politikası", path }];
  return <>
    <PageLd path={path} name={name} description={description} crumbs={crumbs} />
    <PageHead crumbs={[{ name: "Ana Sayfa", href: "/" }, { name: "Yayın politikası" }]} eyebrow="Yayın politikası" h="Yazdıklarımızın arkasındayız." text="Rehberlerimizi kimin yazdığını, rakamları nasıl kontrol ettiğimizi ve hatayı nasıl düzelttiğimizi açıkça anlatıyoruz." />
    <Band tone="gray" label="policy-title"><Intro h="Nasıl çalışıyoruz?" id="policy-title" />
      <div className="mt-10 grid gap-4 md:grid-cols-2">{sections.map(s => <section key={s.h} className={tile}><h3 className={title}>{s.h}</h3><p className="mt-3 max-w-[68ch] text-[17px] leading-[1.6] text-ink-2">{s.text}</p></section>)}</div>
    </Band>
  </>;
}

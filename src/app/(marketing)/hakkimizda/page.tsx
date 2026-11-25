import Link from "next/link";
import { siteMetadata, siteSummary } from "@/lib/marketing/seo";
import { Band, PageHead, PageLd, textLink, tile, title } from "@/components/marketing/acquisition/parts";

const name = "Hakkımızda: KaçaYapayım Nedir?";
const description = "KaçaYapayım, Türkiye'de usta bulmayı ve maliyete dayalı teklif hazırlamayı kolaylaştıran bir platformdur. Kimin için ve nasıl çalışır?";
export const metadata = siteMetadata(name, description, "/hakkimizda");
const path = "/hakkimizda";
const blocks = [
  ["Kimin için?", "Hizmet arayan ev sahipleri ile boyacı, elektrikçi, tesisatçı ve klimacı gibi iş bazında teklif hazırlayan ustalar için."],
  ["Hangi sorunu çözer?", "Ev sahipleri bölgelerindeki ustaları bulur, işini anlatıp teklif alır. Ustalar bir işin malzeme, işçilik ve diğer giderlerini tek hesapta toplar, hedef kârı için gereken fiyatı görür ve teklife dönüştürür."],
  ["Veri ve iddialar", "Fiyat önerileri kullanıcının girdiği rakamlara dayanır. Başka kullanıcıların verisi, şehir ortalaması ya da garanti edilen kâr olarak sunulmaz. Şirket ve ekip bilgileri resmileştiğinde bu sayfa güncellenir."],
] as const;

export default function Page() {
  return <>
    <PageLd path={path} name={name} description={description} type="AboutPage" crumbs={[{ name: "Ana Sayfa", path: "/" }, { name: "Hakkımızda", path }]} />
    <PageHead crumbs={[{ name: "Ana Sayfa", href: "/" }, { name: "Hakkımızda" }]} eyebrow="Hakkımızda" h="KaçaYapayım nedir?" text={siteSummary} />
    <Band tone="gray" label="about-title"><h2 id="about-title" className="sr-only">Hakkımızda ayrıntılar</h2>
      <div className="grid gap-4 md:grid-cols-3">{blocks.map(([h, t]) => <section key={h} className={tile}><h3 className={title}>{h}</h3><p className="mt-3 leading-[1.6] text-ink-2">{t}</p></section>)}</div>
      <p className="mt-8 flex flex-wrap gap-x-6"><Link href="/metodoloji" className={`${textLink} inline-flex min-h-11 items-center`}>Hesaplama metodolojisi</Link><Link href="/yayin-politikasi" className={`${textLink} inline-flex min-h-11 items-center`}>Yayın politikası</Link></p>
    </Band>
  </>;
}

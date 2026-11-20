import Link from "next/link";
import { breadcrumbNode, graph, JsonLd, siteMetadata, siteSummary, webPageNode } from "@/lib/marketing/seo";
import { Crumbs, h2Class, Hero, PageShell } from "@/lib/marketing/blocks";

const title = "Hakkımızda: KaçaYapayım Nedir?";
const description = "KaçaYapayım, Türkiye'de usta bulmayı ve maliyete dayalı teklif hazırlamayı kolaylaştıran bir platformdur. Kimin için ve nasıl çalışır?";
export const metadata = siteMetadata(title, description, "/hakkimizda");
const blocks = [
  ["Kimin için?", "Hizmet arayan ev sahipleri ile boyacı, elektrikçi, tesisatçı ve klimacı gibi iş bazında teklif hazırlayan profesyoneller için. Her mesleğin kullandığı miktar ve maliyet kalemleri farklıdır."],
  ["Hangi sorunu çözer?", "Hizmet arayanlar bölgelerindeki ustaları bulur, işini tarif edip teklif alır. Ustalar bir işin malzeme, işçilik ve diğer giderlerini aynı hesapta toplar, hedef kâr için gereken fiyatı görür ve sonucu teklife dönüştürür."],
  ["Veri ve iddialar", "Fiyat önerileri kullanıcı girdilerine dayanır. Başka kullanıcıların verisi, şehir ortalaması veya garanti edilen kâr olarak sunulmaz. Şirket ve ekip bilgileri resmileştiğinde bu sayfa güncellenecektir."],
] as const;

export default function Page() {
  return <PageShell><article className="mx-auto max-w-3xl">
    <JsonLd data={graph(webPageNode({ path: "/hakkimizda", name: title, description, type: "AboutPage" }), breadcrumbNode([{ name: "Ana Sayfa", path: "/" }, { name: "Hakkımızda", path: "/hakkimizda" }]))} />
    <Crumbs items={[{ name: "Ana Sayfa", href: "/" }, { name: "Hakkımızda" }]} />
    <Hero eyebrow="Hakkımızda" title="KaçaYapayım nedir?" lead={siteSummary} />
    {blocks.map(([h, t]) => <section key={h} className="mt-10"><h2 className={h2Class}>{h}</h2><p className="mt-4 text-lg leading-8 text-[#3F4944]">{t}</p></section>)}
    <p className="mt-10"><Link href="/metodoloji" className="inline-flex min-h-11 items-center font-semibold text-[#075D54] underline underline-offset-4">Hesaplama metodolojisi</Link></p>
  </article></PageShell>;
}

import Link from "next/link";
import { siteMetadata } from "@/lib/marketing/seo";
import { Band, CtaBand, Intro, PageHead, PageLd, ctaGhost, ctaLight, pillPrimary, textLink, tile, title } from "@/components/marketing/acquisition/parts";

const name = "Özellikler: Maliyet, Teklif ve Kâr Takibi";
const description = "Maliyet hesabı, hedef kâr, PDF teklif, teklif durumu ve gerçekleşen kâr takibi. Ustalar için KaçaYapayım özellikleri.";
export const metadata = siteMetadata(name, description, "/ozellikler");
const path = "/ozellikler";
const items = [["Maliyet hesabı", "Malzeme, işçilik, sarf ve yol giderlerini iş bazında topla."], ["Hedef kâr", "Hedef marjına göre önerilen satış fiyatını gör."], ["Teklif hazırlama", "Kapsamı, ödeme koşullarını ve fiyatı tek belgede birleştir."], ["PDF ve paylaşım", "Teklifini PDF indir ya da bağlantıyla paylaş."], ["Teklif durumu", "Görüntülendi, kabul edildi, reddedildi: hepsini takip et."], ["Gerçek kâr", "İş bitince gerçek giderleri kaydet, tahminle karşılaştır."]] as const;

export default function Page() {
  return <>
    <PageLd path={path} name={name} description={description} crumbs={[{ name: "Ana Sayfa", path: "/" }, { name: "Özellikler", path }]} />
    <PageHead crumbs={[{ name: "Ana Sayfa", href: "/" }, { name: "Özellikler" }]} eyebrow="Özellikler" h="Hesabın başından işin sonuna." text="Kendi maliyetlerinle teklif ver, iş bitince gerçekte ne kazandığını gör.">
      <Link href="/ustalar-icin" className={pillPrimary}>Ustalar için</Link>
    </PageHead>
    <Band tone="gray" label="features-title"><Intro h="Teklifin her aşaması için." id="features-title" />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(([t, d]) => <li key={t} className={tile}><h3 className={title}>{t}</h3><p className="mt-3 leading-[1.55] text-[#515154]">{d}</p></li>)}</ul>
      <p className="mt-8"><Link className={textLink} href="/metodoloji">Fiyat hesabının nasıl yapıldığını öğren</Link></p>
    </Band>
    <CtaBand id="cta-title" h="Ücretsiz başla." text="İlk tekliflerini ücretsiz pakette hazırla."><Link href="/register?hesap=usta" className={ctaLight}>Hesap aç</Link><Link href="/fiyatlandirma" className={ctaGhost}>Fiyatlandırma</Link></CtaBand>
  </>;
}

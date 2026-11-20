import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { siteMetadata } from "@/lib/marketing/seo";
import { MarginExample, ProductDemo } from "@/components/marketing/product-demo";
import { Band, CtaBand, Faq, Intro, PageHead, PageLd, Photo, Steps, ctaGhost, ctaLight, pillPrimary, pillSecondary, textLink, tile } from "@/components/marketing/acquisition/parts";

const name = "Ustalar için: profil yayınla, teklif ver, işi takip et";
const description = "Usta profilini yayınla, bölgendeki taleplere maliyete dayalı teklif ver, PDF veya bağlantıyla paylaş, işleri ve ödemeleri takip et.";
export const metadata = siteMetadata(name, description, "/ustalar-icin");
const path = "/ustalar-icin";

const faqs = [
  ["Usta olarak katılmak ücretli mi?", "Hayır. Profil açmak ve yayınlamak ücretsiz. Daha fazla teklif ve müşteri için paketler var; ücretli paketler şu an herkese açık olmayabilir, durumu fiyatlandırma sayfasında görürsün."],
  ["Ödeme nasıl yapılır?", "KaçaYapayım ödemeyi tutmaz ve ödemeye aracılık etmez. Ödeme müşteri ile senin aranda, birlikte belirlediğin koşullarla yapılır."],
  ["Hangi bölgelere hizmet verdiğimi nasıl belirtirim?", "Profilini kurarken hizmet kategorilerini, ilini ve hizmet verdiğin ilçeleri seçersin. Bölgendeki talepler sana düşer."],
  ["Profilim ne zaman görünür olur?", "Hizmet alanını, bölgeni ve kısa bir tanıtım yazını ekleyip yayınladığında. İstediğin zaman yayından kaldırabilirsin."],
] as const;

const steps = [
  { title: "Profilini yayınla", text: "Hizmet kategorilerini, ilini, ilçelerini ve kısa tanıtımını ekle." },
  { title: "Talepleri al", text: "Bölgendeki doğrudan talepler ve açık ilanlar sana gelir." },
  { title: "Maliyete dayalı teklif ver", text: "Malzeme, işçilik ve kâr hesabını yap. Teklifi PDF veya bağlantıyla paylaş." },
  { title: "İşleri ve ödemeleri takip et", text: "Teklifin durumunu, tamamlanan işi ve gerçek kârını aynı yerde gör." },
] as const;

export default function Page() {
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Ustalar için", path }];
  return <>
    <PageLd path={path} name={name} description={description} crumbs={crumbs} faqs={faqs} />
    <PageHead crumbs={[{ name: "Ana Sayfa", href: "/" }, { name: "Ustalar için" }]} eyebrow="Ustalar için" h="İşini hesapla, teklifini düzenli gönder." text="Profilini yayınla, bölgendeki taleplere teklif ver. Malzeme, işçilik ve kâr hesabın aynı yerde olsun.">
      <Link href="/onboarding?usta=1" className={pillPrimary}>Profilini oluştur <ArrowRight size={17} aria-hidden="true" /></Link><Link href="/register?hesap=usta" className={pillSecondary}>Hesap aç</Link>
    </PageHead>

    <Band tone="gray" label="flow-title">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0"><Intro eyebrow="Akış" h="Profilden teslime dört adım." id="flow-title" /></div>
        <Photo src="/images/marketing/usta-teklif.webp" alt="Şantiyede telefonuyla teklif hazırlayan bir usta" sizes="(min-width: 1024px) 540px, 100vw" caption="Sahada teklif hazırlamak. Temsili görsel." />
      </div>
      <div className="mt-12"><Steps items={steps} /></div>
    </Band>

    <Band label="demo-title">
      <Intro eyebrow="Ürünü gör" h="Hesaptan teklife, tek akışta." id="demo-title" text="Örnek bir boya işiyle maliyetin teklif fiyatına nasıl dönüştüğünü dene." />
      <ProductDemo />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <figure className={`${tile} m-0 p-5`}><div className="max-h-[520px] overflow-hidden rounded-xl border border-[#d2d2d7]"><Image src="/images/marketing/quote-demo-logo.jpg" width={636} height={1279} alt="Gerçek demo teklifinden alınan önizleme: iş kapsamı, 42.500 TL örnek fiyat ve ödeme koşulları" sizes="(min-width: 1024px) 360px, 90vw" className="block h-auto w-full" /></div><figcaption className="mt-3 text-sm text-[#6e6e73]">Teklif önizlemesi. Örnek veriler.</figcaption></figure>
        <MarginExample />
      </div>
      <p className="mt-8"><Link href="/hesaplama-araclari/kar-marji" className={textLink}>Kâr marjı hesaplama aracını dene</Link></p>
    </Band>

    <Band tone="gray" label="plans-title">
      <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Intro eyebrow="Paketler" h="Ücretsiz başla, büyüdükçe genişlet." id="plans-title" text="Ücretsiz pakette ayda 5 teklif hazırlayabilir ve 20 aktif müşteri tutabilirsin. Limitleri ve özellikleri karşılaştır." />
        <div className="lg:justify-self-end"><Link href="/fiyatlandirma" className={pillSecondary}>Paketleri karşılaştır</Link></div>
      </div>
    </Band>

    <Band label="faq-title"><Faq items={faqs} /></Band>
    <CtaBand id="cta-title" h="Profilini bugün yayınla." text="Hesap açmak ücretsiz. Müşterilerin seni bölgende bulsun."><Link href="/onboarding?usta=1" className={ctaLight}>Profilini oluştur</Link><Link href="/register?hesap=usta" className={ctaGhost}>Hesap aç</Link></CtaBand>
  </>;
}

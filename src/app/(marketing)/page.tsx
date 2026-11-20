import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, CalendarDays, Check, ClipboardList, Lock, MessageSquareText, Search, ShieldCheck } from "lucide-react";
import { graph, JsonLd, organizationId, siteMetadata, siteOrigin } from "@/lib/marketing/seo";
import { MarginExample, ProductDemo } from "@/components/marketing/product-demo";

export const metadata: Metadata = siteMetadata("Usta bul, teklif al ve işini yönet", "İşin için usta bul veya ilan açıp teklif al. Ustalar için maliyet hesabı, profesyonel teklifler ve iş takibi.", "/");

// Same slugs as the marketplace directory (private.market_categories).
const categories = [["boya", "Boya ve badana"], ["elektrik", "Elektrik"], ["tesisat", "Su tesisatı"], ["klima", "Klima ve havalandırma"], ["isitma", "Kombi ve ısıtma"], ["mobilya", "Mobilya ve montaj"], ["tadilat", "Tadilat"], ["seramik", "Fayans ve seramik"], ["zemin", "Parke ve zemin"], ["cati", "Çatı ve yalıtım"], ["cam", "Cam ve doğrama"], ["celik", "Çilingir ve kapı"], ["bahce", "Bahçe ve peyzaj"], ["cihaz", "Beyaz eşya servisi"], ["temizlik", "Temizlik"], ["nakliye", "Nakliye"], ["diger", "Diğer"]] as const;

const services = [
  { slug: "boya", name: "Boya ve badana", text: "Salon, koridor, tavan", image: "painter", alt: "Boya rulosunun maskelenmiş süpürgeliğin üstünde taze bir kenar çekmesi" },
  { slug: "elektrik", name: "Elektrik", text: "Pano, priz, aydınlatma", image: "electrician", alt: "Kapalı bir sigorta panosunu etiketleyen elektrikçinin elleri" },
  { slug: "tesisat", name: "Su tesisatı", text: "Sifon, batarya, kaçak", image: "plumber", alt: "Mutfak dolabının içinde lavabo sifonunu takan eller" },
  { slug: "klima", name: "Klima ve havalandırma", text: "Montaj, bakım, filtre", image: "hvac", alt: "Balkon kapısının yanında split klimanın filtresini çıkaran teknisyen" },
  { slug: "tadilat", name: "Tadilat", text: "Banyo, mutfak, fayans", image: "tadilat", alt: "Banyo duvarına fayans döşeyen usta" },
  { slug: "", name: "Tüm hizmetler", text: "17 kategoride usta ara", image: "musteri-randevu", alt: "Kapıyı açan ev sahibine selam veren, elinde alet çantası olan teknisyen" },
] as const;

const steps = [
  { icon: Search, title: "Hizmeti ve ilçeni seç", text: "Aradığın işi ve bölgeni yaz. Bölgendeki usta profillerini, hizmet alanlarını ve değerlendirmeleri gör." },
  { icon: ClipboardList, title: "Bir ustaya yaz ya da ilan aç", text: "Beğendiğin ustaya doğrudan talep gönder. Ya da işi bir kez anlat, ilanına gelen teklifleri karşılaştır." },
  { icon: CalendarDays, title: "Tarihi birlikte belirle", text: "Mesajlaş, keşif günü ve fiyatta anlaş. İş bitince deneyimini yaz, sonraki müşteriye yol göster." },
] as const;

const trust = [
  { icon: ShieldCheck, title: "Yorumlar gerçek işten gelir", text: "Değerlendirme, ustayla yürüttüğün bir talebe bağlı yazılır. Boş yere puan verilemez." },
  { icon: Lock, title: "Adresin yalnızca seçtiğin ustaya gider", text: "Açık adresin herkese görünmez. Ustayı sen seçersin, adres ancak o zaman paylaşılır." },
  { icon: BadgeCheck, title: "Müşteriler için ücretsiz", text: "Usta aramak, ilan açmak ve teklif almak için ücret ödemezsin." },
] as const;

const faqs = [
  { q: "Usta bulmak ücretli mi?", a: "Hayır. Usta aramak, talep göndermek ve ilan açmak müşteriler için ücretsiz." },
  { q: "Adresimi herkes görebilir mi?", a: "Hayır. Açık adresin yalnızca talep gönderdiğin veya teklifini kabul ettiğin ustayla paylaşılır." },
  { q: "İlan ile doğrudan talep arasındaki fark nedir?", a: "Doğrudan talepte seçtiğin ustaya yazarsın. İlanda işi bir kez anlatırsın, bölgendeki ustalar teklif verir ve sen karşılaştırırsın." },
  { q: "Yorumlara güvenebilir miyim?", a: "Her yorum, ustayla yürütülmüş bir talebe bağlı olarak yazılır. Talebi olmayan biri puan veremez." },
  { q: "Usta olarak nasıl katılırım?", a: "Ücretsiz hesap aç, hizmet alanını ve bölgeni ekle, profilini yayınla. Teklif ve maliyet araçları aynı hesapta." },
] as const;

export default function Home() {
  return <>
    <JsonLd data={graph({ "@type": "WebApplication", "@id": `${siteOrigin}/#webapp`, name: "KaçaYapayım", applicationCategory: "BusinessApplication", operatingSystem: "Web", description: "Usta arama, iş ilanı, teklif ve iş yönetimi uygulaması.", url: siteOrigin, provider: { "@id": organizationId } })} />

    <section className="ky-hero" aria-labelledby="hero-title"><div className="marketing-container ky-hero-grid">
      <div className="ky-hero-copy">
        <p className="marketing-eyebrow">Mahallendeki ustalar</p>
        <h1 id="hero-title">Doğru ustayı bul, işini rahat teslim et.</h1>
        <p className="ky-lead">Hizmeti ve ilçeni seç, ustaların profillerine bak, tek talepte teklif al.</p>
        <form action="/usta-bul" method="get" className="ky-search" aria-label="Usta ara">
          <div className="ky-field ky-field-wide"><label htmlFor="home-category">Hizmet</label>
            <select id="home-category" name="category" defaultValue=""><option value="">Tüm hizmetler</option>{categories.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}</select></div>
          <div className="ky-field"><label htmlFor="home-city">İl</label><input id="home-city" name="city" type="text" placeholder="Örn. İstanbul" maxLength={80} autoComplete="address-level1" /></div>
          <div className="ky-field"><label htmlFor="home-district">İlçe</label><input id="home-district" name="district" type="text" placeholder="Örn. Kadıköy" maxLength={80} autoComplete="address-level2" /></div>
          <button type="submit" className="marketing-primary ky-field-wide"><Search size={18} aria-hidden="true" />Usta bul</button>
        </form>
        <p className="ky-hero-alt">Ne aradığından emin değil misin? <Link href="/talepler/yeni" className="marketing-text-link">İş ilanı ver</Link> ve teklifler sana gelsin.</p>
      </div>
      <figure className="ky-hero-photo"><Image src="/images/marketing/hero-kesif.webp" alt="Bir boyacı ve ev sahibi, salon duvarını şerit metreyle birlikte ölçüyor" fill priority sizes="(min-width: 1024px) 560px, 100vw" />
        <figcaption>Keşifte duvarı birlikte ölçmek. Temsili görsel.</figcaption></figure>
    </div></section>

    <section id="nasil-calisir" className="landing-section ky-section-white" aria-labelledby="how-title"><div className="marketing-container">
      <div className="section-intro"><p className="marketing-eyebrow">Nasıl çalışır</p><h2 id="how-title" className="marketing-heading">Aramadan randevuya üç adım.</h2></div>
      <ol className="how-grid">{steps.map(({ icon: Icon, title, text }, index) => <li key={title}>
        <div className="how-icon"><Icon size={24} aria-hidden="true" /><span>{index + 1}</span></div><h3>{title}</h3><p>{text}</p></li>)}</ol>
    </div></section>

    <section className="landing-section" aria-labelledby="services-title"><div className="marketing-container">
      <div className="section-heading-row"><div className="section-intro"><p className="marketing-eyebrow">Popüler hizmetler</p><h2 id="services-title" className="marketing-heading">Evinin her işi için usta.</h2></div>
        <Link href="/meslekler" className="marketing-text-link">Tüm hizmetler <ArrowRight size={17} aria-hidden="true" /></Link></div>
      <ul className="ky-service-grid">{services.map(service => <li key={service.slug}><Link href={service.slug ? `/usta-bul?category=${service.slug}` : "/usta-bul"} className="ky-service-card">
        <span className="ky-service-photo"><Image src={`/images/marketing/${service.image}.webp`} alt={service.alt} fill sizes="(min-width: 1280px) 220px, (min-width: 640px) 33vw, 100vw" /></span>
        <span className="ky-service-copy"><strong>{service.name}</strong><span>{service.text}</span></span></Link></li>)}</ul>
      <p className="visual-disclosure">Hizmet görselleri temsilidir; usta profillerinde ustaların kendi işleri yer alır.</p>
    </div></section>

    <section className="landing-section ky-section-white" aria-labelledby="trust-title"><div className="marketing-container">
      <div className="section-intro"><p className="marketing-eyebrow">Güven</p><h2 id="trust-title" className="marketing-heading">Kime kapını açtığını bil.</h2></div>
      <ul className="ky-trust-grid">{trust.map(({ icon: Icon, title, text }) => <li key={title}><span className="ky-trust-icon"><Icon size={22} aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p></li>)}</ul>
    </div></section>

    <section id="usta-paneli" className="landing-section" aria-labelledby="pro-title"><div className="marketing-container">
      <div className="ky-pro-grid">
        <div className="ky-pro-copy"><p className="marketing-eyebrow">Ustalar için</p><h2 id="pro-title" className="marketing-heading">Teklifini hesapla, müşterine düzenli gönder.</h2>
          <p className="ky-lead">Profilini yayınla, bölgendeki taleplere teklif ver. Malzeme, işçilik ve kâr hesabın aynı yerde olsun.</p>
          <ul className="check-list"><li><Check size={18} aria-hidden="true" /> Maliyetini kendi fiyatlarınla hesapla.</li><li><Check size={18} aria-hidden="true" /> Kapsamı açık bir teklif gönder, yanıtı takip et.</li><li><Check size={18} aria-hidden="true" /> İş bitince gerçek kârını gör.</li></ul>
          <div className="ky-actions"><Link className="marketing-primary" href="/onboarding?usta=1">Ücretsiz başla <ArrowRight size={17} aria-hidden="true" /></Link><Link className="marketing-secondary" href="/fiyatlandirma">Fiyatlandırma</Link></div>
          <p className="ky-hero-alt"><Link href="/hesaplama-araclari/kar-marji" className="marketing-text-link">Kâr marjı hesaplama</Link> aracını dene veya <Link href="/rehber" className="marketing-text-link">rehber yazılarına</Link> göz at.</p></div>
        <figure className="ky-pro-photo"><Image src="/images/marketing/usta-teklif.webp" alt="Şantiyede telefonuyla teklif hazırlayan bir usta" fill sizes="(min-width: 1024px) 540px, 100vw" /><figcaption>Sahada teklif hazırlamak. Temsili görsel.</figcaption></figure>
      </div>
      <ProductDemo />
      <div className="ky-quote-row">
        <figure className="ky-quote-preview"><div><Image src="/images/marketing/quote-demo-logo.jpg" width={636} height={1279} alt="Gerçek demo teklifinden alınan önizleme: iş kapsamı, 42.500 TL örnek fiyat ve ödeme koşulları" sizes="(min-width: 1024px) 360px, (min-width: 640px) 60vw, 90vw" /></div><figcaption>Gerçek teklif önizlemesi. Örnek veriler.</figcaption></figure>
        <MarginExample />
      </div>
    </div></section>

    <section className="landing-section ky-section-white" aria-labelledby="faq-title"><div className="marketing-container ky-faq-grid">
      <div className="section-intro"><p className="marketing-eyebrow">Sık sorulanlar</p><h2 id="faq-title" className="marketing-heading">Aklındaki sorular.</h2>
        <p className="ky-lead">Cevabı burada yoksa <Link href="/iletisim" className="marketing-text-link">bize yaz</Link>.</p></div>
      <div className="ky-faq-list">{faqs.map(({ q, a }) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
    </div></section>

    <section className="marketing-container ky-final" aria-labelledby="final-title"><div>
      <MessageSquareText size={28} aria-hidden="true" />
      <h2 id="final-title">İşini anlat, ustalar sana yazsın.</h2>
      <p>Bir kez yaz, bölgendeki ustalardan teklif topla. Ücretsiz.</p>
      <div className="ky-actions"><Link className="ky-cta-light" href="/talepler/yeni">İş ilanı ver <ArrowRight size={17} aria-hidden="true" /></Link><Link className="ky-cta-ghost" href="/usta-bul">Usta bul</Link></div></div></section>
  </>;
}

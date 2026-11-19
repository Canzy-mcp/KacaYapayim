import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, CalendarDays, Check, ClipboardList, Eye, Monitor, PaintRoller, Search, Send, Smartphone, TrendingUp } from "lucide-react";
import { JsonLd, siteMetadata, siteOrigin } from "@/lib/marketing/seo";
import { DeviceShowcase, HeroVisual, ProfessionCards } from "@/components/marketing/visuals";
import { MarginExample, ProductDemo } from "@/components/marketing/product-demo";
import { ProfessionRequest } from "@/components/marketing/profession-request";

export const metadata: Metadata = siteMetadata("Usta bul, teklif al ve işini yönet", "İşin için usta bul veya ilan açıp teklif al. Ustalar için maliyet hesabı, profesyonel teklifler ve iş takibi.", "/");

export default function Home() {
  return <>
    <JsonLd data={[{ "@context": "https://schema.org", "@type": "Organization", name: "KaçaYapayım", url: siteOrigin, logo: `${siteOrigin}/brand/logo.png` }, { "@context": "https://schema.org", "@type": "WebSite", name: "KaçaYapayım", url: siteOrigin }, { "@context": "https://schema.org", "@type": "WebApplication", name: "KaçaYapayım", applicationCategory: "BusinessApplication", operatingSystem: "Web", description: "Usta arama, iş ilanı, teklif ve iş yönetimi uygulaması.", url: siteOrigin }]} />
    <section className="landing-hero"><div className="marketing-container hero-grid">
      <div className="hero-copy">
        <h1>İşin için <span>usta bul.</span></h1>
        <p className="hero-description">Yakınındaki ustaları keşfet, ilanına gelen teklifleri karşılaştır ve randevunu oluştur.</p>
        <div className="hero-actions"><Link className="marketing-primary" href="/usta-bul">Usta Bul <ArrowRight size={18} aria-hidden="true"/></Link>
          <Link className="marketing-secondary" href="/talepler/yeni">İş İlanı Ver</Link></div>
        <Link className="marketing-text-link mt-4" href="#usta-paneli">Ustalar için iş yönetimi <ArrowRight size={16} aria-hidden="true" /></Link>
      </div><HeroVisual/>
    </div></section>
    <section id="nasil-calisir" className="landing-section bg-white"><div className="marketing-container">
      <div className="section-intro"><h2 className="marketing-heading">Aramadan randevuya.</h2></div>
      <ol className="how-grid">{[
        { icon: Search, title: "Bölgende ara", text: "İlçeni ve ihtiyacın olan hizmeti seç. Usta profillerini ve müşteri değerlendirmelerini incele." },
        { icon: ClipboardList, title: "Çağrı gönder veya ilan aç", text: "Bir ustaya doğrudan ulaş ya da işini tarif edip gelen teklifleri karşılaştır." },
        { icon: CalendarDays, title: "Tarihi birlikte belirle", text: "Talep üzerinden mesajlaş, randevunu onayla ve iş tamamlanınca deneyimini değerlendir." },
      ].map(({ icon: Icon, title, text }) => <li key={title}>
        <div className="how-icon"><Icon size={25} aria-hidden="true" /></div><h3>{title}</h3><p>{text}</p>
      </li>)}</ol>
    </div></section>

    <section id="usta-paneli" className="landing-section demo-section"><div className="marketing-container">
      <div className="section-heading-row"><div className="section-intro"><h2 className="marketing-heading">Ustalar için iş yönetimi.</h2>
        <p>Hizmet profilini yayınla, bölgendeki taleplere teklif ver ve kendi işlerinde malzeme, işçilik ve kâr hesabını takip et.</p></div>
        <Link className="marketing-primary shrink-0" href="/onboarding?usta=1">Usta paneline git <ArrowRight size={17} aria-hidden="true" /></Link>
      </div><ProductDemo/>
    </div></section>

    <section className="landing-section how-section"><div className="marketing-container">
      <div className="section-intro" data-reveal><h2 className="marketing-heading">Teklifini üç adımda hazırla.</h2></div>
      <ol className="how-grid">{[
        { icon: PaintRoller, title: "Maliyetlerini tanımla", text: "Malzeme, işçilik ve giderlerini bir kez kaydet. Alış fiyatların değiştiğinde güncelle." },
        { icon: ClipboardList, title: "İşin detaylarını gir", text: "Ölçüyü, gereken malzemeyi ve iş gününü mesleğine uygun formda belirt." },
        { icon: Send, title: "Fiyatı gör, teklifini gönder", text: "Hedef kârına göre fiyatı bul. İş kapsamını ve ödeme koşullarını açıkça paylaş." },
      ].map(({ icon: Icon, title, text }) => <li key={title} data-reveal><div className="how-icon"><Icon size={25} aria-hidden="true" /></div><h3>{title}</h3><p>{text}</p></li>)}</ol>
    </div></section>

    <section className="landing-section calculation-section"><div className="marketing-container calculation-grid">
      <div className="section-intro" data-reveal><p className="marketing-eyebrow">Fiyatının arkasında bir hesap olsun</p><h2 className="marketing-heading">Fiyatı kafadan değil,<br/>hesabına göre belirle.</h2>
        <p>Boya kutusundan son yol masrafına kadar kendi giderlerini kullan. Hedef kâr marjına göre ne kadar istemen gerektiğini gör.</p>
        <ul className="check-list"><li><Check size={17} aria-hidden="true"/> Malzeme ve işçilik aynı hesapta.</li><li><Check size={17} aria-hidden="true"/> Hedef kârın ve minimum fiyatın görünür.</li><li><Check size={17} aria-hidden="true"/> Pazarlık sonrası sana kalanı bilirsin.</li></ul>
        <Link href="/metodoloji" className="marketing-text-link">Hesaplama mantığını incele <ArrowRight size={17} aria-hidden="true"/></Link>
      </div><MarginExample/>
    </div></section>

    <section className="landing-section profession-section"><div className="marketing-container">
      <div className="section-heading-row" data-reveal><div className="section-intro"><p className="marketing-eyebrow">İşini anlayan bir hesap</p><h2 className="marketing-heading">Senin mesleğin.<br/>Senin maliyetlerin.</h2></div><Link href="/meslekler" className="marketing-text-link">Meslekleri incele <ArrowRight size={17} aria-hidden="true"/></Link></div>
      <ProfessionCards/><p className="visual-disclosure">Meslek görselleri temsili olarak hazırlanmıştır.</p><ProfessionRequest/>
      <div className="inline-cta" data-reveal><p>Bir sonraki işine, hesabını bilerek fiyat ver.</p><Link href="/register" className="marketing-primary">Ücretsiz Başla <ArrowRight size={17} aria-hidden="true"/></Link></div>
    </div></section>

    <section className="landing-section devices-section"><div className="marketing-container">
      <div className="section-intro centered" data-reveal><p className="marketing-eyebrow">Masanın başında. Müşterinin yanında.</p><h2 className="marketing-heading">Ofiste de kullan,<br/>sahada da kullan.</h2><p>Bilgisayarda işlerini topluca gör. Telefonda teklifine bak, müşterinle paylaş. Hesabın hep yanında olsun.</p></div>
      <DeviceShowcase/>
      <div className="device-benefits" data-reveal><span><Monitor size={21} aria-hidden="true"/> Bilgisayarda işletme özeti</span><span><Smartphone size={21} aria-hidden="true"/> Telefonda teklif ve paylaşım</span></div>
      <p className="mobile-availability">Mobil tarayıcıdan kullanabilirsin. iOS ve Android uygulamaları yayın hazırlığında.</p>
      <div className="centered-actions"><Link href="/register" className="marketing-primary">Ücretsiz Başla</Link><Link href="/demo" className="marketing-text-link">Demoyu incele <ArrowRight size={17} aria-hidden="true"/></Link></div>
    </div></section>

    <section className="landing-section quote-section"><div className="marketing-container quote-story-grid">
      <figure className="quote-preview-scene" data-reveal><div className="quote-paper-preview"><Image src="/images/marketing/quote-demo-logo.jpg" width={636} height={1279}
        alt="Gerçek demo teklifinden alınan önizleme: iş kapsamı, 42.500 TL örnek fiyat ve ödeme koşulları" sizes="(min-width: 1024px) 440px, (min-width: 640px) 500px, 85vw"/></div>
        <div className="quote-status-card"><span className="success-icon"><Check size={18} aria-hidden="true"/></span><div><strong>Müşteri yanıtı tek yerde.</strong><span>Görüntülenme · Kabul · Red</span></div></div><figcaption>Gerçek teklif önizlemesi · Örnek veriler</figcaption></figure>
      <div className="section-intro" data-reveal><p className="marketing-eyebrow">Teklifini düzenli hale getir</p><h2 className="marketing-heading">Gönder.<br/>Takip et.<br/><span className="text-[#0071e3]">Kârını gör.</span></h2>
        <p>İşin kapsamını müşterinle paylaş. Teklifin sonucunu ve işin tamamlanma durumunu aynı yerden takip et.</p>
        <ol className="quote-journey">{[
          { icon: Send, title: "Teklifini paylaş", text: "WhatsApp, PDF veya tek bir bağlantı." },
          { icon: Eye, title: "Müşterinin yanıtını gör", text: "Teklif açıldı mı, kabul edildi mi?" },
          { icon: TrendingUp, title: "İş sonunda gerçek kârını bil", text: "Gerçek giderlerini tahmininle karşılaştır." },
        ].map(item => <li key={item.title}><span><item.icon size={19} aria-hidden="true"/></span><div><h3>{item.title}</h3><p>{item.text}</p></div></li>)}</ol>
        <Link href="/ozellikler" className="marketing-text-link">Tüm özellikleri gör <ArrowRight size={17} aria-hidden="true"/></Link>
      </div>
    </div></section>

    <section className="landing-section resources-section"><div className="marketing-container resource-grid">
      <Link href="/hesaplama-araclari/kar-marji" data-reveal><p className="marketing-eyebrow">Ücretsiz hesaplayıcı</p><h2>Kendi maliyetinle<br/>bir hesap yap.</h2><p>Üye olmadan hedef marjına göre fiyatını gör.</p><span className="marketing-text-link">Hesaplayıcıyı aç <ArrowRight size={17} aria-hidden="true"/></span></Link>
      <Link href="/rehber" data-reveal><p className="marketing-eyebrow">Ustanın fiyat rehberi</p><h2>Teklif verirken<br/>neyi hesaba katmalı?</h2><p>Marj, işçilik ve pazarlık için somut örnekler.</p><span className="marketing-text-link">Rehberleri oku <ArrowRight size={17} aria-hidden="true"/></span></Link>
    </div></section>
    <section className="final-cta marketing-container" data-reveal><p className="marketing-eyebrow">Bir sonraki işinde</p><h2>İşini kaça yapacağını<br/>bilerek teklif ver.</h2><p>Maliyetlerini tanımla, doğru fiyatı hesapla, teklifini müşterine profesyonel şekilde gönder.</p><div className="centered-actions"><Link className="marketing-primary" href="/register">Ücretsiz Başla <ArrowRight size={18} aria-hidden="true"/></Link><Link className="marketing-secondary" href="/meslekler">Meslekleri İncele</Link></div></section>
  </>;
}


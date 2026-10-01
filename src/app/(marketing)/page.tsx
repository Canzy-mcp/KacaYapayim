import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, Check, ClipboardList, Eye, Monitor, PaintRoller, Send, ShieldCheck, Smartphone, TrendingUp } from "lucide-react";
import { JsonLd, siteMetadata, siteOrigin } from "@/lib/marketing/seo";
import { DeviceShowcase, HeroVisual, ProfessionCards } from "@/components/marketing/visuals";
import { MarginExample, ProductDemo } from "@/components/marketing/product-demo";

export const metadata: Metadata = siteMetadata("İşini doğru fiyatlandır", "Malzeme ve işçilik maliyetlerini gir. Gerçek maliyetini, kârını ve teklif fiyatını hesapla.", "/");

export default function Home() {
  return <>
    <JsonLd data={[{ "@context": "https://schema.org", "@type": "Organization", name: "KaçaYapayım", url: siteOrigin, logo: `${siteOrigin}/brand/logo.png` }, { "@context": "https://schema.org", "@type": "WebSite", name: "KaçaYapayım", url: siteOrigin }, { "@context": "https://schema.org", "@type": "WebApplication", name: "KaçaYapayım", applicationCategory: "BusinessApplication", operatingSystem: "Web", description: "Ustalar için maliyet, kâr ve teklif hesaplama uygulaması.", url: siteOrigin }]} />
    <section className="landing-hero"><div className="marketing-container hero-grid">
      <div className="hero-copy"><p className="hero-eyebrow"><span aria-hidden="true"/> Ustalar için, işin hesabı.</p>
        <h1>İşini kaça yapacağını artık <span>tahmin etme.</span></h1>
        <p className="hero-description">Maliyetini hesapla, kârını gör, doğru fiyatı bul. Müşterine güven veren bir teklif gönder.</p>
        <div className="hero-actions"><Link className="marketing-primary" href="/register">Ücretsiz Başla <ArrowRight size={18} aria-hidden="true"/></Link>
          <a className="marketing-secondary" href="#nasil-calisir">Nasıl Çalışır?</a></div>
        <p className="hero-assurance"><ShieldCheck size={16} aria-hidden="true"/> Kendi maliyetlerine göre. Her işin hesabı ayrı.</p>
      </div><HeroVisual/>
    </div></section>
    <div className="audience-line marketing-container" aria-label="Ürün kullanım alanları"><span><PaintRoller size={18} aria-hidden="true"/> Boyacı, elektrikçi, tesisatçı ve klimacılar için</span>
      <span><Smartphone size={18} aria-hidden="true"/> Bilgisayarda ve telefonda</span><span><ClipboardList size={18} aria-hidden="true"/> Maliyet, teklif ve kâr tek yerde</span></div>

    <section className="landing-section demo-section"><div className="marketing-container">
      <div className="section-intro" data-reveal><p className="marketing-eyebrow">Hesaptan teklife</p><h2 className="marketing-heading">Bir iş. Baştan sona net.</h2>
        <p>KaçaYapayım, ustalar ve hizmet işletmeleri için maliyet, fiyat ve teklif hesabını bir araya getirir.</p></div><ProductDemo/>
    </div></section>

    <section id="nasil-calisir" className="landing-section how-section"><div className="marketing-container">
      <div className="section-intro" data-reveal><p className="marketing-eyebrow">Nasıl çalışır?</p><h2 className="marketing-heading">Sen işini bilirsin.<br/>Hesabı KaçaYapayım’da tut.</h2></div>
      <div className="how-grid">{[
        { n: "01", icon: PaintRoller, title: "Maliyetlerini tanımla.", text: "Malzeme, işçilik ve giderlerini bir kez kaydet. Alış fiyatların değiştiğinde güncelle." },
        { n: "02", icon: ClipboardList, title: "İşin detaylarını gir.", text: "Ölçüyü, gereken malzemeyi ve iş gününü mesleğine uygun formda belirt." },
        { n: "03", icon: Send, title: "Fiyatı gör, teklifini gönder.", text: "Hedef kârına göre fiyatı bul. İş kapsamını ve ödeme koşullarını açıkça paylaş." },
      ].map(item => <article key={item.n} data-reveal><div className="how-icon"><item.icon size={25} aria-hidden="true"/><span>{item.n}</span></div><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
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
      <ProfessionCards/><p className="visual-disclosure">Meslek görselleri temsili olarak hazırlanmıştır.</p>
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
        <p>İşin kapsamını müşterinle aynı şekilde anlayın. Tekliften işin tamamlanmasına kadar sonucu takip et.</p>
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


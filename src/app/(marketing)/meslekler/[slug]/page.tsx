import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { professions } from "@/lib/marketing/content";
import { breadcrumbs, JsonLd, siteMetadata } from "@/lib/marketing/seo";
import { ContentCta, PageIntro } from "@/components/marketing/shell";
import { professionVisuals } from "@/components/marketing/visuals";
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return professions.map(p => ({ slug: p.slug })); }
export async function generateMetadata({ params }: Props) { const {slug}=await params; const p=professions.find(x=>x.slug===slug); return p ? siteMetadata(p.title, p.short, `/meslekler/${p.slug}`) : {}; }
export default async function Page({ params }: Props) {
  const {slug}=await params; const p=professions.find(x=>x.slug===slug); if(!p) notFound(); const visual=professionVisuals[slug];
  return <div className="marketing-container profession-detail"><JsonLd data={breadcrumbs([{name:"Ana Sayfa",path:"/"},{name:"Meslekler",path:"/meslekler"},{name:p.name,path:`/meslekler/${p.slug}`}])}/>
    <nav aria-label="İçerik yolu" className="profession-breadcrumb"><Link href="/">Ana Sayfa</Link><span>/</span><Link href="/meslekler">Meslekler</Link><span>/</span>{p.name}</nav>
    <div className="profession-hero"><div><PageIntro eyebrow={p.name} title={p.heading} description={p.intro}/><div className="hero-actions"><Link href="/register" className="marketing-primary">Ücretsiz Başla</Link><Link href={p.calculator} className="marketing-secondary">Örnek hesapla</Link></div><p className="hero-assurance">Kendi maliyetlerin. Kendi hedef kârın.</p></div>
      <figure className="profession-detail-photo"><Image src={`/images/marketing/${visual.image}.webp`} alt={visual.alt} fill priority sizes="(min-width: 768px) 550px, 100vw"/><figcaption>Temsili görsel · {visual.detail}</figcaption></figure></div>
    <section className="landing-section"><div className="section-intro"><p className="marketing-eyebrow">Eksik kalem, eksik kâr demek.</p><h2>Hesaba hangi kalemler girer?</h2></div><ol className="profession-cost-steps">{p.steps.map((s,i)=><li key={s} data-reveal><span>0{i+1}</span><p>{s}</p></li>)}</ol></section>
    <section className="profession-example" data-reveal><div><p className="marketing-eyebrow">Birlikte hesaplayalım</p><h2>Örnek hesap</h2><p>{p.example}</p><small>Rakamlar açıklama amaçlı örnektir; kendi alış ve işçilik maliyetlerini girmen gerekir.</small><Link href="/metodoloji" className="marketing-text-link">Hesaplamanın yöntemini incele →</Link></div><div className="profession-example-mark" aria-hidden="true"><visual.icon size={58} strokeWidth={1.3}/><span>Maliyet → Fiyat → Teklif</span></div></section>
    <section className="landing-section"><div className="section-intro"><h2>İşine yarayan kaynaklar.</h2></div><div className="hero-actions"><Link className="marketing-secondary" href={p.calculator}>Ücretsiz hesaplayıcı</Link><Link className="marketing-secondary" href={p.guide}>Konuyla ilgili rehber</Link><Link className="marketing-secondary" href="/metodoloji">Hesaplama metodolojisi</Link></div></section><ContentCta/>
  </div>;
}

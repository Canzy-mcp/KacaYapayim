
import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { professionRequestHref, supportEmail, supportHref } from "@/lib/marketing/contact";
import { CookieSettingsButton } from "@/components/marketing/cookie-settings-button";

const nav = [["Nasıl Çalışır?", "/#nasil-calisir"], ["Meslekler", "/meslekler"], ["Rehber", "/rehber"], ["Fiyatlandırma", "/fiyatlandirma"]] as const;

export function MarketingHeader() {
  return <header className="marketing-header"><div className="marketing-header-inner"><Link href="/" className="marketing-brand" aria-label="KaçaYapayım ana sayfa"><BrandLogo size={34}/></Link><nav aria-label="Ana menü" className="marketing-desktop-nav">{nav.map(([text, href]) => <Link key={href} href={href}>{text}</Link>)}</nav><div className="marketing-header-actions"><Link href="/login" className="marketing-login-link">Giriş Yap</Link><Link href="/register" className="marketing-primary">Ücretsiz Başla</Link><details className="marketing-mobile-menu"><summary aria-label="Mobil menüyü aç">Menü</summary><nav aria-label="Mobil menü">{nav.map(([text, href]) => <Link key={href} href={href}>{text}</Link>)}<Link href="/login">Giriş Yap</Link></nav></details></div></div></header>;
}
export function MarketingFooter() {
  return <footer className="border-t border-[#e8e8ed] bg-white px-5 py-12"><div className="mx-auto grid max-w-6xl gap-9 sm:grid-cols-3"><div><Link href="/" className="text-lg font-semibold tracking-tight"><BrandLogo size={38}/></Link><p className="mt-3 max-w-xs text-sm leading-6 text-[#6e6e73]">Kendi maliyetlerinle doğru fiyatı bul, teklifini güvenle paylaş.</p></div><div><h2 className="text-sm font-semibold">Ürün</h2><div className="mt-3 flex flex-col gap-2 text-sm text-[#6e6e73]"><Link href="/ozellikler">Özellikler</Link><Link href="/meslekler">Meslekler</Link><Link href="/hesaplama-araclari">Hesaplama Araçları</Link><Link href="/rehber">Rehber</Link><Link href="/fiyatlandirma">Fiyatlandırma</Link><Link href="/metodoloji">Metodoloji</Link></div></div><div><h2 className="text-sm font-semibold">KaçaYapayım</h2><div className="mt-3 flex flex-col gap-2 text-sm text-[#6e6e73]"><Link href="/hakkimizda">Hakkımızda</Link><Link href="/iletisim">İletişim</Link><a href={supportHref} className="inline-flex min-h-11 items-center break-all text-[#0071e3]">{supportEmail}</a><a href={professionRequestHref} className="inline-flex min-h-11 items-center text-[#0071e3]">Meslek eklenmesini iste</a><Link href="/gizlilik">Gizlilik</Link><Link href="/kullanim-kosullari">Kullanım Koşulları</Link><Link href="/cerez-politikasi">Çerez Politikası</Link><CookieSettingsButton className="inline-flex min-h-11 items-center text-left text-[#0071e3]" /></div></div></div></footer>;
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="max-w-3xl"><p className="marketing-eyebrow">{eyebrow}</p><h1 className="mt-4 text-[clamp(2.4rem,5vw,4rem)] font-semibold leading-[1.08] tracking-[-.055em]">{title}</h1><p className="mt-6 text-lg leading-8 text-[#6e6e73]">{description}</p></div>;
}

export function ContentCta() {
  return <aside className="mt-16 rounded-[28px] bg-[#eaf4ff] p-8 sm:p-10"><h2 className="text-2xl font-semibold tracking-tight">Bu hesabı her iş için yapmak istemiyor musun?</h2><p className="mt-3 max-w-xl text-[#5e6570]">KaçaYapayım maliyetini ve kârını otomatik hesaplasın; teklifini müşterine paylaş.</p><Link href="/register" className="marketing-primary mt-6">Ücretsiz Başla</Link></aside>;
}


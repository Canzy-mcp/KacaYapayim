
import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { professionRequestHref, supportEmail, supportHref } from "@/lib/marketing/contact";
import { CookieSettingsButton } from "@/components/marketing/cookie-settings-button";
import { MarketingMobileNavigation } from "@/components/marketing/mobile-navigation";

const nav = [["Usta Bul", "/usta-bul"], ["İş İlanı Ver", "/talepler/yeni"], ["Meslekler", "/meslekler"], ["Rehber", "/rehber"], ["Fiyatlandırma", "/fiyatlandirma"]] as const;

export function MarketingHeader() {
  return <header className="marketing-header"><div className="marketing-header-inner"><Link href="/" className="marketing-brand" aria-label="KaçaYapayım ana sayfa"><BrandLogo size={34}/></Link><nav aria-label="Ana menü" className="marketing-desktop-nav">{nav.map(([text, href]) => <Link key={href} href={href}>{text}</Link>)}</nav><div className="marketing-header-actions"><Link href="/login" className="marketing-login-link">Giriş Yap</Link><Link href="/register" className="marketing-primary">Ücretsiz Başla</Link><MarketingMobileNavigation links={nav} /></div></div></header>;
}
export function MarketingFooter() {
  return <footer className="border-t border-black/[.06] bg-[#f5f5f7] px-5 pb-10 pt-12 text-[12px] leading-[1.5] text-[#6e6e73]"><div className="mx-auto grid max-w-[1024px] gap-9 sm:grid-cols-3"><div><Link href="/" className="text-lg font-semibold tracking-tight"><BrandLogo size={38}/></Link><p className="mt-3 max-w-xs text-[12px] leading-5 text-[#6e6e73]">Kendi maliyetlerinle doğru fiyatı bul, teklifini güvenle paylaş.</p></div><div><h2 className="text-[12px] font-semibold text-[#1d1d1f]">Ürün</h2><div className="mt-3 flex flex-col gap-2 text-[12px] text-[#424245] [&_a:hover]:underline"><Link href="/ozellikler">Özellikler</Link><Link href="/meslekler">Meslekler</Link><Link href="/hesaplama-araclari">Hesaplama Araçları</Link><Link href="/rehber">Rehber</Link><Link href="/fiyatlandirma">Fiyatlandırma</Link><Link href="/metodoloji">Metodoloji</Link></div></div><div><h2 className="text-[12px] font-semibold text-[#1d1d1f]">KaçaYapayım</h2><div className="mt-3 flex flex-col gap-2 text-[12px] text-[#424245] [&_a:hover]:underline"><Link href="/hakkimizda">Hakkımızda</Link><Link href="/iletisim">İletişim</Link><a href={supportHref} className="inline-flex min-h-11 items-center break-all text-[#0071e3]">{supportEmail}</a><a href={professionRequestHref} className="inline-flex min-h-11 items-center text-[#0071e3]">Meslek eklenmesini iste</a><Link href="/gizlilik">Gizlilik</Link><Link href="/kullanim-kosullari">Kullanım Koşulları</Link><Link href="/cerez-politikasi">Çerez Politikası</Link><CookieSettingsButton className="inline-flex min-h-11 items-center text-left text-[#0071e3]" /></div></div></div></footer>;
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="max-w-3xl"><p className="marketing-eyebrow">{eyebrow}</p><h1 className="mt-3 text-[clamp(2.6rem,6vw,4.5rem)] font-bold leading-[1.04] tracking-[-.04em]">{title}</h1><p className="mt-6 text-[21px] leading-[1.4] tracking-[-.016em] text-[#6e6e73]">{description}</p></div>;
}

export function ContentCta() {
  return <aside className="mt-16 rounded-[28px] bg-black p-8 text-[#f5f5f7] sm:p-12"><h2 className="text-[28px] font-semibold leading-tight tracking-[-.03em]">Bu hesabı her iş için yapmak istemiyor musun?</h2><p className="mt-3 max-w-xl text-[17px] leading-[1.47] text-[#a1a1a6]">KaçaYapayım maliyetini ve kârını otomatik hesaplasın; teklifini müşterine paylaş.</p><Link href="/register" className="marketing-primary mt-6">Ücretsiz Başla</Link></aside>;
}


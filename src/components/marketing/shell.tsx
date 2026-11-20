import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { professionRequestHref, supportEmail, supportHref } from "@/lib/marketing/contact";
import { CookieSettingsButton } from "@/components/marketing/cookie-settings-button";
import { MarketingMobileNavigation, MarketingNavGroup, type NavGroup, type NavLink } from "@/components/marketing/mobile-navigation";

const mainLinks: readonly NavLink[] = [["Usta bul", "/usta-bul"], ["İş ilanı ver", "/talepler/yeni"], ["Hizmetler", "/meslekler"], ["Rehber", "/rehber"]];
const professionalGroup: NavGroup = { label: "Ustalar için", links: [["Özellikler", "/ozellikler"], ["Fiyatlandırma", "/fiyatlandirma"], ["Hesaplama araçları", "/hesaplama-araclari"]] };

export function MarketingHeader() {
  return <header className="marketing-header"><div className="marketing-header-inner">
    <Link href="/" className="marketing-brand" aria-label="KaçaYapayım ana sayfa"><BrandLogo size={34}/></Link>
    <nav aria-label="Ana menü" className="marketing-desktop-nav">{mainLinks.map(([text, href]) => <Link key={href} href={href}>{text}</Link>)}<MarketingNavGroup group={professionalGroup} /></nav>
    <div className="marketing-header-actions"><Link href="/login" className="marketing-login-link">Giriş yap</Link><Link href="/register" className="marketing-primary marketing-header-cta">Ücretsiz başla</Link><MarketingMobileNavigation links={mainLinks} group={professionalGroup} /></div>
  </div></header>;
}

const footerGroups: { title: string; links: readonly NavLink[] }[] = [
  { title: "Müşteriler", links: [["Usta bul", "/usta-bul"], ["İş ilanı ver", "/talepler/yeni"], ["Hizmetler", "/meslekler"], ["Rehber", "/rehber"]] },
  { title: "Ustalar", links: [["Özellikler", "/ozellikler"], ["Fiyatlandırma", "/fiyatlandirma"], ["Hesaplama araçları", "/hesaplama-araclari"], ["Kâr marjı hesaplama", "/hesaplama-araclari/kar-marji"], ["Rehber", "/rehber"], ["Ücretsiz başla", "/register"]] },
  { title: "Şirket", links: [["Hakkımızda", "/hakkimizda"], ["İletişim", "/iletisim"], ["Metodoloji", "/metodoloji"], ["Gizlilik", "/gizlilik"], ["Kullanım koşulları", "/kullanim-kosullari"], ["Çerez politikası", "/cerez-politikasi"]] },
];

export function MarketingFooter() {
  return <footer className="ky-footer"><div className="marketing-container ky-footer-grid">
    <div className="ky-footer-brand"><Link href="/" aria-label="KaçaYapayım ana sayfa"><BrandLogo size={38}/></Link><p>Yakınındaki ustayı bul, işini anlat, teklifleri karşılaştır. Ustalar için teklif ve maliyet takibi.</p>
      <a href={supportHref}>{supportEmail}</a><a href={professionRequestHref}>Meslek eklenmesini iste</a></div>
    {footerGroups.map(group => <nav key={group.title} aria-label={group.title}><h2>{group.title}</h2><ul>{group.links.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}
      {group.title === "Şirket" && <li><CookieSettingsButton className="ky-footer-button" /></li>}</ul></nav>)}
  </div></footer>;
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="max-w-3xl"><p className="marketing-eyebrow">{eyebrow}</p><h1 className="mt-3 text-[clamp(2.1rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-[-.025em]">{title}</h1><p className="mt-5 text-lg leading-[1.6] text-[var(--ky-muted)]">{description}</p></div>;
}

export function ContentCta() {
  return <aside className="mt-16 rounded-[var(--ky-radius)] bg-[var(--ky-primary)] p-8 text-white sm:p-12"><h2 className="text-[28px] font-bold leading-tight tracking-[-.02em]">Bu hesabı her iş için yapmak istemiyor musun?</h2><p className="mt-3 max-w-xl text-lg leading-[1.6] text-white/85">KaçaYapayım maliyetini ve kârını otomatik hesaplasın; teklifini müşterine paylaş.</p><Link href="/register" className="ky-cta-light mt-6">Ücretsiz başla</Link></aside>;
}

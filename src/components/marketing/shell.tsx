import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { professionRequestHref, supportEmail, supportHref } from "@/lib/marketing/contact";
import { CookieSettingsButton } from "@/components/marketing/cookie-settings-button";
import { type NavGroup, type NavLink } from "@/components/marketing/mobile-navigation";
import { IslandNav } from "@/components/marketing/island-nav";

const mainLinks: readonly NavLink[] = [["Usta bul", "/usta-bul"], ["Nasıl çalışır", "/nasil-calisir"], ["Hizmetler", "/meslekler"], ["Rehber", "/rehber"]];
const professionalGroup: NavGroup = { label: "Ustalar için", href: "/ustalar-icin", links: [["Özellikler", "/ozellikler"], ["Fiyatlandırma", "/fiyatlandirma"], ["Hesaplama araçları", "/hesaplama-araclari"]] };

export function MarketingHeader() {
  return <header className="marketing-header"><IslandNav links={mainLinks} group={professionalGroup} /></header>;
}

const footerGroups: { title: string; links: readonly NavLink[] }[] = [
  { title: "Müşteriler", links: [["Usta bul", "/usta-bul"], ["İş ilanı ver", "/talepler/yeni"], ["Nasıl çalışır", "/nasil-calisir"], ["Güvenli hizmet", "/guvenli-hizmet"]] },
  { title: "Ustalar", links: [["Ustalar için", "/ustalar-icin"], ["Özellikler", "/ozellikler"], ["Fiyatlandırma", "/fiyatlandirma"], ["Hesaplama araçları", "/hesaplama-araclari"], ["Kâr marjı hesaplama", "/hesaplama-araclari/kar-marji"]] },
  { title: "Kaynaklar", links: [["Rehber", "/rehber"], ["Meslekler", "/meslekler"], ["Metodoloji", "/metodoloji"], ["Yayın politikası", "/yayin-politikasi"]] },
  { title: "Şirket", links: [["Hakkımızda", "/hakkimizda"], ["İletişim", "/iletisim"], ["Gizlilik", "/gizlilik"], ["Kullanım koşulları", "/kullanim-kosullari"], ["Çerez politikası", "/cerez-politikasi"]] },
];

const legalEntity = process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim();

export function MarketingFooter() {
  return <footer className="ky-footer"><div className="marketing-container ky-footer-grid">
    <div className="ky-footer-brand"><Link href="/" aria-label="KaçaYapayım ana sayfa"><BrandLogo size={28}/></Link><p>Kaça Yapayım ile yakınındaki ustayı bul, işini anlat, teklifleri karşılaştır.</p>
      <a href={supportHref}>{supportEmail}</a><a href={professionRequestHref}>Meslek eklenmesini iste</a></div>
    {footerGroups.map(group => <nav key={group.title} aria-label={group.title}><h2>{group.title}</h2><ul>{group.links.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}
      {group.title === "Şirket" && <li><CookieSettingsButton className="ky-footer-button" /></li>}</ul></nav>)}
    <div className="ky-footer-legal"><span>© {new Date().getFullYear()} KaçaYapayım{legalEntity ? ` · ${legalEntity}` : ""}</span><span>Türkiye</span></div>
  </div></footer>;
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="max-w-3xl"><p className="marketing-eyebrow">{eyebrow}</p><h1 className="ky-display mt-3 !text-[clamp(2.25rem,1.6rem+2.8vw,4rem)]">{title}</h1><p className="ky-lead mt-5">{description}</p></div>;
}

export function ContentCta() {
  return <aside className="mt-16 rounded-2xl bg-primary p-8 text-white sm:p-12"><h2 className="ky-title !text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] !text-white">Bu hesabı her iş için yapmak istemiyor musun?</h2><p className="mt-3 max-w-xl text-lg leading-[1.6] text-white/85">KaçaYapayım maliyetini ve kârını otomatik hesaplasın; teklifini müşterine paylaş.</p><Link href="/register" className="ky-cta-light mt-6">Hesap aç</Link></aside>;
}

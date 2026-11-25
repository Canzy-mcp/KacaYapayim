"use client";

import { BrandLogo } from "@/components/brand-logo";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { isNavigationActive } from "@/lib/navigation-active";
import { navigation } from "@/lib/navigation";
import { Avatar, ButtonLink } from "@/components/ui";
import type { Business, Profile } from "@/types/database";

export type ShellUser = { profile: Profile; business: Business };
function initials(profile: Profile) { return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toLocaleUpperCase("tr-TR") || "KY"; }

function Brand({ mobile = false }: { mobile?: boolean }) {
  return <Link href="/dashboard" className={`inline-flex items-center whitespace-nowrap font-medium tracking-heading text-ink ${mobile ? "text-[19px]" : "text-[21px]"}`}><BrandLogo size={32}/></Link>;
}

export function Sidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  return <aside className="ky-sidebar fixed inset-y-0 left-0 hidden w-60 flex-col bg-ink px-3 py-5 text-white lg:flex"><div className="px-3"><Brand /></div><nav aria-label="Ana menü" className="mt-8 space-y-0.5">{navigation.map(({ label, href, icon: Icon }) => <Link key={href} href={href} aria-current={isNavigationActive(pathname, href) ? "page" : undefined} className={`relative flex min-h-10 items-center gap-3 rounded-md px-3 text-[14px] font-semibold transition-colors ${isNavigationActive(pathname, href) ? "bg-white/10 text-white before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-tape [&>svg]:text-tape" : "text-white/65 hover:bg-white/5 hover:text-white [&>svg]:text-white/45"}`}><Icon size={18} strokeWidth={1.8} />{label}</Link>)}</nav><div className="mt-auto border-t border-white/10 px-3 pt-5"><div className="flex items-center gap-3"><Avatar size="small" initials={initials(user.profile)} /><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-white">{user.business.name}</p><p className="text-[12px] text-white/55">{user.business.profession}</p></div></div></div></aside>;
}

export function MobileNavigation() {
  const pathname = usePathname();
  const items = navigation.filter((item) => item.href !== "/usta-talepleri" && item.href !== "/costs" && item.href !== "/billing" && item.href !== "/settings");
  return <nav aria-label="Mobil menü" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"><div className="mx-auto grid max-w-xl grid-cols-5 items-end px-2 py-2">{items.slice(0, 2).map(({ label, href, icon: Icon }) => <MobileItem key={href} label={label} href={href} active={isNavigationActive(pathname, href)} icon={<Icon size={21} strokeWidth={1.8} />} />)}<Link href="/new-quote" aria-label="Yeni Teklif" className="mx-auto flex w-[62px] flex-col items-center gap-1 text-center"><span className="flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-primary"><Plus size={23} strokeWidth={2} /></span><span className="whitespace-nowrap text-[10px] font-semibold text-ink">Yeni Teklif</span></Link>{items.slice(2).map(({ label, href, icon: Icon }) => <MobileItem key={href} label={label} href={href} active={isNavigationActive(pathname, href)} icon={<Icon size={21} strokeWidth={1.8} />} />)}</div></nav>;
}

function MobileItem({ label, href, active, icon }: { label: string; href: string; active: boolean; icon: React.ReactNode }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-center ${active ? "text-primary" : "text-subtle"}`}>{icon}<span className="whitespace-nowrap text-[11px] font-semibold">{label}</span></Link>;
}

export function Dropdown({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); ref.current?.querySelector<HTMLButtonElement>("button")?.focus(); } };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return <div ref={ref} className="relative"><button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="account-navigation" aria-label="Profil, maliyetler ve diğer sayfalar" className="flex min-h-11 items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-primary"><Avatar initials={initials(user.profile)} /><ChevronDown size={14} className="hidden text-muted sm:block" /></button>{open && <nav id="account-navigation" aria-label="Hesap ve diğer sayfalar" className="absolute right-0 top-[calc(100%+8px)] z-40 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-float"><div className="mb-1 border-b border-line px-3 py-2"><p className="text-[13px] font-semibold">{user.profile.first_name} {user.profile.last_name}</p><p className="text-[12px] text-muted">{user.business.name}</p></div><Link onClick={() => setOpen(false)} href="/settings#profile" className="menu-item">Profil</Link><Link onClick={() => setOpen(false)} href="/settings#business" className="menu-item">İşletme Ayarları</Link><Link onClick={() => setOpen(false)} href="/jobs" className="menu-item">İşlerim</Link><Link onClick={() => setOpen(false)} href="/usta-talepleri" className="menu-item">Usta Talepleri</Link><Link onClick={() => setOpen(false)} href="/talepler" className="menu-item">Hizmet Taleplerim</Link><Link onClick={() => setOpen(false)} href="/costs" className="menu-item">Maliyetlerim</Link><Link onClick={() => setOpen(false)} href="/billing" className="menu-item">Paket ve Kullanım</Link><Link onClick={() => setOpen(false)} href="/team-work" className="menu-item">Bana Atanmış İşler</Link><button disabled={loggingOut} onClick={async () => { setLoggingOut(true); try { for (const key of Object.keys(sessionStorage)) if (key.startsWith("ky:draft:") || key === "ky:calculator-result") sessionStorage.removeItem(key); } catch { /* Restricted browser storage must not prevent logout. */ } await logoutAction(); router.replace("/login"); router.refresh(); }} className="menu-item w-full text-left">{loggingOut ? "Çıkış yapılıyor..." : "Çıkış"}</button></nav>}</div>;
}

export function AppHeader({ user }: { user: ShellUser }) {
  return <header className="sticky top-0 z-20 flex h-[56px] items-center justify-between border-b border-line-strong bg-canvas px-5 sm:px-8 lg:h-[60px] lg:justify-end lg:px-10"><div className="lg:hidden"><Brand mobile /></div><div className="flex items-center gap-2 sm:gap-4"><Link href="/work" title="İş takibi ve hatırlatmalar" aria-label="İş takibi ve hatırlatmalar" className="flex size-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-neutral-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"><Bell size={19} strokeWidth={1.8} /></Link><Dropdown user={user} /></div></header>;
}

export function AppShell({ children, user }: { children: React.ReactNode; user: ShellUser }) {
  return <div className="min-h-screen bg-canvas text-ink"><Sidebar user={user} /><div className="lg:pl-60"><AppHeader user={user} /><main className="mx-auto w-full max-w-[1440px] px-5 pb-32 pt-8 sm:px-8 sm:pt-10 lg:px-10 lg:pb-12">{children}</main></div><MobileNavigation /></div>;
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: { label: string; href: string } }) {
  return <div className="mb-8 flex flex-col gap-5 sm:mb-9 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="font-display text-[30px] font-bold leading-[1.1] tracking-display sm:text-[38px]">{title}</h1><p className="mt-2 max-w-2xl text-[16px] leading-[1.55] text-muted">{description}</p></div>{action && <ButtonLink href={action.href} className="w-full shrink-0 sm:w-auto"><Plus size={18} />{action.label}</ButtonLink>}</div>;
}

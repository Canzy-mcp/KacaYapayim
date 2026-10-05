"use client";

import { BrandLogo } from "@/components/brand-logo";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { navigation } from "@/lib/navigation";
import { Avatar, ButtonLink } from "@/components/ui";
import type { Business, Profile } from "@/types/database";

export type ShellUser = { profile: Profile; business: Business };
function initials(profile: Profile) { return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toLocaleUpperCase("tr-TR") || "KY"; }

function Brand({ mobile = false }: { mobile?: boolean }) {
  return <Link href="/dashboard" className={`inline-flex items-center whitespace-nowrap font-medium tracking-[-0.055em] text-[#1D1D1F] ${mobile ? "text-[19px]" : "text-[21px]"}`}><BrandLogo size={32}/></Link>;
}

export function Sidebar({ user }: { user: ShellUser }) {
  const pathname = usePathname();
  return <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-[#e5e5e9] bg-white px-4 py-7 lg:flex"><div className="px-3"><Brand /><p className="mt-1 text-[12px] text-[#8a8a91]">İşin değerini bil.</p></div><nav aria-label="Ana menü" className="mt-12 space-y-1">{navigation.map(({ label, href, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-[14px] font-medium transition-colors hover:bg-[#f5f5f7] ${pathname === href ? "bg-[#eef5fd] text-[#006aca]" : "text-[#55555d]"}`}><Icon size={18} strokeWidth={1.8} />{label}</Link>)}</nav><div className="mt-auto border-t border-[#ececf0] px-3 pt-5"><div className="flex items-center gap-3"><Avatar size="small" initials={initials(user.profile)} /><div className="min-w-0"><p className="truncate text-[13px] font-semibold">{user.business.name}</p><p className="text-[12px] text-[#8a8a91]">{user.business.profession}</p></div></div></div></aside>;
}

export function MobileNavigation() {
  const pathname = usePathname();
  const items = navigation.filter((item) => item.href !== "/costs" && item.href !== "/billing" && item.href !== "/settings");
  return <nav aria-label="Mobil menü" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e5e5e9] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"><div className="mx-auto grid max-w-xl grid-cols-5 items-end px-2 py-2">{items.slice(0, 2).map(({ label, href, icon: Icon }) => <MobileItem key={href} label={label} href={href} active={pathname === href} icon={<Icon size={21} strokeWidth={1.8} />} />)}<Link href="/new-quote" aria-label="Yeni Teklif" className="mx-auto flex w-[62px] flex-col items-center gap-1 text-center"><span className="flex size-11 items-center justify-center rounded-[15px] bg-[#0071E3] text-white shadow-[0_4px_12px_rgba(0,113,227,.2)]"><Plus size={23} strokeWidth={2} /></span><span className="whitespace-nowrap text-[10px] font-semibold text-[#1D1D1F]">Yeni Teklif</span></Link>{items.slice(2).map(({ label, href, icon: Icon }) => <MobileItem key={href} label={label} href={href} active={pathname === href} icon={<Icon size={21} strokeWidth={1.8} />} />)}</div></nav>;
}

function MobileItem({ label, href, active, icon }: { label: string; href: string; active: boolean; icon: React.ReactNode }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-center ${active ? "text-[#0071E3]" : "text-[#74747b]"}`}>{icon}<span className="whitespace-nowrap text-[11px] font-medium">{label}</span></Link>;
}

export function Dropdown({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return <div ref={ref} className="relative"><button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" aria-label="Kullanıcı menüsü" className="flex min-h-11 items-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-[#0071E3]"><Avatar initials={initials(user.profile)} /><ChevronDown size={14} className="hidden text-[#8a8a91] sm:block" /></button>{open && <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-40 w-52 rounded-[16px] border border-[#e5e5e9] bg-white p-1.5 shadow-[0_12px_35px_rgba(29,29,31,.12)]"><div className="border-b border-[#eeeef1] px-3 py-2"><p className="text-[13px] font-semibold">{user.profile.first_name} {user.profile.last_name}</p><p className="text-[12px] text-[#6E6E73]">{user.business.name}</p></div><Link role="menuitem" onClick={() => setOpen(false)} href="/settings#profile" className="menu-item">Profil</Link><Link role="menuitem" onClick={() => setOpen(false)} href="/settings#business" className="menu-item">İşletme Ayarları</Link><Link role="menuitem" onClick={() => setOpen(false)} href="/team-work" className="menu-item">Bana Atanmış İşler</Link><button role="menuitem" disabled={loggingOut} onClick={async () => { setLoggingOut(true); await logoutAction(); router.replace("/login"); router.refresh(); }} className="menu-item w-full text-left">{loggingOut ? "Çıkış yapılıyor..." : "Çıkış"}</button></div>}</div>;
}

export function AppHeader({ user }: { user: ShellUser }) {
  return <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#eaeaec] bg-[#F5F5F7]/95 px-5 backdrop-blur-md sm:px-8 lg:h-[76px] lg:justify-end lg:px-10"><div className="lg:hidden"><Brand mobile /></div><div className="flex items-center gap-2 sm:gap-4"><Link href="/work" title="İş takibi ve hatırlatmalar" aria-label="İş takibi ve hatırlatmalar" className="flex size-11 items-center justify-center rounded-full text-[#6E6E73] hover:bg-white focus-visible:outline-2 focus-visible:outline-[#0071E3]"><Bell size={19} strokeWidth={1.8} /></Link><Dropdown user={user} /></div></header>;
}

export function AppShell({ children, user }: { children: React.ReactNode; user: ShellUser }) {
  return <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]"><Sidebar user={user} /><div className="lg:pl-60"><AppHeader user={user} /><main className="mx-auto w-full max-w-[1440px] px-5 pb-32 pt-8 sm:px-8 sm:pt-10 lg:px-10 lg:pb-12">{children}</main></div><MobileNavigation /></div>;
}

export function PageHeader({ title, description, action }: { title: string; description: string; action?: { label: string; href: string } }) {
  return <div className="mb-8 flex flex-col gap-5 sm:mb-9 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.055em] sm:text-[42px]">{title}</h1><p className="mt-3 max-w-2xl text-[15px] leading-6 text-[#6E6E73] sm:text-[16px]">{description}</p></div>{action && <ButtonLink href={action.href} className="min-h-12 w-full shrink-0 sm:w-auto"><Plus size={18} />{action.label}</ButtonLink>}</div>;
}

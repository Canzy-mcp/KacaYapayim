"use client";

import { BrandLogo } from "@/components/brand-logo";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, FileText, House, Layers3, Plus, Settings2, UsersRound, Wrench } from "lucide-react";
import type { ReactNode } from "react";

const items = [
  { href: "/demo", label: "Ana Sayfa", icon: House },
  { href: "/demo/quotes", label: "Teklifler", icon: FileText },
  { href: "/demo/customers", label: "Müşteriler", icon: UsersRound },
  { href: "/demo/costs", label: "Maliyetlerim", icon: Layers3 },
  { href: "/demo/professions", label: "Meslek Formları", icon: Wrench },
  { href: "/demo/billing", label: "Üyelik", icon: CreditCard },
  { href: "/demo/settings", label: "Ayarlar", icon: Settings2 },
] as const;

export function DemoShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return <div className="min-h-screen bg-canvas text-ink"><aside className="ky-sidebar fixed inset-y-0 left-0 hidden w-60 flex-col bg-ink px-3 py-5 text-white lg:flex"><Link href="/demo" className="px-3 text-[20px]"><BrandLogo size={30}/></Link><nav aria-label="Demo menüsü" className="mt-8 space-y-0.5">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={`relative flex min-h-10 items-center gap-3 rounded-md px-3 text-[14px] font-semibold transition-colors ${path === href ? "bg-white/10 text-white before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-tape [&>svg]:text-tape" : "text-white/65 hover:bg-white/5 hover:text-white [&>svg]:text-white/45"}`}><Icon size={18} strokeWidth={1.8} />{label}</Link>)}</nav><div className="mt-auto border-t border-white/10 px-3 pt-5"><p className="text-[13px] font-semibold text-white">Örnek Boya Atölyesi</p><p className="mt-1 text-[12px] text-white/55">Boyacı · Demo</p></div></aside><div className="lg:pl-60"><header className="sticky top-0 z-20 flex h-[56px] items-center justify-between border-b border-line-strong bg-canvas px-5 sm:px-8 lg:h-[60px] lg:justify-end lg:px-10"><Link href="/demo" className="text-[21px] font-semibold tracking-heading lg:hidden"><BrandLogo size={32}/></Link><Link href="/login" className="text-[13px] font-medium text-primary hover:underline">Demodan Çık</Link></header><main className="mx-auto w-full max-w-[1440px] px-5 pb-32 pt-7 sm:px-8 lg:px-10 lg:pb-12"><div role="status" className="mb-7 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-tape bg-tape-soft px-4 py-3 text-[13px] text-tape-ink"><span><strong className="text-ink">Demo görünümü</strong> · Ekrandaki müşteri ve teklifler örnek veridir.</span><span>Değişiklikler kaydedilmez.</span></div>{children}</main></div><nav aria-label="Demo mobil menüsü" className="fixed inset-x-0 bottom-0 z-30 border-t border-line-strong bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"><div className="mx-auto grid max-w-xl grid-cols-5 px-2 py-2">{items.slice(0, 2).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-center ${path === href ? "text-primary" : "text-muted"}`}><Icon size={21} /><span className="text-[10px] font-medium">{label}</span></Link>)}<Link href="/demo/new-quote" className="flex min-h-14 flex-col items-center justify-center gap-1 text-center"><span className="flex size-11 items-center justify-center rounded-full bg-primary text-white shadow-primary"><Plus size={23} /></span><span className="text-[10px] font-semibold">Yeni Teklif</span></Link>{items.slice(2, 3).concat(items.slice(4, 5)).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-center ${path === href ? "text-primary" : "text-muted"}`}><Icon size={21} /><span className="text-[10px] font-medium">{label}</span></Link>)}</div></nav></div>;
}


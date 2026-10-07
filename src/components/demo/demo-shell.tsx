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
  { href: "/demo/billing", label: "Paket ve Kullanım", icon: CreditCard },
  { href: "/demo/settings", label: "Ayarlar", icon: Settings2 },
] as const;

export function DemoShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  return <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]"><aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-[#e5e5e9] bg-white px-4 py-7 lg:flex"><Link href="/demo" className="px-3 text-[21px] font-semibold tracking-[-0.055em]"><BrandLogo size={32}/></Link><p className="mt-1 px-3 text-[12px] text-[#62626a]">İşin değerini bil.</p><nav aria-label="Demo menüsü" className="mt-12 space-y-1">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path === href ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-[14px] font-medium transition-colors hover:bg-[#f5f5f7] ${path === href ? "bg-[#eef5fd] text-[#006aca]" : "text-[#55555d]"}`}><Icon size={18} strokeWidth={1.8} />{label}</Link>)}</nav><div className="mt-auto border-t border-[#ececf0] px-3 pt-5"><p className="text-[13px] font-semibold">Örnek Boya Atölyesi</p><p className="mt-1 text-[12px] text-[#62626a]">Boyacı · Demo</p></div></aside><div className="lg:pl-60"><header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#eaeaec] bg-[#F5F5F7]/95 px-5 backdrop-blur-md sm:px-8 lg:h-[76px] lg:justify-end lg:px-10"><Link href="/demo" className="text-[21px] font-semibold tracking-[-0.055em] lg:hidden"><BrandLogo size={32}/></Link><Link href="/login" className="text-[13px] font-semibold text-[#6E6E73] hover:text-[#0071E3]">Demodan Çık</Link></header><main className="mx-auto w-full max-w-[1440px] px-5 pb-32 pt-7 sm:px-8 lg:px-10 lg:pb-12"><div role="status" className="mb-7 flex flex-wrap items-center justify-between gap-2 rounded-[13px] border border-[#c8ddf8] bg-[#edf5ff] px-4 py-3 text-[13px] text-[#205c99]"><span><strong>Demo görünümü</strong> · Ekrandaki müşteri ve teklifler örnek veridir.</span><span>Değişiklikler kaydedilmez.</span></div>{children}</main></div><nav aria-label="Demo mobil menüsü" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e5e5e9] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"><div className="mx-auto grid max-w-xl grid-cols-5 px-2 py-2">{items.slice(0, 2).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-center ${path === href ? "text-[#0071E3]" : "text-[#74747b]"}`}><Icon size={21} /><span className="text-[10px] font-medium">{label}</span></Link>)}<Link href="/demo/new-quote" className="flex min-h-14 flex-col items-center justify-center gap-1 text-center"><span className="flex size-11 items-center justify-center rounded-[15px] bg-[#0071E3] text-white"><Plus size={23} /></span><span className="text-[10px] font-semibold">Yeni Teklif</span></Link>{items.slice(2, 3).concat(items.slice(4, 5)).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-center ${path === href ? "text-[#0071E3]" : "text-[#74747b]"}`}><Icon size={21} /><span className="text-[10px] font-medium">{label}</span></Link>)}</div></nav></div>;
}


import Link from "next/link";
import type { Metadata } from "next";
import { Bell, ClipboardList, Heart, Search } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function MarketLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return <div className="min-h-screen bg-[#f6f8fc] text-[#112046]">
    <header className="border-b border-[#dfe8f3] bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3.5">
      <Link href="/" aria-label="KaçaYapayım ana sayfa"><BrandLogo size={34} /></Link>
      <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold" aria-label="Hizmet menüsü">
        <Link className="inline-flex min-h-10 items-center gap-1.5 hover:text-[#075fc7]" href="/usta-bul"><Search size={16} /> Usta Bul</Link>
        <Link className="inline-flex min-h-10 items-center gap-1.5 hover:text-[#075fc7]" href="/talepler"><ClipboardList size={16} /> Taleplerim</Link>
        {viewer && <><Link className="inline-flex min-h-10 items-center gap-1.5 hover:text-[#075fc7]" href="/talepler/favoriler"><Heart size={16} /> Favoriler</Link>
        <Link className="inline-flex min-h-10 items-center gap-1.5 hover:text-[#075fc7]" href="/talepler/bildirimler"><Bell size={16} /> Bildirimler</Link>
        <Link className="inline-flex min-h-10 items-center hover:text-[#075fc7]" href={viewer.business?.onboarding_completed ? "/usta-talepleri" : "/onboarding?usta=1"}>{viewer.business?.onboarding_completed ? "Usta Paneli" : "Usta Olarak Başla"}</Link>
        <Link className="inline-flex min-h-10 items-center hover:text-[#075fc7]" href="/talepler/hesap">Hesabım</Link></>}
      </nav>
    </div></header>
    <main className="mx-auto max-w-5xl px-5 py-7 sm:py-10">{children}</main>
  </div>;
}

import Link from "next/link";
import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand-logo";
import { getViewer } from "@/lib/viewer";
import { MarketNavigation } from "./market-navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function MarketLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return <div className="min-h-screen bg-[#FAF7F1] text-[#202923]">
    <a href="#icerik" className="sr-only z-20 rounded-lg bg-white p-3 font-semibold text-[#064A43] focus:not-sr-only focus:absolute focus:left-4 focus:top-3">İçeriğe geç</a>
    <header className="border-b border-[#E7E1D6] bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
      <Link href="/" aria-label="KaçaYapayım ana sayfa" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075D54]"><BrandLogo size={34} /></Link>
      <MarketNavigation signedIn={!!viewer} provider={!!viewer?.business?.onboarding_completed} />
    </div></header>
    <main id="icerik" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-7 sm:px-5 sm:py-10">{children}</main>
  </div>;
}

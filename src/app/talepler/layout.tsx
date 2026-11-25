import Link from "next/link";
import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand-logo";
import { getViewer } from "@/lib/viewer";
import { MarketNavigation } from "./market-navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function MarketLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  return <div className="min-h-screen bg-canvas text-ink">
    <a href="#icerik" className="sr-only z-20 rounded-lg bg-white p-3 font-semibold text-primary-hover focus:not-sr-only focus:absolute focus:left-4 focus:top-3">İçeriğe geç</a>
    <header className="sticky top-0 z-30 border-b border-line-strong bg-white/85 backdrop-blur-xl"><div className="mx-auto flex min-h-14 max-w-[1180px] flex-wrap items-center justify-between gap-2 px-4 py-1.5 sm:px-8">
      <Link href="/" aria-label="KaçaYapayım ana sayfa" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><BrandLogo size={34} /></Link>
      <MarketNavigation signedIn={!!viewer} provider={!!viewer?.business?.onboarding_completed} />
    </div></header>
    <main id="icerik" tabIndex={-1} className="mx-auto max-w-[1180px] px-4 py-10 sm:px-8 sm:py-14">{children}</main>
  </div>;
}

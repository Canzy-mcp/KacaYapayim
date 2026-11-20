"use client";

import Link from "next/link";
import { RotateCw } from "lucide-react";

export default function DirectoryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="bg-[#f5f5f7] px-5 py-20 sm:py-28"><div className="mx-auto max-w-xl text-center">
    <h1 className="text-[clamp(1.9rem,4vw,2.75rem)] font-[650] leading-[1.1] tracking-[-0.03em] text-[#1d1d1f]">Usta bilgileri şu anda yüklenemedi.</h1>
    <p className="mt-4 text-lg leading-relaxed text-[#515154]">Bu geçici bir sorun olabilir. Birkaç saniye sonra tekrar dene.</p>
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#075d54] px-6 text-sm font-semibold text-white hover:bg-[#064a43] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075d54]"><RotateCw size={16} aria-hidden="true" /> Tekrar dene</button>
      <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d2d2d7] bg-white px-6 text-sm font-semibold text-[#1d1d1f] hover:bg-[#f5f5f7]">Ana sayfaya dön</Link>
    </div>
  </div></div>;
}

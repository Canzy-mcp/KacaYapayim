"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-canvas px-5"><div className="max-w-sm text-center"><h1 className="text-[28px] font-semibold tracking-display">Bilgiler yüklenemedi.</h1><p className="mt-3 text-[15px] text-muted">Bağlantını kontrol edip tekrar dene.</p><Button onClick={reset} className="mt-6 min-h-12">Tekrar Dene</Button></div></main>;
}

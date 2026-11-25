"use client";

import { Button } from "@/components/ui";

export default function CostsError({ reset }: { error: Error; reset: () => void }) {
  return <div className="mx-auto max-w-[1000px] rounded-xl border border-line bg-white px-6 py-10 text-center"><h1 className="text-[22px] font-semibold">Maliyetler yüklenemedi.</h1><p className="mt-2 text-[14px] text-muted">Bağlantını kontrol edip tekrar deneyebilirsin.</p><Button className="mt-6" onClick={reset}>Tekrar Dene</Button></div>;
}

"use client";
import { Button, Card } from "@/components/ui";
export default function QuotesError({ reset }: { error: Error; reset: () => void }) {
  return <Card className="mx-auto max-w-[640px] px-6 py-14 text-center"><h1 className="text-[22px] font-semibold">Teklif bilgileri yüklenemedi.</h1><p className="mt-2 text-[14px] text-[#6E6E73]">Bağlantını kontrol edip tekrar dene.</p><Button onClick={reset} className="mt-6">Tekrar Dene</Button></Card>;
}

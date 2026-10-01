"use client";
import { Button, Card } from "@/components/ui";
export default function NewQuoteError({ reset }: { error: Error; reset: () => void }) { return <div className="mx-auto max-w-[720px]"><Card className="px-6 py-14 text-center"><h1 className="text-[22px] font-semibold">İş formu yüklenemedi.</h1><p className="mt-2 text-[14px] text-[#6E6E73]">Tekrar deneyebilirsin.</p><Button onClick={reset} className="mt-6">Tekrar Dene</Button></Card></div>; }

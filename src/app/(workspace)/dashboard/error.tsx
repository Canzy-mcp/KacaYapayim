"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return <main className="mx-auto max-w-xl rounded-[20px] border border-[#e5e5e9] bg-white p-8 text-center"><h1 className="text-xl font-semibold">Özet bilgiler yüklenemedi.</h1><p className="mt-2 text-sm text-[#6E6E73]">Bağlantıyı kontrol edip tekrar deneyebilirsin.</p><button type="button" onClick={reset} className="mt-5 min-h-11 rounded-[13px] bg-[#1D1D1F] px-5 text-sm font-semibold text-white">Tekrar Dene</button></main>;
}

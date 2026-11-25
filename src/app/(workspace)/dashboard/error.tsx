"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return <main className="mx-auto max-w-xl rounded-xl border border-line bg-white p-8 text-center"><h1 className="text-xl font-semibold">Özet bilgiler yüklenemedi.</h1><p className="mt-2 text-sm text-muted">Bağlantıyı kontrol edip tekrar deneyebilirsin.</p><button type="button" onClick={reset} className="mt-5 min-h-11 rounded-lg bg-ink px-5 text-sm font-semibold text-white">Tekrar Dene</button></main>;
}

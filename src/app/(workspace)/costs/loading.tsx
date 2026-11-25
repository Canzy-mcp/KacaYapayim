export default function CostsLoading() {
  return <div className="mx-auto max-w-[1000px] animate-pulse" aria-label="Maliyetler yükleniyor">
    <div className="h-11 w-52 rounded-xl bg-line" /><div className="mt-4 h-5 w-80 max-w-full rounded-lg bg-line" />
    <div className="mt-9 h-24 rounded-xl bg-line" />
    {[0, 1, 2].map((section) => <div key={section} className="mt-8"><div className="mb-4 h-6 w-28 rounded-lg bg-line" /><div className="overflow-hidden rounded-xl border border-line bg-white">{[0, 1].map((row) => <div key={row} className="flex h-20 items-center justify-between border-b border-line px-5 last:border-0"><div className="h-5 w-32 rounded-lg bg-line" /><div className="h-5 w-24 rounded-lg bg-line" /></div>)}</div></div>)}
  </div>;
}

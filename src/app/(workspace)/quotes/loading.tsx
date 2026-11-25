export default function QuotesLoading() {
  return <div className="mx-auto max-w-[1200px] animate-pulse" aria-label="Teklifler yükleniyor"><div className="h-11 w-64 rounded-xl bg-line" /><div className="mt-5 h-5 w-80 rounded-lg bg-line" /><div className="mt-8 grid gap-5 xl:grid-cols-2"><div className="space-y-4">{[0,1,2].map((item) => <div key={item} className="h-36 rounded-xl bg-white" />)}</div><div className="h-[650px] rounded-xl bg-white" /></div></div>;
}

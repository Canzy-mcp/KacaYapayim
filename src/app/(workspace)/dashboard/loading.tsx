export default function DashboardLoading() {
  return <div aria-label="Özet yükleniyor" className="mx-auto max-w-6xl animate-pulse"><div className="h-10 w-64 rounded-xl bg-line" /><div className="mt-3 h-5 w-80 max-w-full rounded-lg bg-line" /><div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{[1,2,3,4].map((item) => <div key={item} className="h-36 rounded-xl bg-white" />)}</div><div className="mt-6 grid gap-5 lg:grid-cols-2">{[1,2].map((item) => <div key={item} className="h-64 rounded-xl bg-white" />)}</div></div>;
}

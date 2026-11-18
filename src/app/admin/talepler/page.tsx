import { notFound } from "next/navigation";
import { requireViewer } from "@/lib/viewer";
import { createClient } from "@/lib/supabase/server";
import { marketPage, marketRead } from "@/lib/marketplace/service";
import { MarketForm } from "@/components/marketplace/form";
import { marketDate, MarketEmpty, MarketHeading, MarketPagination, panel } from "@/components/marketplace/ui";

export const metadata = { title: "Hizmet Moderasyonu", robots: { index: false, follow: false } };

export default async function MarketModerationPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireViewer();
  const client = await createClient();
  const { data, error } = await client.rpc("market_read", { p_view: "admin" });
  if (error || !data) notFound();
  const page = marketPage((await searchParams).page);
  const reports = await marketRead("moderation", page);
  return <main className="mx-auto max-w-4xl px-5 py-10 text-[#112046]">
    <MarketHeading title="Hizmet moderasyonu" description="Kullanıcı bildirimlerini incele, gerektiğinde profili askıya al veya değerlendirmeyi gizle." />
    {reports.length ? <div className="grid gap-3">{reports.slice(0, 20).map((report) => <article className={panel} key={report.id}>
      <h2 className="font-semibold">{report.display_name ?? report.title ?? "Hizmet bildirimi"}</h2>
      <p className="mt-1 text-xs text-slate-600">{marketDate(report.created_at)} · {{ open: "Açık", resolved: "Çözüldü", dismissed: "Kapatıldı" }[report.state]}</p>
      <p className="my-3 whitespace-pre-wrap break-words text-sm">{report.reason}</p>
      <div className="flex flex-wrap gap-2">
        {report.state === "open" && <><MarketForm action="moderate" fields={{ id: report.id, decision: "resolve" }} label="Çözüldü işaretle" inline subtle />
          <MarketForm action="moderate" fields={{ id: report.id, decision: "dismiss" }} label="Bildirimi kapat" inline subtle />
          {report.can_hide_review && <MarketForm action="moderate" fields={{ id: report.id, decision: "hide_review" }} label="Değerlendirmeyi gizle" inline subtle />}</>}
        {report.provider_id && <MarketForm action="moderate" fields={{ id: report.id, decision: report.suspended ? "restore" : "suspend" }} label={report.suspended ? "Askıyı kaldır" : "Profili askıya al"} inline subtle />}
      </div>
    </article>)}</div> : <MarketEmpty>Henüz kullanıcı bildirimi yok.</MarketEmpty>}
    <MarketPagination page={page} more={reports.length > 20} href={(next) => `/admin/talepler?page=${next}`} />
  </main>;
}

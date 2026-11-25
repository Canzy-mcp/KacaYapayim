import { adminChallenge } from "../access";
import Link from "next/link";
import type { MarketModerationAction, MarketReport } from "@kacayapayim/core/marketplace";
import { marketPage, marketRead } from "@/lib/marketplace/service";
import { MarketForm } from "@/components/marketplace/form";
import { marketDate, MarketEmpty, MarketHeading, MarketPagination, panel } from "@/components/marketplace/ui";

export const metadata = { title: "Hizmet Moderasyonu", robots: { index: false, follow: false } };

const stateLabels: Record<MarketReport["state"], string> = { open: "Açık", resolved: "Çözüldü", dismissed: "Kapatıldı" };
const actionLabels: Record<MarketModerationAction, string> = {
  suspend: "Profil askıya alındı",
  restore: "Profilin askısı kaldırıldı",
  hide_review: "Değerlendirme gizlendi",
  resolve: "Bildirim çözüldü",
  dismiss: "Bildirim kapatıldı",
};

export default async function MarketModerationPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const challenge = await adminChallenge("/admin/talepler");
  if (challenge) return challenge;
  const page = marketPage((await searchParams).page);
  const reports = await marketRead("moderation", page);
  return <main className="mx-auto max-w-4xl px-5 py-10 text-ink">
    <MarketHeading title="Hizmet moderasyonu" description="Kullanıcı bildirimlerini incele, gerektiğinde profili askıya al veya değerlendirmeyi gizle." />
    {reports.length ? <div className="grid gap-3">{reports.slice(0, 20).map((report) => <article className={panel} key={report.id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><h2 className="break-words font-semibold">{report.display_name ?? report.title ?? "Hizmet bildirimi"}</h2>
          {report.title && report.display_name && <p className="mt-1 break-words text-sm text-ink-2">{report.title}</p>}
          <p className="mt-1 text-xs text-muted"><time dateTime={report.created_at}>{marketDate(report.created_at)}</time></p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${report.state === "open" ? "bg-warning-soft text-warning-ink" : "bg-neutral-soft text-ink-2"}`}>{stateLabels[report.state]}</span>
      </div>
      <p className="my-4 whitespace-pre-wrap break-words rounded-2xl bg-canvas px-4 py-3 text-sm leading-6">{report.reason}</p>
      <div className="flex flex-wrap gap-2">
        {report.state === "open" && <><MarketForm action="moderate" fields={{ id: report.id, decision: "resolve" }} label="Çözüldü işaretle" inline subtle />
          <MarketForm action="moderate" fields={{ id: report.id, decision: "dismiss" }} label="Bildirimi kapat" inline subtle />
          {report.can_hide_review && <MarketForm action="moderate" fields={{ id: report.id, decision: "hide_review" }} label="Değerlendirmeyi gizle" inline subtle />}</>}
        {report.provider_id && <MarketForm action="moderate" fields={{ id: report.id, decision: report.suspended ? "restore" : "suspend" }} label={report.suspended ? "Askıyı kaldır" : "Profili askıya al"} inline subtle />}
      </div>
      {(report.latest_action && report.latest_action_at || report.provider_id && !report.suspended) &&
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          {report.latest_action && report.latest_action_at && <p className="text-xs text-muted">{actionLabels[report.latest_action]} · <time dateTime={report.latest_action_at}>{marketDate(report.latest_action_at)}</time></p>}
          {report.provider_id && !report.suspended && <Link href={`/usta-bul/${report.provider_id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-hover hover:underline">Usta profilini aç</Link>}
        </div>}
    </article>)}</div> : <MarketEmpty>Henüz kullanıcı bildirimi yok.</MarketEmpty>}
    <MarketPagination page={page} more={reports.length > 20} href={(next) => `/admin/talepler?page=${next}`} />
  </main>;
}

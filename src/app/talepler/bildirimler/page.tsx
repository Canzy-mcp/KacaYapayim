import Link from "next/link";
import { marketNoticeLabels } from "@kacayapayim/core/marketplace";
import { marketPage, marketRead, requireMarketViewer } from "@/lib/marketplace/service";
import { MarketForm } from "@/components/marketplace/form";
import { marketDate, MarketEmpty, MarketHeading, MarketPagination, panel, plainButton } from "@/components/marketplace/ui";

export const metadata = { title: "Hizmet Bildirimleri" };

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireMarketViewer("/talepler/bildirimler");
  const page = marketPage((await searchParams).page);
  const rows = await marketRead("notices", page);
  return <><MarketHeading title="Bildirimler">{rows.some((row) => !row.read_at) && <MarketForm action="mark_read" label="Tümünü okundu işaretle" success="Bildirimler okundu olarak işaretlendi." inline subtle />}</MarketHeading>
    {rows.length ? <div className="grid gap-3">{rows.slice(0, 20).map((row) => <article key={row.id} className={`${panel} flex flex-wrap items-center justify-between gap-2 ${row.read_at ? "" : "border-l-4 border-l-primary"}`}>
      <div className="min-w-0"><p className="text-sm font-semibold">{marketNoticeLabels[row.event] ?? "Talep güncellendi"}{!row.read_at && <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary-hover">Okunmadı</span>}</p>
        <Link className="break-words text-sm text-primary hover:underline" href={`/talepler/${row.request_id}${row.event === "message" ? "#mesajlar" : ""}`}>{row.title}</Link>
        <p className="text-xs text-ink-2"><time dateTime={row.created_at}>{marketDate(row.created_at)}</time></p></div>
      {!row.read_at && <MarketForm action="mark_read" fields={{ id: row.id }} label="Okundu işaretle" inline subtle />}
    </article>)}</div> : <MarketEmpty photo><p className="text-lg font-semibold text-ink">{page > 1 ? "Bu sayfada bildirim yok." : "Şimdilik yeni bir şey yok."}</p>{page === 1 && <><p className="mt-2">Teklifler, mesajlar ve randevu güncellemeleri burada görünür.</p><div className="mt-5"><Link href="/talepler" className={plainButton}>Taleplerime git</Link></div></>}</MarketEmpty>}
    <MarketPagination page={page} more={rows.length > 20} href={(next) => `/talepler/bildirimler?page=${next}`} />
  </>;
}

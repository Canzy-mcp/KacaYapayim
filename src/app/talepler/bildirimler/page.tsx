import Link from "next/link";
import { marketNoticeLabels } from "@kacayapayim/core/marketplace";
import { requireViewer } from "@/lib/viewer";
import { marketPage, marketRead } from "@/lib/marketplace/service";
import { MarketForm } from "@/components/marketplace/form";
import { marketDate, MarketEmpty, MarketHeading, MarketPagination, panel } from "@/components/marketplace/ui";

export const metadata = { title: "Hizmet Bildirimleri" };

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireViewer();
  const page = marketPage((await searchParams).page);
  const rows = await marketRead("notices", page);
  return <><MarketHeading title="Bildirimler">{rows.some((row) => !row.read_at) && <MarketForm action="mark_read" label="Tümünü okundu işaretle" inline subtle />}</MarketHeading>
    {rows.length ? <div className="grid gap-2">{rows.slice(0, 20).map((row) => <article key={row.id} className={`${panel} flex flex-wrap items-center justify-between gap-2 ${row.read_at ? "" : "border-l-4 border-l-[#075fc7]"}`}>
      <div><p className="text-sm font-semibold">{marketNoticeLabels[row.event] ?? "Talep güncellendi"}</p>
        <Link className="text-sm text-[#075fc7] hover:underline" href={`/talepler/${row.request_id}`}>{row.title}</Link>
        <p className="text-xs text-slate-600">{marketDate(row.created_at)}</p></div>
      {!row.read_at && <MarketForm action="mark_read" fields={{ id: row.id }} label="Okundu işaretle" inline subtle />}
    </article>)}</div> : <MarketEmpty>Henüz bildirim yok.</MarketEmpty>}
    <MarketPagination page={page} more={rows.length > 20} href={(next) => `/talepler/bildirimler?page=${next}`} />
  </>;
}

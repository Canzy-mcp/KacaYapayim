import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, X } from "lucide-react";
import type { MarketCategory, MarketProvider } from "@kacayapayim/core/marketplace";
import { marketDirectory } from "@/lib/marketplace/service";
import { compareHref, directoryHref, parseCompareIds, parseDirectoryFilters, requestHref } from "@/lib/marketplace/prefill";
import { linkButton, MarketEmpty, plainButton, Rating } from "@/components/marketplace/ui";

export const metadata: Metadata = { title: "Usta Karşılaştır", robots: { index: false, follow: true }, alternates: { canonical: "/usta-bul/karsilastir" } };

export default async function ComparePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const ids = parseCompareIds(params.ids);
  const filters = parseDirectoryFilters(params);
  const page = Number(params.page) > 1 ? Math.min(101, Math.floor(Number(params.page))) : 1;
  const results = await Promise.all(ids.map((id) => marketDirectory({ id }).catch(() => null)));
  const categories: MarketCategory[] = results.find(Boolean)?.categories ?? [];
  const providers = results.flatMap((result) => result?.providers[0] ?? []) as MarketProvider[];
  const failed = ids.length > 0 && results.some((result) => !result);
  const without = (id: string) => ids.filter((item) => item !== id);
  const rows: { label: string; cell: (provider: MarketProvider) => React.ReactNode }[] = [
    { label: "Hizmetler", cell: (p) => categories.filter((c) => p.categories.includes(c.slug)).map((c) => c.name).join(", ") || "Belirtilmemiş" },
    { label: "İl", cell: (p) => p.city },
    { label: "Hizmet verdiği ilçeler", cell: (p) => p.districts.length ? p.districts.join(", ") : "Tüm ilçeler" },
    { label: "Puan", cell: (p) => <Rating provider={p} /> },
    { label: "Tanıtım", cell: (p) => p.bio ? <span className="line-clamp-4">{p.bio}</span> : "Tanıtım yazısı yok" },
  ];
  return <div className="bg-canvas text-ink"><div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-16">
    <Link href={directoryHref(filters, { compare: ids, page })} className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft size={17} aria-hidden="true" /> Usta rehberi</Link>
    <h1 className="text-[clamp(2rem,5vw,3rem)] font-semibold leading-[1.1] tracking-heading">Ustaları karşılaştır</h1>
    <p className="mt-2 max-w-xl text-base text-ink-2">En fazla üç ustayı hizmet, bölge ve değerlendirme açısından yan yana gör.</p>
    {failed && <p role="alert" className="mt-4 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning-ink">Bazı profiller yüklenemedi. Sayfayı yenilemeyi dene.</p>}
    {providers.length === 0 ? <div className="mt-6"><MarketEmpty photo>
      <p className="font-semibold text-ink">Karşılaştırılacak usta seçilmedi.</p>
      <p className="mt-1">Usta rehberinde profil kartlarındaki Karşılaştır bağlantısıyla en fazla üç usta seç.</p>
      <Link href={directoryHref(filters, { compare: ids, page })} className={`mt-4 ${linkButton}`}>Usta rehberine git</Link>
    </MarketEmpty></div> : <div className="relative mt-6 overflow-x-auto rounded-xl border border-line-strong bg-white">
      <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm">
        <caption className="sr-only">Seçilen ustaların karşılaştırması</caption>
        <thead><tr><td className="w-36 p-4" />{providers.map((p) => <th key={p.id} scope="col" className="border-l border-line-strong p-4 align-top">
          <Link href={`/usta-bul/${p.id}`} className="break-words text-lg font-semibold text-ink hover:underline">{p.display_name}</Link>
          <Link href={without(p.id).length ? compareHref(without(p.id), filters, page) : directoryHref(filters, { page })} className="mt-1 flex min-h-9 items-center gap-1 text-xs font-medium text-ink-2 hover:underline"><X size={13} aria-hidden="true" /> Listeden çıkar</Link>
        </th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.label} className="border-t border-line-strong">
          <th scope="row" className="p-4 align-top font-semibold text-ink-2">{row.label}</th>
          {providers.map((p) => <td key={p.id} className="break-words border-l border-line-strong p-4 align-top text-ink">{row.cell(p)}</td>)}
        </tr>)}
          <tr className="border-t border-line-strong"><th scope="row" className="p-4 align-top font-semibold text-ink-2">İşlem</th>
            {providers.map((p) => <td key={p.id} className="border-l border-line-strong p-4 align-top"><div className="grid gap-2">
              <Link href={requestHref({ usta: p.id })} className={linkButton}>Teklif iste</Link>
              <Link href={`/usta-bul/${p.id}`} className={plainButton}>Profili gör</Link></div></td>)}</tr>
        </tbody>
      </table>
    </div>}
  </div></div>;
}

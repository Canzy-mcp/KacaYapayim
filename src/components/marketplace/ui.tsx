import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { marketStateLabels, type MarketCategory, type MarketProvider, type MarketRequest } from "@kacayapayim/core/marketplace";

export const panel = "rounded-2xl border border-[#e0e5ee] bg-white p-5 sm:p-6";
export const linkButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#075fc7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0652ac]";
export const plainButton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d9dce3] bg-white px-4 py-2 text-sm font-semibold text-[#18335a] hover:bg-[#eff6ff]";
export const input = "block min-h-11 w-full rounded-xl border border-[#d9dce3] bg-white px-3 py-2.5 text-sm text-[#172235] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/25";
export const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const dateTime = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" });
const calendarDate = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "UTC" });

export function marketDate(value: string) {
  return (value.length === 10 ? calendarDate : dateTime).format(new Date(value));
}

export function CategoryOptions({ categories }: { categories: MarketCategory[] }) {
  return categories.map(({ slug, name }) => <option key={slug} value={slug}>{name}</option>);
}

export function MarketHeading({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
    <div><h1 className="text-3xl font-bold tracking-tight text-[#112046] sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">{description}</p>}</div>
    {children}
  </header>;
}

export function MarketEmpty({ children }: { children: React.ReactNode }) {
  return <div className={`${panel} border-dashed text-sm text-slate-600`}>{children}</div>;
}

export function MarketPagination({ page, more, href }: { page: number; more: boolean; href: (page: number) => string }) {
  if (page === 1 && !more) return null;
  return <nav aria-label="Sayfalama" className="mt-5 flex items-center gap-3">
    {page > 1 && <Link className={plainButton} href={href(page - 1)}>Önceki</Link>}
    <span className="text-sm text-slate-600">Sayfa {page}</span>
    {more && page < 101 && <Link className={plainButton} href={href(page + 1)}>Sonraki</Link>}
  </nav>;
}

export function ProviderCard({ provider, categories, children }: {
  provider: MarketProvider; categories: MarketCategory[]; children?: React.ReactNode;
}) {
  return <article className={`${panel} flex flex-col gap-3`}>
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#eaf3ff] font-bold text-[#075fc7]">{provider.display_name.slice(0, 2).toLocaleUpperCase("tr-TR")}</span>
      <div className="min-w-0"><h2 className="break-words text-lg font-semibold text-[#112046]">{provider.display_name}</h2>
        <p className="flex items-center gap-1 text-sm text-slate-600"><MapPin size={14} />{provider.city}{provider.districts.length > 0 && ` · ${provider.districts.join(", ")}`}</p></div>
    </div>
    {provider.rating != null && <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700"><Star size={15} className="fill-amber-400 text-amber-500" />{provider.rating} / 5 · {provider.review_count} değerlendirme</p>}
    <ul className="flex flex-wrap gap-1.5">{categories.filter((item) => provider.categories.includes(item.slug)).map((item) =>
      <li key={item.slug} className="rounded-full bg-[#f0f5fb] px-2.5 py-1 text-xs font-medium text-[#18335a]">{item.name}</li>)}</ul>
    {provider.bio && <p className="line-clamp-3 break-words text-sm text-slate-600">{provider.bio}</p>}
    <div className="mt-auto flex flex-wrap gap-2 pt-2"><Link href={`/usta-bul/${provider.id}`} className={plainButton}>Profili gör <ArrowRight size={15} /></Link>{children}</div>
  </article>;
}

export function RequestList({ rows, categories, empty }: { rows: MarketRequest[]; categories: MarketCategory[]; empty: string }) {
  if (!rows.length) return <MarketEmpty>{empty}</MarketEmpty>;
  return <div className="grid gap-3">{rows.map((row) => <article className={panel} key={row.id}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-semibold text-[#075fc7]">{row.is_direct ? "Doğrudan çağrı" : categories.find((c) => c.slug === row.category)?.name}</p>
        <h2 className="mt-1 text-lg font-bold text-[#112046]"><Link href={`/talepler/${row.id}`} className="hover:underline">{row.title}</Link></h2>
        <p className="mt-1 text-sm text-slate-600">{row.district}, {row.city}{row.preferred_date && ` · ${marketDate(row.preferred_date)}`}</p>
        {row.budget != null && <p className="mt-1 text-sm text-slate-600">Bütçe {money.format(row.budget)}</p>}</div>
      <div className="text-sm"><span className="rounded-full bg-[#edf4ff] px-3 py-1.5 font-medium text-[#18335a]">{marketStateLabels[row.state]}</span>
        {row.offer_count > 0 && <p className="mt-2 text-right text-slate-600">{row.offer_count} teklif</p>}</div>
    </div>
  </article>)}</div>;
}

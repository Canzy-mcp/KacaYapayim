import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { marketStateLabels, type MarketCategory, type MarketProvider, type MarketRequest } from "@kacayapayim/core/marketplace";
import { MiniProgress } from "./timeline";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075D54]";
export const panel = "min-w-0 rounded-2xl border border-[#E7E1D6] bg-white p-5 shadow-[0_1px_2px_#2029230a] sm:p-6";
export const linkButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#075D54] px-5 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#064A43] ${focus}`;
export const plainButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#D9D2C4] bg-white px-5 py-2 text-sm font-semibold text-[#202923] transition-colors duration-150 hover:bg-[#F3EEE4] ${focus}`;
export const input = "block min-h-11 w-full min-w-0 rounded-xl border border-[#D9D2C4] bg-white px-3 py-2.5 text-base text-[#202923] focus:border-[#075D54] focus:outline-none focus:ring-2 focus:ring-[#075D54]/25 sm:text-sm";
export const chip = "inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#EFE9DC] px-3 py-1 text-sm font-medium text-[#202923]";
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
    <div className="min-w-0"><h1 className="text-3xl font-semibold tracking-tight text-[#202923] sm:text-4xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-base leading-relaxed text-[#5B6460]">{description}</p>}</div>
    {children}
  </header>;
}

export function MarketEmpty({ children }: { children: React.ReactNode }) {
  return <div className={`${panel} border-dashed text-sm text-[#5B6460]`}>{children}</div>;
}

export function MarketPagination({ page, more, href }: { page: number; more: boolean; href: (page: number) => string }) {
  if (page === 1 && !more) return null;
  return <nav aria-label="Sayfalama" className="mt-5 flex flex-wrap items-center gap-3">
    {page > 1 && <Link className={plainButton} href={href(page - 1)}>Önceki</Link>}
    <span aria-current="page" className="text-sm text-[#5B6460]">Sayfa {page}</span>
    {more && page < 101 && <Link className={plainButton} href={href(page + 1)}>Sonraki</Link>}
  </nav>;
}

export function Rating({ provider }: { provider: Pick<MarketProvider, "rating" | "review_count"> }) {
  if (provider.rating == null || !provider.review_count) return <p className="text-sm text-[#5B6460]">Henüz değerlendirme yok</p>;
  return <p className="flex items-center gap-1.5 text-sm font-medium text-[#202923]"><Star size={15} className="fill-[#C98A2B] text-[#C98A2B]" aria-hidden="true" />
    {provider.rating.toLocaleString("tr-TR")} / 5 <span className="font-normal text-[#5B6460]">· {provider.review_count} değerlendirme</span></p>;
}

export function ProviderCard({ provider, categories, compare, children }: {
  provider: MarketProvider; categories: MarketCategory[];
  compare?: { href: string; selected: boolean; full: boolean }; children?: React.ReactNode;
}) {
  const services = categories.filter((item) => provider.categories.includes(item.slug));
  return <article className={`${panel} flex flex-col gap-3`}>
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#E4EFEC] font-semibold text-[#075D54]">{provider.display_name.slice(0, 2).toLocaleUpperCase("tr-TR")}</span>
      <div className="min-w-0"><h3 className="break-words text-lg font-semibold text-[#202923]">{provider.display_name}</h3>
        <p className="flex items-start gap-1 text-sm text-[#5B6460]"><MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{provider.city} · {provider.districts.length ? provider.districts.join(", ") : "Tüm ilçeler"}</span></p></div>
    </div>
    <Rating provider={provider} />
    <ul className="flex flex-wrap gap-1.5">{services.map((item) =>
      <li key={item.slug} className="rounded-full bg-[#F3EEE4] px-2.5 py-1 text-xs font-medium text-[#202923]">{item.name}</li>)}</ul>
    {provider.bio && <p className="line-clamp-3 break-words text-sm leading-relaxed text-[#5B6460]">{provider.bio}</p>}
    <div className="mt-auto flex flex-wrap items-center gap-2 pt-2"><Link href={`/usta-bul/${provider.id}`} aria-label={`${provider.display_name} profilini gör`} className={plainButton}>Profili gör <ArrowRight size={15} aria-hidden="true" /></Link>
      {compare && (compare.full && !compare.selected ? <span className="inline-flex min-h-11 items-center px-2 text-xs text-[#5B6460]">En fazla 3 usta</span> :
        <Link href={compare.href} scroll={false} aria-pressed={compare.selected} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold ${focus} ${compare.selected ? "bg-[#075D54] text-white" : "text-[#075D54] hover:bg-[#F3EEE4]"}`}>
          <span aria-hidden="true" className={`grid size-4 place-items-center rounded border text-[10px] ${compare.selected ? "border-white" : "border-[#075D54]"}`}>{compare.selected ? "✓" : ""}</span>Karşılaştır</Link>)}
      {children}</div>
  </article>;
}

export function RequestList({ rows, categories, empty }: { rows: MarketRequest[]; categories: MarketCategory[]; empty: string }) {
  if (!rows.length) return <MarketEmpty>{empty}</MarketEmpty>;
  return <div className="grid gap-3">{rows.map((row) => <article className={`${panel} transition-shadow duration-150 hover:shadow-[0_4px_18px_#20292312]`} key={row.id}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-xs font-semibold tracking-wide text-[#075D54]">{row.is_direct ? "Doğrudan çağrı" : categories.find((c) => c.slug === row.category)?.name}</p>
        <h2 className="mt-1 break-words text-lg font-semibold text-[#202923]"><Link href={`/talepler/${row.id}`} className="hover:underline">{row.title}</Link></h2>
        <p className="mt-1 text-sm text-[#5B6460]">{row.district}, {row.city}{row.preferred_date && ` · ${marketDate(row.preferred_date)}`}{row.budget != null && ` · Bütçe ${money.format(row.budget)}`}</p></div>
      <div className="text-right text-sm"><span className="inline-block rounded-full bg-[#EFE9DC] px-3 py-1.5 font-medium text-[#202923]">{marketStateLabels[row.state]}</span>
        {row.offer_count > 0 && <p className="mt-2 font-medium text-[#075D54]">{row.offer_count} teklif</p>}</div>
    </div>
    <MiniProgress state={row.state} />
  </article>)}</div>;
}

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { marketStateLabels, type MarketCategory, type MarketProvider, type MarketRequest } from "@kacayapayim/core/marketplace";
import { MiniProgress } from "./timeline";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075d54]";
export const panel = "min-w-0 rounded-[20px] border border-[#d2d2d7] bg-white p-6 sm:p-7";
export const linkButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#075d54] px-6 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#064a43] ${focus}`;
export const plainButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-6 py-2 text-sm font-semibold text-[#1d1d1f] transition-colors duration-150 hover:bg-[#f5f5f7] ${focus}`;
export const disabledButton = "inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[#ececf0] px-6 py-2 text-sm font-semibold text-[#6e6e73]";
export const input = "block min-h-12 w-full min-w-0 rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2.5 text-base text-[#1d1d1f] focus:border-[#075d54] focus:outline-none focus:ring-2 focus:ring-[#075d54]/25 sm:text-sm";
export const chip = "inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#ececf0] px-3 py-1 text-sm font-medium text-[#1d1d1f]";
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
  return <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0"><h1 className="text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[#1d1d1f]">{title}</h1>
      {description && <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#515154] sm:text-lg">{description}</p>}</div>
    {children}
  </header>;
}

// photo: friendly variant with the appointment photograph; put actions inside children.
export function MarketEmpty({ children, photo = false }: { children: React.ReactNode; photo?: boolean }) {
  if (!photo) return <div className={`${panel} border-dashed text-sm text-[#515154]`}>{children}</div>;
  return <div className="grid min-w-0 overflow-hidden rounded-[20px] border border-[#d2d2d7] bg-white sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <div className="order-2 min-w-0 p-6 text-sm leading-relaxed text-[#515154] sm:order-1 sm:p-10">{children}</div>
    <Image src="/images/marketing/musteri-randevu.webp" alt="" width={640} height={480} sizes="(min-width: 640px) 40vw, 100vw" className="order-1 aspect-[4/3] h-full w-full object-cover sm:order-2" />
  </div>;
}

export function MarketPagination({ page, more, href }: { page: number; more: boolean; href: (page: number) => string }) {
  if (page === 1 && !more) return null;
  return <nav aria-label="Sayfalama" className="mt-8 flex flex-wrap items-center gap-3">
    {page > 1 && <Link className={plainButton} href={href(page - 1)}>Önceki</Link>}
    <span aria-current="page" className="text-sm text-[#515154]">Sayfa {page}</span>
    {more && page < 101 && <Link className={plainButton} href={href(page + 1)}>Sonraki</Link>}
  </nav>;
}

export function Rating({ provider }: { provider: Pick<MarketProvider, "rating" | "review_count"> }) {
  if (provider.rating == null || !provider.review_count) return <p className="text-sm text-[#515154]">Henüz değerlendirme yok</p>;
  return <p className="flex items-center gap-1.5 text-sm font-medium text-[#1d1d1f]"><Star size={15} className="fill-[#c98a2b] text-[#c98a2b]" aria-hidden="true" />
    {provider.rating.toLocaleString("tr-TR")} <span className="font-normal text-[#515154]">({provider.review_count} değerlendirme)</span></p>;
}

export function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full bg-[#e4f0ed] font-semibold text-[#075d54] ${size === "lg" ? "size-16 text-2xl" : "size-12 text-lg"}`}>{Array.from(name.trim())[0]?.toLocaleUpperCase("tr-TR") ?? "U"}</span>;
}

export function ProviderCard({ provider, categories, compare, children }: {
  provider: MarketProvider; categories: MarketCategory[];
  compare?: { href: string; selected: boolean; full: boolean }; children?: React.ReactNode;
}) {
  const services = categories.filter((item) => provider.categories.includes(item.slug));
  return <article className={`${panel} flex flex-col gap-4 transition-colors duration-150 hover:border-[#86868b]`}>
    <div className="flex items-start gap-4">
      <Avatar name={provider.display_name} />
      <div className="min-w-0"><h3 className="break-words text-lg font-semibold leading-snug tracking-[-0.01em] text-[#1d1d1f]">{provider.display_name}</h3>
        <p className="mt-1 flex items-start gap-1 text-sm text-[#515154]"><MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{provider.city} · {provider.districts.length ? provider.districts.join(", ") : "Tüm ilçeler"}</span></p></div>
    </div>
    <Rating provider={provider} />
    {services.length > 0 && <ul className="flex flex-wrap gap-1.5" aria-label="Hizmetler">{services.map((item) =>
      <li key={item.slug} className="rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-medium text-[#1d1d1f]">{item.name}</li>)}</ul>}
    {provider.bio && <p className="line-clamp-3 break-words text-sm leading-relaxed text-[#515154]">{provider.bio}</p>}
    <div className="mt-auto flex flex-wrap items-center gap-2 pt-2"><Link href={`/usta-bul/${provider.id}`} aria-label={`${provider.display_name} profilini gör`} className={plainButton}>Profili gör <ArrowRight size={15} aria-hidden="true" /></Link>
      {compare && (compare.full && !compare.selected ? <span className="inline-flex min-h-11 items-center px-2 text-xs text-[#515154]">En fazla 3 usta</span> :
        <Link href={compare.href} scroll={false} aria-label={`${provider.display_name} ${compare.selected ? "karşılaştırmadan çıkar" : "karşılaştırmaya ekle"}`} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold ${focus} ${compare.selected ? "bg-[#075d54] text-white" : "text-[#075d54] hover:bg-[#f5f5f7]"}`}>
          <span aria-hidden="true" className={`grid size-4 place-items-center rounded border text-[10px] ${compare.selected ? "border-white" : "border-[#075d54]"}`}>{compare.selected ? "✓" : ""}</span>{compare.selected ? "Seçildi" : "Karşılaştır"}</Link>)}
      {children}</div>
  </article>;
}

// Fixed at the bottom once at least one usta is selected. Without two selections the action is a disabled button, never a link.
export function CompareTray({ names, count, href, clearHref }: { names: string[]; count: number; href: string; clearHref: string }) {
  if (count < 1) return null;
  return <div role="region" aria-label="Karşılaştırma" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d2d2d7] bg-white/90 backdrop-blur-xl">
    <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
      <p className="min-w-0 text-sm text-[#1d1d1f]" aria-live="polite"><span className="font-semibold">{count} usta seçildi</span>
        <span className="ml-2 text-[#515154]">{count < 2 ? "Karşılaştırmak için bir usta daha seç." : names.length ? names.join(", ") : "En fazla 3 usta seçebilirsin."}</span></p>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={clearHref} scroll={false} className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-[#075d54] hover:underline">Seçimi temizle</Link>
        {count >= 2 ? <Link href={href} className={linkButton}>Karşılaştır</Link> : <button type="button" disabled aria-disabled="true" className={disabledButton}>Karşılaştır</button>}
      </div>
    </div>
  </div>;
}

export function RequestList({ rows, categories, empty }: { rows: MarketRequest[]; categories: MarketCategory[]; empty: string }) {
  if (!rows.length) return <MarketEmpty>{empty}</MarketEmpty>;
  return <div className="grid gap-4">{rows.map((row) => <article className={`${panel} transition-colors duration-150 hover:border-[#86868b]`} key={row.id}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-xs font-semibold tracking-wide text-[#075d54]">{row.is_direct ? "Doğrudan çağrı" : categories.find((c) => c.slug === row.category)?.name}</p>
        <h2 className="mt-1 break-words text-lg font-semibold text-[#1d1d1f]"><Link href={`/talepler/${row.id}`} className="hover:underline">{row.title}</Link></h2>
        <p className="mt-1 text-sm text-[#515154]">{row.district}, {row.city}{row.preferred_date && ` · ${marketDate(row.preferred_date)}`}{row.budget != null && ` · Bütçe ${money.format(row.budget)}`}</p></div>
      <div className="text-right text-sm"><span className="inline-block rounded-full bg-[#ececf0] px-3 py-1.5 font-medium text-[#1d1d1f]">{marketStateLabels[row.state]}</span>
        {row.offer_count > 0 && <p className="mt-2 font-medium text-[#075d54]">{row.offer_count} teklif</p>}</div>
    </div>
    <MiniProgress state={row.state} />
  </article>)}</div>;
}

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { siteOrigin, organizationId } from "@/lib/marketing/seo";

// Apple-inspired editorial blocks for trade, guide, calculator and methodology pages.
export const pill = "inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-[16px] font-semibold text-white no-underline transition-colors duration-150 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
export const pillOutline = "inline-flex min-h-11 items-center justify-center rounded-lg border border-line-strong bg-surface shadow-xs px-6 text-[16px] font-semibold text-ink no-underline transition-colors duration-150 hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
export const proseLink = "font-medium text-primary underline underline-offset-4 hover:text-primary-hover";
export const h2 = "text-[1.625rem] font-semibold leading-[1.15] tracking-heading text-ink sm:text-[2rem]";
export const body = "text-[1.0625rem] leading-[1.6] text-ink sm:text-[1.125rem]";
export const muted = "text-ink-2";

export function Band({ tone = "white", children, label, narrow = false }: { tone?: "white" | "gray"; children: ReactNode; label?: string; narrow?: boolean }) {
  return <section aria-labelledby={label} className={`${tone === "gray" ? "bg-canvas" : "bg-white"} py-14 sm:py-20 lg:py-28`}><div className={`mx-auto w-full min-w-0 px-5 sm:px-8 lg:px-12 ${narrow ? "max-w-[68ch]" : "max-w-[1180px]"}`}>{children}</div></section>;
}

export function EdCrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return <nav aria-label="İçerik yolu" className="text-sm text-muted"><ol className="flex flex-wrap items-center gap-x-2">{items.map((item, i) => <li key={item.name} className="flex items-center gap-2">{i > 0 && <span aria-hidden="true">/</span>}{item.href ? <Link href={item.href} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">{item.name}</Link> : <span aria-current="page">{item.name}</span>}</li>)}</ol></nav>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold tracking-[.01em] text-muted">{children}</p>;
}

export function Display({ children, as: Tag = "h1" }: { children: ReactNode; as?: "h1" | "h2" }) {
  return <Tag className="mt-3 text-balance text-[clamp(2.5rem,1.6rem+3.6vw,4.5rem)] font-[650] leading-[1.08] tracking-display text-ink">{children}</Tag>;
}

// Byline: "KaçaYapayım Editörlüğü · Son güncelleme <date> · Hesaplamalar metodoloji"
export function Byline({ updatedLabel, modified, formatted }: { updatedLabel: string; modified: string; formatted: string }) {
  return <p className="mt-5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
    <Link href="/yayin-politikasi" className="inline-flex min-h-11 items-center underline underline-offset-4">KaçaYapayım Editörlüğü</Link><span aria-hidden="true">·</span>
    <span>{updatedLabel} <time dateTime={modified}>{formatted}</time></span><span aria-hidden="true">·</span>
    <span>Hesaplamalar: <Link href="/metodoloji" className="inline-flex min-h-11 items-center underline underline-offset-4">metodoloji</Link></span>
  </p>;
}

export function Callout({ title, tone = "answer", children }: { title?: string; tone?: "answer" | "note" | "warn"; children: ReactNode }) {
  const cls = tone === "answer" ? "bg-canvas" : tone === "warn" ? "border border-line-strong bg-white" : "bg-primary-soft";
  return <div className={`mt-8 rounded-xl p-6 sm:p-8 ${cls}`}>{title && <p className="text-sm font-semibold tracking-[.01em] text-muted">{title}</p>}<div className={`${title ? "mt-2 " : ""}${body}`}>{children}</div></div>;
}

export function Summary({ items, title = "Kısaca" }: { items: readonly string[]; title?: string }) {
  return <Callout title={title}><ul className="grid gap-3">{items.map(i => <li key={i} className="flex gap-3"><span aria-hidden="true" className="mt-[.7em] size-1.5 shrink-0 rounded-full bg-primary" /><span className="min-w-0">{i}</span></li>)}</ul></Callout>;
}

export function Table({ caption, head, rows }: { caption: string; head: readonly string[]; rows: readonly (readonly string[])[] }) {
  return <div className="relative mt-6 overflow-x-auto"><table className="w-full min-w-[20rem] border-collapse text-left text-[15px] leading-6 sm:text-base">
    <caption className="pb-3 text-left text-sm font-semibold text-muted">{caption}</caption>
    <thead><tr>{head.map(h => <th key={h} scope="col" className="border-b border-ink px-3 py-3 font-semibold first:pl-0">{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-line-strong">{r.map((c, j) => j === 0 ? <th key={j} scope="row" className="py-3 pl-0 pr-3 text-left align-top font-semibold">{c}</th> : <td key={j} className="px-3 py-3 align-top text-ink-2">{c}</td>)}</tr>)}</tbody>
  </table></div>;
}

export function Checks({ items }: { items: readonly string[] }) {
  return <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">{items.map(i => <li key={i} className="flex min-w-0 gap-3 border-t border-line-strong pt-4 leading-[1.55]"><span aria-hidden="true" className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">✓</span><span className="min-w-0">{i}</span></li>)}</ul>;
}

export function FaqList({ items, title = "Sık sorulan sorular" }: { items: readonly (readonly [string, string])[]; title?: string }) {
  return <div><h2 id="faq-title" className={h2}>{title}</h2><div className="mt-6 divide-y divide-line-strong border-y border-line-strong">{items.map(([q, a]) => <details key={q} className="group"><summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-4 text-[1.0625rem] font-semibold marker:content-none focus-visible:outline-2 focus-visible:outline-primary"><span>{q}</span><span aria-hidden="true" className="text-primary transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none">+</span></summary><p className="pb-5 leading-[1.6] text-ink-2">{a}</p></details>)}</div></div>;
}

export type RelatedItem = { href: string; label: string; note?: string };
export function Related({ items, title = "İlgili bağlantılar", id = "related" }: { items: readonly RelatedItem[]; title?: string; id?: string }) {
  return <div><h2 id={id} className={h2}>{title}</h2><ul className="mt-6 grid gap-4 sm:grid-cols-2">{items.map(i => <li key={i.href} className="min-w-0"><Link href={i.href} className="block h-full rounded-xl border border-line-strong bg-white p-6 no-underline transition-colors duration-150 hover:border-primary"><span className="block text-[1.0625rem] font-semibold text-ink">{i.label}</span>{i.note && <span className="mt-2 block text-[15px] leading-[1.5] text-ink-2">{i.note}</span>}<span aria-hidden="true" className="mt-3 block text-primary">→</span></Link></li>)}</ul></div>;
}

export function SourceList({ items }: { items: readonly { label: string; url: string; note: string }[] }) {
  return <div><h2 id="sources-title" className="text-xl font-semibold tracking-heading">Kaynaklar</h2><ul className="mt-4 grid gap-3">{items.map(s => <li key={s.url} className="leading-[1.55]"><a href={s.url} className={proseLink} {...(s.url.startsWith("http") ? { rel: "noopener noreferrer", target: "_blank" } : {})}>{s.label}</a><span className="block text-sm text-muted">{s.note}</span></li>)}</ul></div>;
}

export function Photo({ src, alt, caption, priority = false, ratio = "4/3", sizes = "(min-width: 1024px) 480px, 100vw" }: { src: string; alt: string; caption: string; priority?: boolean; ratio?: "4/3" | "16/9"; sizes?: string }) {
  return <figure className="min-w-0"><div className={`relative overflow-hidden rounded-xl bg-canvas ${ratio === "4/3" ? "aspect-[4/3]" : "aspect-[16/9]"}`}><Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" /></div><figcaption className="mt-2 text-[13px] leading-[1.45] text-muted">{caption}</figcaption></figure>;
}

// ImageObject node for photos shown on the page. Photos are illustrative, not provider work.
export function imageNode(pageUrl: string, key: string, src: string, alt: string, caption: string) {
  return { "@type": "ImageObject", "@id": `${pageUrl}#${key}`, url: `${siteOrigin}${src}`, contentUrl: `${siteOrigin}${src}`, caption, description: alt, inLanguage: "tr-TR", representativeOfPage: false, creditText: "KaçaYapayım", publisher: { "@id": organizationId } };
}

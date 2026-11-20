import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { breadcrumbNode, faqNode, graph, JsonLd, webPageNode } from "@/lib/marketing/seo";

const focus = "focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#075d54]";
export const pillPrimary = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#075d54] px-7 text-[17px] font-semibold text-white no-underline transition-colors duration-150 hover:bg-[#064a43] ${focus}`;
export const pillSecondary = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#075d54] bg-transparent px-7 text-[17px] font-semibold text-[#075d54] no-underline transition-colors duration-150 hover:bg-[#075d54]/10 ${focus}`;
export const textLink = `font-semibold text-[#075d54] underline underline-offset-4 hover:text-[#064a43] ${focus}`;
export const display = "text-[clamp(2.5rem,1.6rem+4.4vw,4.5rem)] font-[650] leading-[1.08] tracking-[-.04em] text-[#1d1d1f] text-balance";
export const headline = "text-[clamp(1.875rem,1.3rem+2.6vw,3rem)] font-semibold leading-[1.12] tracking-[-.03em] text-[#1d1d1f] text-balance";
export const title = "text-[clamp(1.3rem,1.15rem+.7vw,1.75rem)] font-semibold leading-[1.2] tracking-[-.02em] text-[#1d1d1f]";
export const lead = "text-[clamp(1.0625rem,1rem+.3vw,1.25rem)] leading-[1.55] text-[#515154]";
export const tile = "min-w-0 rounded-[20px] border border-[#d2d2d7] bg-white p-6 sm:p-8";

export function Band({ tone = "white", children, label, id, className = "" }: { tone?: "white" | "gray"; children: ReactNode; label?: string; id?: string; className?: string }) {
  return <section id={id} aria-labelledby={label} className={`scroll-mt-28 py-14 sm:py-20 lg:py-28 ${tone === "gray" ? "bg-[#f5f5f7]" : "bg-white"} ${className}`}><div className="mx-auto w-full min-w-0 max-w-[1180px] px-5 sm:px-8 lg:px-12">{children}</div></section>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold tracking-[.01em] text-[#075d54]">{children}</p>;
}

export function Intro({ eyebrow, h, id, text, center = false, as: Tag = "h2" }: { eyebrow?: string; h: string; id: string; text?: string; center?: boolean; as?: "h1" | "h2" }) {
  return <div className={`min-w-0 max-w-3xl ${center ? "mx-auto text-center" : ""}`}>{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}<Tag id={id} className={`${eyebrow ? "mt-3" : ""} ${Tag === "h1" ? display : headline}`}>{h}</Tag>{text && <p className={`mt-5 max-w-[60ch] ${lead} ${center ? "mx-auto" : ""}`}>{text}</p>}</div>;
}

export function Crumbs({ items }: { items: { name: string; href?: string }[] }) {
  return <nav aria-label="İçerik yolu" className="text-sm text-[#515154]"><ol className="flex flex-wrap items-center gap-x-2">{items.map((it, i) => <li key={it.name} className="flex items-center gap-2">{i > 0 && <span aria-hidden="true">/</span>}{it.href ? <Link href={it.href} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">{it.name}</Link> : <span aria-current="page">{it.name}</span>}</li>)}</ol></nav>;
}

/** Info-page header: breadcrumb, display title, lead and actions on the white band. */
export function PageHead({ crumbs, eyebrow, h, text, children }: { crumbs: { name: string; href?: string }[]; eyebrow: string; h: string; text: string; children?: ReactNode }) {
  return <section className="bg-white pb-12 pt-4 sm:pb-16 lg:pb-24" aria-labelledby="page-title"><div className="mx-auto w-full min-w-0 max-w-[1180px] px-5 sm:px-8 lg:px-12"><Crumbs items={crumbs} />
    <div className="mt-6 sm:mt-10"><Intro as="h1" eyebrow={eyebrow} h={h} id="page-title" text={text} />{children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}</div></div></section>;
}

export function Photo({ src, alt, ratio = "aspect-[4/3]", sizes, priority = false, caption }: { src: string; alt: string; ratio?: string; sizes: string; priority?: boolean; caption?: string }) {
  return <figure className="m-0 min-w-0"><div className={`relative ${ratio} overflow-hidden rounded-[20px] bg-[#e8e8ed]`}><Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" /></div>{caption && <figcaption className="mt-3 text-[13px] leading-[1.45] text-[#6e6e73] sm:text-sm">{caption}</figcaption>}</figure>;
}

export function Steps({ items }: { items: readonly { title: string; text: string }[] }) {
  return <ol className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))]">{items.map((s, i) => <li key={s.title} className={`${tile} p-6`}><span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-[#075d54] text-sm font-semibold text-white">{i + 1}</span><h3 className={`mt-5 ${title}`}>{s.title}</h3><p className="mt-3 leading-[1.55] text-[#515154]">{s.text}</p></li>)}</ol>;
}

export function Faq({ items, id = "faq-title", heading = "Sık sorulan sorular" }: { items: readonly (readonly [string, string])[]; id?: string; heading?: string }) {
  return <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16"><h2 id={id} className={headline}>{heading}</h2>
    <div className="grid min-w-0 gap-3">{items.map(([q, a]) => <details key={q} className="group rounded-[20px] border border-[#d2d2d7] bg-white px-6"><summary className={`flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold text-[#1d1d1f] marker:content-none [&::-webkit-details-marker]:hidden ${focus}`}><span className="min-w-0">{q}</span><span aria-hidden="true" className="text-2xl leading-none text-[#075d54] transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none">+</span></summary><p className="pb-5 leading-[1.6] text-[#515154]">{a}</p></details>)}</div></div>;
}

export const ctaLight = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-[17px] font-semibold text-[#075d54] no-underline transition-colors duration-150 hover:bg-[#f5f5f7] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white";
export const ctaGhost = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/70 px-7 text-[17px] font-semibold text-white no-underline transition-colors duration-150 hover:bg-white/10 focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white";

export function CtaBand({ h, text, id, children }: { h: string; text: string; id: string; children: ReactNode }) {
  return <section aria-labelledby={id} className="bg-white py-14 sm:py-20"><div className="mx-auto w-full min-w-0 max-w-[1180px] px-5 sm:px-8 lg:px-12"><div className="rounded-[28px] bg-[#075d54] px-6 py-12 text-center sm:px-12 sm:py-16"><h2 id={id} className="mx-auto max-w-[18ch] text-[clamp(1.875rem,1.3rem+2.6vw,3rem)] font-semibold leading-[1.12] tracking-[-.03em] text-white text-balance">{h}</h2><p className="mx-auto mt-4 max-w-[48ch] text-lg leading-[1.55] text-white/85">{text}</p><div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div></div></div></section>;
}

/** WebPage + BreadcrumbList (+ FAQPage only when the FAQ is visible on the page). */
export function PageLd({ path, name, description, type, crumbs, faqs, extra = [] }: { path: string; name: string; description: string; type?: string; crumbs: { name: string; path: string }[]; faqs?: readonly (readonly [string, string])[]; extra?: object[] }) {
  return <JsonLd data={graph(webPageNode({ path, name, description, type }), breadcrumbNode(crumbs), ...(faqs ? [faqNode(path, faqs)] : []), ...extra)} />;
}

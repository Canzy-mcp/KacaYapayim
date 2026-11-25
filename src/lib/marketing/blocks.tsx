import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/* ---------- Class strings (Tailwind) kept for existing pages, restyled to the Apple-like system ---------- */
export const btnPrimary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-[22px] text-[16px] font-semibold text-white no-underline transition-colors duration-150 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
export const btnSecondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface shadow-xs px-[22px] text-[16px] font-semibold text-ink no-underline transition-colors duration-150 hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
export const chip = "inline-flex min-h-11 items-center rounded-lg border border-line-strong bg-white px-4 text-sm font-medium text-primary no-underline transition-colors duration-150 hover:border-primary";
export const card = "rounded-xl border border-line-strong bg-white p-6";
export const h2Class = "text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] font-semibold leading-[1.15] tracking-heading text-ink";

/* ---------- Layout primitives ---------- */
export function PageShell({ children }: { children: ReactNode }) {
  return <div className="bg-white text-ink"><div className="mx-auto w-full max-w-5xl min-w-0 px-5 pb-20 pt-8 sm:px-8 sm:pb-24 sm:pt-12">{children}</div></div>;
}

/** Full-bleed section. tone: white (default), alt (#f5f5f7) or dark. */
export function Band({ tone = "white", id, className = "", narrow = false, children, labelledBy }: { tone?: "white" | "alt" | "dark"; id?: string; className?: string; narrow?: boolean; children: ReactNode; labelledBy?: string }) {
  const base = tone === "alt" ? "ky-band-alt" : tone === "dark" ? "ky-band-dark" : "ky-band";
  return <section id={id} aria-labelledby={labelledBy} className={`${base} ${className}`.trim()}><div className={`ky-container ${narrow ? "ky-prose" : ""}`.trim()}>{children}</div></section>;
}

export function SectionHeader({ eyebrow, title, lead, align = "left", as: Tag = "h2", id }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; align?: "left" | "center"; as?: "h1" | "h2" | "h3"; id?: string }) {
  return <div className={`ky-section-header ${align === "center" ? "ky-section-header-center" : ""}`.trim()}>
    {eyebrow && <p className="ky-eyebrow">{eyebrow}</p>}
    <Tag id={id} className={Tag === "h1" ? "ky-display" : "ky-headline"}>{title}</Tag>
    {lead && <p className="ky-body">{lead}</p>}
  </div>;
}

type Ratio = "4/3" | "3/2" | "16/7";
const ratioClass: Record<Ratio, string> = { "4/3": "ky-photo-43", "3/2": "ky-photo-32", "16/7": "ky-photo-167" };

/** Rounded photograph with optional caption. src is a local /images path. */
export function PhotoTile({ src, alt, caption, ratio = "4/3", sizes = "(min-width: 1024px) 560px, 100vw", priority = false, className = "", children }: { src: string; alt: string; caption?: string; ratio?: Ratio; sizes?: string; priority?: boolean; className?: string; children?: ReactNode }) {
  return <figure className={`ky-photo ${ratioClass[ratio]} ${className}`.trim()}>
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority} />
    {caption && <figcaption>{caption}</figcaption>}
    {children}
  </figure>;
}

export function FeatureTile({ icon, title, children, href, cta, className = "" }: { icon?: ReactNode; title: string; children: ReactNode; href?: string; cta?: string; className?: string }) {
  const body = <>{icon && <span className="ky-card-icon" aria-hidden="true">{icon}</span>}<h3 className="ky-title">{title}</h3><p>{children}</p>{href && cta && <span className="ky-link ky-link-arrow mt-2">{cta}</span>}</>;
  return href ? <Link href={href} className={`ky-card ${className}`.trim()}>{body}</Link> : <div className={`ky-card ${className}`.trim()}>{body}</div>;
}

export function StatTile({ value, label, note, className = "" }: { value: ReactNode; label: string; note?: string; className?: string }) {
  return <div className={`ky-card ${className}`.trim()}><p className="ky-stat !mt-0 !text-ink">{value}</p><p className="!mt-2 text-[1.0625rem] font-semibold !text-ink">{label}</p>{note && <p className="ky-caption !mt-1">{note}</p>}</div>;
}

export function Steps({ items }: { items: readonly { title: string; body: ReactNode }[] }) {
  return <ol className="ky-steps" style={{ "--steps": Math.min(items.length, 4) } as CSSProperties}>{items.map(item => <li key={item.title}><h3>{item.title}</h3><p>{item.body}</p></li>)}</ol>;
}

export function FaqList({ items, title, id = "sss" }: { items: readonly (readonly [string, string])[]; title?: string; id?: string }) {
  return <section aria-labelledby={title ? `${id}-title` : undefined}>{title && <h2 id={`${id}-title`} className="ky-headline">{title}</h2>}<div className="ky-faq">{items.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>;
}

export function CtaBand({ title, lead, primary, secondary }: { title: string; lead?: string; primary: { href: string; label: string }; secondary?: { href: string; label: string } }) {
  return <Band tone="dark" className="ky-cta-band"><h2 className="ky-headline">{title}</h2>{lead && <p className="ky-body">{lead}</p>}
    <div className="ky-btn-row"><Link href={primary.href} className="ky-btn ky-btn-light">{primary.label}</Link>{secondary && <Link href={secondary.href} className="ky-btn ky-btn-outline-light">{secondary.label}</Link>}</div></Band>;
}

export function Crumbs({ items }: { items: { name: string; href?: string }[] }) {
  return <nav aria-label="İçerik yolu" className="ky-crumbs"><ol>{items.map((item, i) => <li key={item.name}>{i > 0 && <span aria-hidden="true">/</span>}{item.href ? <Link href={item.href}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}</li>)}</ol></nav>;
}
export const Breadcrumbs = Crumbs;

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="ky-eyebrow">{children}</p>;
}

export function Hero({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead: string; children?: ReactNode }) {
  return <header className="max-w-3xl"><Eyebrow>{eyebrow}</Eyebrow><h1 className="mt-3 text-[clamp(2.25rem,1.6rem+2.8vw,4rem)] font-[650] leading-[1.08] tracking-display text-balance">{title}</h1><p className="mt-5 text-[clamp(1.0625rem,1rem+.4vw,1.3125rem)] leading-[1.5] text-ink-2">{lead}</p>{children}</header>;
}

export function DataTable({ caption, head, rows }: { caption: string; head: readonly string[]; rows: readonly (readonly string[])[] }) {
  return <div className="relative mt-5 overflow-x-auto rounded-xl border border-line-strong bg-white"><table className="w-full min-w-0 border-collapse text-left text-[15px] leading-6">
    <caption className="border-b border-line-strong bg-canvas px-4 py-3 text-left text-sm font-semibold">{caption}</caption>
    <thead><tr>{head.map((h) => <th key={h} scope="col" className="border-b border-line-strong px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-line last:border-0">{r.map((c, j) => j === 0 ? <th key={j} scope="row" className="px-4 py-3 align-top font-semibold">{c}</th> : <td key={j} className="px-4 py-3 align-top text-ink-2">{c}</td>)}</tr>)}</tbody>
  </table></div>;
}

export function Faq({ items, title = "Sık sorulan sorular" }: { items: readonly (readonly [string, string])[]; title?: string }) {
  return <section className="mt-14" aria-labelledby="faq-title"><h2 id="faq-title" className={h2Class}>{title}</h2><div className="ky-faq">{items.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>;
}

export function Checklist({ items }: { items: readonly string[] }) {
  return <ul className="mt-5 grid gap-3 sm:grid-cols-2">{items.map((item) => <li key={item} className="flex min-w-0 gap-3 rounded-xl border border-line-strong bg-white p-4 leading-7"><span aria-hidden="true" className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">✓</span><span className="min-w-0">{item}</span></li>)}</ul>;
}

export function Sources({ items }: { items: readonly { label: string; url: string; note: string }[] }) {
  return <section className="mt-12" aria-labelledby="sources-title"><h2 id="sources-title" className="text-xl font-semibold">Kaynaklar</h2><ul className="mt-4 grid gap-3">{items.map((s) => <li key={s.url} className="leading-7"><a href={s.url} className="font-medium text-primary underline underline-offset-4" {...(s.url.startsWith("http") ? { rel: "noopener noreferrer", target: "_blank" } : {})}>{s.label}</a><span className="block text-sm text-muted">{s.note}</span></li>)}</ul></section>;
}

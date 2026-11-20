import Link from "next/link";
import type { ReactNode } from "react";

export const btnPrimary = "inline-flex min-h-12 items-center justify-center rounded-xl bg-[#075D54] px-6 text-base font-semibold text-white no-underline transition-colors duration-150 hover:bg-[#064A43] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#075D54]";
export const btnSecondary = "inline-flex min-h-12 items-center justify-center rounded-xl border border-[#075D54] bg-white px-6 text-base font-semibold text-[#075D54] no-underline transition-colors duration-150 hover:bg-[#E4F0ED] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#075D54]";
export const chip = "inline-flex min-h-11 items-center rounded-full border border-[#E7E1D6] bg-white px-4 text-sm font-semibold text-[#075D54] no-underline transition-colors duration-150 hover:border-[#075D54]";
export const card = "rounded-2xl border border-[#E7E1D6] bg-white p-6 shadow-[0_1px_2px_rgba(32,41,35,.05)]";
export const h2Class = "text-2xl font-bold tracking-[-.02em] text-[#202923] sm:text-[1.75rem]";

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="bg-[#FAF7F1] text-[#202923]"><div className="mx-auto w-full max-w-5xl min-w-0 px-4 pb-20 pt-8 sm:px-6 sm:pt-12">{children}</div></div>;
}

export function Crumbs({ items }: { items: { name: string; href?: string }[] }) {
  return <nav aria-label="İçerik yolu" className="mb-6 text-sm text-[#5B6460]"><ol className="flex flex-wrap items-center gap-x-2">{items.map((item, i) => <li key={item.name} className="flex items-center gap-2">{i > 0 && <span aria-hidden="true">/</span>}{item.href ? <Link href={item.href} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">{item.name}</Link> : <span aria-current="page">{item.name}</span>}</li>)}</ol></nav>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-bold uppercase tracking-[.06em] text-[#8A5A10]">{children}</p>;
}

export function Hero({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead: string; children?: ReactNode }) {
  return <header className="max-w-3xl"><Eyebrow>{eyebrow}</Eyebrow><h1 className="mt-3 text-[clamp(2rem,5.2vw,3.25rem)] font-bold leading-[1.1] tracking-[-.03em] text-balance">{title}</h1><p className="mt-5 text-lg leading-8 text-[#3F4944]">{lead}</p>{children}</header>;
}

export function DataTable({ caption, head, rows }: { caption: string; head: readonly string[]; rows: readonly (readonly string[])[] }) {
  return <div className="mt-5 overflow-x-auto rounded-2xl border border-[#E7E1D6] bg-white"><table className="w-full min-w-0 border-collapse text-left text-[15px] leading-6">
    <caption className="border-b border-[#E7E1D6] bg-[#F4EFE4] px-4 py-3 text-left text-sm font-semibold">{caption}</caption>
    <thead><tr>{head.map((h) => <th key={h} scope="col" className="border-b border-[#E7E1D6] px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-[#E7E1D6] last:border-0">{r.map((c, j) => j === 0 ? <th key={j} scope="row" className="px-4 py-3 align-top font-semibold">{c}</th> : <td key={j} className="px-4 py-3 align-top text-[#3F4944]">{c}</td>)}</tr>)}</tbody>
  </table></div>;
}

export function Faq({ items, title = "Sık sorulan sorular" }: { items: readonly (readonly [string, string])[]; title?: string }) {
  return <section className="mt-14" aria-labelledby="faq-title"><h2 id="faq-title" className={h2Class}>{title}</h2><div className="mt-5 grid gap-3">{items.map(([q, a]) => <details key={q} className="group rounded-2xl border border-[#E7E1D6] bg-white px-5 open:shadow-[0_1px_2px_rgba(32,41,35,.05)]"><summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-3 text-base font-semibold marker:content-none focus-visible:outline-3 focus-visible:outline-[#075D54]"><span>{q}</span><span aria-hidden="true" className="text-[#075D54] transition-transform duration-150 group-open:rotate-45">+</span></summary><p className="pb-5 leading-7 text-[#3F4944]">{a}</p></details>)}</div></section>;
}

export function Checklist({ items }: { items: readonly string[] }) {
  return <ul className="mt-5 grid gap-3 sm:grid-cols-2">{items.map((item) => <li key={item} className="flex min-w-0 gap-3 rounded-2xl border border-[#E7E1D6] bg-white p-4 leading-7"><span aria-hidden="true" className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-[#E4F0ED] text-xs font-bold text-[#075D54]">✓</span><span className="min-w-0">{item}</span></li>)}</ul>;
}

export function Sources({ items }: { items: readonly { label: string; url: string; note: string }[] }) {
  return <section className="mt-12" aria-labelledby="sources-title"><h2 id="sources-title" className="text-xl font-bold">Kaynaklar</h2><ul className="mt-4 grid gap-3">{items.map((s) => <li key={s.url} className="leading-7"><a href={s.url} className="font-semibold text-[#075D54] underline underline-offset-4" {...(s.url.startsWith("http") ? { rel: "noopener noreferrer", target: "_blank" } : {})}>{s.label}</a><span className="block text-sm text-[#5B6460]">{s.note}</span></li>)}</ul></section>;
}

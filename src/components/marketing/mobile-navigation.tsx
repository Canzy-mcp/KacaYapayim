"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

export type NavLink = readonly [label: string, href: string];
export type NavGroup = { label: string; links: readonly NavLink[]; href?: string };

/** Desktop: "Ustalar için" is a real link; a small chevron button opens the disclosure. */
export function MarketingNavGroup({ group }: { group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return <div ref={root} className="ky-nav-group" onKeyDown={(event) => {
    if (event.key === "Escape" && open) { setOpen(false); button.current?.focus(); }
  }}>
    {group.href
      ? <><Link href={group.href} aria-current={pathname === group.href ? "page" : undefined}>{group.label}</Link>
        <button ref={button} type="button" className="ky-nav-chevron" aria-expanded={open} aria-controls={panelId} aria-label={`${group.label} alt menüsü`} onClick={() => setOpen(!open)}><ChevronDown size={16} aria-hidden="true" /></button></>
      : <button ref={button} type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>{group.label}<ChevronDown size={16} aria-hidden="true" /></button>}
    <div id={panelId} hidden={!open} className="ky-nav-panel">
      {group.links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
    </div>
  </div>;
}

const focusable = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Mobile: full-height overlay under the header. Locks body scroll, traps Tab, closes on Escape. */
export function MarketingMobileNavigation({ links, group }: { links: readonly NavLink[]; group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const panelId = useId();
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    const wide = window.matchMedia("(min-width: 1024px)");
    const onWide = () => { if (wide.matches) setOpen(false); };
    wide.addEventListener("change", onWide);
    return () => { document.body.style.overflow = previous; wide.removeEventListener("change", onWide); };
  }, [open]);
  const close = () => setOpen(false);
  const current = (href: string) => (pathname === href ? "page" : undefined);
  return <div ref={root} className="ky-mobile-menu" onKeyDown={(event) => {
    if (!open) return;
    if (event.key === "Escape") { setOpen(false); button.current?.focus(); return; }
    if (event.key !== "Tab" || !root.current) return;
    const items = Array.from(root.current.querySelectorAll<HTMLElement>(focusable)).filter(el => !el.closest("[hidden]"));
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}>
    <button ref={button} type="button" aria-expanded={open} aria-controls={panelId} aria-label={open ? "Menüyü kapat" : "Menüyü aç"} onClick={() => setOpen(!open)}>
      {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
    </button>
    <nav ref={panel} id={panelId} hidden={!open} aria-label="Mobil menü" className="ky-mobile-panel">
      {links.map(([label, href]) => <Link key={href} href={href} aria-current={current(href)} onClick={close}>{label}</Link>)}
      {group.href && <Link href={group.href} aria-current={current(group.href)} onClick={close}>{group.label}</Link>}
      {group.links.map(([label, href]) => <Link key={href} href={href} className="ky-mobile-sub" aria-current={current(href)} onClick={close}>{label}</Link>)}
      <div className="ky-mobile-actions"><Link href="/login" onClick={close} className="marketing-secondary">Giriş yap</Link><Link href="/register" onClick={close} className="marketing-primary">Ücretsiz başla</Link></div>
    </nav>
  </div>;
}

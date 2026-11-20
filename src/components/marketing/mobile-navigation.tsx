"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

export type NavLink = readonly [label: string, href: string];
export type NavGroup = { label: string; links: readonly NavLink[] };

/** Desktop disclosure for a group of links ("Ustalar için"). */
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
    <button ref={button} type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>{group.label}<ChevronDown size={16} aria-hidden="true" /></button>
    <div id={panelId} hidden={!open} className="ky-nav-panel">
      {group.links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
    </div>
  </div>;
}

/** Mobile disclosure: a button with aria-expanded; the panel overlays the page so nothing shifts. */
export function MarketingMobileNavigation({ links, group }: { links: readonly NavLink[]; group: NavGroup }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  const close = () => setOpen(false);
  return <div className="ky-mobile-menu" onKeyDown={(event) => {
    if (event.key === "Escape" && open) { setOpen(false); button.current?.focus(); }
  }}>
    <button ref={button} type="button" aria-expanded={open} aria-controls={panelId} aria-label={open ? "Menüyü kapat" : "Menüyü aç"} onClick={() => setOpen(!open)}>
      {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
    </button>
    <nav id={panelId} hidden={!open} aria-label="Mobil menü" className="ky-mobile-panel">
      {links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={close}>{label}</Link>)}
      <p>{group.label}</p>
      {group.links.map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={close}>{label}</Link>)}
      <div className="ky-mobile-actions"><Link href="/login" onClick={close} className="marketing-secondary">Giriş yap</Link><Link href="/register" onClick={close} className="marketing-primary">Ücretsiz başla</Link></div>
    </nav>
  </div>;
}

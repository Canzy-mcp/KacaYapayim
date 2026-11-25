"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { MarketingNavGroup, type NavGroup, type NavLink } from "@/components/marketing/mobile-navigation";

/** Dynamic-Island style header: a floating ink capsule that compacts on scroll and springs open into a menu sheet. */
export function IslandNav({ links, group }: { links: readonly NavLink[]; group: NavGroup }) {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const sheetId = useId();
  const pathname = usePathname();
  const current = (href: string) => (pathname === href ? "page" : undefined);
  const close = () => setOpen(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onPointer);
    root.current?.querySelector<HTMLElement>(".ky-island-sheet a")?.focus();
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  return <div ref={root} className={`ky-island${compact ? " is-compact" : ""}${open ? " is-open" : ""}`} onKeyDown={(event) => {
    if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); }
  }}>
    <div className="ky-island-bar">
      <Link href="/" className="ky-island-brand" aria-label="KaçaYapayım ana sayfa"><BrandLogo size={28} /></Link>
      <nav aria-label="Ana menü" className="ky-island-links"><div>
        {links.map(([text, href]) => <Link key={href} href={href} aria-current={current(href)}>{text}</Link>)}
        <MarketingNavGroup group={group} />
      </div></nav>
      <div className="ky-island-actions">
        <Link href="/login" className="ky-island-login">Giriş yap</Link>
        <Link href="/register" className="ky-island-cta">Hesap aç</Link>
        <button ref={toggle} type="button" className="ky-island-toggle" aria-expanded={open} aria-controls={sheetId} aria-label={open ? "Menüyü kapat" : "Menüyü aç"} onClick={() => setOpen(!open)}>
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>
    </div>
    <div id={sheetId} className="ky-island-sheet" inert={!open} aria-hidden={!open}>
      <nav aria-label="Mobil menü" className="ky-island-sheet-inner">
        {links.map(([label, href]) => <Link key={href} href={href} aria-current={current(href)} onClick={close}>{label}</Link>)}
        {group.href && <Link href={group.href} aria-current={current(group.href)} onClick={close}>{group.label}</Link>}
        {group.links.map(([label, href]) => <Link key={href} href={href} className="ky-island-sub" aria-current={current(href)} onClick={close}>{label}</Link>)}
        <div className="ky-island-sheet-actions"><Link href="/login" onClick={close}>Giriş yap</Link><Link href="/register" onClick={close} className="ky-island-cta">Hesap aç</Link></div>
      </nav>
    </div>
  </div>;
}

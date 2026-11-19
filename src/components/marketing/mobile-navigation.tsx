"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function MarketingMobileNavigation({ links }: { links: readonly (readonly [string, string])[] }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  return <details ref={menu} className="marketing-mobile-menu" onKeyDown={(event) => {
    if (event.key === "Escape" && menu.current?.open) {
      menu.current.open = false;
      trigger.current?.focus();
    }
  }}>
    <summary ref={trigger}>Menü</summary>
    <nav aria-label="Mobil menü">
      {[...links, ["Giriş Yap", "/login"]].map(([label, href]) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => {
        if (menu.current) menu.current.open = false;
      }}>{label}</Link>)}
    </nav>
  </details>;
}

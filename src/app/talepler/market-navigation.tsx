"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BriefcaseBusiness, ClipboardList, Heart, Search, UserRound } from "lucide-react";

const customerLinks = [
  { href: "/talepler/favoriler", label: "Favoriler", icon: Heart },
  { href: "/talepler/bildirimler", label: "Bildirimler", icon: Bell },
  { href: "/talepler/hesap", label: "Hesabım", icon: UserRound },
];

export function MarketNavigation({ signedIn, provider }: { signedIn: boolean; provider: boolean }) {
  const pathname = usePathname();
  const current = customerLinks.find((link) => link.href === pathname)?.href ?? "/talepler";
  const links = [
    { href: "/usta-bul", label: "Usta Bul", icon: Search },
    { href: "/talepler", label: "Taleplerim", icon: ClipboardList },
    ...signedIn ? [
      ...customerLinks,
      { href: provider ? "/usta-talepleri" : "/onboarding?usta=1", label: provider ? "Usta Paneli" : "Usta Olarak Başla", icon: BriefcaseBusiness },
    ] : [],
  ];

  return <nav className="flex min-w-0 flex-wrap gap-1" aria-label="Hizmet menüsü">
    {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={href === current ? (href === pathname ? "page" : "location") : undefined}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${href === current ? "bg-blue-50 text-blue-900" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"}`}>
      <Icon size={16} aria-hidden="true" />{label}
    </Link>)}
  </nav>;
}

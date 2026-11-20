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
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075D54] ${href === current ? "bg-[#E4EFEC] text-[#064A43]" : "text-[#424245] hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"}`}>
      <Icon size={16} aria-hidden="true" />{label}
    </Link>)}
  </nav>;
}

import { House, FileText, UsersRound, Layers3, Settings2, CreditCard, CalendarDays, Inbox } from "lucide-react";

export const navigation = [
  { label: "Ana Sayfa", href: "/dashboard", icon: House },
  { label: "Teklifler", href: "/quotes", icon: FileText },
  { label: "Müşteriler", href: "/customers", icon: UsersRound },
  { label: "Maliyetlerim", href: "/costs", icon: Layers3 },
  { label: "İş Takibi", href: "/work", icon: CalendarDays },
  { label: "Usta Talepleri", href: "/usta-talepleri", icon: Inbox },
  { label: "Üyelik", href: "/billing", icon: CreditCard },
  { label: "Ayarlar", href: "/settings", icon: Settings2 },
] as const;

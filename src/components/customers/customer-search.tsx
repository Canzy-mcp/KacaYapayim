"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export function CustomerSearch({ initialQuery, archived }: { initialQuery: string; archived: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  useEffect(() => { setValue(initialQuery); }, [initialQuery]);
  useEffect(() => {
    if (value === initialQuery) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (value.trim()) params.set("q", value.trim());
      if (archived) params.set("view", "archive");
      router.replace(`/customers${params.size ? `?${params}` : ""}`, { scroll: false });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [value, initialQuery, archived, router]);
  return <label className="relative block"><span className="sr-only">Müşteri ara</span><Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8a91]" /><input type="search" name="q" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Müşteri ara" autoComplete="off" className="h-12 w-full rounded-[13px] border border-[#D2D2D7] bg-white pl-11 pr-11 text-[16px] outline-none focus:border-[#0071E3] focus:ring-3 focus:ring-[#0071E3]/15" />{value && <button type="button" aria-label="Aramayı temizle" onClick={() => setValue("")} className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#6E6E73] hover:bg-[#f1f1f3]"><X size={17} /></button>}</label>;
}

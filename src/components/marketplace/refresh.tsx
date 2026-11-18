"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function RefreshMarketDetail() {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) router.refresh();
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [router]);
  return null;
}

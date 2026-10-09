"use client";

import { hasAnalyticsConsent } from "@/lib/analytics/attribution";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const [consentVersion, setConsentVersion] = useState(0);

  useEffect(() => {
    const onConsentChange = () => setConsentVersion((version) => version + 1);
    window.addEventListener("ky:analytics-consent", onConsentChange);
    return () => window.removeEventListener("ky:analytics-consent", onConsentChange);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    if (!hasAnalyticsConsent()) {
      window.gtag("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      return;
    }
    window.gtag("consent", "update", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    window.gtag("event", "page_view", { page_path: pathname });
  }, [pathname, consentVersion]);

  return null;
}

"use client";

import { hasAnalyticsConsent } from "@/lib/analytics/attribution";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const measurementId = "G-T73M9QZQ5J";

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
    if (!pathname || !hasAnalyticsConsent()) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(...args: unknown[]) { window.dataLayer.push(args); };
    window.gtag("js", new Date());
    window.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    window.gtag("consent", "update", { analytics_storage: "granted" });
    window.gtag("config", measurementId, { page_path: pathname, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });

    if (!document.querySelector(`script[data-google-analytics="${measurementId}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      script.dataset.googleAnalytics = measurementId;
      document.head.appendChild(script);
    }

    window.gtag("event", "page_view", { page_path: pathname });
  }, [pathname, consentVersion]);

  return null;
}

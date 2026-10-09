import type { Metadata } from "next";
import { AnalyticsConsent } from "@/components/marketing/analytics-consent";
import { GoogleAnalytics } from "@/components/marketing/google-analytics";
import Script from "next/script";
import "./globals.css";

const siteUrl = process.env.APP_URL || "http://localhost:3005";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "KaçaYapayım | İşini doğru fiyatlandır", template: "%s | KaçaYapayım" },
  description: "Kendi maliyetlerini hesapla, hedef kârını gör ve müşterine profesyonel teklif gönder.",
  applicationName: "KaçaYapayım",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "5YHiKGyRlhZoPmBvxTmYVWfHZypE79zmrB3wgaJmciI",
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body><GoogleAnalytics/><AnalyticsConsent/>{children}
    <Script id="google-tag-consent-default" strategy="beforeInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){window.dataLayer.push(arguments);}
      gtag('consent', 'default', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
      gtag('js', new Date());
      gtag('config', 'G-T73M9QZQ5J', {send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false});
    `}</Script>
    <Script src="https://www.googletagmanager.com/gtag/js?id=G-T73M9QZQ5J" strategy="beforeInteractive" />
  </body></html>;
}

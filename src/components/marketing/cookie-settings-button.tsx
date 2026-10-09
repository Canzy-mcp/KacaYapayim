"use client";

export function CookieSettingsButton({ className = "" }: { className?: string }) {
  return <button type="button" onClick={() => window.dispatchEvent(new Event("ky:open-analytics-consent"))} className={className}>Çerez ayarları</button>;
}

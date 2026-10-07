import type { NextConfig } from "next";

if (process.env.DEPLOYMENT_ENV && !["local", "staging", "production"].includes(process.env.DEPLOYMENT_ENV)) throw new Error("DEPLOYMENT_ENV local, staging veya production olmalı.");

if ((process.env.DEPLOYMENT_ENV === "production" || process.env.VERCEL_ENV === "production")) {
  const required = ["APP_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "RATE_LIMIT_HMAC_KEY", "NEXT_PUBLIC_LEGAL_ENTITY_NAME", "NEXT_PUBLIC_SUPPORT_EMAIL"];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) throw new Error(`Production ayarları eksik: ${missing.join(", ")}`);
  if (!process.env.APP_URL?.startsWith("https://")) throw new Error("Production APP_URL HTTPS olmalı.");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("https://")) throw new Error("Production Supabase URL HTTPS olmalı.");
  if ((process.env.RATE_LIMIT_HMAC_KEY?.length || 0) < 32) throw new Error("RATE_LIMIT_HMAC_KEY en az 32 karakter olmalı.");
  if (process.env.LEGAL_REVIEW_APPROVED !== "true") throw new Error("Hukuki sayfalar onaylanmadan production build yapılamaz.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "")) throw new Error("Production destek e-postası geçerli olmalı.");
  if (/placeholder|example|yer tutucu|yayın öncesi/i.test(process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME || "")) throw new Error("Production hizmet sahibi gerçek bilgi içermeli.");
}

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
const csp = [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`, "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
  "font-src 'self' data:", `connect-src 'self' ${supabaseOrigin} ${supabaseOrigin.replace(/^http/, "ws")}`.trim(),
].join("; ");
const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  trailingSlash: false,
  async redirects() { return [
    { source: "/meslekler/painter", destination: "/meslekler/boyaci", permanent: true },
    { source: "/meslekler/electrician", destination: "/meslekler/elektrikci", permanent: true },
    { source: "/meslekler/plumber", destination: "/meslekler/tesisatci", permanent: true },
    { source: "/meslekler/hvac", destination: "/meslekler/klimaci", permanent: true },
  ]; },
  async headers() { return [{ source: "/:path*", headers: [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
  ] }]; },
};
export default nextConfig;

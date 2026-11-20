import type { MetadataRoute } from "next";
import { siteOrigin, isStaging } from "@/lib/marketing/seo";

// AI search and assistant crawlers get the same public-content rules as every other crawler.
export const aiCrawlers = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended"] as const;

export default function robots(): MetadataRoute.Robots {
  // Staging pages carry X-Robots-Tag noindex from the middleware, so crawlers must be allowed to read it.
  if (isStaging) return { rules: { userAgent: "*", allow: "/" } };
  // Private and token pages (/dashboard, /t/..., /talepler ...) stay crawlable on purpose: the middleware
  // sends "X-Robots-Tag: noindex", which crawlers can only read when they are allowed to fetch the URL.
  // Only API routes are disallowed.
  const rule = (userAgent: string | string[]) => ({ userAgent, allow: ["/", "/api/og"], disallow: ["/api/"] });
  return { rules: [rule("*"), ...aiCrawlers.map(rule)], sitemap: `${siteOrigin}/sitemap.xml`, host: siteOrigin };
}

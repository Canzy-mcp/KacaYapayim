import type { MetadataRoute } from "next";
import { siteOrigin, isStaging } from "@/lib/marketing/seo";

// AI crawler policy (decision): public marketing content is allowed for everyone.
// Search / user-triggered fetchers (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User)
// are allowed so KaçaYapayım can be cited in AI answers. Training crawlers (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended)
// are also allowed: the public pages hold no private data, and being in the corpus helps brand recall. To opt out of
// training later, move those four into `aiTrainingCrawlers` and give them disallow: ["/"].
export const aiSearchCrawlers = ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User"] as const;
export const aiTrainingCrawlers = ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended"] as const;
export const aiCrawlers = [...aiTrainingCrawlers, ...aiSearchCrawlers] as const;

export default function robots(): MetadataRoute.Robots {
  // Staging pages carry X-Robots-Tag noindex from the middleware, so crawlers must be allowed to read it.
  if (isStaging) return { rules: { userAgent: "*", allow: "/" } };
  // Private and token pages (/dashboard, /t/..., /talepler ...) stay crawlable on purpose: the middleware
  // sends "X-Robots-Tag: noindex", which crawlers can only read when they are allowed to fetch the URL.
  // Only API routes are disallowed.
  const rule = (userAgent: string | string[]) => ({ userAgent, allow: ["/", "/api/og"], disallow: ["/api/"] });
  return { rules: [rule("*"), ...aiCrawlers.map(rule)], sitemap: `${siteOrigin}/sitemap.xml`, host: siteOrigin };
}

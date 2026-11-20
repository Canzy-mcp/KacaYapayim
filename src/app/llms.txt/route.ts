import { isStaging } from "@/lib/marketing/seo";
import { llmsTxt } from "@/lib/marketing/llms";

export const revalidate = 86400;

export function GET() {
  return new Response(llmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400", ...(isStaging ? { "X-Robots-Tag": "noindex, nofollow" } : {}) } });
}

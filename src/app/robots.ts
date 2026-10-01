import type { MetadataRoute } from "next";
import { siteOrigin, isStaging } from "@/lib/marketing/seo";
export default function robots(): MetadataRoute.Robots {
 if(isStaging)return {rules:{userAgent:"*",allow:"/"}};
 // Private and token pages stay crawlable so their noindex header can be read.
 return {rules:{userAgent:"*",allow:"/",disallow:["/api/"]},sitemap:`${siteOrigin}/sitemap.xml`,host:siteOrigin};
}

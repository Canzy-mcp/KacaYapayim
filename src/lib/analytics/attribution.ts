export type Attribution = { channel: string; medium: string; campaign: string };
const channels = new Set(["direct","google","bing","chatgpt","perplexity","newsletter","instagram","facebook","tiktok","youtube","whatsapp","linkedin","other"]);
export function normalizeChannel(value: string | null | undefined) {
 const source = (value || "direct").toLowerCase();
 const aliases: Record<string,string> = { ig:"instagram",fb:"facebook",yt:"youtube",wa:"whatsapp" };
 return channels.has(aliases[source] || source) ? aliases[source] || source : "other";
}
export function sanitizeCampaign(value: unknown) { return typeof value === "string" ? value.replace(/[^a-zA-Z0-9_\-]/g, "").slice(0,60) : ""; }
export function hasAnalyticsConsent() { return typeof document !== 'undefined' && document.cookie.split('; ').includes('ky_analytics_consent=accepted'); }
export function browserAttribution(): Attribution {
 if (typeof window === "undefined" || !hasAnalyticsConsent()) return { channel:"direct",medium:"",campaign:"" };
 const params = new URLSearchParams(location.search);
 if (params.has("utm_source")) {
  const context = {channel:normalizeChannel(params.get("utm_source")),medium:sanitizeCampaign(params.get("utm_medium")),campaign:sanitizeCampaign(params.get("utm_campaign"))};
  document.cookie = `ky_attribution=${encodeURIComponent(JSON.stringify(context))}; Path=/; Max-Age=2592000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
  return context;
 }
 try { const raw = document.cookie.split('; ').find(s=>s.startsWith('ky_attribution='))?.split('=').slice(1).join('='); const context = raw && JSON.parse(decodeURIComponent(raw));
  if(context)return {channel:normalizeChannel(context.channel),medium:sanitizeCampaign(context.medium),campaign:sanitizeCampaign(context.campaign)};
 } catch {}
 const host=(()=>{try{return new URL(document.referrer).hostname;}catch{return '';}})();
 return {channel:normalizeChannel(host.includes('google.')?'google':host.includes('bing.')?'bing':host.includes('instagram.')?'instagram':host.includes('facebook.')?'facebook':host.includes('t.co')?'other':'direct'),medium:'',campaign:''};
}

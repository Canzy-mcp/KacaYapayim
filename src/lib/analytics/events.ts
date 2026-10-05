import "server-only";
import { cookies } from "next/headers";
import { getViewer } from "@/lib/viewer";
import { normalizeChannel, sanitizeCampaign } from "./attribution";
import { createServiceClient } from "@/lib/supabase/admin";
import { logFailure } from "@/lib/observability/log";

export const publicEvents=["landing_view","pricing_viewed","signup_started","calculation_completed"] as const;
export const productEvents=["signup_completed","onboarding_completed","cost_setup_completed","job_created","quote_created","quote_shared","quote_viewed","quote_accepted","quote_rejected","job_completed","upgrade_viewed","checkout_started","subscription_started"] as const;
export type AnalyticsEvent=typeof publicEvents[number]|typeof productEvents[number];
const channels=new Set(["direct","google","bing","chatgpt","perplexity","newsletter","instagram","facebook","tiktok","youtube","whatsapp","linkedin","other"]);
export function safeChannel(value:string|null){return normalizeChannel(value);}
export function safeMarketingPath(path:string){return /^\/(?:$|ozellikler$|fiyatlandirma$|meslekler(?:\/[a-z-]+)?$|rehber(?:\/[a-z-]+)?$|hesaplama-araclari(?:\/[a-z-]+)?$|metodoloji$|hakkimizda$)/.test(path)?path:null;}
export async function recordEvent(event:AnalyticsEvent,path:string,channel="unknown", context?: {medium?: string;campaign?:string}){
  if(process.env.ANALYTICS_ENABLED!=="true"||!process.env.SUPABASE_SERVICE_ROLE_KEY)return;
  if(path.length>100||!channels.has(channel)&&channel!=="unknown")return;
  try{
    if((await cookies()).get('ky_analytics_consent')?.value!=='accepted')return;
    if(channel==='unknown'){try{const raw=(await cookies()).get('ky_attribution')?.value;if(raw){const saved=JSON.parse(decodeURIComponent(raw));channel=normalizeChannel(saved.channel);context={medium:sanitizeCampaign(saved.medium),campaign:sanitizeCampaign(saved.campaign)};}}catch{}}
    if(context?.campaign||context?.medium){await createServiceClient().rpc('record_campaign_event',{p_event:event,p_path:path,p_channel:channel,p_medium:sanitizeCampaign(context.medium),p_campaign:sanitizeCampaign(context.campaign)});}
    if(productEvents.includes(event as typeof productEvents[number])){const viewer=await getViewer();if(viewer?.business)await createServiceClient().from('product_usage_daily').upsert({business_id:viewer.business.id,day:new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Istanbul'}),event_name:event},{onConflict:'business_id,day,event_name'});}
    const {error}=await createServiceClient().rpc("record_aggregate_event",{p_event:event,p_path:path,p_channel:channel});if(error)logFailure("analytics_write");}
  catch{logFailure("analytics_write");}
}

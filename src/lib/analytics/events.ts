import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";
import { logFailure } from "@/lib/observability/log";

export const publicEvents=["landing_view","pricing_viewed","signup_started","calculation_completed"] as const;
export const productEvents=["signup_completed","onboarding_completed","cost_setup_completed","job_created","quote_created","quote_shared","quote_viewed","quote_accepted","quote_rejected","job_completed","upgrade_viewed","checkout_started","subscription_started"] as const;
export type AnalyticsEvent=typeof publicEvents[number]|typeof productEvents[number];
const channels=new Set(["direct","google","bing","chatgpt","perplexity","newsletter","other"]);
export function safeChannel(value:string|null){const channel=value?.toLowerCase()||"direct";return channels.has(channel)?channel:"other";}
export function safeMarketingPath(path:string){return /^\/(?:$|ozellikler$|fiyatlandirma$|meslekler(?:\/[a-z-]+)?$|rehber(?:\/[a-z-]+)?$|hesaplama-araclari(?:\/[a-z-]+)?$|metodoloji$|hakkimizda$)/.test(path)?path:null;}
export async function recordEvent(event:AnalyticsEvent,path:string,channel="unknown"){
  if(process.env.ANALYTICS_ENABLED!=="true"||!process.env.SUPABASE_SERVICE_ROLE_KEY)return;
  if(path.length>100||!channels.has(channel)&&channel!=="unknown")return;
  try{const {error}=await createServiceClient().rpc("record_aggregate_event",{p_event:event,p_path:path,p_channel:channel});if(error)logFailure("analytics_write");}
  catch{logFailure("analytics_write");}
}

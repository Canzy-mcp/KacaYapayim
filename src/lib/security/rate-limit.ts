import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";

// The reverse proxy must overwrite x-real-ip / x-forwarded-for. See SECURITY_CHECKLIST.
export async function consumeRateLimit(scope:string, limit:number, windowSeconds=60, identity?:string):Promise<boolean>{
 if(process.env.DEPLOYMENT_ENV!=="production" && process.env.VERCEL_ENV!=="production" && !process.env.SUPABASE_SERVICE_ROLE_KEY)return true;
 const secret=process.env.RATE_LIMIT_HMAC_KEY;
 if(!secret||!process.env.SUPABASE_SERVICE_ROLE_KEY)return false;
 const h=await headers();
 const ip=(process.env.VERCEL ? h.get("x-forwarded-for")?.split(",")[0]?.trim() :
   process.env.TRUST_PROXY_IP_HEADERS === "true" ? h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() : null)||"unknown";
 const digest=createHmac("sha256",secret).update(`${scope}:${identity || ip}`).digest("hex");
 try{
  const {data,error}=await createServiceClient().rpc("consume_rate_limit",{p_scope:scope,p_identity_hash:digest,p_window_seconds:windowSeconds,p_limit:limit});
  return !error&&data===true;
 }catch{return false;}
}

import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/admin";
import { isPublicToken } from "@/lib/quotes/id";
import { consumeRateLimit } from "@/lib/security/rate-limit";
export async function quoteAccess(token:string) {
  if(!isPublicToken(token)||!process.env.SUPABASE_SERVICE_ROLE_KEY)return {state:"unavailable" as const};
  if(!await consumeRateLimit("public-access-lookup",120,60))return {state:"unavailable" as const};
  const client=createServiceClient();
  const q=await client.from("quotes").select("id,package_group_id,status,sharing_disabled").eq("public_token",token).maybeSingle();
  if(q.error||!q.data||q.data.status==="draft"||q.data.sharing_disabled)return {state:"unavailable" as const};
  const control=await client.from("quote_access_controls").select("version").eq("quote_id",q.data.id).maybeSingle();
  if(control.error)return {state:"unavailable" as const};
  if(!control.data)return {state:"allowed" as const};
  const scope=q.data.package_group_id||q.data.id;const version=control.data.version;const name=`ky_quote_access_${scope}`;
  const saved=(await cookies()).get(name)?.value;const secret=process.env.RATE_LIMIT_HMAC_KEY;
  if(saved&&secret){const [expires,signature]=saved.split(".");const at=Number(expires);const expected=createHmac("sha256",secret).update(`${scope}:${version}:${expires}`).digest("hex");
    if(Number.isSafeInteger(at)&&at>Date.now()&&at<=Date.now()+30*60*1000&&/^[a-f0-9]{64}$/.test(signature||"")&&timingSafeEqual(Buffer.from(signature,"hex"),Buffer.from(expected,"hex")))return {state:"allowed" as const};}
  return {state:"locked" as const,scope,version,name};
}
export function signQuoteAccess(scope:string,version:string){
 const secret=process.env.RATE_LIMIT_HMAC_KEY;if(!secret)throw new Error("Erişim doğrulaması kullanılamıyor.");
 const expires=String(Date.now()+30*60*1000);
 return `${expires}.${createHmac("sha256",secret).update(`${scope}:${version}:${expires}`).digest("hex")}`;
}

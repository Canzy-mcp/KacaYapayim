import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/admin";
import {consumeRateLimit} from "@/lib/security/rate-limit";
export const dynamic="force-dynamic";
export async function GET(){
 if(!isSupabaseConfigured()||!process.env.SUPABASE_SERVICE_ROLE_KEY)return Response.json({status:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
 if(!await consumeRateLimit("health-check",60,60))return Response.json({status:"unavailable"},{status:429,headers:{"Cache-Control":"no-store"}});
 try{
  const service=createServiceClient();
  const results=await Promise.all([
   service.from("plans").select("id",{head:true}).limit(1),
   service.from("quotes").select("id,sharing_disabled",{head:true}).limit(1),
   service.from("job_payments").select("id",{head:true}).limit(1),
   service.from("notifications").select("id",{head:true}).limit(1),
   service.storage.getBucket("business-assets"),
  ]);
  if(results.some(result=>result.error)||results[4].data?.public)throw new Error("Readiness failed");
  return Response.json({status:"ok"},{headers:{"Cache-Control":"no-store"}});
 }
 catch{return Response.json({status:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}
}

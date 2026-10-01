import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/admin";
export const dynamic="force-dynamic";
export async function GET(){
 if(!isSupabaseConfigured()||!process.env.SUPABASE_SERVICE_ROLE_KEY)return Response.json({status:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
 try{const {error}=await createServiceClient().from("plans").select("id").limit(1);if(error)throw error;return Response.json({status:"ok"},{headers:{"Cache-Control":"no-store"}})}
 catch{return Response.json({status:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}})}
}

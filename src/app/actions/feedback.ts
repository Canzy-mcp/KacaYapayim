"use server";
import { requireCompletedViewer } from "@/lib/viewer";
import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { logFailure } from "@/lib/observability/log";

export async function sendFeedback(type:"bug"|"idea"|"general",message:string){
  const viewer=await requireCompletedViewer();
  if(!["bug","idea","general"].includes(type)||typeof message!=="string"||message.trim().length<10||message.length>2000)
    return {ok:false,error:"Mesajını 10–2000 karakter arasında yaz."};
  if(!await consumeRateLimit("feedback",5,3600))return {ok:false,error:"Çok fazla geri bildirim gönderdin. Daha sonra tekrar dene."};
  const {error}=await (await createClient()).from("feedback").insert({business_id:viewer.business!.id,user_id:viewer.id,type,message:message.trim(),page:"/settings"});
  if(error){logFailure("feedback_save");return {ok:false,error:"Geri bildirimin kaydedilemedi. Tekrar dene."};}
  return {ok:true};
}

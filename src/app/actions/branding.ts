"use server";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { revalidatePath } from "next/cache";
import { sanitizeUpload } from "@/lib/storage/sanitize";
import { uploadPrivateFile } from "@/lib/storage/upload";
import { randomUUID } from "node:crypto";
import { consumeRateLimit } from "@/lib/security/rate-limit";
export async function saveLogo(form:FormData){
 const viewer=await requireCompletedViewer();const client=await createClient();const file=form.get('file');
 if(!(file instanceof File)||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size<=0||file.size>2*1024*1024)return {ok:false,error:'PNG, JPEG veya WebP seç. Logo en fazla 2 MB olabilir.'};
 if(!await consumeRateLimit('logo-decode',10,3600,viewer.id))return {ok:false,error:'Logo yükleme sınırına ulaştın. Bir süre sonra tekrar dene.'};
 let safe;try{safe=await sanitizeUpload(file,false);}catch{return {ok:false,error:'Görsel açılamadı veya türü geçersiz.'};}
 const {bytes,mime,ext}=safe;
 const path=`${viewer.id}/logo/${randomUUID()}.${ext}`;
 const uploaded=await uploadPrivateFile(viewer.id,path,bytes,mime);if(uploaded.error)return {ok:false,error:uploaded.error};
 const url=`/api/business/logo/${viewer.business!.id}?v=${Date.now()}`;
 const saved=await client.rpc('set_my_logo',{p_path:path,p_url:url});
 if(saved.error){await client.storage.from('business-assets').remove([path]);return {ok:false,error:'Logo kaydedilemedi.'};}
 if(saved.data?.startsWith(viewer.id+'/logo/'))await client.storage.from('business-assets').remove([saved.data]);
 revalidatePath('/settings');revalidatePath('/quotes');return {ok:true,url};
}
export async function removeLogo(){
 const viewer=await requireCompletedViewer();const client=await createClient();
 const removed=await client.rpc('set_my_logo',{p_path:null,p_url:null});if(removed.error)return {ok:false};
 if(removed.data?.startsWith(viewer.id+'/logo/'))await client.storage.from('business-assets').remove([removed.data]);
 revalidatePath('/settings');revalidatePath('/quotes');return {ok:true};
}

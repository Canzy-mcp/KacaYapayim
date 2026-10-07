"use server";
import { revalidatePath } from "next/cache";
import { sanitizeUpload } from "@/lib/storage/sanitize";
import { uploadPrivateFile } from "@/lib/storage/upload";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { isJobId } from "@/lib/jobs/service";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import type { WorkEntry } from "@/lib/work/types";

export async function uploadWorkFile(form: FormData): Promise<{ok:boolean;error?:string;entry?:WorkEntry}> {
 const viewer=await requireCompletedViewer();const jobId=String(form.get('jobId')??'');const file=form.get('file');
 if(!isJobId(jobId)||!(file instanceof File)||file.size===0||file.size>5*1024*1024)return {ok:false,error:'PNG, JPEG, WebP veya PDF seç. Dosya en fazla 5 MB olabilir.'};
 const client=await createClient();const {data:job}=await client.from('jobs').select('id').eq('id',jobId).eq('business_id',viewer.business!.id).maybeSingle();
 if(!job)return {ok:false,error:'İş bulunamadı.'};
 if(!await consumeRateLimit('file-decode',30,3600,viewer.id))return {ok:false,error:'Yükleme sınırına ulaştın. Bir süre sonra tekrar dene.'};
 let safe;try{safe=await sanitizeUpload(file);}catch{return {ok:false,error:'Dosya açılmıyor, türü geçersiz veya etkin içerik taşıyor.'};}const {bytes,ext,mime}=safe;
 const path=`${viewer.id}/${jobId}/${randomUUID()}.${ext}`;
 const upload=await uploadPrivateFile(viewer.id,path,bytes,mime);
 if(upload.error)return {ok:false,error:upload.error};
 const {data,error}=await client.from('work_entries').insert({business_id:viewer.business!.id,job_id:jobId,kind:'attachment',title:file.name.slice(0,160)||'Dosya',metadata:{path,mime,size:bytes.length}}).select('*').single();
 if(error){await client.storage.from('business-assets').remove([path]);return {ok:false,error:'Dosya kaydı oluşturulamadı.'};}
 revalidatePath(`/jobs/${jobId}`);return {ok:true,entry:data as WorkEntry};
}

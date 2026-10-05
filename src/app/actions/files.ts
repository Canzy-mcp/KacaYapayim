"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { isJobId } from "@/lib/jobs/service";
import type { WorkEntry } from "@/lib/work/types";

function fileExtension(bytes: Uint8Array, mime: string) {
 if(mime==='image/png'&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)return 'png';
 if(mime==='image/jpeg'&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpg';
 if(mime==='image/webp'&&Buffer.from(bytes.slice(0,4)).toString()==='RIFF'&&Buffer.from(bytes.slice(8,12)).toString()==='WEBP')return 'webp';
 if(mime==='application/pdf'&&Buffer.from(bytes.slice(0,5)).toString()==='%PDF-')return 'pdf';
 return null;
}
export async function uploadWorkFile(form: FormData): Promise<{ok:boolean;error?:string;entry?:WorkEntry}> {
 const viewer=await requireCompletedViewer();const jobId=String(form.get('jobId')??'');const file=form.get('file');
 if(!isJobId(jobId)||!(file instanceof File)||file.size===0||file.size>5*1024*1024)return {ok:false,error:'PNG, JPEG, WebP veya PDF seç. Dosya en fazla 5 MB olabilir.'};
 const client=await createClient();const {data:job}=await client.from('jobs').select('id').eq('id',jobId).eq('business_id',viewer.business!.id).maybeSingle();
 if(!job)return {ok:false,error:'İş bulunamadı.'};
 const bytes=new Uint8Array(await file.arrayBuffer());const ext=fileExtension(bytes,file.type);if(!ext)return {ok:false,error:'Dosyanın türü ve içeriği uyuşmuyor.'};
 const path=`${viewer.id}/${jobId}/${randomUUID()}.${ext}`;
 const upload=await client.storage.from('business-assets').upload(path,bytes,{contentType:file.type,upsert:false});
 if(upload.error)return {ok:false,error:'Dosya yüklenemedi. Yeniden dene.'};
 const {data,error}=await client.from('work_entries').insert({business_id:viewer.business!.id,job_id:jobId,kind:'attachment',title:file.name.slice(0,160)||'Dosya',metadata:{path,mime:file.type,size:file.size}}).select('*').single();
 if(error){await client.storage.from('business-assets').remove([path]);return {ok:false,error:'Dosya kaydı oluşturulamadı.'};}
 revalidatePath(`/jobs/${jobId}`);return {ok:true,entry:data as WorkEntry};
}

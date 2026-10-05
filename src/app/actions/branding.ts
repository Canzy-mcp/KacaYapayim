"use server";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
export async function saveLogo(form:FormData){
 const viewer=await requireCompletedViewer();const client=await createClient();const file=form.get('file');
 if(!(file instanceof File)||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size<=0||file.size>2*1024*1024)return {ok:false,error:'PNG, JPEG veya WebP seç. Logo en fazla 2 MB olabilir.'};
 const bytes=new Uint8Array(await file.arrayBuffer());
 const valid=file.type==='image/png'?bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71:file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:Buffer.from(bytes.slice(0,4)).toString()==='RIFF'&&Buffer.from(bytes.slice(8,12)).toString()==='WEBP';
 if(!valid)return {ok:false,error:'Görselin türü ve içeriği uyuşmuyor.'};
 const path=`${viewer.id}/logo/${randomUUID()}.${file.type.split('/')[1]}`;
 const {data:old}=await client.from('business_branding').select('storage_path').eq('business_id',viewer.business!.id).maybeSingle();
 const uploaded=await client.storage.from('business-assets').upload(path,bytes,{contentType:file.type});if(uploaded.error)return {ok:false,error:'Logo yüklenemedi.'};
 const saved=await client.from('business_branding').upsert({business_id:viewer.business!.id,storage_path:path,updated_at:new Date().toISOString()});
 if(saved.error){await client.storage.from('business-assets').remove([path]);return {ok:false,error:'Logo kaydedilemedi.'};}
 const url=`/api/business/logo/${viewer.business!.id}?v=${Date.now()}`;
 const updated=await client.from('businesses').update({logo_url:url}).eq('id',viewer.business!.id).eq('owner_id',viewer.id);
 if(updated.error)return {ok:false,error:'Logo yüklendi ancak işletmeye bağlanamadı. Yeniden dene.'};
 if(old?.storage_path&&old.storage_path.startsWith(viewer.id+'/'))await client.storage.from('business-assets').remove([old.storage_path]);
 revalidatePath('/settings');revalidatePath('/quotes');return {ok:true,url};
}
export async function removeLogo(){
 const viewer=await requireCompletedViewer();const client=await createClient();
 const {data}=await client.from('business_branding').select('storage_path').eq('business_id',viewer.business!.id).maybeSingle();
 const updated=await client.from('businesses').update({logo_url:null}).eq('id',viewer.business!.id).eq('owner_id',viewer.id);if(updated.error)return {ok:false};
 const removed=await client.from('business_branding').delete().eq('business_id',viewer.business!.id);if(removed.error)return {ok:false};
 if(data?.storage_path?.startsWith(viewer.id+'/'))await client.storage.from('business-assets').remove([data.storage_path]);
 revalidatePath('/settings');revalidatePath('/quotes');return {ok:true};
}

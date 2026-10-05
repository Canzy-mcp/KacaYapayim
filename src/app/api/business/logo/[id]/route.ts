import { createServiceClient } from "@/lib/supabase/admin";
import { isJobId } from "@/lib/jobs/service";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!isJobId(id))return new Response(null,{status:404});
 const service=createServiceClient();const {data}=await service.from('business_branding').select('storage_path').eq('business_id',id).maybeSingle();
 if(!data)return new Response(null,{status:404});
 const download=await service.storage.from('business-assets').download(data.storage_path);
 if(download.error||!download.data||!['image/png','image/jpeg','image/webp'].includes(download.data.type))return new Response(null,{status:404});
 return new Response(download.data,{headers:{'Content-Type':download.data.type,'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
}

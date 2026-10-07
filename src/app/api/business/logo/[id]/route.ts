import { createServiceClient } from "@/lib/supabase/admin";
import { isJobId } from "@/lib/jobs/service";
import { createHash } from "node:crypto";
import { consumeRateLimit } from "@/lib/security/rate-limit";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!isJobId(id))return new Response(null,{status:404});
 if(!await consumeRateLimit('public-logo',120,60))return new Response(null,{status:429});
 const service=createServiceClient();const {data}=await service.from('business_branding').select('storage_path').eq('business_id',id).maybeSingle();
 if(!data)return new Response(null,{status:404});
 const owner=await service.from('businesses').select('owner_id').eq('id',id).maybeSingle();
 if(!owner.data||!data.storage_path.startsWith(`${owner.data.owner_id}/logo/`))return new Response(null,{status:404});
 const etag=`"${createHash('sha256').update(data.storage_path).digest('hex')}"`;
 const cacheHeaders={'Cache-Control':'public, max-age=300',ETag:etag,'X-Content-Type-Options':'nosniff'};
 if(request.headers.get('if-none-match')===etag)return new Response(null,{status:304,headers:cacheHeaders});
 const download=await service.storage.from('business-assets').download(data.storage_path);
 if(download.error||!download.data||!['image/png','image/jpeg','image/webp'].includes(download.data.type))return new Response(null,{status:404});
 return new Response(download.data,{headers:{'Content-Type':download.data.type,...cacheHeaders}});
}

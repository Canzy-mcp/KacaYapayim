import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { isJobId } from "@/lib/jobs/service";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const viewer=await requireCompletedViewer();const {id}=await params;if(!isJobId(id))return new Response(null,{status:404});
 const client=await createClient();const {data,error}=await client.from('work_entries').select('metadata').eq('id',id).eq('business_id',viewer.business!.id).eq('kind','attachment').maybeSingle();
 const path=data?.metadata.path;if(error||typeof path!=='string'||!path.startsWith(viewer.id+'/'))return new Response(null,{status:404});
 const signed=await client.storage.from('business-assets').createSignedUrl(path,60);
 if(signed.error||!signed.data)return new Response(null,{status:503});
 return Response.redirect(signed.data.signedUrl,302);
}

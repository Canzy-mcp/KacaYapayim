import { quoteAccess } from "@/lib/quotes/public-access";
import { createServiceClient } from "@/lib/supabase/admin";
import { isPublicToken } from "@/lib/quotes/public-service";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { readJsonBody } from "@/lib/security/body";
import { todayInIstanbul } from "@/lib/quotes/defaults";
import { revalidatePath } from "next/cache";
export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
 if(process.env.APP_URL&&request.headers.get('origin')!==new URL(process.env.APP_URL).origin)return new Response(null,{status:403});
 if(!await consumeRateLimit('public-quote-revision',6,3600))return new Response(null,{status:429});
 const {token}=await params;if(!isPublicToken(token))return new Response(null,{status:404});
 const {value:body,tooLarge}=await readJsonBody(request,2048);if(tooLarge)return new Response(null,{status:413});
 if(!body||typeof body.note!=='string'||body.note.trim().length<5||body.note.length>1000)return Response.json({error:'Değişiklik isteğinizi 5–1000 karakterle yazın.'},{status:400});
  if ((await quoteAccess(token)).state !== "allowed") return new Response(null,{status:403});
 const service=createServiceClient();const {data:q,error}=await service.from('quotes').select('id,business_id,job_id,status,valid_until,quote_number').eq('public_token',token).maybeSingle();
 if(error)return new Response(null,{status:503});if(!q||q.status==='draft')return new Response(null,{status:404});
 if(!['ready','sent','viewed'].includes(q.status)||q.valid_until<todayInIstanbul())return Response.json({error:'Bu teklif artık değişiklik talebine açık değil.'},{status:409});
 const saved=await service.from('work_entries').insert({business_id:q.business_id,job_id:q.job_id,quote_id:q.id,kind:'revision_request',title:`${q.quote_number} · Müşteri değişiklik isteği`.slice(0,160),note:body.note.trim()});
 if(saved.error)return new Response(null,{status:503});revalidatePath('/work');revalidatePath(`/quotes/${q.id}`);
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
}

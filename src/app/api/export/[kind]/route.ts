import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { encodeCsv } from "@/lib/csv";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { hasExportGrant } from "@/lib/account/export-access";
const specs = {
 customers:{table:"customers",columns:["name","phone","email","company_name","city","district","address","notes"]},
 quotes:{table:"quotes",columns:["id","quote_number","title","status","sale_price","tax_mode","tax_rate","valid_until","created_at","parent_quote_id","revision_number","accepted_at","rejected_at"]},
 costs:{table:"business_cost_items",columns:["id","name","category","unit","unit_cost","updated_at"]},
 jobs:{table:"jobs",columns:["id","customer_id","title","description","status","estimated_cost","selected_sale_price","actual_cost","created_at","input_data","template_snapshot","calculation_snapshot"]},
 expenses:{table:"work_entries",columns:["id","job_id","quote_id","kind","title","note","amount","status","scheduled_at","created_at","metadata"]},
 files:{table:"work_entries",columns:["id","job_id","title","created_at","metadata"],filter:"attachment"},
 payments:{table:"job_payments",columns:["id","job_id","amount","paid_at","method","note","created_at"]},
} as const;
export const dynamic="force-dynamic";
export async function GET(_:Request,{params}:{params:Promise<{kind:string}>}){
 const {kind}=await params;if(!Object.hasOwn(specs,kind))return new Response(null,{status:404});
 const viewer=await requireCompletedViewer();
 if(!await hasExportGrant(viewer.id))return new Response("İndirmeden önce Ayarlar > Verilerini dışa aktar bölümünde parolanı doğrula.",{status:403,headers:{"Cache-Control":"no-store"}});
 if(!await consumeRateLimit("data-export",20,3600,viewer.id))return new Response("İndirme sınırına ulaştın.",{status:429});
 const client=await createClient();const spec=specs[kind as keyof typeof specs];const startedAt=new Date().toISOString();let cursor="";let pages=0;let cancelled=false;
 async function batch(){
  let query=client.from(spec.table).select("*").eq("business_id",viewer.business!.id).lte("created_at",startedAt).order("id").limit(500);
  if(cursor)query=query.gt("id",cursor);
  if("filter" in spec)query=query.filter("kind","eq",spec.filter);
  const {data,error}=await query;if(error)throw new Error("Dışa aktarım tamamlanamadı.");
  const records=(data||[]) as unknown as Record<string,unknown>[];
  if(records.length)cursor=String(records.at(-1)!.id);return records;
 }
 let first:Record<string,unknown>[];try{first=await batch();}catch{return new Response("Veriler okunamadı.",{status:503});}
 const encoder=new TextEncoder();let next:Record<string,unknown>[]|null=first;
 const stream=new ReadableStream<Uint8Array>({
  start(controller){controller.enqueue(encoder.encode(encodeCsv([[...spec.columns,...(kind==="files"?["download_url"]:[])]])+"\r\n"));},
  async pull(controller){if(cancelled)return;try{
   const records=next||await batch();next=null;if(++pages>10000)throw new Error("Dışa aktarım sınırı aşıldı.");
   const rows=records.map(row=>[...spec.columns.map(column=>typeof row[column]==="object"&&row[column]!==null?JSON.stringify(row[column]):row[column]),...(kind==="files"?[`/api/work/files/${row.id}`]:[])]);
   if(rows.length)controller.enqueue(encoder.encode(encodeCsv(rows).replace(/^\uFEFF/,"")+"\r\n"));
   if(records.length<500)controller.close();
  }catch(error){controller.error(error);}},cancel(){cancelled=true;}
 });
 return new Response(stream,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="kacayapayim-${kind}.csv"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}

import {createClient} from "@/lib/supabase/server";
import {requireCompletedViewer} from "@/lib/viewer";
import {hasExportGrant} from "@/lib/account/export-access";
import {consumeRateLimit} from "@/lib/security/rate-limit";
export const dynamic="force-dynamic";
const tables=["profiles","businesses","business_preferences","business_branding","business_profession_settings","business_cost_items","customers","jobs","painter_job_details","job_cost_breakdown","actual_job_costs","quotes","quote_items","quote_exclusions","quote_templates","service_package_groups","quote_decision_history","work_entries","job_payments","notifications","job_viewers","subscriptions"];
export async function GET(){
 const viewer=await requireCompletedViewer();if(!await hasExportGrant(viewer.id))return new Response("Ayarlar ekranında güncel parolanı doğrula.",{status:403,headers:{"Cache-Control":"no-store"}});
 if(!await consumeRateLimit("account-archive",3,3600,viewer.id))return new Response("Arşiv indirme sınırına ulaştın.",{status:429});
 const client=await createClient();const cutoff=new Date().toISOString();let index=0,cursor:string|null=null,pages=0,cancelled=false;
 const encoder=new TextEncoder();
 async function read(){const result=await client.rpc("get_my_archive_page",{p_table:tables[index],p_cursor:cursor,p_cutoff:cutoff});if(result.error)throw new Error("Arşiv tamamlanamadı.");return result.data||[];}
 let first;try{first=await read();}catch{return new Response("Arşiv hazırlanamadı.",{status:503});}
 let next:typeof first|null=first;
 const stream=new ReadableStream<Uint8Array>({
  start(controller){controller.enqueue(encoder.encode(JSON.stringify({type:"manifest",version:1,createdAt:cutoff,tables,fileContentsIncluded:false})+"\n"));},
  async pull(controller){if(cancelled)return;try{
   if(++pages>10000)throw new Error("Arşiv sınırı aşıldı.");const rows=next||await read();next=null;
   if(rows.length)controller.enqueue(encoder.encode(rows.map(row=>JSON.stringify({type:"record",table:tables[index],record:row.record})).join("\n")+"\n"));
   if(rows.length===500)cursor=rows.at(-1)!.key;else{cursor=null;index++;}
   if(index>=tables.length){controller.enqueue(encoder.encode('{"type":"complete"}\n'));controller.close();}
  }catch(error){controller.error(error);}},cancel(){cancelled=true;}
 });
 return new Response(stream,{headers:{"Content-Type":"application/x-ndjson; charset=utf-8","Content-Disposition":'attachment; filename="kacayapayim-hesap-arsivi.ndjson"',"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
}

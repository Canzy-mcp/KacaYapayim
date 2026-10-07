import {createClient} from "@/lib/supabase/server";
import {requireCompletedViewer} from "@/lib/viewer";
import {formatMoney} from "@/lib/costs/format";
import {quoteAmounts,taxLabels} from "@/lib/quotes/tax";
import type {Quote} from "@/types/database";
export async function RevisionComparison({quote}:{quote:Quote}){
 if(!quote.parent_quote_id)return null;const viewer=await requireCompletedViewer();const client=await createClient();
 const r=await client.from("quotes").select("*").eq("id",quote.parent_quote_id).eq("business_id",viewer.business!.id).eq("job_id",quote.job_id).maybeSingle();
 if(r.error)throw new Error("Önceki revizyon yüklenemedi.");if(!r.data)return null;const old=r.data;
 const [items,excluded]=await Promise.all([client.from("quote_items").select("quote_id,name,description").in("quote_id",[old.id,quote.id]).order("sort_order").order("id"),client.from("quote_exclusions").select("quote_id,text").in("quote_id",[old.id,quote.id]).order("sort_order").order("id")]);
 if(items.error||excluded.error)throw new Error("Revizyon kapsamı yüklenemedi.");
 const scope=(id:string)=>(items.data||[]).filter(i=>i.quote_id===id).map(i=>i.name+(i.description?`: ${i.description}`:"")).join("\n");
 const excludes=(id:string)=>(excluded.data||[]).filter(i=>i.quote_id===id).map(i=>i.text).join("\n");
 const amount=(q:Quote)=>formatMoney(quoteAmounts(q.sale_price,q.tax_mode,q.tax_rate).total);
 const changes=[{name:"Başlık",before:old.title,after:quote.title},{name:"Açıklama",before:old.description,after:quote.description},{name:"Müşteri toplamı",before:amount(old),after:amount(quote)},{name:"Vergi",before:`${taxLabels[old.tax_mode ?? "unspecified"]} · ${old.tax_rate??"—"}%`,after:`${taxLabels[quote.tax_mode ?? "unspecified"]} · ${quote.tax_rate??"—"}%`},{name:"Kapsam",before:scope(old.id),after:scope(quote.id)},{name:"Hariç tutulanlar",before:excludes(old.id),after:excludes(quote.id)},{name:"Geçerlilik",before:old.valid_until,after:quote.valid_until},{name:"Süre",before:old.estimated_duration_text,after:quote.estimated_duration_text},{name:"Ödeme koşulları",before:old.payment_terms,after:quote.payment_terms},{name:"Not",before:old.notes,after:quote.notes}].filter(c=>c.before!==c.after);
 return <section className="my-5 rounded-2xl border bg-white p-5"><h2 className="font-semibold">Önceki revizyonla karşılaştır</h2><p className="mt-2 text-sm text-[#6e6e73]">{old.quote_number} → {quote.quote_number}. Taslak kaydetmek önceki bağlantıyı kapatmaz; yeni revizyon hazır olduğunda önceki teklif kapatılır.</p>{changes.length?<div className="mt-4 overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead><tr><th className="p-3">Alan</th><th className="p-3">Önceki</th><th className="p-3">Bu revizyon</th></tr></thead><tbody>{changes.map(c=><tr key={c.name} className="border-t"><th className="p-3 align-top font-medium">{c.name}</th><td className="whitespace-pre-wrap p-3 align-top text-[#6e6e73]">{c.before||"—"}</td><td className="whitespace-pre-wrap p-3 align-top">{c.after||"—"}</td></tr>)}</tbody></table></div>:<p className="mt-3 text-sm">Müşteriye görünen içerikte henüz değişiklik yok.</p>}</section>;
}

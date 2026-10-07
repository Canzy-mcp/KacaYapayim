import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
export async function WorkReminders(){
 const viewer=await requireCompletedViewer();const client=await createClient();const id=viewer.business!.id;
 const {data:p,error}=await client.from('business_preferences').select('*').eq('business_id',id).maybeSingle();if(error)throw new Error('Hatırlatma ayarları yüklenemedi.');
 const now=new Date();const tomorrow=new Date(now.getTime()+86400000).toISOString();const week=new Date(now.getTime()-7*86400000).toISOString();const old=new Date(now.getTime()-30*86400000).toISOString();
 const [tasks,decisions,costs]=await Promise.all([
  p?.followup_reminders===false?Promise.resolve({count:0}):client.from('work_entries').select('id',{head:true,count:'exact'}).eq('business_id',id).eq('status','open').in('kind',['followup','visit']).lte('scheduled_at',tomorrow),
  p?.decision_notifications===false?Promise.resolve({count:0}):client.from('work_entries').select('id',{head:true,count:'exact'}).eq('business_id',id).eq('kind','revision_request').eq('status','open'),
  p?.cost_reminders===false?Promise.resolve({count:0}):client.from('business_cost_items').select('id',{head:true,count:'exact'}).eq('business_id',id).eq('is_active',true).lt('updated_at',old),
 ]);
 const {count:responses}=p?.decision_notifications===false?{count:0}:await client.from('quotes').select('id',{head:true,count:'exact'}).eq('business_id',id).or(`and(status.eq.accepted,accepted_at.gte.${week}),and(status.eq.rejected,rejected_at.gte.${week})`);
 if(!tasks.count&&!decisions.count&&!costs.count&&!responses)return null;
 return <section aria-label="Hatırlatmalar" className="mb-6 rounded-2xl border bg-white p-5"><h2 className="font-semibold">Bugün gözden geçir</h2><div className="mt-3 flex flex-wrap gap-3 text-sm">{!!tasks.count&&<Link href="/work" className="min-h-11 rounded-xl bg-amber-50 p-3 text-amber-900">{tasks.count} yaklaşan veya geciken takip / keşif</Link>}{!!decisions.count&&<Link href="/work" className="min-h-11 rounded-xl bg-blue-50 p-3 text-blue-800">{decisions.count} revizyon talebi</Link>}{!!responses&&<Link href="/quotes" className="min-h-11 rounded-xl bg-blue-50 p-3 text-blue-800">Son 7 günde {responses} müşteri kararı</Link>}{!!costs.count&&<Link href="/costs" className="min-h-11 rounded-xl bg-amber-50 p-3 text-amber-900">{costs.count} maliyet fiyatını kontrol et</Link>}</div></section>;
}

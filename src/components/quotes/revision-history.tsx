import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import type { Quote } from "@/types/database";
export async function RevisionHistory({quote}:{quote:Quote}){
 const viewer=await requireCompletedViewer();const client=await createClient();
 const {data,error}=await client.from('quotes').select('id,parent_quote_id,revision_number,quote_number,status,created_at').eq('business_id',viewer.business!.id).eq('job_id',quote.job_id).order('created_at',{ascending:false}).limit(100);
 if(error)throw new Error('Revizyon geçmişi yüklenemedi.');
 const ids=new Set([quote.id]);let changed=true;while(changed){changed=false;for(const q of data??[]){if(ids.has(q.id)&&q.parent_quote_id&&!ids.has(q.parent_quote_id)){ids.add(q.parent_quote_id);changed=true;}if(q.parent_quote_id&&ids.has(q.parent_quote_id)&&!ids.has(q.id)){ids.add(q.id);changed=true;}}}
 const revisions=data?.filter(q=>ids.has(q.id));if(!revisions||revisions.length<2)return null;
 return <section className="my-5 rounded-2xl border bg-white p-5"><h2 className="font-semibold">Revizyon geçmişi</h2><ul className="mt-3 space-y-2">{revisions.map(q=><li key={q.id}><Link href={`/quotes/${q.id}`} aria-current={q.id===quote.id?'page':undefined} className="inline-flex min-h-11 items-center text-sm text-[#0071E3]">{q.quote_number} · Revizyon {q.revision_number} · {new Date(q.created_at).toLocaleDateString('tr-TR')}</Link></li>)}</ul></section>;
}

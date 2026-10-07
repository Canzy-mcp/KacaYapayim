import Link from "next/link";
import { PageHeader } from "@/components/layout";
import { TeamAccess } from "@/components/work/team-access";
import { requireCompletedViewer } from "@/lib/viewer";
import { createClient } from "@/lib/supabase/server";
export const metadata={title:"Ekip yetkileri"};
export default async function TeamAccessPage({searchParams}:{searchParams:Promise<{page?:string}>}){
 const viewer=await requireCompletedViewer();const params=await searchParams;const requested=Number(params.page||1);
 const page=Number.isSafeInteger(requested)&&requested>0?Math.min(requested,100000):1;const client=await createClient();
 const result=await client.from("job_viewers").select("id,job_id,invited_email,user_id,can_add_notes,expires_at",{count:"exact"}).eq("business_id",viewer.business!.id).order("created_at",{ascending:false}).order("id").range((page-1)*50,page*50-1);
 if(result.error)throw new Error("Ekip yetkileri yüklenemedi.");const people=result.data||[];const jobIds=[...new Set(people.map(p=>p.job_id))];
 const jobs=jobIds.length?await client.from("jobs").select("id,title").eq("business_id",viewer.business!.id).in("id",jobIds):{data:[],error:null};
 if(jobs.error)throw new Error("İşler yüklenemedi.");
 return <><PageHeader title="Ekip yetkileri" description="Kimin hangi işe eriştiğini ve saha notu ekleme izinlerini kontrol et."/>
 <p className="mb-5 text-sm text-[#6e6e73]">Müşteri telefonu, adresi, fiyat, iç maliyet, kâr ve dosyalar ekip ekranında paylaşılmaz. İş açıklamasına yazdığın özel bilgiler ise görünür; açıklamayı buna göre düzenle. Yeni davetler varsayılan olarak yalnızca görüntüleme izni verir.</p>
 {people.length?jobs.data?.map(job=><section key={job.id}><Link className="text-lg font-semibold text-[#0071e3]" href={`/jobs/${job.id}`}>{job.title}</Link><TeamAccess jobId={job.id} initial={people.filter(p=>p.job_id===job.id)}/></section>):<p className="rounded-xl bg-white p-5">Ekip daveti veya erişimi yok. İş detayından davet oluşturabilirsin.</p>}
 <nav aria-label="Ekip yetkileri sayfaları" className="mt-5 flex items-center justify-between text-sm">{page>1?<Link className="min-h-11 p-3" href={`/team-access?page=${page-1}`}>Önceki</Link>:<span/>}<span>{result.count||0} yetki · Sayfa {page}</span>{page*50<(result.count||0)?<Link className="min-h-11 p-3" href={`/team-access?page=${page+1}`}>Sonraki</Link>:<span/>}</nav></>;
}

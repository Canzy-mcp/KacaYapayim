"use client";
import {useState} from 'react';
import {publishServicePackages} from '@/app/actions/service-packages';
import {useRouter} from 'next/navigation';
export function PublishPackages({id}:{id:string}){
 const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [risk,setRisk]=useState(false);const [path,setPath]=useState('');
 return <div className="my-4 space-y-3 rounded-xl border bg-white p-4"><p className="text-sm">Üç taslak tek müşteri bağlantısında karşılaştırılır. Müşteri birini kabul ettiğinde diğer seçenekler kapanır.</p><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={risk} onChange={e=>setRisk(e.target.checked)}/>Minimum kârın altındaki fiyatları kontrol ettim ve devam etmek istiyorum.</label><button disabled={busy} className="min-h-12 rounded-xl bg-[#0071E3] px-4 text-sm text-white" onClick={async()=>{setBusy(true);setError('');try{const r=await publishServicePackages(id,risk);if(!r.ok||!r.token){setError('Üç paketin taslak, müşteriye bağlı ve süresi geçerli olduğunu kontrol et.');return;}setPath(location.origin+'/t/'+r.token);router.refresh();}catch{setError('Bağlantı kurulamadı.');}finally{setBusy(false);}}}>{busy?'Hazırlanıyor…':'Üç Paketi Birlikte Paylaşıma Hazırla'}</button>{path&&<a href={path} target="_blank" rel="noreferrer" className="block break-all text-sm text-[#0071E3]">{path}</a>}{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}</div>;
}

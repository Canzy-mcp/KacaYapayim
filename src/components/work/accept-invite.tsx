"use client";
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {acceptJobInvite} from '@/app/actions/team';
export function AcceptInvite({token}:{token:string}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const router=useRouter();
 return <><button disabled={busy} onClick={async()=>{setBusy(true);try{const r=await acceptJobInvite(token);if(r.ok){router.push('/team-work');router.refresh();}else setError('Davet geçersiz, süresi dolmuş veya başka bir e-postaya ait. Davet edilen doğrulanmış hesapla giriş yapmalısın.');}catch{setError('Bağlantı kurulamadı.');}finally{setBusy(false);}}} className="mt-5 min-h-12 rounded-xl bg-[#0071E3] px-5 text-white">{busy?'Kontrol ediliyor…':'İş Davetini Kabul Et'}</button>{error&&<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}</>;
}

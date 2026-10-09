"use client";
import {useEffect,useState} from 'react';
export function AnalyticsConsent(){
 const [open,setOpen]=useState(false);
 useEffect(()=>setOpen(!document.cookie.split('; ').some(c=>c.startsWith('ky_analytics_consent='))),[]);
 function choose(value:'accepted'|'declined'){
  document.cookie=`ky_analytics_consent=${value}; Path=/; Max-Age=2592000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
  if(value==='declined')document.cookie='ky_attribution=; Path=/; Max-Age=0; SameSite=Lax';
  setOpen(false);window.dispatchEvent(new Event('ky:analytics-consent'));
 }
 if(!open)return null;
 return <aside aria-label="İsteğe bağlı ölçüm tercihi" className="fixed bottom-5 left-5 right-5 z-50 mx-auto max-w-xl rounded-2xl border border-[#e5e5e9] bg-white p-5 shadow-xl"><p className="text-sm leading-6">Kampanya ve kullanım ölçümü için Google Analytics ile çerez kullanımına izin verir misin? Tercihin ve kampanya kaynağın 30 gün saklanır. Ayrıntılar <a href="/cerez-politikasi" className="text-[#0071E3] underline">çerez politikası</a>nda.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={()=>choose('accepted')} className="min-h-11 rounded-xl border border-[#e5e5e9] px-4 text-sm">İzin Ver</button><button type="button" onClick={()=>choose('declined')} className="min-h-11 rounded-xl border border-[#e5e5e9] px-4 text-sm">İzin Verme</button></div></aside>;
}

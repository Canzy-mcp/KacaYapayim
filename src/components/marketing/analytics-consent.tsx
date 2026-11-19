"use client";
import {useEffect,useState} from 'react';
export function AnalyticsConsent(){
 const [open,setOpen]=useState(false);
 useEffect(()=>{
  setOpen(!document.cookie.split('; ').some(c=>c.startsWith('ky_analytics_consent=')));
  const openSettings=()=>setOpen(true);
  window.addEventListener('ky:open-analytics-consent',openSettings);
  return()=>window.removeEventListener('ky:open-analytics-consent',openSettings);
 },[]);
 function choose(value:'accepted'|'declined'){
  document.cookie=`ky_analytics_consent=${value}; Path=/; Max-Age=2592000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
  if(value==='declined')document.cookie='ky_attribution=; Path=/; Max-Age=0; SameSite=Lax';
  setOpen(false);window.dispatchEvent(new Event('ky:analytics-consent'));
 }
 if(!open)return null;
 return <aside aria-label="Çerez tercihleri" className="fixed bottom-5 left-5 right-5 z-50 mx-auto max-w-xl rounded-[22px] border border-black/[.06] bg-white/80 p-5 shadow-[0_10px_40px_rgba(0,0,0,.16)] backdrop-blur-2xl backdrop-saturate-150"><h2 className="text-base font-semibold">Çerez tercihleri</h2><p className="mt-2 text-sm leading-6">Zorunlu çerezler uygulamanın çalışması için her zaman etkindir. Google etiketi sayfada bulunur; Google Analytics ölçümü yalnızca izin verdiğinde başlar. Tercihini daha sonra çerez ayarlarından değiştirebilirsin. Ayrıntılar <a href="/cerez-politikasi" className="text-[#0071E3] underline">çerez politikası</a>nda.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={()=>choose('accepted')} className="min-h-10 rounded-full bg-[#0071E3] px-5 text-sm font-medium text-white hover:bg-[#0077ED]">Kabul Et</button><button type="button" onClick={()=>choose('declined')} className="min-h-10 rounded-full bg-[#e8e8ed] px-5 text-sm font-medium hover:bg-[#dedee3]">Reddet</button></div></aside>;
}

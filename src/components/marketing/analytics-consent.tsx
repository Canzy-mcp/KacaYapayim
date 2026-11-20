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
 return <aside aria-label="Çerez tercihleri" className="fixed bottom-3 left-3 right-3 z-50 mr-auto max-w-md rounded-2xl border border-[#E7E1D6] bg-white p-4 text-[#202923] shadow-[0_10px_40px_rgba(32,41,35,.18)] sm:bottom-5 sm:left-5 sm:right-auto"><h2 className="text-base font-bold">Çerez tercihleri</h2><p className="mt-2 text-sm leading-6 text-[#5B6460]">Zorunlu çerezler uygulamanın çalışması için her zaman etkindir. Google etiketi sayfada bulunur; Google Analytics ölçümü yalnızca izin verdiğinde başlar. Tercihini daha sonra çerez ayarlarından değiştirebilirsin. Ayrıntılar <a href="/cerez-politikasi" className="font-semibold text-[#075D54] underline">çerez politikası</a>nda.</p><div className="mt-3 grid grid-cols-2 gap-3"><button type="button" onClick={()=>choose('accepted')} className="min-h-11 rounded-xl border border-[#075D54] bg-white px-4 text-sm font-semibold text-[#075D54] hover:bg-[#E4F0ED]">Kabul et</button><button type="button" onClick={()=>choose('declined')} className="min-h-11 rounded-xl border border-[#075D54] bg-white px-4 text-sm font-semibold text-[#075D54] hover:bg-[#E4F0ED]">Reddet</button></div></aside>;
}

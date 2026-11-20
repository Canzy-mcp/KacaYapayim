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
 const button="min-h-11 rounded-full border border-[#075d54] bg-white px-4 text-sm font-medium text-[#075d54] transition-colors hover:bg-[#e4f0ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075d54]";
 return <aside aria-label="Çerez tercihleri" className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-[20px] border border-b-0 border-[#d2d2d7] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-[#1d1d1f] shadow-[0_-4px_24px_rgba(0,0,0,.08)] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:max-h-none sm:w-[380px] sm:max-w-[calc(100vw-2.5rem)] sm:rounded-[20px] sm:border-b sm:pb-5"><h2 className="text-base font-semibold">Çerez tercihleri</h2><p className="mt-2 text-sm leading-6 text-[#515154]">Zorunlu çerezler her zaman etkindir. Google Analytics ölçümü yalnızca izin verdiğinde başlar; tercihini çerez ayarlarından değiştirebilirsin. Ayrıntılar <a href="/cerez-politikasi" className="font-medium text-[#075d54] underline underline-offset-4">çerez politikasında</a>.</p><div className="mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={()=>choose('declined')} className={button}>Reddet</button><button type="button" onClick={()=>choose('accepted')} className={button}>Kabul et</button></div></aside>;
}

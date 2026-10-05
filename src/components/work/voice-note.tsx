"use client";
import { useEffect, useRef, useState } from "react";
type Recognition = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>; resultIndex: number }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
export function VoiceNote({onText}:{onText:(text:string)=>void}) {
 const recognition=useRef<Recognition|null>(null); const [active,setActive]=useState(false); const [message,setMessage]=useState('');
 useEffect(()=>()=>{recognition.current?.stop();},[]);
 function start(){
  if(active){recognition.current?.stop();return;}
  const browser=window as unknown as {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
  const Constructor=browser.SpeechRecognition??browser.webkitSpeechRecognition;
  if(!Constructor){setMessage('Bu tarayıcı sesli yazmayı desteklemiyor. Notunu klavyeden girebilirsin.');return;}
  const instance=new Constructor();recognition.current=instance;instance.lang='tr-TR';instance.continuous=false;instance.interimResults=false;
  instance.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal)onText(e.results[i][0].transcript);};
  instance.onend=()=>setActive(false);instance.onerror=()=>{setActive(false);setMessage('Ses alınamadı. Mikrofon iznini kontrol et veya klavyeden yaz.');};
  try{instance.start();setActive(true);setMessage('Dinleniyor… Bitince metni kontrol et.');}catch{setMessage('Sesli yazma başlatılamadı.');}
 }
 return <div className="mt-2"><button type="button" onClick={start} aria-pressed={active} className="min-h-11 rounded-xl border border-[#e5e5e9] px-3 text-sm">{active?'Dinlemeyi Durdur':'Sesle Not Yaz'}</button><p className="mt-2 text-xs leading-5 text-[#6E6E73]">Sesli yazma tarayıcının konuşma hizmetini kullanır; ses hizmet sağlayıcısına gönderilebilir. KaçaYapayım ses kaydı saklamaz. Müşteri bilgisi söylemeden önce bunu dikkate al.</p>{message&&<p role="status" className="mt-2 text-sm">{message}</p>}</div>;
}

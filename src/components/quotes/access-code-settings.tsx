"use client";
import { useState } from "react";
import { setQuoteAccessCode } from "@/app/actions/quote-sharing";
import { Button,Input } from "@/components/ui";
export function AccessCodeSettings({id}:{id:string}){
 const [code,setCode]=useState("");const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
 async function save(remove=false){setBusy(true);try{const r=await setQuoteAccessCode(id,remove?null:code);setMessage(r.ok?remove?"Erişim kodu kaldırıldı.":"Erişim kodu etkin. Kodu alıcıya ayrı bir kanaldan gönder.":r.error||"Kaydedilemedi.");if(r.ok)setCode("");}catch{setMessage("Bağlantı kurulamadı.");}finally{setBusy(false);}}
 return <details className="mt-5 rounded-xl border p-4"><summary className="min-h-11 cursor-pointer text-sm font-medium">İsteğe bağlı erişim kodu</summary><p className="mt-2 text-sm text-[#6e6e73]">Bağlantıya ek olarak kod gerekir. Alıcının kimliğini tek başına doğrulamaz. Paket varsa aynı kod bütün seçeneklere uygulanır.</p><div className="mt-4 space-y-3"><Input id={`quote-code-${id}`} label="Yeni 6 haneli kod" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="off"/><Button type="button" disabled={busy||code.length!==6} onClick={()=>save()}>Kodu etkinleştir / değiştir</Button><Button type="button" disabled={busy} variant="secondary" onClick={()=>{if(window.confirm("Bağlantıyı alan herkes kod girmeden açabilecek. Erişim kodu kaldırılsın mı?"))void save(true);}}>Kodu kaldır</Button>{message&&<p role="status" className="text-sm">{message}</p>}</div></details>;
}

"use client";
import { useState } from "react";
import { Button,Input } from "@/components/ui";
export function PublicAccessForm({token}:{token:string}){
 const [code,setCode]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 return <main className="mx-auto max-w-lg px-5 py-16"><h1 className="text-3xl font-semibold">Teklif erişim kodu</h1><p className="mt-3 text-sm text-[#6e6e73]">İşletmenin sana ayrıca ilettiği 6 haneli kodu gir.</p><form className="mt-6 space-y-4" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError("");try{const r=await fetch(`/api/public/quotes/${token}/access`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code})});if(!r.ok){setError(r.status===429?"Çok fazla deneme yapıldı. 15 dakika sonra tekrar dene.":"Kod doğrulanamadı. İşletmeden güncel kodu iste.");return;}window.location.reload();}catch{setError("Bağlantı kurulamadı.");}finally{setBusy(false);}}}><Input id="access-code" label="Erişim kodu" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} required/><Button disabled={busy||code.length!==6}>Teklifi aç</Button>{error&&<p role="alert" className="text-sm text-[#b42318]">{error}</p>}</form></main>;
}

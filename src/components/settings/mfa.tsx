"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button, Input } from "@/components/ui";
export function Mfa({ challenge = false }: { challenge?: boolean }) {
  const [factors, setFactors] = useState<Array<{ id: string; friendly_name?: string }>>([]);
  const [setup, setSetup] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [factor, setFactor] = useState(""); const [code, setCode] = useState(""); const [busy,setBusy] = useState(false);const [error,setError]=useState("");
  async function load() {
    const {data,error}=await createClient().auth.mfa.listFactors();
    if(error){setError("Doğrulama yöntemleri yüklenemedi.");return;}
    setFactors(data.totp);setFactor(data.totp[0]?.id||"");
  }
  useEffect(()=>{void load();},[]);
  async function verify() {
    setBusy(true);setError("");
    try { const client=createClient(); const c=await client.auth.mfa.challenge({factorId:setup?.id||factor});if(c.error)throw c.error;
      const v=await client.auth.mfa.verify({factorId:setup?.id||factor,challengeId:c.data.id,code});if(v.error)throw v.error;
      setSetup(null);setCode("");window.location.assign(challenge?"/dashboard":"/settings");
    }catch{setError("Kod doğrulanamadı. Uygulamandaki güncel 6 haneli kodu gir.");}finally{setBusy(false);}
  }
  return <section className="mt-6 rounded-2xl border bg-white p-6"><h2 className="text-lg font-semibold">İki aşamalı doğrulama</h2><p className="mt-2 text-sm text-[#6e6e73]">Authenticator uygulamanla hesabını koru. Kurulumu bitirdikten sonra girişlerde 6 haneli kod gerekir. Cihazını kaybedersen hesabına erişemeyebilirsin; ikinci bir doğrulama cihazı ekleyebilirsin.</p>
    {!challenge&&!setup&&<Button className="mt-4" disabled={busy} onClick={async()=>{setBusy(true);setError("");try{const r=await createClient().auth.mfa.enroll({factorType:"totp",friendlyName:`Authenticator ${Date.now()}`});if(r.error)throw r.error;setSetup({id:r.data.id,qr:r.data.totp.qr_code,secret:r.data.totp.secret});}catch{setError("Doğrulama kurulumu açılamadı.");}finally{setBusy(false);}}}>Doğrulama cihazı ekle</Button>}
    {setup&&<div className="mt-4"><img src={setup.qr} width={200} height={200} alt="Authenticator kurulumu için QR kod"/><p className="mt-2 break-all text-sm">Elle kurulum anahtarı: <code>{setup.secret}</code></p><p className="mt-2 text-sm">Bu anahtarı kimseyle paylaşma.</p></div>}
    {(setup||challenge&&factors.length>0)&&<form className="mt-4 space-y-4" onSubmit={e=>{e.preventDefault();void verify();}}>{challenge&&<label className="block text-sm">Doğrulama cihazı<select className="mt-2 min-h-11 w-full rounded-xl border px-3" value={factor} onChange={e=>setFactor(e.target.value)}>{factors.map(f=><option key={f.id} value={f.id}>{f.friendly_name||"Authenticator"}</option>)}</select></label>}<Input id="mfa-code" label="6 haneli doğrulama kodu" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required/><Button disabled={busy||code.length!==6}>Doğrula</Button>{setup&&<Button type="button" variant="secondary" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await createClient().auth.mfa.unenroll({factorId:setup.id});if(r.error)throw r.error;setSetup(null);}catch{setError("Kurulum iptal edilemedi.");}finally{setBusy(false);}}}>Kurulumu iptal et</Button>}</form>}
    {!challenge&&factors.map(f=><div key={f.id} className="mt-4 flex items-center justify-between gap-3 text-sm"><span>{f.friendly_name||"Authenticator"}</span><Button variant="secondary" disabled={busy} onClick={async()=>{if(!window.confirm("Bu doğrulama cihazı kaldırılsın mı?"))return;setBusy(true);try{const r=await createClient().auth.mfa.unenroll({factorId:f.id});if(r.error)throw r.error;await load();}catch{setError("Cihaz kaldırılamadı. Önce güncel doğrulama koduyla giriş yap.");}finally{setBusy(false);}}}>Kaldır</Button></div>)}
    {error&&<p role="alert" className="mt-3 text-sm text-[#b42318]">{error}</p>}
  </section>;
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { copyRecord } from "@/app/actions/work";
export function RecordTools({ id, type }: { id: string; type: "job" | "quote" }) {
 const router = useRouter(); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 async function copy(revision=false) { if(busy)return;setBusy(true);setError("");try{const r=await copyRecord(id,revision?'revision':type);if(!r.ok||!r.id){setError(r.error||'İşlem tamamlanamadı.');return;}router.push(type==='job'?`/new-quote?job_id=${r.id}`:`/quotes/${r.id}/edit`);router.refresh();}catch{setError('Bağlantı kurulamadı. Tekrar dene.');}finally{setBusy(false);} }
 return <div className="my-5"><div className="flex flex-wrap gap-2"><button disabled={busy} onClick={()=>copy()} className="min-h-11 rounded-xl border border-[#e5e5e9] bg-white px-4 text-sm font-medium">{busy?'Hazırlanıyor…':type==='job'?'Benzer İş Oluştur':'Teklifi Kopyala'}</button>{type==='quote'&&<button disabled={busy} onClick={()=>copy(true)} className="min-h-11 rounded-xl border border-[#e5e5e9] bg-white px-4 text-sm font-medium">Yeni Revizyon Oluştur</button>}</div><p className="mt-2 text-xs text-[#6E6E73]">Kopyadaki maliyetleri ve kapsamı yeni iş için kontrol et.</p>{error&&<p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</div>;
}

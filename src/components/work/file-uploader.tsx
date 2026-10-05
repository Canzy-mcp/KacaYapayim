"use client";
import { useRef, useState } from "react";
import { uploadWorkFile } from "@/app/actions/files";
import type { WorkEntry } from "@/lib/work/types";
export function FileUploader({jobId,onUploaded}:{jobId:string;onUploaded:(entry:WorkEntry)=>void}){
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const input=useRef<HTMLInputElement>(null);
 return <form className="mt-5 rounded-xl bg-[#f5f5f7] p-4" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setMessage('');try{const data=new FormData(e.currentTarget);data.set('jobId',jobId);const r=await uploadWorkFile(data);if(r.ok&&r.entry){onUploaded(r.entry);setMessage('Dosya eklendi.');if(input.current)input.current.value='';}else setMessage(r.error||'Dosya eklenemedi.');}catch{setMessage('Yükleme tamamlanamadı. Yeniden dene.');}finally{setBusy(false);}}}><label className="block text-sm font-medium">İş fotoğrafı veya belge<input ref={input} name="file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required className="mt-3 block min-h-11 w-full text-sm"/></label><p className="mt-1 text-xs text-[#6E6E73]">En fazla 5 MB. Dosya yalnızca işletme hesabında görünür.</p><button disabled={busy} className="mt-3 min-h-11 rounded-xl border border-[#e5e5e9] bg-white px-4 text-sm">{busy?'Yükleniyor…':'Dosyayı Ekle'}</button>{message&&<p role="status" className="mt-2 text-sm">{message}</p>}</form>;
}

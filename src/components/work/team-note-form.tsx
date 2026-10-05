"use client";
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {addAssignedJobNote} from '@/app/actions/team';
export function TeamNoteForm({jobId}:{jobId:string}){
 const router=useRouter();const [title,setTitle]=useState('');const [note,setNote]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 return <form className="mt-5 space-y-3 border-t pt-4" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{const r=await addAssignedJobNote(jobId,title,note);if(!r.ok){setError('Not kaydedilemedi. Erişim iznini kontrol et.');return;}setTitle('');setNote('');router.refresh();}catch{setError('Bağlantı kurulamadı. Notun korunuyor.');}finally{setBusy(false);}}}><label className="block text-sm">Saha notu başlığı<input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border px-3"/></label><label className="block text-sm">Not<textarea maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy} className="min-h-12 rounded-xl bg-[#0071E3] px-4 text-sm text-white">{busy?'Kaydediliyor…':'Not Ekle'}</button></form>;
}

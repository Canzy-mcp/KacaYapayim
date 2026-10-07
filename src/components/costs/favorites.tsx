"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {setCostFavorite} from "@/app/actions/costs";
import type {BusinessCostItem} from "@/types/database";
export function CostFavorites({costs}:{costs:BusinessCostItem[]}){
 const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 return <details className="mb-6 rounded-2xl border bg-white p-5"><summary className="min-h-11 cursor-pointer font-semibold">Sık kullandığım maliyetler</summary><p className="my-3 text-sm text-[#6e6e73]">Favoriler genel iş formundaki hızlı ekleme listesinde en başta görünür.</p><div className="grid gap-2 sm:grid-cols-2">{costs.filter(c=>c.is_active).map(c=><label key={c.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" disabled={busy} checked={!!c.is_favorite} onChange={async e=>{const favorite=e.target.checked;setBusy(true);setError("");try{const r=await setCostFavorite(c.id,favorite);if(!r.ok)setError("Favori kaydedilemedi.");else router.refresh();}catch{setError("Bağlantı kurulamadı.");}finally{setBusy(false);}}}/>{c.name}</label>)}</div>{error&&<p role="alert" className="mt-3 text-sm text-[#b42318]">{error}</p>}</details>;
}

"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { formatMoney } from "@/lib/costs/format";
export function CalculatorContinuation(){
 const [result,setResult]=useState<{cost:number;margin:number}|null>(null);
 useEffect(()=>{try{const raw=sessionStorage.getItem('ky:calculator-result');const saved=raw&&JSON.parse(raw);if(saved&&Date.now()-saved.at<86400000&&Number.isFinite(saved.cost)&&saved.cost>0&&saved.cost<1e12&&Number.isFinite(saved.margin)&&saved.margin>=1&&saved.margin<=90)setResult(saved);else sessionStorage.removeItem('ky:calculator-result');}catch{}},[]);
 if(!result)return null;
 return <section className="mb-6 rounded-2xl border border-[#b8d8f7] bg-[#eef6ff] p-5"><h2 className="font-semibold">Hesapladığın maliyetle devam et</h2><p className="mt-2 text-sm">{formatMoney(result.cost)} maliyet · %{result.margin} hedef marj</p><div className="mt-4 flex flex-wrap gap-3"><Link href="/new-quote?from_calculator=1" className="inline-flex min-h-11 items-center rounded-xl bg-[#0071E3] px-4 text-sm font-semibold text-white">Bu Hesaptan İş Oluştur</Link><button onClick={()=>{sessionStorage.removeItem('ky:calculator-result');setResult(null);}} className="min-h-11 px-4 text-sm">Kaldır</button></div></section>;
}

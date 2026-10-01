"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { calculatePriceForMargin, roundSuggestedPrice } from "@/lib/pricing/engine";

type Kind = "margin" | "quote" | "paint" | "electric";
const money = (n:number) => new Intl.NumberFormat("tr-TR", {maximumFractionDigits:2}).format(n)+" TL";
const labels:Record<string,string>={cost:"Toplam maliyet (TL)",margin:"Hedef kâr marjı (%)",material:"Malzeme maliyeti (TL)",labor:"İşçilik maliyeti (TL)",other:"Yol ve sarf gideri (TL)",area:"Boyanacak alan (m²)",coats:"Kat sayısı",coverage:"Bir litre boyanın örtücülüğü (m²)",waste:"Fire payı (%)",literPrice:"Boya litre maliyeti (TL)",cableMeters:"Kablo uzunluğu (m)",cablePrice:"Kablo metre maliyeti (TL)",socketCount:"Priz sayısı",socketPrice:"Priz birim maliyeti (TL)"};
const configs:Record<Kind,{keys:string[];initial:Record<string,number>}>={
 margin:{keys:["cost","margin"],initial:{cost:20000,margin:30}},
 quote:{keys:["material","labor","other","margin"],initial:{material:12000,labor:8000,other:1000,margin:30}},
 paint:{keys:["area","coats","coverage","waste","literPrice","labor","other","margin"],initial:{area:100,coats:2,coverage:10,waste:10,literPrice:450,labor:9000,other:1550,margin:30}},
 electric:{keys:["cableMeters","cablePrice","socketCount","socketPrice","labor","other","margin"],initial:{cableMeters:100,cablePrice:20,socketCount:10,socketPrice:250,labor:6000,other:1000,margin:30}},
};
export function Calculator({kind,analyticsEnabled=false}: {kind:Kind;analyticsEnabled?:boolean}) {
 const config=configs[kind];const [values,setValues]=useState<Record<string,number>>(config.initial);
 const tracked=useRef(false);
 const onChange=(key:string,raw:string)=>{const value=raw===""?NaN:Number(raw);setValues(v=>({...v,[key]:value}));if(analyticsEnabled&&!tracked.current&&Number.isFinite(value)&&value>=0){tracked.current=true;navigator.sendBeacon?.("/api/analytics",new Blob([JSON.stringify({event:"calculation_completed",path:location.pathname,channel:"direct"})],{type:"application/json"}));}};
 const number=(key:string)=>values[key]??0;
 const invalid=config.keys.some(k=>!Number.isFinite(number(k))||number(k)<0)||(number("margin")>=90)||(kind==="paint"&&(number("coverage")<=0||number("coats")<1));
 let cost=0,quantity=0;
 if(kind==="margin")cost=number("cost");
 if(kind==="quote")cost=number("material")+number("labor")+number("other");
 if(kind==="paint"){quantity=number("area")*number("coats")/Math.max(number("coverage"),.00001)*(1+number("waste")/100);cost=quantity*number("literPrice")+number("labor")+number("other");}
 if(kind==="electric")cost=number("cableMeters")*number("cablePrice")+number("socketCount")*number("socketPrice")+number("labor")+number("other");
 const price=invalid?0:roundSuggestedPrice(calculatePriceForMargin(cost,number("margin")));
 return <div className="grid gap-6 lg:grid-cols-[1fr_.85fr]"><div className="marketing-card"><h2 className="text-xl font-semibold">Kendi rakamlarını gir</h2><div className="mt-6 grid gap-5 sm:grid-cols-2">{config.keys.map(k=><label className="block" key={k}><span className="mb-2 block text-sm font-medium text-[#55555d]">{labels[k]}</span><input type="number" min={k==="coverage"||k==="coats"?1:0} max={k==="margin"?89:undefined} step="any" value={values[k]??0} onChange={e=>onChange(k,e.target.value)} className="min-h-12 w-full rounded-xl border border-[#d8d8de] bg-white px-4 text-base"/></label>)}</div><p className="mt-6 text-sm leading-6 text-[#6e6e73]">Örnek değerler sana ait fiyatlar değildir. Gerçek alış ve işçilik maliyetlerini gir. Hesap tarayıcında yapılır; veriler sunucuya gönderilmez.</p></div><div aria-live="polite" className="marketing-card self-start !bg-[#eaf4ff]"><p className="marketing-eyebrow">Hesap sonucu</p>{invalid?<p className="mt-6 text-[#a02f24]">Alanları kontrol et. Marj %90&apos;ın altında, değerler sıfır veya üzeri olmalı.</p>:<><div className="mt-7 space-y-3 text-[#55555d]">{kind==="paint"&&<div className="flex justify-between gap-3"><span>Gereken boya</span><strong>{quantity.toLocaleString("tr-TR",{maximumFractionDigits:2})} L</strong></div>}<div className="flex justify-between gap-3"><span>Toplam maliyet</span><strong>{money(cost)}</strong></div><div className="flex justify-between gap-3"><span>Hedef marj</span><strong>%{number("margin")}</strong></div></div><div className="mt-7 border-t border-[#cbdff3] pt-7"><p className="font-medium">Bu işi yaklaşık</p><p className="mt-2 text-4xl font-semibold tracking-[-.06em] text-[#0071e3]">{money(price)}</p><p className="mt-2">ve üzeri fiyatlandırmalısın.</p></div><p className="mt-6 text-sm leading-6 text-[#55555d]">Hedef fiyat = maliyet ÷ (1 − marj / 100). Sonuç 100 TL yukarı yuvarlanır; vergi ve özel koşulları ayrıca değerlendir.</p></>}<div className="mt-7"><p className="mb-4 text-sm font-medium">Müşterine profesyonel teklif göndermek ister misin?</p><Link href="/register" className="marketing-primary">Ücretsiz Başla</Link></div></div></div>;
}

"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
export function MarketingTracker(){const path=usePathname();const search=useSearchParams();useEffect(()=>{if(!path)return;const channel=search.get("utm_source")||"direct";const send=(event:string)=>navigator.sendBeacon?.("/api/analytics",new Blob([JSON.stringify({event,path,channel})],{type:"application/json"}));send(path==="/fiyatlandirma"?"pricing_viewed":"landing_view");const onClick=(e:MouseEvent)=>{const link=(e.target as Element)?.closest?.("a[href]") as HTMLAnchorElement|null;if(link?.pathname==="/register")send("signup_started");};document.addEventListener("click",onClick);return()=>document.removeEventListener("click",onClick);},[path,search]);return null;}

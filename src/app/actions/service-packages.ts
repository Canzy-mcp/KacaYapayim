"use server";
import {requireCompletedViewer} from '@/lib/viewer';
import {createClient} from '@/lib/supabase/server';
import {isQuoteId} from '@/lib/quotes/id';
import {revalidatePath} from 'next/cache';
export type PackageOption={name:string;scope:string;cost:number;price:number};
export async function createServicePackages(id:string,options:PackageOption[],acknowledgeRisk:boolean){
 await requireCompletedViewer();if(!isQuoteId(id)||!Array.isArray(options)||options.length!==3||options.some(o=>!o.name.trim()||o.name.length>60||!o.scope.trim()||o.scope.length>2000||![o.cost,o.price].every(n=>Number.isFinite(n)&&n>0&&n<=1e12&&Math.abs(n*100-Math.round(n*100))<0.0001)))return {ok:false,error:'Paketlerin kapsamını, maliyetini ve fiyatını kontrol et.'};
 const client=await createClient();const {data,error}=await client.rpc('create_service_packages',{p_quote_id:id,p_options:options,p_acknowledge_risk:acknowledgeRisk});
 if(error||!data)return {ok:false,error:'Paketler oluşturulamadı. Üç yeni teklif için kota gerektiğini ve minimum kâr hedefini kontrol et. Hiçbir paket kaydedilmedi.'};
 revalidatePath('/quotes');revalidatePath('/jobs');return {ok:true,options:data as Array<{id:string;name:string}>};
}

export async function publishServicePackages(id:string,risk:boolean){await requireCompletedViewer();if(!isQuoteId(id))return {ok:false};const client=await createClient();const {data,error}=await client.rpc("publish_service_packages",{p_quote_id:id,p_acknowledge_risk:risk});revalidatePath("/quotes");return {ok:!error&&!!data,token:data};}

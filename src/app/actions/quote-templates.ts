"use server";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import type { ScopeDraft } from "@/lib/quotes/defaults";
export type QuoteTemplateContent={title:string;description:string;items:ScopeDraft[];exclusions:string[];duration:string;payment:string;notes:string;taxMode:'unspecified'|'included'|'excluded'};
export async function listQuoteTemplates(){
 const viewer=await requireCompletedViewer();const client=await createClient();const {data,error}=await client.from('quote_templates').select('id,name,content').eq('business_id',viewer.business!.id).order('name').limit(100);
 if(error)throw new Error('Şablonlar yüklenemedi.');return (data??[]).map(t=>({...t,content:t.content as QuoteTemplateContent}));
}
export async function saveQuoteTemplate(name:string,content:QuoteTemplateContent){
 const viewer=await requireCompletedViewer();
 if(typeof name!=='string'||!name.trim()||name.length>100||!content||typeof content.title!=='string'||content.title.length>160||typeof content.description!=='string'||content.description.length>2000||typeof content.duration!=='string'||content.duration.length>160||typeof content.payment!=='string'||content.payment.length>1000||typeof content.notes!=='string'||content.notes.length>2000||!Array.isArray(content.items)||content.items.length<1||content.items.length>30||content.items.some(i=>!i||typeof i.name!=='string'||!i.name.trim()||i.name.length>160||typeof i.description!=='string'||i.description.length>1000)||!Array.isArray(content.exclusions)||content.exclusions.length>20||content.exclusions.some(t=>typeof t!=='string'||t.length>500)||!['unspecified','included','excluded'].includes(content.taxMode))return {ok:false,error:'Şablon alanlarını kontrol et.'};
 const client=await createClient();const {error}=await client.from('quote_templates').upsert({business_id:viewer.business!.id,name:name.trim(),content},{onConflict:'business_id,name'});
 return {ok:!error,error:error?'Şablon kaydedilemedi.':undefined};
}

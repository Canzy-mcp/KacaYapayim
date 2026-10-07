"use server";
import { requireCompletedViewer } from "@/lib/viewer";
import { createCustomer } from "@/app/actions/customers";
import { consumeRateLimit } from "@/lib/security/rate-limit";
export async function importCustomers(rows: Record<string,string>[]) {
 const viewer=await requireCompletedViewer();if(!Array.isArray(rows)||rows.length<1||rows.length>100)return {created:0,failures:[{row:0,error:'Bir seferde 1–100 müşteri aktarabilirsin.'}]};
 if(!await consumeRateLimit('customer-import',3,3600,viewer.id))return {created:0,failures:rows.map((_,i)=>({row:i+2,error:'Saatlik aktarım sınırına ulaştın. Daha sonra tekrar dene.'}))};
 let created=0;const failures:Array<{row:number;error:string}>=[];
 for(let i=0;i<rows.length;i++){
  const data=new FormData();for(const key of ['name','phone','email','company_name','city','district','address','notes'])if(typeof rows[i]?.[key]==='string')data.set(key,rows[i][key]);
  try{const result=await createCustomer(data);if(result.ok)created++;else failures.push({row:i+2,error:result.error||Object.values(result.fieldErrors||{})[0]||(result.duplicate?'Bu telefon numarası zaten kayıtlı.':'Müşteri eklenemedi.')});}
  catch{failures.push({row:i+2,error:'Sonuç doğrulanamadı; tekrar aktarmadan önce listeyi kontrol et.'});for(let j=i+1;j<rows.length;j++)failures.push({row:j+2,error:'Bağlantı hatası nedeniyle işlenmedi.'});break;}
 }
 return {created,failures};
}

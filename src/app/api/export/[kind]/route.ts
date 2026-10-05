import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { encodeCsv } from "@/lib/csv";
export async function GET(_:Request,{params}:{params:Promise<{kind:string}>}){
 const {kind}=await params;if(!['customers','quotes','costs'].includes(kind))return new Response(null,{status:404});
 const viewer=await requireCompletedViewer();const client=await createClient();const rows:unknown[][]=[];
 if(kind==='customers')rows.push(['name','phone','email','company_name','city','district','address','notes']);
 if(kind==='quotes')rows.push(['Teklif No','Başlık','Durum','Tutar','Geçerlilik','Oluşturma']);
 if(kind==='costs')rows.push(['Kalem','Kategori','Birim','Birim Maliyet','Güncelleme']);
 let page=0;while(true){
  if(kind==='customers'){const {data,error}=await client.from('customers').select('id,name,phone,email,company_name,city,district,address,notes').eq('business_id',viewer.business!.id).order('id').range(page*500,(page+1)*500-1);if(error)return new Response(null,{status:503});for(const c of data??[])rows.push([c.name,c.phone,c.email,c.company_name,c.city,c.district,c.address,c.notes]);if(!data||data.length<500)break;}
  else if(kind==='quotes'){const {data,error}=await client.from('quotes').select('id,quote_number,title,status,sale_price,valid_until,created_at').eq('business_id',viewer.business!.id).order('id').range(page*500,(page+1)*500-1);if(error)return new Response(null,{status:503});for(const q of data??[])rows.push([q.quote_number,q.title,q.status,q.sale_price,q.valid_until,q.created_at]);if(!data||data.length<500)break;}
  else{const {data,error}=await client.from('business_cost_items').select('id,name,category,unit,unit_cost,updated_at').eq('business_id',viewer.business!.id).order('id').range(page*500,(page+1)*500-1);if(error)return new Response(null,{status:503});for(const c of data??[])rows.push([c.name,c.category,c.unit,c.unit_cost,c.updated_at]);if(!data||data.length<500)break;}
  page++;if(page>1000)return new Response('Dışa aktarım çok büyük.',{status:413});
 }
 return new Response(encodeCsv(rows),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="kacayapayim-${kind}.csv"`,'Cache-Control':'no-store'}});
}

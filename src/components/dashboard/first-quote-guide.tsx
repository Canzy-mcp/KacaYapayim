import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {requireCompletedViewer} from "@/lib/viewer";
export async function FirstQuoteGuide(){
 const viewer=await requireCompletedViewer();const r=await (await createClient()).from("quotes").select("id",{head:true,count:"exact"}).eq("business_id",viewer.business!.id);
 if(r.error)throw new Error("Başlangıç durumu yüklenemedi.");if(r.count)return null;
 return <section className="mb-6 rounded-2xl border border-[#d7e8fa] bg-[#eef6ff] p-5"><h2 className="text-lg font-semibold">İlk teklifini hazırlayalım</h2><ol className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><li><strong>1. Maliyetlerini kontrol et</strong><p className="mt-1 text-[#4d5968]">Malzeme ve işçilik fiyatlarının güncel olduğundan emin ol.</p><Link className="mt-2 inline-flex min-h-11 items-center text-[#0071e3]" href="/costs">Maliyetlerimi aç →</Link></li><li><strong>2. İşini ve kapsamını gir</strong><p className="mt-1 text-[#4d5968]">Müşteriyi seç; miktarları ve yapılacak işleri ekle.</p><Link className="mt-2 inline-flex min-h-11 items-center text-[#0071e3]" href="/new-quote">İş oluştur →</Link></li><li><strong>3. Fiyatı belirle ve paylaş</strong><p className="mt-1 text-[#4d5968]">Kâr marjını, vergiyi ve müşteri görünümünü kontrol et.</p><Link className="mt-2 inline-flex min-h-11 items-center text-[#0071e3]" href="/rehber">Teklif rehberi →</Link></li></ol></section>;
}

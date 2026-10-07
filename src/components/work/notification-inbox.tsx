import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { markNotificationRead } from "@/app/actions/notifications";
export async function NotificationInbox(){
  const viewer=await requireCompletedViewer();const client=await createClient();
  const {data,error}=await client.from("notifications").select("*").eq("business_id",viewer.business!.id).is("read_at",null).order("created_at",{ascending:false}).limit(20);
  if(error)throw new Error("Bildirimler yüklenemedi.");if(!data?.length)return null;
  return <section className="mb-6 rounded-2xl border bg-white p-5"><h2 className="font-semibold">Okunmamış bildirimler</h2><ul className="mt-3 divide-y">{data.map(n=><li key={n.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div>{n.quote_id?<Link className="text-[#0071e3]" href={`/quotes/${n.quote_id}`}>{n.title}</Link>:n.title}<p className="mt-1 text-xs text-[#6e6e73]">{new Date(n.created_at).toLocaleString("tr-TR",{timeZone:"Europe/Istanbul"})}</p></div><form action={markNotificationRead}><input type="hidden" name="id" value={n.id}/><button className="min-h-11 rounded-xl border px-3">Okundu</button></form></li>)}</ul></section>;
}

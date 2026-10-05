import Link from 'next/link';
import {getViewer} from '@/lib/viewer';
import {notFound} from 'next/navigation';
import {AcceptInvite} from '@/components/work/accept-invite';
export default async function Page({params}:{params:Promise<{token:string}>}){
 const {token}=await params;if(!/^[a-f0-9]{64}$/.test(token))notFound();const viewer=await getViewer();
 return <main className="mx-auto max-w-xl px-5 py-16"><h1 className="text-3xl font-semibold">İş görüntüleme daveti</h1><p className="mt-4 text-sm leading-6">Bu bağlantı yalnızca davet edilen e-postayla açılır. Daveti kabul edince sana atanmış işlerin kapsamını ve keşif saatlerini görebilirsin.</p>{viewer?<AcceptInvite token={token}/>:<><Link href="/login" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-[#0071E3] px-5 text-white">Giriş Yap</Link><p className="mt-3 text-sm">Girişten sonra bu davet bağlantısını tekrar aç. Hesabın yoksa önce kayıt olup e-postanı doğrula.</p></>}</main>;
}

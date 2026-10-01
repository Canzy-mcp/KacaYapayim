import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculator } from "@/components/marketing/calculator";
import { PageIntro } from "@/components/marketing/shell";
import { calculators } from "@/lib/marketing/calculators";
import { breadcrumbs, JsonLd, siteMetadata } from "@/lib/marketing/seo";
type Props={params:Promise<{slug:string}>};
export function generateStaticParams(){return calculators.map(c=>({slug:c.slug}));}
export async function generateMetadata({params}:Props){const {slug}=await params;const c=calculators.find(x=>x.slug===slug);return c?siteMetadata(c.title,c.description,`/hesaplama-araclari/${c.slug}`):{};}
export default async function Page({params}:Props){const {slug}=await params;const c=calculators.find(x=>x.slug===slug);if(!c)notFound();return <div className="mx-auto max-w-6xl px-5 py-16"><JsonLd data={breadcrumbs([{name:"Ana Sayfa",path:"/"},{name:"Hesaplama Araçları",path:"/hesaplama-araclari"},{name:c.title,path:`/hesaplama-araclari/${c.slug}`}])}/><nav aria-label="İçerik yolu" className="mb-10 text-sm text-[#6e6e73]"><Link href="/">Ana Sayfa</Link> / <Link href="/hesaplama-araclari">Hesaplama Araçları</Link></nav><PageIntro eyebrow="Ücretsiz hesaplayıcı" title={c.title} description={c.description}/><div className="mt-12"><Calculator kind={c.kind} analyticsEnabled={process.env.ANALYTICS_ENABLED==="true"}/></div><div className="mt-12 max-w-3xl"><h2 className="text-2xl font-semibold">Sonuç nasıl bulunur?</h2><p className="mt-4 leading-8 text-[#55555d]">Önce işin toplam maliyeti hesaplanır. Hedef kâr marjı satış fiyatı üzerinden tanımlanır; bu nedenle maliyet (1 − marj / 100) değerine bölünür. Öneri fiyatı yukarı yuvarlanır. Bu hesap piyasa fiyatı veya bağlayıcı teklif değildir.</p><Link href="/metodoloji" className="marketing-text-link mt-4 inline-block">Metodolojiyi oku →</Link></div></div>}

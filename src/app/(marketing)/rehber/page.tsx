import Link from "next/link";
import { guides } from "@/lib/marketing/content";
import { siteMetadata } from "@/lib/marketing/seo";
import { PageIntro } from "@/components/marketing/shell";
export const metadata = siteMetadata("Fiyatlandırma ve teklif rehberi", "Kâr marjı, iş maliyeti, işçilik ve teklif fiyatı için formüllerle hazırlanmış rehber.", "/rehber");
export default function Page() { return <div className="mx-auto max-w-6xl px-5 py-16"><PageIntro eyebrow="Rehber" title="İşinin hesabını açıkça yap." description="Fiyatlandırma kararlarını örnekler ve formüllerle anlamak için kısa, somut yazılar."/><div className="mt-12 grid gap-4 md:grid-cols-2">{guides.map(g=><Link key={g.slug} className="marketing-card" href={`/rehber/${g.slug}`}><h2 className="text-xl font-semibold">{g.title}</h2><p className="mt-3 leading-6 text-[#6e6e73]">{g.answer}</p><span className="marketing-text-link mt-5 inline-block">Oku →</span></Link>)}</div></div>; }

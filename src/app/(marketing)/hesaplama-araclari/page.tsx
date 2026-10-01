import Link from "next/link";
import { PageIntro } from "@/components/marketing/shell";
import { calculators } from "@/lib/marketing/calculators";
import { siteMetadata } from "@/lib/marketing/seo";
export const metadata=siteMetadata("Ücretsiz Hesaplama Araçları","Kâr marjını ve iş maliyetini hesaplamak için ücretsiz araçlar.","/hesaplama-araclari");
export default function Page(){return <div className="mx-auto max-w-6xl px-5 py-16"><PageIntro eyebrow="Hesaplama araçları" title="Önce hesabını gör." description="Kayıt olmadan kendi rakamlarınla hesap yap. Sonucu gördükten sonra istersen teklifini hazırla."/><div className="mt-12 grid gap-5 sm:grid-cols-2">{calculators.map(c=><Link key={c.slug} className="marketing-card" href={`/hesaplama-araclari/${c.slug}`}><h2 className="text-xl font-semibold">{c.title}</h2><p className="mt-3 text-[#6e6e73]">{c.description}</p><span className="marketing-text-link mt-5 inline-block">Hesapla →</span></Link>)}</div></div>}

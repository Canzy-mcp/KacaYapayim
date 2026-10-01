import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { PlanCards } from "@/components/billing/plan-cards";
import { getPlans } from "@/lib/billing/service";
import { PageIntro } from "@/components/marketing/shell";
import { siteMetadata } from "@/lib/marketing/seo";
export const metadata=siteMetadata("Fiyatlandırma","Ücretsiz, Usta ve Pro paketlerinin güncel özelliklerini ve sınırlarını karşılaştır.","/fiyatlandirma");
export const dynamic="force-dynamic";
export default async function Page(){const plans=await getPlans();return <div className="marketing-container landing-section"><div className="pricing-intro"><PageIntro eyebrow="Fiyatlandırma" title="İşin büyüdükçe yanında." description="İlk işinin hesabını ücretsiz çıkar. Daha fazla teklif ve müşteri gerektiğinde paketini büyüt."/><div className="pricing-assurances"><span><Check size={17}/>Kendi maliyetlerinle hesaplama</span><span><Check size={17}/>Mesleğine uygun iş kalemleri</span><span><Check size={17}/>İşin büyüdükçe paket seçimi</span></div></div><section className="pricing-plans" aria-label="Paket karşılaştırması"><h2 className="sr-only">İşine uygun paketi seç</h2><PlanCards plans={plans} marketing/></section><p className="pricing-payment-note">Ücretli paketler için ödeme bağlantısı henüz açılmadı. Satın alma ve yenileme koşulları ödeme altyapısı hazır olduğunda satın alma ekranında gösterilir.</p><aside className="inline-cta"><div><h2>Önce bir işi hesapla.</h2><p>Ücretsiz hesaplayıcıyla maliyetinin teklif fiyatına nasıl dönüştüğünü gör.</p></div><Link href="/hesaplama-araclari/kar-marji" className="marketing-secondary">Kâr marjını hesapla <ArrowRight size={16}/></Link></aside></div>}

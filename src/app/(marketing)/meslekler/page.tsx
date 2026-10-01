import { siteMetadata } from "@/lib/marketing/seo";
import { ContentCta, PageIntro } from "@/components/marketing/shell";
import { ProfessionCards } from "@/components/marketing/visuals";
export const metadata = siteMetadata("Meslekler", "Boyacı, elektrikçi, tesisatçı ve klimacı için maliyet ve teklif hesapları.", "/meslekler");
export default function Page() { return <div className="marketing-container landing-section"><PageIntro eyebrow="İşini bilen ustalar için" title="Her işin hesabı farklı." description="Kendi mesleğinin kalemlerini kullanarak maliyetini çıkar, hedef kârına göre teklifini oluştur."/><section aria-label="Mesleğine uygun hesaplama"><h2 className="sr-only">Mesleğini seç</h2><ProfessionCards spacious/></section><p className="visual-disclosure">Meslek görselleri temsili olarak hazırlanmıştır.</p><ContentCta/></div>; }


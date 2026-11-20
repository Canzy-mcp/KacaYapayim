import Link from "next/link";
import { siteMetadata } from "@/lib/marketing/seo";
import { Band, CtaBand, Faq, Intro, PageHead, PageLd, ctaGhost, ctaLight, textLink, tile, title } from "@/components/marketing/acquisition/parts";
import { supportEmail } from "@/lib/marketing/contact";

const name = "Güvenli hizmet: adres, yorum ve bildirim kuralları";
const description = "KaçaYapayım'da adresin kimle ve ne zaman paylaşıldığı, yorumları kimin yazabildiği, profil bildirme, moderasyon ve ödeme hakkında bilmen gerekenler.";
export const metadata = siteMetadata(name, description, "/guvenli-hizmet");
const path = "/guvenli-hizmet";

const blocks = [
  { id: "adres", h: "Adresin senin kontrolünde", text: "İlanda ve usta profillerinde açık adres görünmez. Bir ustayı seçtikten sonra adresini paylaşıp paylaşmayacağına sen karar verirsin. Paylaşırsan yalnızca seçtiğin usta görür. İş iptal edilirse paylaşım kapanır." },
  { id: "yorum", h: "Yorumlar tamamlanan işten gelir", text: "Yorumu yalnızca işi yaptıran müşteri, iş tamamlandı olarak işaretlendikten sonra yazabilir. Talebi olmayan biri puan veremez." },
  { id: "bildir", h: "Profili bildir", text: "Giriş yaptıktan sonra usta profilinin altındaki “Profili bildir” bölümünden uygunsuz ya da yanıltıcı bir profili bildirebilirsin. Bildirimleri ekibimiz inceler." },
  { id: "moderasyon", h: "İnceleme ve askıya alma", text: "Kurallara aykırı bir profil incelenir. Gerekirse profil askıya alınır; askıdaki profil aramalarda görünmez ve yeni talep almaz." },
  { id: "odeme", h: "Ödeme sizin aranızda", text: "Ödeme müşteri ile usta arasında yapılır. KaçaYapayım parayı tutmaz, emanet hesabı işletmez ve ödemeye aracılık etmez. Bu yüzden ödeme koşullarını iş başlamadan yazılı netleştirmeni öneririz." },
] as const;

const tips = [
  "Fiyatı ve işin kapsamını yazılı al. Teklifte neyin dahil, neyin hariç olduğuna bak.",
  "Profildeki hizmet bölgesini ve değerlendirmeleri incele.",
  "Adresini ustayı seçmeden paylaşma.",
  "Ödemeyi işin aşamasına göre böl ve ne için ödediğini not et.",
  "Bir şey yanlış görünüyorsa profili bildir ya da bize yaz.",
] as const;

const faqs = [
  ["Adresimi herkes görebilir mi?", "Hayır. Adres ilanda ya da profilde yayımlanmaz. Yalnızca seçtiğin usta, sen paylaştıktan sonra görür."],
  ["Kimler yorum yazabilir?", "Yalnızca işi tamamlanan müşteri. Yorum, tamamlanmış bir talebe bağlı olarak yazılır."],
  ["Bir sorun yaşarsam ne yapmalıyım?", `Profili bildirebilir ya da ${supportEmail} adresine yazabilirsin. Kişisel bilgi, şifre veya ödeme bilgisi gönderme.`],
] as const;

export default function Page() {
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Güvenli hizmet", path }];
  return <>
    <PageLd path={path} name={name} description={description} crumbs={crumbs} faqs={faqs} />
    <PageHead crumbs={[{ name: "Ana Sayfa", href: "/" }, { name: "Güvenli hizmet" }]} eyebrow="Güvenli hizmet" h="Kapını açmadan önce bilmen gerekenler." text="Adresin, yorumların, bildirimlerin ve ödemenin nasıl işlediğini açıkça yazdık." />
    <Band tone="gray" label="rules-title">
      <h2 id="rules-title" className="sr-only">Güvenlik kuralları</h2>
      <div className="grid gap-4 md:grid-cols-2">{blocks.map((b, i) => <section key={b.id} id={b.id} aria-labelledby={`${b.id}-t`} className={`${tile} scroll-mt-28 ${i === 0 ? "md:col-span-2" : ""}`}><h3 id={`${b.id}-t`} className={title}>{b.h}</h3><p className="mt-3 max-w-[68ch] text-[17px] leading-[1.6] text-[#515154]">{b.text}</p></section>)}</div>
    </Band>
    <Band label="tips-title">
      <Intro eyebrow="Müşteriler için" h="Daha güvenli bir iş için beş ipucu." id="tips-title" />
      <ul className="mt-8 grid max-w-3xl gap-3">{tips.map(t => <li key={t} className="flex gap-3 rounded-[20px] border border-[#d2d2d7] bg-white p-5 leading-[1.55]"><span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#e4f0ed] text-xs font-bold text-[#075d54]">✓</span><span className="min-w-0">{t}</span></li>)}</ul>
      <p className="mt-8"><Link href="/nasil-calisir" className={textLink}>Süreç nasıl işliyor?</Link></p>
    </Band>
    <Band tone="gray" label="faq-title"><Faq items={faqs} /></Band>
    <CtaBand id="cta-title" h="Güvenle usta bul." text="Müşteriler için ücretsiz."><Link href="/usta-bul" className={ctaLight}>Usta bul</Link><Link href="/iletisim" className={ctaGhost}>Bize yaz</Link></CtaBand>
  </>;
}

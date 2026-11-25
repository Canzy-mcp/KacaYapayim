import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { siteMetadata } from "@/lib/marketing/seo";
import { Band, CtaBand, Faq, Intro, PageHead, PageLd, Photo, Steps, ctaGhost, ctaLight, pillPrimary, pillSecondary, textLink, tile, title } from "@/components/marketing/acquisition/parts";

const name = "Nasıl çalışır: usta bul, teklif al, işi bitir";
const description = "KaçaYapayım'da doğrudan ustaya talep göndermek ya da açık ilan vermek, teklifleri karşılaştırmak, adresi paylaşmak ve işi değerlendirmek nasıl işler?";
export const metadata = siteMetadata(name, description, "/nasil-calisir");
const path = "/nasil-calisir";

const faqs = [
  ["Hangi yolu seçmeliyim?", "Belirli bir ustayı beğendiysen doğrudan talep gönder. Birkaç teklif görmek istiyorsan işi bir kez anlat ve açık ilan ver."],
  ["Adresimi ne zaman paylaşırım?", "Ustayı seçtikten sonra. Adres otomatik gitmez; paylaşıp paylaşmayacağına sen karar verirsin ve yalnızca seçtiğin usta görür."],
  ["Ödemeyi nasıl yaparım?", "Ödeme müşteri ile usta arasında yapılır. KaçaYapayım ödemeyi tutmaz ve aracılık etmez."],
  ["Yorumu ne zaman yazabilirim?", "İş tamamlandı olarak işaretlendikten sonra. Yalnızca o işi yaptıran müşteri yorum yazabilir."],
] as const;

const direct = [
  { title: "Ustayı seç", text: "Hizmete ve ilçeye göre ara, profilleri incele." },
  { title: "Talebini gönder", text: "İşi kısaca anlat. Adresin bu aşamada paylaşılmaz." },
  { title: "Yanıtı bekle", text: "Usta kabul eder, soru sorar ya da teklifini gönderir." },
] as const;
const open = [
  { title: "İlanını yaz", text: "İşi bir kez anlat, istersen fotoğraf ekle." },
  { title: "Teklifleri topla", text: "Bölgendeki uygun ustalar sana teklif gönderir." },
  { title: "Karşılaştır", text: "Fiyatı, kapsamı ve profilleri yan yana gör." },
] as const;
const after = [
  { title: "Ustayı seç", text: "Teklifini beğendiğin ustayla devam et." },
  { title: "Adresi paylaş", text: "İstersen adresini yalnızca seçtiğin ustaya ilet." },
  { title: "Randevuyu belirle", text: "Keşif ya da iş gününü mesajlaşarak netleştir." },
  { title: "İşi tamamla, yorum yaz", text: "İş bitince tamamlandı olarak işaretle ve deneyimini paylaş." },
] as const;

export default function Page() {
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Nasıl çalışır", path }];
  return <>
    <PageLd path={path} name={name} description={description} crumbs={crumbs} faqs={faqs} />
    <PageHead crumbs={[{ name: "Ana Sayfa", href: "/" }, { name: "Nasıl çalışır" }]} eyebrow="Nasıl çalışır" h="İki yol, aynı sonuç: doğru usta." text="Beğendiğin ustaya doğrudan yaz ya da işini ilan et. Teklifleri karşılaştır, seç, randevunu belirle.">
      <Link href="/usta-bul" className={pillPrimary}>Usta bul <ArrowRight size={17} aria-hidden="true" /></Link><Link href="/talepler/yeni" className={pillSecondary}>İş ilanı ver</Link>
    </PageHead>

    <Band tone="gray" label="journeys-title">
      <Intro eyebrow="Başlangıç" h="Önce yolunu seç." id="journeys-title" />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className={tile}><h3 className={title}>Doğrudan ustaya talep</h3><p className="mt-2 text-ink-2">Aradığın ustayı biliyorsan.</p><div className="mt-6"><Steps items={direct} /></div><Link href="/usta-bul" className={`${pillPrimary} mt-6`}>Usta bul</Link></div>
        <div className={tile}><h3 className={title}>Açık ilan</h3><p className="mt-2 text-ink-2">Birkaç teklif görmek istiyorsan.</p><div className="mt-6"><Steps items={open} /></div><Link href="/talepler/yeni" className={`${pillSecondary} mt-6`}>İş ilanı ver</Link></div>
      </div>
    </Band>

    <Band label="after-title">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-16">
        <div className="min-w-0"><Intro eyebrow="Seçtikten sonra" h="Seç, adresi paylaş, randevuyu belirle." id="after-title" text="Adresin ustayı seçmeden önce kimseye gitmez. İş tamamlanınca deneyimini yazarsın." /></div>
        <Photo src="/images/marketing/musteri-randevu.webp" alt="Kapıyı açan ev sahibine selam veren, elinde alet çantası olan teknisyen" sizes="(min-width: 1024px) 540px, 100vw" caption="Randevu günü kapıda. Temsili görsel." />
      </div>
      <div className="mt-12"><Steps items={after} /></div>
      <p className="mt-8"><Link href="/guvenli-hizmet" className={textLink}>Adres paylaşımı ve değerlendirme kuralları</Link></p>
    </Band>

    <Band tone="gray" label="faq-title"><Faq items={faqs} /></Band>
    <CtaBand id="cta-title" h="Hangi yolu seçersen seç, ücretsiz." text="Müşteriler için usta bulmak ve ilan açmak ücretsiz."><Link href="/usta-bul" className={ctaLight}>Usta bul</Link><Link href="/talepler/yeni" className={ctaGhost}>İş ilanı ver</Link></CtaBand>
  </>;
}

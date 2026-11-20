import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, Lock, Search, ShieldCheck, Flag } from "lucide-react";
import { graph, JsonLd, organizationId, siteMetadata, siteOrigin, webPageNode } from "@/lib/marketing/seo";
import { Band, CtaBand, Intro, Photo, Steps, ctaGhost, ctaLight, display, headline, lead, pillPrimary, pillSecondary, textLink, tile } from "@/components/marketing/acquisition/parts";

export const metadata: Metadata = siteMetadata("Usta bul, teklif al ve işini yönet", "İşin için usta bul veya ilan açıp teklif al. Ustalar için maliyet hesabı, profesyonel teklifler ve iş takibi.", "/");

// Same slugs as the marketplace directory (private.market_categories).
const categories = [["boya", "Boya ve badana"], ["elektrik", "Elektrik"], ["tesisat", "Su tesisatı"], ["klima", "Klima ve havalandırma"], ["isitma", "Kombi ve ısıtma"], ["mobilya", "Mobilya ve montaj"], ["tadilat", "Tadilat"], ["seramik", "Fayans ve seramik"], ["zemin", "Parke ve zemin"], ["cati", "Çatı ve yalıtım"], ["cam", "Cam ve doğrama"], ["celik", "Çilingir ve kapı"], ["bahce", "Bahçe ve peyzaj"], ["cihaz", "Beyaz eşya servisi"], ["temizlik", "Temizlik"], ["nakliye", "Nakliye"], ["diger", "Diğer"]] as const;

const services = [
  { slug: "boya", name: "Boya ve badana", text: "Salon, koridor, tavan", image: "painter", alt: "Boya rulosunun maskelenmiş süpürgeliğin üstünde taze bir kenar çekmesi" },
  { slug: "elektrik", name: "Elektrik", text: "Pano, priz, aydınlatma", image: "electrician", alt: "Kapalı bir sigorta panosunu etiketleyen elektrikçinin elleri" },
  { slug: "tesisat", name: "Su tesisatı", text: "Sifon, batarya, kaçak", image: "plumber", alt: "Mutfak dolabının içinde lavabo sifonunu takan eller" },
  { slug: "klima", name: "Klima ve havalandırma", text: "Montaj, bakım, filtre", image: "hvac", alt: "Balkon kapısının yanında split klimanın filtresini çıkaran teknisyen" },
  { slug: "tadilat", name: "Tadilat", text: "Banyo, mutfak, fayans", image: "tadilat", alt: "Banyo duvarına fayans döşeyen usta" },
  { slug: "", name: "Tüm hizmetler", text: "17 kategoride usta ara", image: "musteri-randevu", alt: "Kapıyı açan ev sahibine selam veren, elinde alet çantası olan teknisyen" },
] as const;

const steps = [
  { title: "Ustayı bul", text: "Hizmeti ve ilçeni seç. Profilleri, hizmet bölgelerini ve değerlendirmeleri incele." },
  { title: "Talep gönder ya da ilan aç", text: "Beğendiğin ustaya doğrudan yaz. Ya da işi bir kez anlat, gelen teklifleri karşılaştır." },
  { title: "Seç, buluş, değerlendir", text: "Ustayı sen seç, keşif gününü birlikte belirle. İş bitince deneyimini paylaş." },
] as const;

const trust = [
  { icon: ShieldCheck, title: "Yorumlar tamamlanan işten gelir", text: "Değerlendirmeyi yalnızca işi tamamlanan müşteri yazabilir." },
  { icon: Lock, title: "Adresin senin elinde", text: "Adresin yalnızca seçtiğin ustaya gider ve ancak sen paylaştıktan sonra." },
  { icon: BadgeCheck, title: "Müşteriler için ücretsiz", text: "Usta aramak, ilan açmak ve teklif almak için ücret ödemezsin." },
  { icon: Flag, title: "Profili bildirebilirsin", text: "Uygunsuz bir profil görürsen bildir, ekibimiz inceler." },
] as const;

const faqs = [
  { q: "Usta bulmak ücretli mi?", a: "Hayır. Usta aramak, talep göndermek ve ilan açmak müşteriler için ücretsiz." },
  { q: "Adresimi herkes görebilir mi?", a: "Hayır. Adresin ilanda ya da profilde görünmez. Bir ustayı seçtikten sonra istersen adresini yalnızca o ustayla paylaşırsın." },
  { q: "İlan ile doğrudan talep arasındaki fark nedir?", a: "Doğrudan talepte seçtiğin ustaya yazarsın. İlanda işi bir kez anlatırsın, bölgendeki ustalar teklif verir ve sen karşılaştırıp birini seçersin." },
  { q: "Yorumlara güvenebilir miyim?", a: "Yorumlar yalnızca tamamlanan işlerden sonra, o işi yaptıran müşteri tarafından yazılır. Talebi tamamlanmamış biri puan veremez." },
  { q: "Usta olarak nasıl katılırım?", a: "Ücretsiz hesap aç, hizmet alanını ve bölgeni ekle, profilini yayınla. Teklif ve maliyet araçları aynı hesapta." },
] as const;
const faqPairs = faqs.map(f => [f.q, f.a] as const);

export default function Home() {
  return <>
    <JsonLd data={graph(
      webPageNode({ path: "/", name: "KaçaYapayım: usta bul, teklif al", description: "İşin için usta bul veya ilan açıp teklif al.", hasBreadcrumb: false }),
      { "@type": "WebApplication", "@id": `${siteOrigin}/#webapp`, name: "KaçaYapayım", applicationCategory: "BusinessApplication", operatingSystem: "Web", description: "Usta arama, iş ilanı, teklif ve iş yönetimi uygulaması.", url: siteOrigin, publisher: { "@id": organizationId } },
      { "@type": "FAQPage", "@id": `${siteOrigin}/#faq`, inLanguage: "tr-TR", mainEntity: faqPairs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    )} />

    <section className="bg-white pb-10 pt-10 sm:pt-16 lg:pb-14 lg:pt-20" aria-labelledby="hero-title"><div className="mx-auto w-full min-w-0 max-w-[1180px] px-5 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold text-[#075d54]">Mahallendeki ustalar</p>
        <h1 id="hero-title" className={`mt-3 ${display}`}>Doğru ustayı bul, işini rahat teslim et.</h1>
        <p className={`mx-auto mt-5 max-w-[48ch] ${lead}`}>Hizmeti ve ilçeni seç, ustaların profillerine bak, tek talepte teklif al.</p>
      </div>
      <form action="/usta-bul" method="get" aria-label="Usta ara" className="mx-auto mt-10 grid max-w-4xl gap-4 rounded-[20px] border border-[#d2d2d7] bg-[#f5f5f7] p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
        <div className="grid min-w-0 gap-1.5"><label htmlFor="home-category" className="text-sm font-semibold text-[#1d1d1f]">Hizmet</label>
          <select id="home-category" name="category" defaultValue="" className="min-h-12 w-full min-w-0 rounded-xl border border-[#d2d2d7] bg-white px-3 text-base text-[#1d1d1f] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#075d54]"><option value="">Tüm hizmetler</option>{categories.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}</select></div>
        <div className="grid min-w-0 gap-1.5"><label htmlFor="home-city" className="text-sm font-semibold text-[#1d1d1f]">İl</label>
          <input id="home-city" name="city" type="text" placeholder="Örn. İstanbul" maxLength={80} autoComplete="address-level1" className="min-h-12 w-full min-w-0 rounded-xl border border-[#d2d2d7] bg-white px-3 text-base text-[#1d1d1f] placeholder:text-[#6e6e73] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#075d54]" /></div>
        <div className="grid min-w-0 gap-1.5"><label htmlFor="home-district" className="text-sm font-semibold text-[#1d1d1f]">İlçe</label>
          <input id="home-district" name="district" type="text" placeholder="Örn. Kadıköy" maxLength={80} autoComplete="address-level2" className="min-h-12 w-full min-w-0 rounded-xl border border-[#d2d2d7] bg-white px-3 text-base text-[#1d1d1f] placeholder:text-[#6e6e73] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#075d54]" /></div>
        <button type="submit" className={`${pillPrimary} sm:col-span-2 lg:col-span-1`}><Search size={18} aria-hidden="true" />Usta bul</button>
      </form>
      <p className="mt-5 text-center text-base text-[#515154]">Ne aradığından emin değil misin? <Link href="/talepler/yeni" className={textLink}>İş ilanı ver</Link> ve teklifler sana gelsin.</p>
    </div></section>

    <section className="bg-white pb-14 sm:pb-20 lg:pb-28" aria-label="Keşifte ev sahibi ve usta">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#e8e8ed] md:aspect-[16/7]"><Image src="/images/marketing/hero-kesif.webp" alt="Bir boyacı ve ev sahibi, salon duvarını şerit metreyle birlikte ölçüyor" fill priority sizes="100vw" className="object-cover" /></div>
      <p className="mx-auto mt-3 w-full max-w-[1180px] px-5 text-[13px] text-[#6e6e73] sm:px-8 sm:text-sm lg:px-12">Keşifte duvarı birlikte ölçmek. Temsili görsel.</p>
    </section>

    <Band tone="gray" label="services-title">
      <div className="flex flex-wrap items-end justify-between gap-4"><Intro eyebrow="Popüler hizmetler" h="Evinin her işi için usta." id="services-title" /><Link href="/meslekler" className={`${textLink} inline-flex min-h-11 items-center gap-1`}>Tüm meslekler <ArrowRight size={17} aria-hidden="true" /></Link></div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.map(s => <li key={s.name} className="min-w-0"><Link href={s.slug ? `/usta-bul?category=${s.slug}` : "/usta-bul"} className="group block h-full overflow-hidden rounded-[20px] border border-[#d2d2d7] bg-white no-underline transition-colors duration-150 hover:border-[#075d54] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#075d54]">
        <span className="relative block aspect-[4/3] bg-[#e8e8ed]"><Image src={`/images/marketing/${s.image}.webp`} alt={s.alt} fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="object-cover" /></span>
        <span className="grid gap-0.5 p-5"><strong className="text-lg font-semibold text-[#1d1d1f]">{s.name}</strong><span className="text-[15px] text-[#515154]">{s.text}</span></span></Link></li>)}</ul>
      <p className="mt-5 text-sm text-[#6e6e73]">Hizmet görselleri temsilidir. Usta profillerinde ustaların kendi işleri yer alır.</p>
    </Band>

    <Band label="how-title" id="nasil-calisir">
      <Intro eyebrow="Nasıl çalışır" h="Aramadan randevuya üç adım." id="how-title" />
      <div className="mt-10"><Steps items={steps} /></div>
      <p className="mt-8"><Link href="/nasil-calisir" className={`${textLink} inline-flex min-h-11 items-center gap-1`}>Ayrıntılı anlatım <ArrowRight size={17} aria-hidden="true" /></Link></p>
    </Band>

    <Band tone="gray" label="trust-title">
      <Intro eyebrow="Güven" h="Kime kapını açtığını bil." id="trust-title" />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{trust.map(({ icon: Icon, title: t, text }) => <li key={t} className={`${tile} p-6`}><span className="grid size-11 place-items-center rounded-full bg-[#e4f0ed] text-[#075d54]"><Icon size={22} aria-hidden="true" /></span><h3 className={`mt-5 text-xl font-semibold leading-[1.25] tracking-[-.02em] text-[#1d1d1f]`}>{t}</h3><p className="mt-3 leading-[1.55] text-[#515154]">{text}</p></li>)}</ul>
      <p className="mt-8"><Link href="/guvenli-hizmet" className={`${textLink} inline-flex min-h-11 items-center gap-1`}>Güvenli hizmet <ArrowRight size={17} aria-hidden="true" /></Link></p>
    </Band>

    <Band label="pro-title" id="usta-paneli">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="min-w-0"><Intro eyebrow="Ustalar için" h="Teklifini hesapla, müşterine düzenli gönder." id="pro-title" text="Profilini yayınla, bölgendeki taleplere teklif ver. Malzeme, işçilik ve kâr hesabın aynı yerde olsun." />
          <div className="mt-8 flex flex-wrap gap-3"><Link className={pillPrimary} href="/ustalar-icin">Ustalar için <ArrowRight size={17} aria-hidden="true" /></Link><Link className={pillSecondary} href="/hesaplama-araclari/kar-marji">Kâr marjı hesapla</Link></div></div>
        <Photo src="/images/marketing/usta-teklif.webp" alt="Şantiyede telefonuyla teklif hazırlayan bir usta" sizes="(min-width: 1024px) 540px, 100vw" caption="Sahada teklif hazırlamak. Temsili görsel." />
      </div>
    </Band>

    <Band tone="gray" label="faq-title"><div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16"><h2 id="faq-title" className={headline}>Aklındaki sorular.</h2>
      <div className="grid min-w-0 gap-3">{faqs.map(({ q, a }) => <details key={q} className="group rounded-[20px] border border-[#d2d2d7] bg-white px-6"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold text-[#1d1d1f] marker:content-none focus-visible:outline-[3px] focus-visible:outline-[#075d54] [&::-webkit-details-marker]:hidden"><span className="min-w-0">{q}</span><span aria-hidden="true" className="text-2xl leading-none text-[#075d54] transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none">+</span></summary><p className="pb-5 leading-[1.6] text-[#515154]">{a}</p></details>)}</div></div>
    </Band>

    <CtaBand id="final-title" h="İşini anlat, ustalar sana yazsın." text="Bir kez yaz, bölgendeki ustalardan teklif topla. Müşteriler için ücretsiz."><Link className={ctaLight} href="/talepler/yeni">İş ilanı ver <ArrowRight size={17} aria-hidden="true" /></Link><Link className={ctaGhost} href="/usta-bul">Usta bul</Link></CtaBand>
  </>;
}

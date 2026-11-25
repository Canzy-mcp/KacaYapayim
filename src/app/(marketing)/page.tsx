import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, Lock, Search, ShieldCheck, Flag } from "lucide-react";
import { LiveIsland } from "@/components/marketing/live-island";
import { graph, JsonLd, organizationId, siteMetadata, siteOrigin, webPageNode } from "@/lib/marketing/seo";
import { Band, CtaBand, Eyebrow, Intro, Photo, Steps, ctaGhost, ctaLight, display, headline, lead, pillPrimary, pillSecondary, textLink, tile } from "@/components/marketing/acquisition/parts";

export const metadata: Metadata = {
  ...siteMetadata("Kaça Yapayım: usta bul, teklif al", "Kaça Yapayım (KaçaYapayım) ile işin için usta bul veya ilan açıp teklif al. Ustalar için maliyet hesabı, profesyonel teklifler ve iş takibi.", "/"),
  title: { absolute: "Kaça Yapayım: usta bul, teklif al | KaçaYapayım" },
};

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
  { q: "Usta olarak nasıl katılırım?", a: "Hesap aç, hizmet alanını ve bölgeni ekle. Profilini yayınlamak ve teklif vermek için tek seferlik 199 ₺ usta üyeliği gerekir; abonelik yok, üyelik süresiz. Teklif ve maliyet araçları aynı hesapta." },
] as const;
const field = "h-12 w-full min-w-0 rounded-lg border border-line-strong bg-surface px-3.5 text-[16px] text-ink outline-none transition-shadow placeholder:text-subtle focus:border-primary focus:ring-4 focus:ring-primary/15";
const fieldLabel = "text-[13px] font-bold text-ink-2";
const faqPairs = faqs.map(f => [f.q, f.a] as const);

export default function Home() {
  return <>
    <JsonLd data={graph(
      webPageNode({ path: "/", name: "KaçaYapayım: usta bul, teklif al", description: "İşin için usta bul veya ilan açıp teklif al.", hasBreadcrumb: false }),
      { "@type": "WebApplication", "@id": `${siteOrigin}/#webapp`, name: "KaçaYapayım", applicationCategory: "BusinessApplication", operatingSystem: "Web", description: "Usta arama, iş ilanı, teklif ve iş yönetimi uygulaması.", url: siteOrigin, publisher: { "@id": organizationId } },
      { "@type": "FAQPage", "@id": `${siteOrigin}/#faq`, inLanguage: "tr-TR", mainEntity: faqPairs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    )} />

    <section className="border-b border-line-strong bg-canvas" aria-labelledby="hero-title">
      <div className="mx-auto grid w-full min-w-0 max-w-[1180px] items-center gap-12 px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-16 lg:px-12 lg:pb-24 lg:pt-20">
        <div className="min-w-0">
          <Eyebrow>Mahallendeki ustalar</Eyebrow>
          <h1 id="hero-title" className={`mt-5 ${display}`}>Doğru ustayı bul, işini <span className="whitespace-nowrap bg-[linear-gradient(transparent_60%,var(--color-tape)_60%,var(--color-tape)_92%,transparent_92%)] px-1 [box-decoration-break:clone]">rahat</span> teslim et.</h1>
          <p className={`mt-6 max-w-[44ch] ${lead}`}>Hizmeti ve ilçeni seç, ustaların profillerine bak, tek talepte teklif al.</p>
          <form action="/usta-bul" method="get" aria-label="Usta ara" className="mt-8 grid gap-3 rounded-xl border border-line-strong bg-surface p-4 shadow-card sm:grid-cols-2 sm:p-5">
            <div className="grid min-w-0 gap-1.5 sm:col-span-2"><label htmlFor="home-category" className={fieldLabel}>Hizmet</label>
              <select id="home-category" name="category" defaultValue="" className={field}><option value="">Tüm hizmetler</option>{categories.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}</select></div>
            <div className="grid min-w-0 gap-1.5"><label htmlFor="home-city" className={fieldLabel}>İl</label>
              <input id="home-city" name="city" type="text" placeholder="İstanbul" maxLength={80} autoComplete="address-level1" className={field} /></div>
            <div className="grid min-w-0 gap-1.5"><label htmlFor="home-district" className={fieldLabel}>İlçe</label>
              <input id="home-district" name="district" type="text" placeholder="Kadıköy" maxLength={80} autoComplete="address-level2" className={field} /></div>
            <button type="submit" className={`${pillPrimary} sm:col-span-2`}><Search size={18} aria-hidden="true" />Usta bul</button>
          </form>
          <p className="mt-4 text-[15px] text-muted">Ne aradığından emin değil misin? <Link href="/talepler/yeni" className={textLink}>İş ilanı ver</Link>, teklifler sana gelsin.</p>
          <ul className="mt-8 grid gap-2 border-t border-line-strong pt-6 text-[14px] font-medium text-ink-2 sm:flex sm:flex-wrap sm:gap-x-6">{["Müşteriler için ücretsiz", "Adresin yalnız seçtiğin ustaya", "Yorumlar tamamlanan işten"].map(t => <li key={t} className="flex items-center gap-2"><BadgeCheck size={17} className="text-success" aria-hidden="true" />{t}</li>)}</ul>
        </div>
        <figure className="m-0 min-w-0"><div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line-strong bg-neutral-soft sm:aspect-[4/3] lg:aspect-square"><Image src="/images/marketing/hero-kesif.webp" alt="Bir boyacı ve ev sahibi, salon duvarını şerit metreyle birlikte ölçüyor" fill priority sizes="(min-width: 1024px) 520px, 100vw" className="object-cover object-[78%_50%]" /><LiveIsland /></div>
          <div aria-hidden="true" className="absolute -bottom-6 left-4 right-4 rounded-lg border border-line-strong bg-surface p-4 shadow-float sm:left-auto sm:right-6 sm:w-[290px] lg:-left-10 lg:right-auto">
            <div className="flex items-center justify-between"><span className="text-[13px] font-bold text-ink">Salon boyası · Kadıköy</span><span className="rounded-md bg-tape px-2 py-0.5 text-[12px] font-bold text-ink">3 teklif</span></div>
            <div className="mt-3 divide-y divide-line">{[["Usta A · 4,9 ★", "18.200 ₺"], ["Usta B · 4,8 ★", "19.500 ₺"]].map(([n, p]) => <div key={n} className="flex items-center justify-between py-2 text-[13px]"><span className="text-ink-2">{n}</span><span className="font-bold text-ink tabular-nums">{p}</span></div>)}</div>
          </div>
          </div>
          <figcaption className="mt-10 text-[13px] text-muted lg:text-right">Keşifte duvarı birlikte ölçmek. Görsel ve teklif kartı temsilidir.</figcaption>
        </figure>
      </div>
    </section>


    <Band tone="gray" label="services-title">
      <div className="flex flex-wrap items-end justify-between gap-4"><Intro eyebrow="Popüler hizmetler" h="Evinin her işi için usta." id="services-title" /><Link href="/meslekler" className={`${textLink} inline-flex min-h-11 items-center gap-1`}>Tüm meslekler <ArrowRight size={17} aria-hidden="true" /></Link></div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.map(s => <li key={s.name} className="min-w-0"><Link href={s.slug ? `/usta-bul?category=${s.slug}` : "/usta-bul"} className="group block h-full overflow-hidden rounded-xl border border-line bg-surface no-underline shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <span className="relative block aspect-[16/10] overflow-hidden bg-neutral-soft"><Image src={`/images/marketing/${s.image}.webp`} alt={s.alt} fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /></span>
        <span className="flex items-center justify-between gap-3 p-5"><span className="grid gap-0.5"><strong className="text-[17px] font-semibold text-ink">{s.name}</strong><span className="text-[14px] text-muted">{s.text}</span></span><ArrowRight size={18} aria-hidden="true" className="shrink-0 text-subtle transition-colors group-hover:text-primary" /></span></Link></li>)}</ul>
      <p className="mt-5 text-sm text-muted">Hizmet görselleri temsilidir. Usta profillerinde ustaların kendi işleri yer alır.</p>
    </Band>

    <Band label="how-title" id="nasil-calisir">
      <Intro eyebrow="Nasıl çalışır" h="Aramadan randevuya üç adım." id="how-title" />
      <div className="mt-10"><Steps items={steps} /></div>
      <p className="mt-8"><Link href="/nasil-calisir" className={`${textLink} inline-flex min-h-11 items-center gap-1`}>Ayrıntılı anlatım <ArrowRight size={17} aria-hidden="true" /></Link></p>
    </Band>

    <Band tone="gray" label="trust-title">
      <Intro eyebrow="Güven" h="Kime kapını açtığını bil." id="trust-title" />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{trust.map(({ icon: Icon, title: t, text }) => <li key={t} className={`${tile} p-6`}><span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary"><Icon size={20} aria-hidden="true" /></span><h3 className="mt-5 text-[17px] font-semibold leading-[1.3] tracking-heading text-ink">{t}</h3><p className="mt-2 text-[15px] leading-[1.6] text-muted">{text}</p></li>)}</ul>
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
      <div className="grid min-w-0 gap-3">{faqs.map(({ q, a }) => <details key={q} className="group rounded-xl border border-line bg-surface px-5 shadow-xs open:border-line-strong sm:px-6"><summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-semibold text-ink marker:content-none focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden"><span className="min-w-0">{q}</span><span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-md bg-neutral-soft text-lg leading-none text-ink-2 transition-transform duration-150 group-open:rotate-45 motion-reduce:transition-none">+</span></summary><p className="pb-5 leading-[1.65] text-ink-2">{a}</p></details>)}</div></div>
    </Band>

    <CtaBand id="final-title" h="İşini anlat, ustalar sana yazsın." text="Bir kez yaz, bölgendeki ustalardan teklif topla. Müşteriler için ücretsiz."><Link className={ctaLight} href="/talepler/yeni">İş ilanı ver <ArrowRight size={17} aria-hidden="true" /></Link><Link className={ctaGhost} href="/usta-bul">Usta bul</Link></CtaBand>
  </>;
}

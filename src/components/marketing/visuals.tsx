import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, PaintRoller, PlugZap, Wrench, Wind } from "lucide-react";
import { professions } from "@/lib/marketing/content";

export const professionVisuals: Record<string, { image: string; alt: string; icon: typeof Wrench; detail: string }> = {
  boyaci: { image: "painter", alt: "Boyama sahasında telefonundan iş hesabına bakan usta; temsili görsel", icon: PaintRoller, detail: "Boya, astar, tavan, işçilik" },
  elektrikci: { image: "electrician", alt: "Atölyede elektrik panosunu kontrol eden elektrikçi; temsili görsel", icon: PlugZap, detail: "Kablo, priz, sigorta, iş günü" },
  tesisatci: { image: "plumber", alt: "Lavabo tesisatı için boru ölçen tesisatçı; temsili görsel", icon: Wrench, detail: "Boru, bağlantı, montaj, yol" },
  klimaci: { image: "hvac", alt: "Klima iç ünitesini kontrol eden teknisyen; temsili görsel", icon: Wind, detail: "Bakır boru, montaj, sarf, işçilik" },
};

export function HeroVisual() {
  return <figure className="hero-scene">
    <div className="hero-photo"><Image src="/images/marketing/plumber.webp" alt={professionVisuals.tesisatci.alt}
      fill priority sizes="(min-width: 1024px) 530px, (min-width: 640px) 650px, 100vw" /></div>
    <Link href="/usta-bul?category=tesisat" className="absolute bottom-4 left-1/2 flex min-h-14 w-[min(380px,calc(100%-32px))] -translate-x-1/2 items-center gap-3 rounded-full bg-white/75 p-2 pr-5 text-left text-[15px] font-medium text-[#1d1d1f] shadow-[0_8px_30px_rgba(0,0,0,.15)] backdrop-blur-xl backdrop-saturate-150 transition-colors hover:bg-white/90 sm:bottom-6">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#0071e3] text-white"><Wrench size={19} aria-hidden="true" /></span>
      Su tesisatçılarını gör <ArrowUpRight size={19} className="ml-auto shrink-0" aria-hidden="true" />
    </Link>
  </figure>;
}

export function ProfessionCards({ spacious = false }: { spacious?: boolean }) {
  return <div className={`profession-grid ${spacious ? "profession-grid-spacious" : ""}`}>
    {professions.map(profession => { const visual = professionVisuals[profession.slug]; const Icon = visual.icon;
      return <Link href={`/meslekler/${profession.slug}`} className="profession-visual-card" key={profession.slug} data-reveal>
        <div className={`profession-photo profession-photo-${profession.slug}`}><Image src={`/images/marketing/${visual.image}.webp`}
          alt={visual.alt} fill sizes={spacious ? "(min-width: 768px) 560px, 100vw" : "(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"} />
          <span className="profession-icon"><Icon size={20} aria-hidden="true" /></span></div>
        <div className="profession-card-copy"><div><h3>{profession.name}</h3><ArrowUpRight size={19} aria-hidden="true" /></div>
          <p>{profession.short}</p><span>{visual.detail}</span></div>
      </Link>;
    })}
  </div>;
}

export function DeviceShowcase() {
  return <figure className="device-scene" data-reveal>
    <div className="laptop-frame"><div className="browser-chrome" aria-hidden="true"><i/><i/><i/><span>KaçaYapayım · İşletme özeti</span></div>
      <Image src="/images/marketing/dashboard-demo-logo.jpg" alt="KaçaYapayım demo dashboard: teklifler, devam eden işler ve gerçek kâr özeti" width={1425} height={846} sizes="(min-width: 1024px) 780px, 90vw" />
    </div><div className="laptop-base" aria-hidden="true" />
    <div className="phone-frame"><div className="phone-speaker" aria-hidden="true" />
      <Image src="/images/marketing/mobile-quote-demo-logo.jpg" alt="Telefon ekranında salon ve koridor boyama teklifinin mobil web önizlemesi" width={375} height={811} sizes="(min-width: 640px) 190px, 130px" /></div>
    <figcaption>Gerçek demo ekranları · Örnek veriler · Telefon görüntüsü mobil web deneyimidir.</figcaption>
  </figure>;
}



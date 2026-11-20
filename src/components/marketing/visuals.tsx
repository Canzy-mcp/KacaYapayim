import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, PaintRoller, PlugZap, Wrench, Wind } from "lucide-react";
import { professions } from "@/lib/marketing/content";

export const professionVisuals: Record<string, { image: string; alt: string; icon: typeof Wrench; detail: string }> = {
  boyaci: { image: "painter", alt: "Boya rulosunun maskelenmiş süpürgeliğin üstünde taze bir kenar çekmesi; temsili görsel", icon: PaintRoller, detail: "Boya, astar, tavan, işçilik" },
  elektrikci: { image: "electrician", alt: "Kapalı bir sigorta panosunu etiketleyen elektrikçinin elleri; temsili görsel", icon: PlugZap, detail: "Kablo, priz, sigorta, iş günü" },
  tesisatci: { image: "plumber", alt: "Mutfak dolabının içinde lavabo sifonunu takan eller; temsili görsel", icon: Wrench, detail: "Boru, bağlantı, montaj, yol" },
  klimaci: { image: "hvac", alt: "Balkon kapısının yanında split klimanın filtresini çıkaran teknisyen; temsili görsel", icon: Wind, detail: "Bakır boru, montaj, sarf, işçilik" },
};

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

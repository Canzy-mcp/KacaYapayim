import { Check, Circle } from "lucide-react";
import type { MarketProviderSettings } from "@kacayapayim/core/marketplace";
import { profileChecklist } from "@/lib/marketplace/profile-completeness";

// Place above the profile form: <ProfileCompleteness profile={settings.profile} />
export function ProfileCompleteness({ profile }: { profile: MarketProviderSettings["profile"] }) {
  const items = profileChecklist(profile);
  const done = items.filter((item) => item.done).length;
  return <section aria-labelledby="profile-completeness" className="mb-5 rounded-[20px] border border-[#d2d2d7] bg-[#f5f5f7] p-5">
    <h3 id="profile-completeness" className="flex flex-wrap items-baseline justify-between gap-2 text-base font-semibold text-[#1d1d1f]">Profil durumu <span className="text-sm font-medium text-[#515154]">{done} / {items.length} tamam</span></h3>
    <ul className="mt-3 grid gap-2">{items.map((item) => <li key={item.key} className="flex items-start gap-2.5 text-sm">
      {item.done ? <Check size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-[#075d54]" /> : <Circle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-[#6e6e73]" />}
      <span className="min-w-0"><span className="font-medium text-[#1d1d1f]">{item.label}</span><span className="sr-only">{item.done ? ", tamam" : ", eksik"}</span>
        {!item.done && <span className="block text-[#515154]">{item.hint}</span>}</span>
    </li>)}</ul>
  </section>;
}

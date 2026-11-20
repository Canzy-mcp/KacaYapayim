import type { MarketProviderSettings } from "@kacayapayim/core/marketplace";

export const minBioLength = 120;

export type ChecklistItem = { key: string; label: string; hint: string; done: boolean };

export function profileChecklist(profile: MarketProviderSettings["profile"]): ChecklistItem[] {
  const bio = Array.from((profile?.bio ?? "").trim()).length;
  return [
    { key: "category", label: "Hizmet kategorisi", hint: "En az bir hizmet seç.", done: !!profile?.categories.length },
    { key: "city", label: "Hizmet ili", hint: "Çalıştığın ili yaz.", done: !!profile?.city?.trim() },
    { key: "districts", label: "İlçe kapsamı", hint: "Çalıştığın ilçeleri ekle. Boş bırakırsan ilin tamamı görünür.", done: !!profile?.districts.length },
    { key: "bio", label: `En az ${minBioLength} karakter tanıtım`, hint: bio ? `Şu an ${bio} karakter var.` : "Deneyimini ve yaptığın işleri anlat.", done: bio >= minBioLength },
    { key: "published", label: "Rehberde yayında", hint: "Profili yayınlayınca yeni talepler alırsın.", done: !!profile?.published && !profile.suspended },
  ];
}

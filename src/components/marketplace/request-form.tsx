import { randomUUID } from "node:crypto";
import type { MarketCategory, MarketDetail, MarketProvider } from "@kacayapayim/core/marketplace";
import { MarketForm } from "./form";
import { CategoryOptions, input } from "./ui";

export function RequestForm({ categories, provider, existing }: {
  categories: MarketCategory[]; provider?: MarketProvider; existing?: MarketDetail["request"];
}) {
  const matching = provider ? categories.filter((item) => provider.categories.includes(item.slug)) : categories;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", dateStyle: "short" }).format(new Date());
  return <MarketForm action={existing ? "edit" : "create"} fields={{ id: existing?.id ?? randomUUID(), provider: provider?.id }}
    label={existing ? "Değişiklikleri kaydet" : provider ? "Ustaya çağrı gönder" : "İlanı yayımla"}>
    <label className="grid gap-1.5 text-sm font-medium">Hizmet kategorisi<select className={input} name="category" required defaultValue={existing?.category ?? (matching.length === 1 ? matching[0].slug : "")}>
      <option value="" disabled>Hizmet seç</option><CategoryOptions categories={matching} />
    </select></label>
    <label className="grid gap-1.5 text-sm font-medium">İşin başlığı<input className={input} name="title" required minLength={5} maxLength={120} defaultValue={existing?.title} placeholder="Örn. Mutfak musluğu değişimi" /></label>
    <label className="grid gap-1.5 text-sm font-medium">İşin açıklaması<textarea className={input} rows={5} name="body" required minLength={15} maxLength={3000} defaultValue={existing?.description} placeholder="Yapılacak işi, ölçüleri ve varsa malzeme ihtiyacını yaz." /><span className="font-normal text-slate-600">Açıklamaya telefon veya açık adres ekleme.</span></label>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm font-medium">İl<input className={input} name="city" required minLength={2} maxLength={80} defaultValue={provider?.city ?? existing?.city} readOnly={!!provider} /></label>
      <label className="grid gap-1.5 text-sm font-medium">İlçe{provider?.districts.length ?
        <select className={input} name="district" required defaultValue={provider.districts.length === 1 ? provider.districts[0] : ""}><option value="" disabled>İlçe seç</option>{provider.districts.map((district) => <option key={district}>{district}</option>)}</select>
        : <input className={input} name="district" required minLength={2} maxLength={80} defaultValue={existing?.district} />}</label>
      <label className="grid gap-1.5 text-sm font-medium">Tercih edilen gün <span className="font-normal text-slate-500">(isteğe bağlı)</span><input type="date" className={input} name="date" min={today} defaultValue={existing?.preferred_date ?? undefined} /></label>
      <label className="grid gap-1.5 text-sm font-medium">Bütçe (₺) <span className="font-normal text-slate-500">(isteğe bağlı)</span><input type="number" step="0.01" min="0.01" max="9999999999.99" className={input} name="amount" defaultValue={existing?.budget ?? undefined} /></label>
    </div>
    <label className="grid gap-1.5 text-sm font-medium">Açık adres <span className="font-normal text-slate-500">(isteğe bağlı ve özel)</span><textarea className={input} name="address" rows={2} maxLength={500} defaultValue={existing?.address ?? undefined} /><span className="font-normal text-slate-600">Adresini, teklif kabulünden sonra seçtiğin ustayla paylaşabilirsin.</span></label>
  </MarketForm>;
}

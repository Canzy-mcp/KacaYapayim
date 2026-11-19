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
    <div className="grid gap-1.5 text-sm font-medium"><label htmlFor="request-category">Hizmet kategorisi</label><select id="request-category" className={input} name="category" required defaultValue={existing?.category ?? (matching.length === 1 ? matching[0].slug : "")}>
      <option value="" disabled>Hizmet seç</option><CategoryOptions categories={matching} />
    </select></div>
    <label className="grid gap-1.5 text-sm font-medium">İşin başlığı<input className={input} name="title" required minLength={5} maxLength={120} defaultValue={existing?.title} placeholder="Örn. Mutfak musluğu değişimi" /></label>
    <div className="grid gap-1.5 text-sm font-medium"><label htmlFor="request-description">İşin açıklaması</label><textarea id="request-description" aria-describedby="request-description-hint" className={input} rows={5} name="body" required minLength={15} maxLength={3000} defaultValue={existing?.description} placeholder="Yapılacak işi, ölçüleri ve varsa malzeme ihtiyacını yaz." /><p id="request-description-hint" className="font-normal text-slate-600">Telefon ve açık adresini bu alana yazma.</p></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1.5 text-sm font-medium">İl<input className={input} name="city" autoComplete="address-level1" required minLength={2} maxLength={80} defaultValue={provider?.city ?? existing?.city} readOnly={!!provider} /></label>
      <div className="grid gap-1.5 text-sm font-medium"><label htmlFor="request-district">İlçe</label>{provider?.districts.length ?
        <select id="request-district" className={input} name="district" autoComplete="address-level2" required defaultValue={provider.districts.length === 1 ? provider.districts[0] : ""}><option value="" disabled>İlçe seç</option>{provider.districts.map((district) => <option key={district}>{district}</option>)}</select>
        : <input id="request-district" className={input} name="district" autoComplete="address-level2" required minLength={2} maxLength={80} defaultValue={existing?.district} />}</div>
      <label className="grid gap-1.5 text-sm font-medium"><span>Tercih edilen gün <span className="font-normal text-slate-600">(isteğe bağlı)</span></span><input type="date" className={input} name="date" min={today} defaultValue={existing?.preferred_date ?? undefined} /></label>
      <label className="grid gap-1.5 text-sm font-medium"><span>Bütçe (₺) <span className="font-normal text-slate-600">(isteğe bağlı)</span></span><input type="number" inputMode="decimal" step="0.01" min="0.01" max="9999999999.99" className={input} name="amount" defaultValue={existing?.budget ?? undefined} /></label>
    </div>
    <div className="grid gap-1.5 text-sm font-medium"><label htmlFor="request-address">Açık adres <span className="font-normal text-slate-600">(isteğe bağlı)</span></label><textarea id="request-address" aria-describedby="request-address-hint" className={input} name="address" autoComplete="street-address" rows={2} maxLength={500} defaultValue={existing?.address ?? undefined} /><p id="request-address-hint" className="font-normal text-slate-600">Adresini, teklif kabulünden sonra seçtiğin ustayla paylaşabilirsin.</p></div>
  </MarketForm>;
}

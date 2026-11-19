import { validMarketId, type MarketAction } from "@kacayapayim/core/marketplace";

type Payload = Record<string, string | string[] | boolean>;
type Parsed = { payload: Payload; error?: never } | { error: string; payload?: never };

const textFields = ["id", "provider", "category", "title", "body", "city", "district", "address", "date", "amount",
  "offer", "version", "at", "rating", "decision"] as const;
const optionalIdActions = new Set<MarketAction>(["profile", "favorite", "unfavorite", "mark_read", "report"]);
const categorySlug = /^[a-z0-9-]{1,80}$/;
const currency = /^\d{1,10}(?:\.\d{1,2})?$/;
const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/i;
const calendarDate = /^\d{4}-\d{2}-\d{2}$/;
const appointmentTime = /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d$/;

function isCalendarDate(value: string) {
  if (!calendarDate.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().startsWith(value);
}

function lengthIs(value: string, min: number, max: number) {
  const length = Array.from(value).length;
  return length >= min && length <= max;
}

export function parseMarketForm(action: MarketAction, form: FormData): Parsed {
  const values = Object.fromEntries(textFields.flatMap((field) => {
    const value = form.get(field);
    return typeof value === "string" ? [[field, value.trim()]] : [];
  })) as Partial<Record<typeof textFields[number], string>>;
  const { id, provider, category, title = "", body = "", city = "", district = "", address = "", date,
    offer, version, at, rating, decision } = values;
  const amount = values.amount?.replace(",", ".");

  if ((!optionalIdActions.has(action) || id !== undefined) && !validMarketId(id) ||
    provider !== undefined && !validMarketId(provider)) return { error: "Talep veya usta bilgisi geçersiz. Sayfayı yenileyip tekrar dene." };

  switch (action) {
    case "create":
    case "edit":
      if (!category || !categorySlug.test(category)) return { error: "Bir hizmet kategorisi seç." };
      if (!lengthIs(title, 5, 120)) return { error: "İşin başlığı 5 ile 120 karakter arasında olmalı." };
      if (!lengthIs(body, 15, 3000)) return { error: "İşin açıklaması 15 ile 3000 karakter arasında olmalı." };
      if (!lengthIs(city, 2, 80) || !lengthIs(district, 2, 80)) return { error: "İl ve ilçeyi 2 ile 80 karakter arasında gir." };
      if (date && !isCalendarDate(date)) return { error: "Geçerli bir gün seç." };
      if (amount && (!currency.test(amount) || Number(amount) <= 0)) return { error: "Bütçe sıfırdan büyük ve en çok iki ondalık basamaklı olmalı." };
      if (!lengthIs(address, 0, 500)) return { error: "Açık adres en fazla 500 karakter olabilir." };
      return { payload: { id: id!, category, title, body, city, district, address, date: date ?? "", amount: amount ?? "",
        ...(action === "create" && provider ? { provider } : {}) } };
    case "profile": {
      const categories = [...new Set(form.getAll("categories").filter((value): value is string => typeof value === "string"))];
      const rawDistricts = form.get("districts");
      const districts = [...new Set(typeof rawDistricts === "string" ? rawDistricts.split(",").map((value) => value.trim()).filter(Boolean) : [])];
      if (!lengthIs(title, 2, 120)) return { error: "Görünen ad 2 ile 120 karakter arasında olmalı." };
      if (!lengthIs(body, 0, 1600)) return { error: "Profil tanıtımı en fazla 1600 karakter olabilir." };
      if (!lengthIs(city, 2, 80)) return { error: "Hizmet ilini 2 ile 80 karakter arasında gir." };
      if (!categories.length || categories.length > 17 || categories.some((entry) => !categorySlug.test(entry))) return { error: "En az bir geçerli hizmet seç." };
      if (districts.length > 20 || districts.some((entry) => !lengthIs(entry, 2, 80))) return { error: "En fazla 20 ilçe gir. Her ilçe adı 2 ile 80 karakter arasında olmalı." };
      return { payload: { title, body, city, categories, districts, published: form.get("published") === "on" } };
    }
    case "offer":
      if (!amount || !currency.test(amount) || Number(amount) <= 0) return { error: "Fiyat sıfırdan büyük ve en çok iki ondalık basamaklı olmalı." };
      if (!lengthIs(body, 5, 1600)) return { error: "Teklifin kapsamını 5 ile 1600 karakter arasında yaz." };
      return { payload: { id: id!, amount, body } };
    case "award":
      if (!validMarketId(offer) || !version || !timestamp.test(version)) return { error: "Teklif bilgisi değişmiş olabilir. Sayfayı yenileyip tekrar dene." };
      return { payload: { id: id!, offer, version } };
    case "appointment": {
      const day = at ? appointmentTime.exec(at)?.[1] : undefined;
      if (!at || !day || !isCalendarDate(day)) return { error: "Randevu için geçerli bir gün ve saat seç." };
      return { payload: { id: id!, at } };
    }
    case "confirm_appointment":
      if (!version || !timestamp.test(version)) return { error: "Randevu bilgisi değişmiş olabilir. Sayfayı yenileyip tekrar dene." };
      return { payload: { id: id!, version } };
    case "address": {
      const share = form.get("share") === "on";
      if (!lengthIs(body, share ? 5 : 0, 500)) return { error: share ? "Paylaşacağın adres 5 ile 500 karakter arasında olmalı." : "Açık adres en fazla 500 karakter olabilir." };
      return { payload: { id: id!, body, share } };
    }
    case "message":
      if (!provider || !lengthIs(body, 1, 1600)) return { error: "Mesajını 1 ile 1600 karakter arasında yaz." };
      return { payload: { id: id!, provider, body } };
    case "review":
      if (!rating || !/^[1-5]$/.test(rating)) return { error: "Değerlendirme puanını seç." };
      if (!lengthIs(body, 5, 1000)) return { error: "Deneyimini 5 ile 1000 karakter arasında anlat." };
      return { payload: { id: id!, rating, body } };
    case "favorite":
    case "unfavorite":
      return provider ? { payload: { provider } } : { error: "Usta bilgisi bulunamadı. Sayfayı yenileyip tekrar dene." };
    case "mark_read":
      return { payload: id ? { id } : {} };
    case "report":
      if (!id && !provider) return { error: "Bildirilecek talep veya usta bulunamadı." };
      if (!lengthIs(body, 5, 1200)) return { error: "Bildirim nedenini 5 ile 1200 karakter arasında yaz." };
      return { payload: { body, ...(id ? { id } : {}), ...(provider ? { provider } : {}) } };
    case "moderate":
      if (!decision || !["suspend", "restore", "hide_review", "resolve", "dismiss"].includes(decision)) return { error: "Geçerli bir inceleme işlemi seç." };
      return { payload: { id: id!, decision } };
    case "withdraw":
    case "start":
    case "finish":
    case "complete":
    case "reopen":
    case "cancel":
    case "decline":
      return { payload: { id: id! } };
    default:
      return { error: "Bu hizmet işlemi tanınmadı." };
  }
}

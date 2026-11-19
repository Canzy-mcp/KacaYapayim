export type MarketCategory = { slug: string; name: string };
export type MarketProvider = {
  id: string; display_name: string; bio: string; city: string; districts: string[];
  categories: string[]; rating?: number | null; review_count?: number;
};
export type MarketReview = { rating: number; body: string; created_at: string };
export type MarketDirectory = { providers: MarketProvider[]; categories: MarketCategory[]; reviews: MarketReview[] };
export type MarketProviderSettings = {
  profile: (MarketProvider & { published: boolean; suspended: boolean }) | null;
  business: { name: string; city: string | null } | null;
};
export type MarketState = "open" | "awarded" | "in_progress" | "awaiting_completion" | "completed" | "cancelled";
export type MarketRequest = {
  id: string; title: string; category: string; city: string; district: string; state: MarketState;
  is_direct: boolean; created_at: string; preferred_date: string | null; budget: number | null; offer_count: number;
};
export type MarketOffer = {
  id: string; provider_id: string; display_name: string; amount: number; scope: string;
  state: "active" | "withdrawn" | "accepted" | "rejected"; updated_at: string;
};
export type MarketDetail = {
  request: Omit<MarketRequest, "offer_count"> & {
    description: string; target_id: string | null; winner_id: string | null; job_id: string | null;
    address: string | null; address_shared: boolean; appointment_at: string | null; appointment_confirmed: boolean;
    appointment_proposer: "customer" | "provider" | null;
  };
  is_customer: boolean; provider_id: string | null; provider_suspended: boolean;
  target_name: string | null; winner_name: string | null; offers: MarketOffer[]; has_review: boolean;
};
export type MarketMessage = { id: string; provider_id: string; display_name: string; sender: "customer" | "provider"; body: string; created_at: string };
export type MarketNotice = { id: string; request_id: string; event: string; title: string; read_at: string | null; created_at: string };
export type MarketModerationAction = "suspend" | "restore" | "hide_review" | "resolve" | "dismiss";
export type MarketReport = {
  id: string; provider_id: string | null; request_id: string | null; display_name: string | null;
  title: string | null; suspended: boolean | null; reason: string; state: "open" | "resolved" | "dismissed"; created_at: string;
  can_hide_review: boolean;
  latest_action?: MarketModerationAction | null;
  latest_action_at?: string | null;
};
export type MarketViews = {
  provider: MarketProviderSettings; favorite: boolean; favorites: MarketProvider[]; notices: MarketNotice[]; moderation: MarketReport[];
  own: MarketRequest[]; feed: MarketRequest[]; work: MarketRequest[]; detail: MarketDetail | null; thread: MarketMessage[];
};
export type MarketAction = "profile" | "create" | "edit" | "favorite" | "unfavorite" | "mark_read" | "report" | "moderate" |
  "offer" | "withdraw" | "award" | "message" | "address" | "appointment" | "confirm_appointment" |
  "start" | "finish" | "complete" | "reopen" | "cancel" | "review" | "decline";

export const marketStateLabels: Record<MarketState, string> = {
  open: "Teklif bekliyor", awarded: "Usta seçildi", in_progress: "İş devam ediyor",
  awaiting_completion: "Tamamlama onayı bekliyor", completed: "Tamamlandı", cancelled: "İptal edildi",
};
export const marketOfferLabels: Record<MarketOffer["state"], string> = {
  active: "Bekliyor", withdrawn: "Geri çekildi", accepted: "Kabul edildi", rejected: "Seçilmedi",
};
export const marketNoticeLabels: Record<string, string> = {
  direct: "Yeni doğrudan çağrı", offer: "Yeni veya güncellenen teklif", withdraw: "Teklif geri çekildi",
  award: "Teklifin kabul edildi", not_selected: "Müşteri başka bir teklif seçti", message: "Yeni mesaj",
  address: "Adres paylaşımı güncellendi", appointment: "Yeni randevu önerisi",
  confirm_appointment: "Randevu onaylandı", start: "İş başladı", finish: "Usta işin tamamlandığını bildirdi",
  complete: "Müşteri işi onayladı", reopen: "Müşteri işin yeniden açılmasını istedi",
  cancel: "Talep iptal edildi", decline: "Usta çağrıyı reddetti", review: "Yeni değerlendirme",
};

export function marketError(message: string) {
  if (message.includes("MARKET_RATE")) return "İşlem sınırına ulaştın. Açık taleplerini kontrol et veya daha sonra tekrar dene.";
  if (message.includes("MARKET_STALE")) return "Bilgiler değişti. Sayfayı yenileyip son durumu kontrol et.";
  if (message.includes("MARKET_AUTH") || message.includes("MFA")) return "İşleme devam etmek için hesabına yeniden giriş yap.";
  if (message.includes("MARKET_ACCESS") || message.includes("MARKET_STATE")) return "Talebin mevcut durumunda bu işlem yapılamıyor.";
  if (message.includes("MARKET_UNAVAILABLE")) return "Bu usta veya işlem şu anda kullanılamıyor. Hizmet bölgesini ve talebi kontrol et.";
  if (message.includes("MARKET_CONFLICT")) return "Bu saat ustanın başka bir randevusuyla çakışıyor. Yeni bir saat öner.";
  return "İşlem kaydedilemedi. Girdiğin bilgileri kontrol edip tekrar dene.";
}

export function validMarketId(value: unknown): value is string {
  return typeof value === "string" && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value);
}

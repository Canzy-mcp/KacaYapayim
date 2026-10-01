import type { CustomerQuotePreview } from "@/lib/quotes/public-preview";

export const demoCustomers = [
  { id: "ayse", name: "Ayşe Demir", company: "", phone: "05xx xxx xx 42", city: "İstanbul", status: "Aktif", jobs: 2 },
  { id: "mert", name: "Mert Yılmaz", company: "Yılmaz Mimarlık", phone: "05xx xxx xx 18", city: "İstanbul", status: "Aktif", jobs: 1 },
  { id: "selin", name: "Selin Kaya", company: "", phone: "05xx xxx xx 76", city: "Kocaeli", status: "Aktif", jobs: 1 },
];
export const demoQuotes = [
  { id: "salon", number: "KY-2026-0003", customer: "Ayşe Demir", title: "Salon ve koridor boya işi", amount: 42500, status: "Kabul edildi", tone: "green", date: "28 Eylül 2026" },
  { id: "ofis", number: "KY-2026-0002", customer: "Yılmaz Mimarlık", title: "Ofis iç cephe boyama", amount: 78000, status: "Görüntülendi", tone: "blue", date: "24 Eylül 2026" },
  { id: "daire", number: "KY-2026-0001", customer: "Selin Kaya", title: "2+1 daire boya teklifi", amount: 36500, status: "Hazır", tone: "neutral", date: "21 Eylül 2026" },
] as const;
export const demoQuotePreview: CustomerQuotePreview = {
  business: { name: "Örnek Boya Atölyesi", logoUrl: null, phone: "05xx xxx xx xx", city: "İstanbul" },
  customer: { name: "Ayşe Demir", companyName: null },
  quoteNumber: "KY-2026-0003", date: "2026-09-28", validUntil: "2026-10-05",
  title: "Salon ve koridor boya işi",
  description: "Duvar ve tavan yüzeylerinin hazırlanması, astarlanması ve iki kat boyanması.",
  items: [
    { name: "Yüzey hazırlığı", description: "Çatlakların onarılması ve yüzeylerin zımparalanması" },
    { name: "Duvar boyası", description: "Salon ve koridor duvarlarına iki kat boya" },
    { name: "Tavan boyası", description: "Tavan yüzeylerine iki kat boya" },
    { name: "Koruma ve temizlik", description: "Zemin ve mobilyaların korunması, iş sonu temizlik" },
  ],
  exclusions: ["Mobilya taşıma", "Elektrik tesisatı onarımı"],
  estimatedDuration: "3 iş günü", salePrice: 42500, currency: "TRY",
  paymentTerms: "İş başlangıcında %30, teslimde kalan tutar.", notes: "Renk seçimi işe başlamadan önce birlikte netleştirilir.",
  showBranding: true,
};

// Guide structure: groups by reader question, dates, sources and price tables. No external statistics.
export const guideGroups = [
  { id: "fiyat", question: "Teklif fiyatımı nasıl belirlerim?", intro: "Maliyetten hedef kâra giden hesabı ve en sık karıştırılan yüzdeleri açıklar.", slugs: ["kar-marji-nasil-hesaplanir", "teklif-fiyati-nasil-belirlenir", "markup-ve-marj-farki"] },
  { id: "maliyet", question: "Bir işin maliyeti neden oluşur?", intro: "Malzeme, işçilik, sarf ve yolu tek tek görmek için.", slugs: ["is-maliyeti-nasil-hesaplanir", "iscilik-maliyeti-nasil-hesaplanir"] },
  { id: "meslek", question: "Mesleğime göre nasıl hesaplarım?", intro: "Boya ve elektrik işlerinin kalemleriyle çalışılmış örnekler.", slugs: ["boyaci-teklifi-nasil-hazirlanir", "elektrik-isi-nasil-fiyatlandirilir"] },
  { id: "musteri", question: "Müşteriyle fiyat ve ödeme konusunda nasıl anlaşırım?", intro: "Ödeme koşulu, indirim sınırı ve ustalardan fiyat alma konuları.", slugs: ["teklifte-odeme-kosullari", "pazarlikta-ne-kadar-indirim", "usta-yaklasik-fiyat-nasil-alinir"] },
] as const;

export const guideDates: Record<string, { published: string; modified: string }> = Object.fromEntries(
  guideGroups.flatMap((g) => g.slugs).map((slug) => [slug, slug === "usta-yaklasik-fiyat-nasil-alinir" ? { published: "2026-11-20", modified: "2026-11-20" } : { published: "2026-09-30", modified: "2026-11-20" }]),
);

const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
export function formatDateTr(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

export type GuideSource = { label: string; url: string; note: string };
const methodology: GuideSource = { label: "KaçaYapayım hesaplama metodolojisi", url: "/metodoloji", note: "Formüller, yuvarlama kuralı ve varsayımlar." };
const tbk: GuideSource = { label: "6098 sayılı Türk Borçlar Kanunu, eser sözleşmesi (m. 470 ve devamı)", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.6098.pdf", note: "Bedel ve ödeme koşullarının sözleşmeyle belirlenmesine ilişkin hukuki çerçeve." };
export const guideSources: Record<string, GuideSource[]> = {
  "teklif-fiyati-nasil-belirlenir": [methodology, tbk],
  "teklifte-odeme-kosullari": [methodology, tbk],
};
export const sourcesFor = (slug: string) => guideSources[slug] ?? [methodology];

export type GuideTable = { caption: string; head: string[]; rows: string[][] };
export const guideTables: Record<string, GuideTable> = {
  "kar-marji-nasil-hesaplanir": { caption: "20.000 TL maliyetli işte üç fiyat", head: ["Senaryo", "Satış fiyatı", "Kâr", "Marj"], rows: [["Uygulamanın yuvarlaması", "28.600 TL", "8.600 TL", "%30,07"], ["Tam %30 marj", "28.571,43 TL", "8.571,43 TL", "%30"], ["Maliyete %30 eklemek", "26.000 TL", "6.000 TL", "%23,08"]] },
  "is-maliyeti-nasil-hesaplanir": { caption: "Örnek iş için maliyet kalemleri", head: ["Kalem", "Tutar"], rows: [["Malzeme", "12.000 TL"], ["İşçilik", "8.000 TL"], ["Sarf", "800 TL"], ["Yol", "700 TL"], ["Toplam maliyet", "21.500 TL"]] },
  "teklif-fiyati-nasil-belirlenir": { caption: "30.000 TL maliyette hedef marja göre fiyat", head: ["Hedef marj", "Hesap", "Teklif fiyatı"], rows: [["%20", "30.000 ÷ 0,80", "37.500 TL"], ["%25", "30.000 ÷ 0,75", "40.000 TL"], ["%30", "30.000 ÷ 0,70", "42.857,14 TL"]] },
  "markup-ve-marj-farki": { caption: "Aynı yüzde, farklı fiyat (20.000 TL maliyet)", head: ["Yöntem", "Hesap", "Fiyat", "Marj", "Markup"], rows: [["%30 markup", "20.000 × 1,30", "26.000 TL", "%23,08", "%30"], ["%30 marj", "20.000 ÷ 0,70", "28.571,43 TL", "%30", "%42,86"]] },
  "iscilik-maliyeti-nasil-hesaplanir": { caption: "Örnek işçilik hesabı", head: ["Kişi", "Gün", "Günlük maliyet", "Toplam"], rows: [["Usta", "3", "3.000 TL", "9.000 TL"], ["Yardımcı", "2", "1.800 TL", "3.600 TL"], ["Toplam", "", "", "12.600 TL"]] },
  "boyaci-teklifi-nasil-hazirlanir": { caption: "Boya miktarını etkileyen girdiler", head: ["Girdi", "Örnek değer"], rows: [["Duvar alanı", "100 m²"], ["Kat sayısı", "2"], ["Örtücülük", "10 m²/L"], ["Fire", "%10"], ["Gereken boya", "100 × 2 ÷ 10 × 1,10 = 22 L"]] },
  "elektrik-isi-nasil-fiyatlandirilir": { caption: "Üç kalemin örnek maliyeti", head: ["Kalem", "Hesap", "Tutar"], rows: [["Kablo", "100 m × 20 TL", "2.000 TL"], ["Priz", "10 × 250 TL", "2.500 TL"], ["İşçilik", "2 gün × 3.000 TL", "6.000 TL"], ["Toplam", "", "10.500 TL"]] },
  "teklifte-odeme-kosullari": { caption: "40.000 TL'lik işte örnek ödeme planı", head: ["Aşama", "Pay", "Tutar"], rows: [["Avans", "%30", "12.000 TL"], ["Teslimde", "%70", "28.000 TL"], ["Toplam", "%100", "40.000 TL"]] },
  "pazarlikta-ne-kadar-indirim": { caption: "20.000 TL maliyette indirim alanı", head: ["Fiyat", "Marj", "Tutar"], rows: [["Hedef fiyat", "%30", "28.571 TL"], ["Minimum fiyat", "%20", "25.000 TL"], ["İndirim alanı", "", "yaklaşık 3.571 TL"]] },
  "usta-yaklasik-fiyat-nasil-alinir": { caption: "İlanda yer alması gereken bilgiler", head: ["Bilgi", "Neden önemli"], rows: [["Alan, adet veya metraj", "Ustanın malzeme ve süre hesabının temelidir."], ["Malzemeyi kimin alacağı", "Fiyatların aynı kapsamda karşılaştırılmasını sağlar."], ["İstenen tarih", "İş takvimi ve işçilik planını etkiler."], ["Fotoğraf", "Keşfe gerek kalmadan daha net teklif almana yardımcı olur."]] },
};

// Guides that are the strongest search targets get extra FAQ blocks.
export const guideFaqs: Record<string, readonly (readonly [string, string])[]> = {
  "kar-marji-nasil-hesaplanir": [
    ["Kâr marjı nasıl hesaplanır?", "Kâr marjı = (satış fiyatı − maliyet) ÷ satış fiyatı × 100. 20.000 TL maliyetli iş 28.600 TL'ye satılırsa kâr 8.600 TL, marj yaklaşık %30,07 olur."],
    ["Hedef marja göre satış fiyatı nasıl bulunur?", "Maliyeti (1 − hedef marj) değerine böl. %30 hedef için 20.000 ÷ 0,70 = 28.571,43 TL."],
    ["Kâr marjı ile markup aynı şey mi?", "Hayır. Markup kârı maliyete, marj kârı satış fiyatına böler. Aynı yüzde farklı fiyat verir."],
  ],
  "markup-ve-marj-farki": [
    ["Marj ve markup farkı nedir?", "Markup kâr ÷ maliyet, marj kâr ÷ satış fiyatıdır. %30 markup %23,08 marja karşılık gelir."],
  ],
  "usta-yaklasik-fiyat-nasil-alinir": [
    ["Bir iş yaptırmadan önce ustalardan yaklaşık fiyat nereden alabilirim?", "KaçaYapayım'da işini tarif eden bir ilan verip bölgendeki ustalardan teklif alabilirsin. Teklifler aynı kapsamda gelirse karşılaştırması kolaylaşır."],
    ["Gelen yaklaşık fiyat bağlayıcı mı?", "Hayır. Kesin tutar, ustanın kapsamı görmesi ve yazılı teklifi göndermesiyle belli olur."],
  ],
};

export const guideTradeSlugs = (slug: string): string[] =>
  slug === "boyaci-teklifi-nasil-hazirlanir" ? ["boyaci"] : slug === "elektrik-isi-nasil-fiyatlandirilir" ? ["elektrikci"] : ["boyaci", "elektrikci", "tesisatci", "klimaci"];

// Root template appends " | KaçaYapayım", so raw titles stay at 47 characters or fewer.
export const guideMetaTitles: Record<string, string> = { "pazarlikta-ne-kadar-indirim": "Pazarlıkta ne kadar indirim yapılabilir?" };

export const siteContentModified = "2026-11-20";

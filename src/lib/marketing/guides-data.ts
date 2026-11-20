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

// Answer-first blocks: 2-3 sentence direct answer with the key number, stated assumptions and a short summary.
// Every figure comes from the guide's own example data above.
export type GuideLead = { direct: string; assumptions: string; summary: readonly string[] };
export const guideLeads: Record<string, GuideLead> = {
  "kar-marji-nasil-hesaplanir": {
    direct: "Kâr marjı = (satış fiyatı − maliyet) ÷ satış fiyatı × 100. 20.000 TL maliyetli bir iş 28.600 TL'ye satılırsa kâr 8.600 TL, marj yaklaşık %30,07 olur. Hedef marjdan fiyat bulmak için maliyeti (1 − marj) değerine böl.",
    assumptions: "Maliyete malzeme, işçilik, sarf ve yol dahildir. Vergiler ve genel giderler hesaba katılmadı. Uygulama öneriyi yüz TL yukarı yuvarlar.",
    summary: ["Marj kârı satış fiyatına böler, markup maliyete böler.", "%30 marj için 20.000 TL maliyet 28.571,43 TL fiyat gerektirir.", "Yuvarlanmış fiyatla gerçekleşen marjı yeniden hesapla."],
  },
  "is-maliyeti-nasil-hesaplanir": {
    direct: "İş maliyeti; malzeme, işçilik, sarf ve yolun toplamıdır. 12.000 TL malzeme, 8.000 TL işçilik, 800 TL sarf ve 700 TL yol gideri olan işin maliyeti 21.500 TL eder.",
    assumptions: "Tutarlar örnek içindir. Vergiler ve işletmenin genel giderleri dahil değildir.",
    summary: ["Her kalemi miktar × birim maliyet olarak ayrı yaz.", "İşçiliği kişi ve gün sayısına böl.", "Gerçekleşen giderle tahmini karşılaştır."],
  },
  "teklif-fiyati-nasil-belirlenir": {
    direct: "Teklif fiyatı = toplam maliyet ÷ (1 − hedef marj). 30.000 TL maliyet ve %25 hedef marjla fiyat 40.000 TL, brüt kâr 10.000 TL olur.",
    assumptions: "Maliyet 30.000 TL kabul edildi. Marj brüt kâra göredir, vergi hariçtir.",
    summary: ["Önce maliyet, sonra hedef marj, sonra fiyat.", "%20, %25 ve %30 marj aynı maliyette 37.500, 40.000 ve 42.857,14 TL verir.", "Kapsamı, hariç işleri ve geçerlilik süresini teklife yaz."],
  },
  "markup-ve-marj-farki": {
    direct: "Markup kârı maliyete, marj kârı satış fiyatına böler. 20.000 TL maliyete %30 markup 26.000 TL fiyat ve %23,08 marj verir; %30 marj ise 28.571,43 TL fiyat ve %42,86 markup demektir.",
    assumptions: "Maliyet 20.000 TL kabul edildi. Vergiler hariçtir.",
    summary: ["Aynı yüzde, farklı fiyat verir.", "Maliyete %30 eklemek %23,08 marja karşılık gelir.", "Hedefin marj mı markup mı olduğunu fiyatlamadan önce netleştir."],
  },
  "iscilik-maliyeti-nasil-hesaplanir": {
    direct: "İşçilik maliyeti, kişi sayısı × iş günü × günlük maliyetin toplamıdır. 3 gün çalışan usta (günlük 3.000 TL) ile 2 gün çalışan yardımcı (günlük 1.800 TL) için işçilik 12.600 TL olur.",
    assumptions: "Günlük tutarlar örnektir, ücret standardı değildir. Fazla mesai ve yasal işveren maliyetleri hesaba katılmadı.",
    summary: ["Usta ve yardımcıyı ayrı satıra yaz.", "Keşif ve ikinci ziyaretleri iş gününe say.", "İş uzarsa ek günün maliyetini önceden gör."],
  },
  "boyaci-teklifi-nasil-hazirlanir": {
    direct: "Boya miktarı = alan × kat sayısı ÷ örtücülük × (1 + fire). 100 m² duvar, 2 kat, 10 m²/L örtücülük ve %10 fire ile yaklaşık 22 L boya gerekir.",
    assumptions: "Yalnızca duvar alanı, belirtilen örtücülük ve fire payı kullanıldı. Astar, tavan ve macun ayrıca hesaplanır; litre fiyatı örnekte yoktur.",
    summary: ["Alanı, kat sayısını ve ürünün örtücülüğünü gir.", "Fire payını unutma.", "Astar, tavan ve onarımı ayrı kalem yap."],
  },
  "elektrik-isi-nasil-fiyatlandirilir": {
    direct: "Elektrik işinin maliyeti kablo, priz, işçilik, sarf ve yolun toplamıdır. 100 m kablo (2.000 TL), 10 priz (2.500 TL) ve 2 gün işçilik (6.000 TL) için bu üç kalem 10.500 TL eder.",
    assumptions: "Anahtar, sigorta, buat, sarf ve yol bu örneğe dahil değildir; ayrıca eklenir. Teknik uygunluk fiyat hesabının dışındadır.",
    summary: ["Kabloyu kesit ve metraj bazında ayır.", "Adet kalemlerini birim maliyetle çarp.", "İşçilik gününü ve yardımcıyı ayrıca yaz."],
  },
  "teklifte-odeme-kosullari": {
    direct: "Ödeme koşulunda toplam tutarı, avansı ve kalan ödemenin hangi aşamada yapılacağını yaz. 40.000 TL'lik örnek işte %30 avans 12.000 TL, teslimde kalan ödeme 28.000 TL olur.",
    assumptions: "%30 avans bir öneri veya hukuki kural değildir. Tarafların anlaşması ve geçerli mevzuat esastır.",
    summary: ["Her aşamanın tutarını yaz.", "Teslim kilometre taşını net tanımla.", "Kapsam değişirse planı yeniden konuş."],
  },
  "pazarlikta-ne-kadar-indirim": {
    direct: "İndirim sınırın minimum marjından gelir: minimum fiyat = maliyet ÷ (1 − minimum marj). 20.000 TL maliyet ve %20 alt sınırda minimum fiyat 25.000 TL'dir; %30 hedef fiyatla (28.571 TL) arasındaki yaklaşık 3.571 TL indirim alanıdır.",
    assumptions: "Maliyet 20.000 TL, hedef marj %30, minimum marj %20 kabul edildi. Vergiler hariçtir.",
    summary: ["Önce minimum kabul marjını belirle.", "İstenen indirim 3.571 TL'yi aşıyorsa kapsamı veya ödemeyi konuş.", "İndirim sonrası kâr tutarını da gör."],
  },
  "usta-yaklasik-fiyat-nasil-alinir": {
    direct: "Karşılaştırılabilir fiyat için aynı kapsamı, aynı malzeme varsayımını ve aynı tarihi birkaç ustaya ilet. KaçaYapayım'da iş ilanı verip gelen teklifleri kalem kalem karşılaştırabilirsin; yaklaşık fiyat bağlayıcı değildir.",
    assumptions: "Örnek bir iş tarifi içindir; rakam içermez. Kesin tutar ustanın kapsamı görmesi ve yazılı teklifiyle belli olur.",
    summary: ["Ölçü, malzeme ve tarihi yaz.", "Fotoğraf ekle.", "Teklifleri toplam tutara göre değil dahil ve hariç işlere göre karşılaştır."],
  },
};

// Contextual hub: marj vs markup comparison, shown on the two strongest margin pages.
export const marjMarkupTable: GuideTable = {
  caption: "Kâr marjı ve markup farkı (20.000 TL maliyet, 8.000 TL kâr)",
  head: ["", "Kâr marjı", "Markup"],
  rows: [
    ["Neye böler", "Satış fiyatına", "Maliyete"],
    ["Formül", "Kâr ÷ satış fiyatı", "Kâr ÷ maliyet"],
    ["Örnek sonuç", "8.000 ÷ 28.000 = %28,57", "8.000 ÷ 20.000 = %40"],
    ["Hedef %30 olunca fiyat", "20.000 ÷ 0,70 = 28.571,43 TL", "20.000 × 1,30 = 26.000 TL"],
  ],
};
export const marjGuideSlugs = ["kar-marji-nasil-hesaplanir", "markup-ve-marj-farki"] as const;

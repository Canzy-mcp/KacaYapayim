// Search-focused copy for calculator pages. Examples reuse figures from content.ts guides.
export type CalcSeo = {
  metaTitle: string; metaDescription: string; h1: string; answer: string; formula: string; example: string;
  faqs: readonly (readonly [string, string])[]; guides: readonly string[]; trades: readonly string[];
};

export const calcSeo: Record<string, CalcSeo> = {
  "kar-marji": {
    metaTitle: "Kâr Marjı Hesaplama Aracı", h1: "Kâr marjı hesaplama",
    metaDescription: "Kâr marjı hesaplama: maliyetini ve hedef marjını gir, satış fiyatını gör. Formül, örnek hesap, marj ve markup farkı.",
    answer: "Kâr marjı, kârın satış fiyatına oranıdır. Maliyetini ve hedef marjını girince aracın hesapladığı satış fiyatı, maliyeti (1 − marj) değerine bölerek bulunur.",
    formula: "Kâr marjı = (satış fiyatı − maliyet) ÷ satış fiyatı × 100. Hedef fiyat = maliyet ÷ (1 − hedef marj / 100).",
    example: "20.000 TL maliyet ve %30 hedef marj için fiyat 20.000 ÷ 0,70 = 28.571,43 TL olur. Uygulama bunu yüz TL yukarı yuvarlayıp 28.600 TL gösterir; gerçekleşen marj yaklaşık %30,07'dir.",
    faqs: [
      ["Kâr marjı nasıl hesaplanır?", "Satış fiyatından maliyeti çıkar, kalanı satış fiyatına böl, 100 ile çarp. 28.600 TL satış ve 20.000 TL maliyette marj yaklaşık %30,07'dir."],
      ["Marj ile markup farkı nedir?", "Markup kârı maliyete, marj satış fiyatına böler. Maliyete %30 eklemek %23,08 marj verir; %30 marj için maliyeti 0,70'e bölmek gerekir."],
      ["Hedef marja göre fiyat nasıl bulunur?", "Maliyeti 1 eksi marj oranına böl. %25 marj ve 30.000 TL maliyet için 40.000 TL çıkar."],
      ["Bu araç piyasa fiyatı verir mi?", "Hayır. Sonuç yalnızca senin girdiğin maliyete ve hedef marja dayanır."],
    ],
    guides: ["kar-marji-nasil-hesaplanir", "markup-ve-marj-farki", "teklif-fiyati-nasil-belirlenir"], trades: ["boyaci", "elektrikci", "tesisatci", "klimaci"],
  },
  "teklif-fiyati": {
    metaTitle: "Teklif Fiyatı Hesaplama Aracı", h1: "Teklif fiyatı hesaplama",
    metaDescription: "Teklif fiyatı hesaplama: malzeme, işçilik ve diğer giderleri topla, hedef kârına göre müşteriye vereceğin fiyatı bul.",
    answer: "Teklif fiyatı, işin toplam maliyetinin hedef kâr marjına göre fiyata çevrilmesiyle bulunur. Malzeme, işçilik, sarf ve yolu topla, hedef marjı gir, araç önerilen fiyatı gösterir.",
    formula: "Teklif fiyatı = toplam maliyet ÷ (1 − hedef marj / 100).",
    example: "30.000 TL maliyet ve %25 hedef marj için fiyat 30.000 ÷ 0,75 = 40.000 TL'dir. Bu fiyatın 10.000 TL'si brüt kârdır.",
    faqs: [
      ["Teklif fiyatı nasıl belirlenir?", "Önce toplam maliyeti bul, sonra hedef marjına göre fiyatı hesapla. Kapsamı, hariç işleri ve geçerlilik süresini teklife yaz."],
      ["Fiyata KDV dahil mi?", "Araç vergiyi hesaplamaz; sonuç senin girdiğin maliyetlere dayanır. Vergi için güncel uzman görüşü al."],
    ],
    guides: ["teklif-fiyati-nasil-belirlenir", "is-maliyeti-nasil-hesaplanir", "teklifte-odeme-kosullari"], trades: ["boyaci", "elektrikci", "tesisatci", "klimaci"],
  },
  "boya-maliyeti": {
    metaTitle: "Boya Fiyatı Hesaplama, Boya Badana Maliyeti", h1: "Boya fiyatı hesaplama",
    metaDescription: "Boya badana fiyat hesaplama: alan, kat sayısı, örtücülük ve fire ile gereken boya miktarını ve boya maliyetini hesapla.",
    answer: "Boya fiyatını bulmak için önce gereken boya miktarını hesapla, sonra litre fiyatı, işçilik, sarf ve yolu ekle. Boya miktarı alan, kat sayısı, örtücülük ve fire payına bağlıdır.",
    formula: "Boya miktarı = alan × kat sayısı ÷ litre başına örtücülük × (1 + fire oranı).",
    example: "100 m² duvar, 2 kat, 10 m²/L örtücülük ve %10 fire için yaklaşık 22 L boya gerekir. Birim boya maliyetini ve işçiliği ayrıca girersin.",
    faqs: [
      ["Boya badana fiyatı nasıl hesaplanır?", "Boya miktarı, astar, macun, işçilik, sarf ve yol toplanır. Metrekare başına tek rakam bu kalemleri gizleyebilir."],
      ["Kaç litre boya gerekir?", "Alan × kat sayısı ÷ örtücülük × (1 + fire). 100 m², 2 kat, 10 m²/L ve %10 fire için yaklaşık 22 L."],
      ["Aracın sonucu piyasa fiyatı mı?", "Hayır. Sonuç senin girdiğin ürün ve işçilik maliyetine dayanır."],
    ],
    guides: ["boyaci-teklifi-nasil-hazirlanir", "teklif-fiyati-nasil-belirlenir", "usta-yaklasik-fiyat-nasil-alinir"], trades: ["boyaci"],
  },
  "elektrik-isi-maliyeti": {
    metaTitle: "Elektrik Yaklaşık Maliyet Hesaplama", h1: "Elektrik yaklaşık maliyet hesaplama",
    metaDescription: "Elektrik işi yaklaşık maliyet hesaplama: kablo metrajı, priz adedi ve işçilikle toplam maliyeti ve teklif fiyatını bul.",
    answer: "Elektrik işinin yaklaşık maliyeti kablo, priz, anahtar, sigorta, buat, işçilik, sarf ve yolun toplamıdır. Metrajı ve adetleri girince araç maliyeti ve hedef marja göre teklif fiyatını verir.",
    formula: "Maliyet = kablo + priz + anahtar + sigorta + buat + işçilik + sarf + yol.",
    example: "100 m kablo × 20 TL, 10 priz × 250 TL ve 2 gün × 3.000 TL işçilik için bu üç kalem 10.500 TL eder. Diğer kalemler ayrıca eklenir.",
    faqs: [
      ["Elektrik işi yaklaşık maliyeti nasıl hesaplanır?", "Her kalemi miktar × birim maliyet olarak yaz, işçilik ve sarfı ekle. Kablo kesitlerini ayrı hesapla."],
      ["Elektrik güvenliği bu hesaba dahil mi?", "Hayır. Teknik uygunluk ve güvenlik fiyat hesabının dışındadır; işi yetkin bir usta planlamalıdır."],
    ],
    guides: ["elektrik-isi-nasil-fiyatlandirilir", "is-maliyeti-nasil-hesaplanir", "teklif-fiyati-nasil-belirlenir"], trades: ["elektrikci"],
  },
};

// Landing-page content per trade. Numbers come from the worked examples already in content.ts.
export type TradeQuote = { lines: readonly (readonly [string, number])[]; cost: number; margin: number };
export type Trade = {
  slug: string; category: string; name: string; metaTitle: string; metaDescription: string; h1: string;
  image: string; imageAlt: string; answer: string;
  drivers: readonly (readonly [string, string])[];
  scope: readonly string[];
  quote: TradeQuote;
  guides: readonly string[]; calculators: readonly string[];
  faqs: readonly (readonly [string, string])[];
};

export const trades: Trade[] = [
  {
    slug: "boyaci", category: "boya", name: "Boyacı", metaTitle: "Boyacı Ustası Bul ve Boya Fiyatı Hesapla",
    metaDescription: "Boya badana ustası bul, iş ilanı ver. Boya fiyatını alan, kat sayısı ve işçilikle hesapla; kapsam listesi ve örnek teklifi gör.",
    h1: "Boyacı ustası bul ve fiyat hesapla",
    image: "painter", imageAlt: "Parke zemindeki süpürgeliği maskelenmiş bir odada, taze duvar kenarını rulo ile çeken boyacı; temsili görsel",
    answer: "Boya işinin fiyatı tek bir metrekare rakamıyla çıkmaz. Duvar ve tavan alanı, kat sayısı, yüzey hazırlığı, boya ve astar tüketimi ile işçilik süresi toplamı belirler. KaçaYapayım piyasa fiyatı vermez; ustalar kendi maliyetinden teklif hazırlar, sen de aynı kapsamdaki teklifleri karşılaştırırsın.",
    drivers: [
      ["Alan ve kat sayısı", "Boyanacak duvar ve tavan alanı ile kat sayısı, boya miktarını ve işçilik süresini birlikte artırır."],
      ["Yüzey hazırlığı", "Macun, zımpara, astar ve onarım ihtiyacı işin en değişken kalemidir. Keşifte görülmeden net fiyat vermek zordur."],
      ["Boya ve sarf", "Ürünün örtücülüğü ve fire payı gereken litreyi değiştirir. Koruma örtüsü, bant ve rulo sarfa girer."],
      ["Eşya ve mekân", "Dolu evde eşyayı kaydırmak ve korumak süreyi uzatır. Boş evde iş daha hızlı ilerler."],
      ["Süre ve yol", "Ustanın ve yardımcısının çalışacağı gün sayısı ile ulaşım gideri maliyete eklenir."],
    ],
    scope: [
      "Boyanacak oda, duvar ve tavanlar tek tek yazıldı mı?",
      "Kat sayısı ve astar teklife dahil mi?",
      "Macun, çatlak ve alçı onarımı kapsamda mı, ayrı mı fiyatlanıyor?",
      "Boyayı usta mı müşteri mi alacak? Marka, renk kodu ve litre belli mi?",
      "Eşya kaydırma, örtme ve iş sonu temizliği kimde?",
      "Başlangıç tarihi, iş günü sayısı ve ödeme planı yazılı mı?",
    ],
    quote: { lines: [], cost: 57510, margin: 30 },
    guides: ["boyaci-teklifi-nasil-hazirlanir", "teklif-fiyati-nasil-belirlenir", "usta-yaklasik-fiyat-nasil-alinir"], calculators: ["boya-maliyeti", "teklif-fiyati"],
    faqs: [
      ["Boya badana fiyatı neye göre belirlenir?", "Alan, kat sayısı, yüzey hazırlığı, boya ve astar, işçilik süresi ve yol birlikte belirler. Yalnızca metrekare üzerinden verilen fiyat, macun ve onarım gibi kalemleri gizleyebilir."],
      ["Boya malzemesi fiyata dahil mi?", "Bu teklife göre değişir. Teklifte boyayı kimin alacağı, marka ve litre miktarı açıkça yazılmalıdır."],
      ["Usta evime gelmeden fiyat alabilir miyim?", "Ölçü ve fotoğrafla yaklaşık fiyat alabilirsin. Yüzey durumu görülmeden verilen fiyat keşifte değişebilir."],
      ["KaçaYapayım boya için piyasa fiyatı söyler mi?", "Hayır. Piyasa rayici ya da ortalama ücret sunmaz. Ustalar kendi maliyetlerinden teklif hazırlar, sen teklifleri karşılaştırırsın."],
    ],
  },
  {
    slug: "elektrikci", category: "elektrik", name: "Elektrikçi", metaTitle: "Elektrikçi Bul ve Elektrik Maliyeti Hesapla",
    metaDescription: "Elektrikçi ustası bul, iş ilanı ver. Kablo, priz, sigorta ve işçilikle elektrik işi maliyetini hesapla; kapsam listesi ve örnek teklif.",
    h1: "Elektrikçi ustası bul ve fiyat hesapla",
    image: "electrician", imageAlt: "Kapalı bir apartman sigorta panosunun etiketlerini düzenleyen elektrikçinin omuz üstünden görüntüsü; temsili görsel",
    answer: "Elektrik işinde fiyatı adet ve metraj kadar montaj süresi de belirler. Kablo kesiti ve uzunluğu, priz ve anahtar sayısı, sigorta ve buat adedi, yardımcı işçilik ile sarf toplam maliyeti oluşturur. KaçaYapayım piyasa fiyatı vermez; ustalar kendi maliyetlerinden teklif hazırlar.",
    drivers: [
      ["Kablo metrajı ve kesiti", "Her kesit farklı fiyatlanır. Tek bir metre fiyatı bütün kablolar için kullanılmamalıdır."],
      ["Priz, anahtar ve sigorta adedi", "Ürün seçimi ve adet toplamı doğrudan değiştirir. Seri ve marka tercihi teklife yazılmalıdır."],
      ["Mevcut tesisat", "Açık, gömülü veya yenilenecek hat işçilik süresini ve kırma ihtiyacını etkiler."],
      ["Montaj süresi", "Elektrikçi ve yardımcının iş günü sayısı işçilik kalemidir."],
      ["Sarf ve yol", "Buat, kelepçe, bant gibi sarf ile ulaşım gideri ayrıca hesaplanır."],
    ],
    scope: [
      "Yeni hat mı çekilecek, mevcut hat mı değişecek?",
      "Kablo kesiti ve ürün markası yazıldı mı?",
      "Priz, anahtar ve sigorta adetleri ürün seçimiyle birlikte listelendi mi?",
      "Kırma, sıva ve boya onarımı kapsamda mı?",
      "Pano, topraklama ve teknik uygunluk kontrolünü kimin yapacağı belli mi?",
      "İş bitiminde test ve teslim nasıl yapılacak?",
    ],
    quote: { lines: [["Malzeme", 12000], ["İşçilik", 8000], ["Yol ve sarf", 1000]], cost: 21000, margin: 30 },
    guides: ["elektrik-isi-nasil-fiyatlandirilir", "teklif-fiyati-nasil-belirlenir", "usta-yaklasik-fiyat-nasil-alinir"], calculators: ["elektrik-isi-maliyeti", "teklif-fiyati"],
    faqs: [
      ["Elektrik işi fiyatı nasıl hesaplanır?", "Kablo, priz, anahtar, sigorta, buat, işçilik, sarf ve yol toplanır. Hedef kâr marjı ayrıca satış fiyatı üzerinden uygulanır."],
      ["Elektrik güvenliği fiyata dahil mi?", "Teknik uygunluk ve güvenlik fiyat hesabının dışındadır. İşi yürürlükteki kurallara göre yetkin bir usta planlamalıdır; kapsamı teklifte yazdır."],
      ["Keşif gerekli mi?", "Mevcut hat ve pano görülmeden verilen fiyat sonradan değişebilir. Keşifte belirlenmeyen işler kapsam dışı yazılmalıdır."],
      ["KaçaYapayım elektrik için piyasa fiyatı söyler mi?", "Hayır. Ustaların kendi girdileriyle hazırladığı teklifleri karşılaştırırsın."],
    ],
  },
  {
    slug: "tesisatci", category: "tesisat", name: "Tesisatçı", metaTitle: "Tesisatçı Ustası Bul ve Tesisat Fiyatı Hesapla",
    metaDescription: "Su tesisatçısı bul, iş ilanı ver. Boru, bağlantı, montaj ve yol giderine göre tesisat işi maliyetini hesapla; örnek teklifi gör.",
    h1: "Tesisatçı ustası bul ve fiyat hesapla",
    image: "plumber", imageAlt: "Fayanslı bir mutfak dolabının içinde lavabo sifonunu takan tesisatçının elleri; temsili görsel",
    answer: "Tesisat işinin fiyatı boru uzunluğu, bağlantı parçaları, armatür ve montaj süresine bağlıdır. Kırma ve onarım gibi kalemler kapsam dışı kalırsa teklif sonradan değişir. KaçaYapayım piyasa fiyatı vermez; ustalar kendi maliyetlerinden teklif hazırlar.",
    drivers: [
      ["Boru uzunluğu ve cinsi", "Hat uzunluğu ve boru tipi malzeme maliyetini belirler."],
      ["Bağlantı parçaları ve armatür", "Dirsek, rakor, batarya ve sifon gibi parçaların kimin alacağı teklifte yazmalıdır."],
      ["Kırma ve onarım", "Duvar veya fayans açılacaksa onarımın kapsamda olup olmadığı fiyatı en çok değiştiren sorudur."],
      ["Montaj süresi", "Ustanın ve yardımcının çalışma günü işçilik kalemidir."],
      ["Sarf ve yol", "Conta, bant ve benzeri sarf ile ulaşım ayrıca hesaplanır."],
    ],
    scope: [
      "Hangi tesisat değişecek: gider, temiz su, armatür veya cihaz bağlantısı?",
      "Armatürü ve parçaları kim alacak?",
      "Kırma, fayans ve sıva onarımı kapsamda mı?",
      "Eski tesisatın sökümü ve atığı kimde?",
      "Su kesintisinin ne kadar süreceği belli mi?",
      "Sızdırmazlık kontrolü ve işçilik garantisi yazılı mı?",
    ],
    quote: { lines: [["Malzeme", 8000], ["İşçilik", 6000], ["Yol ve sarf", 1000]], cost: 15000, margin: 25 },
    guides: ["is-maliyeti-nasil-hesaplanir", "teklif-fiyati-nasil-belirlenir", "usta-yaklasik-fiyat-nasil-alinir"], calculators: ["kar-marji", "teklif-fiyati"],
    faqs: [
      ["Tesisat işi fiyatı neye göre değişir?", "Boru ve parça miktarı, kırma ve onarım ihtiyacı, montaj süresi ve yol fiyatı değiştirir."],
      ["Kırma ve onarım fiyata dahil mi?", "Her teklifte değişir. Fayans veya sıva onarımı dahil değilse teklifte hariç işler olarak yazılmalıdır."],
      ["Armatürü ben mi almalıyım?", "Teklifte kimin alacağı belirtilmelidir. Uyumsuz ürün montaj süresini uzatabilir."],
      ["KaçaYapayım tesisat için piyasa fiyatı söyler mi?", "Hayır. Ustalar kendi girdileriyle teklif hazırlar, sen karşılaştırırsın."],
    ],
  },
  {
    slug: "klimaci", category: "klima", name: "Klimacı", metaTitle: "Klima Ustası Bul ve Montaj Fiyatı Hesapla",
    metaDescription: "Klima montaj ve servis ustası bul, iş ilanı ver. Bakır boru, işçilik ve yol giderine göre klima işi maliyetini hesapla; örnek teklif.",
    h1: "Klimacı ustası bul ve fiyat hesapla",
    image: "hvac", imageAlt: "Balkon kapısının yanında split klimanın filtresini çıkaran teknisyen; temsili görsel",
    answer: "Klima montajında bakır boru boyu, izolasyon, drenaj, konsol ve bağlantı malzemeleri ile işçilik ve ulaşım birlikte hesaplanır. Cihazın teklife dahil olup olmadığı fiyatı en çok değiştiren noktadır. KaçaYapayım piyasa fiyatı vermez; ustalar kendi maliyetlerinden teklif hazırlar.",
    drivers: [
      ["Boru boyu ve izolasyon", "İç ve dış ünite arasındaki mesafe bakır boru ve izolasyon maliyetini belirler."],
      ["Cihaz dahil mi?", "Cihaz teklife dahilse tutar belirgin değişir. Marka ve model yazılmalıdır."],
      ["Montaj yeri", "Dış ünite konumu, konsol ihtiyacı ve erişim zorluğu işçilik süresini etkiler."],
      ["Drenaj ve elektrik bağlantısı", "Su tahliyesi ve besleme hattı ayrı bir kalem olabilir."],
      ["İşçilik ve yol", "Montaj süresi, ikinci personel ihtiyacı ve servis yolu maliyete eklenir."],
    ],
    scope: [
      "Cihaz teklife dahil mi? Marka ve model yazıldı mı?",
      "Boru boyu ve izolasyon kapsamı belli mi?",
      "Dış ünite konumu ve konsol ihtiyacı kontrol edildi mi?",
      "Drenaj ve elektrik hattı kapsamda mı?",
      "Çalıştırma ve test işlemi teklifte yazılı mı?",
      "Eski cihazın sökümü ve nakliyesi kimde?",
    ],
    quote: { lines: [["Malzeme", 5000], ["İşçilik", 4000], ["Ulaşım", 1000]], cost: 10000, margin: 20 },
    guides: ["iscilik-maliyeti-nasil-hesaplanir", "teklif-fiyati-nasil-belirlenir", "usta-yaklasik-fiyat-nasil-alinir"], calculators: ["kar-marji", "teklif-fiyati"],
    faqs: [
      ["Klima montajı fiyatı neye göre değişir?", "Boru boyu, cihazın dahil olup olmadığı, montaj yeri, drenaj ve elektrik bağlantısı ile işçilik belirler."],
      ["Cihaz montaj fiyatına dahil mi?", "Teklife göre değişir. Cihazın dahil olup olmadığı yazılmalıdır."],
      ["Servis ve bakım için de usta bulabilir miyim?", "Evet. Klima ve havalandırma kategorisinde servis veren ustaları görebilir veya iş ilanı verebilirsin."],
      ["KaçaYapayım klima için piyasa fiyatı söyler mi?", "Hayır. Ustalar kendi girdileriyle teklif hazırlar, sen karşılaştırırsın."],
    ],
  },
];

export const tadilatImage = { src: "/images/marketing/tadilat.webp", alt: "Banyo duvarına fayans döşeyen usta; temsili görsel", category: "tadilat" };

export function quotePrice(cost: number, margin: number) {
  const exact = Math.round((cost / (1 - margin / 100)) * 100) / 100;
  return { exact, rounded: Math.ceil(exact / 100) * 100 };
}
export const tl = (n: number, digits = 0) => `${new Intl.NumberFormat("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)} TL`;
export const tradeBySlug = (slug: string) => trades.find((t) => t.slug === slug);

import { guides, professions } from "./content";
import { calculators } from "./calculators";
import { calcSeo } from "./calc-seo";
import { formatDateTr, guideDates } from "./guides-data";
import { siteOrigin, siteSummary } from "./seo";
import { tradeBySlug } from "./trades";

const link = (title: string, path: string, note: string) => `- [${title}](${siteOrigin}${path}): ${note}`;

// Short, verifiable facts for AI assistants. Keep in sync with product rules (address sharing, reviews, pricing).
export const kurumsalBilgiler = [
  "KaçaYapayım nedir: Türkiye'de ev hizmetleri için usta bulmayı ve ustaların maliyete dayalı teklif hazırlamasını kolaylaştıran bir platformdur. Hizmeti kendisi vermez, müşteri ile ustayı buluşturur.",
  "Kimin için: Boya badana, elektrik, su tesisatı, klima ve tadilat işi için usta arayan ev sahipleri ile bu işleri yapan ustalar ve küçük ekipler.",
  "Müşteriler için ücretsiz: Usta bulmak, iş ilanı vermek ve teklif almak için müşteriden ücret alınmaz.",
  "Adres paylaşımı: Müşterinin adresi yalnızca seçtiği ustayla ve yalnızca müşteri, işi verdikten sonra adresi açıkça paylaşmayı seçerse paylaşılır. Diğer ustalar adresi görmez.",
  "Yorumlar: Yalnızca tamamlanmış bir talep için ve yalnızca o talebin müşterisi yorum yazabilir.",
  "Fiyat yaklaşımı: Piyasa fiyatı veya ortalama ücret yayımlanmaz. Teklifler ustanın kendi maliyetine ve hedef kâr marjına dayanır.",
  "Ustalar için üyelik: Tek seferlik 199 TL usta üyeliği, süresiz erişim, abonelik yok. Ödeme altyapısı yapılandırılana kadar satın alınamaz; güncel durum Fiyatlandırma sayfasındadır.",
];

export function llmsTxt(): string {
  return [
    "# KaçaYapayım", "",
    `> ${siteSummary} Piyasa rayici veya ortalama ücret yayımlamaz; fiyatlar ustaların kendi maliyetlerine ve hedef kâr marjlarına dayanır.`, "",
    "## Hizmetler ve meslekler", "",
    link("Usta Bul", "/usta-bul", "İl, ilçe ve hizmete göre yayındaki ustaları listeler."),
    link("Nasıl çalışır", "/nasil-calisir", "İş ilanından teklif almaya ve ustayı seçmeye adım adım süreç."),
    link("Ustalar için", "/ustalar-icin", "Ustaların profil açması, teklif vermesi ve maliyet hesaplaması."),
    link("Güvenli hizmet", "/guvenli-hizmet", "Adres paylaşımı, yorum kuralları ve güvenlik önlemleri."),
    ...professions.map(p => link(`${p.name} ustası bul ve fiyat hesapla`, `/meslekler/${p.slug}`, tradeBySlug(p.slug)?.metaDescription ?? p.short)), "",
    "## Hesaplama araçları", "",
    ...calculators.map(c => link(calcSeo[c.slug].h1, `/hesaplama-araclari/${c.slug}`, calcSeo[c.slug].metaDescription)), "",
    "## Rehber", "",
    ...guides.map(g => link(g.title, `/rehber/${g.slug}`, g.answer)), "",
    "## Şirket ve yöntem", "",
    link("Hesaplama metodolojisi", "/metodoloji", "Fiyatın girdilerle ve hedef marjla nasıl hesaplandığı."),
    link("Fiyatlandırma", "/fiyatlandirma", "Usta Üyelik: tek seferlik 199 TL, süresiz. Müşteriler için ücretsiz."),
    link("Özellikler", "/ozellikler", "Maliyet hesabı, teklif hazırlama ve kâr takibi."),
    link("Hakkımızda", "/hakkimizda", "KaçaYapayım nedir ve kimin için?"),
    link("Yayın politikası", "/yayin-politikasi", "İçeriklerin nasıl hazırlandığı, kontrol edildiği ve güncellendiği."), "",
    "## Kurumsal bilgiler", "",
    ...kurumsalBilgiler.map(f => `- ${f}`), "",
  ].join("\n");
}

export function llmsFullTxt(): string {
  return [
    llmsTxt(), "---", "",
    "# Rehber özetleri", "",
    ...guides.flatMap(g => [`## ${g.title}`, "", `Adres: ${siteOrigin}/rehber/${g.slug}`, `Son güncelleme: ${formatDateTr(guideDates[g.slug].modified)}`, "", g.answer, "", `Formül: ${g.formula}`, `Örnek: ${g.example}`, ""]),
    "# Meslek özetleri", "",
    ...professions.flatMap(p => { const t = tradeBySlug(p.slug); return [`## ${p.name}`, "", `Adres: ${siteOrigin}/meslekler/${p.slug}`, "", t?.answer ?? p.intro, ""]; }),
  ].join("\n");
}

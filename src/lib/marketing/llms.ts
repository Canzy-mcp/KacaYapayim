import { guides, professions } from "./content";
import { calculators } from "./calculators";
import { calcSeo } from "./calc-seo";
import { formatDateTr, guideDates } from "./guides-data";
import { siteOrigin, siteSummary } from "./seo";
import { tradeBySlug } from "./trades";

const link = (title: string, path: string, note: string) => `- [${title}](${siteOrigin}${path}): ${note}`;

export function llmsTxt(): string {
  return [
    "# KaçaYapayım", "",
    `> ${siteSummary} Piyasa rayici veya ortalama ücret yayımlamaz; fiyatlar ustaların kendi maliyetlerine ve hedef kâr marjlarına dayanır.`, "",
    "## Hizmetler ve meslekler", "",
    link("Usta Bul", "/usta-bul", "İl, ilçe ve hizmete göre yayındaki ustaları listeler."),
    ...professions.map(p => link(`${p.name} ustası bul ve fiyat hesapla`, `/meslekler/${p.slug}`, tradeBySlug(p.slug)?.metaDescription ?? p.short)), "",
    "## Hesaplama araçları", "",
    ...calculators.map(c => link(calcSeo[c.slug].h1, `/hesaplama-araclari/${c.slug}`, calcSeo[c.slug].metaDescription)), "",
    "## Rehber", "",
    ...guides.map(g => link(g.title, `/rehber/${g.slug}`, g.answer)), "",
    "## Şirket ve yöntem", "",
    link("Hesaplama metodolojisi", "/metodoloji", "Fiyatın girdilerle ve hedef marjla nasıl hesaplandığı."),
    link("Fiyatlandırma", "/fiyatlandirma", "Ücretsiz, Usta ve Pro paketlerinin limitleri ve fiyatları."),
    link("Özellikler", "/ozellikler", "Maliyet hesabı, teklif hazırlama ve kâr takibi."),
    link("Hakkımızda", "/hakkimizda", "KaçaYapayım nedir ve kimin için?"), "",
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

export const customerCsvColumns = [
  ["name", "Ad soyad", ["name", "ad", "ad soyad", "isim", "müşteri", "musteri"]],
  ["phone", "Telefon", ["phone", "telefon", "telefon numarası", "tel"]],
  ["email", "E-posta", ["email", "e-posta", "eposta", "mail"]],
  ["company_name", "Firma", ["company_name", "firma", "şirket", "sirket"]],
  ["city", "İl", ["city", "il", "şehir", "sehir"]],
  ["district", "İlçe", ["district", "ilçe", "ilce"]],
  ["address", "Adres", ["address", "adres"]],
  ["notes", "Not", ["notes", "not", "notlar", "açıklama", "aciklama"]],
] as const;
export function suggestCustomerColumns(headers: string[]) {
  return Object.fromEntries(customerCsvColumns.map(([key, , aliases]) => [key,
    headers.findIndex(header => (aliases as readonly string[]).includes(header.trim().toLocaleLowerCase("tr-TR")))]));
}
export function mapCustomerRows(rows: string[][], mapping: Record<string, number>) {
  if (!Number.isInteger(mapping.name) || mapping.name < 0) throw new Error("Ad soyad sütununu seç.");
  const selected = Object.values(mapping).filter(index => index >= 0);
  if (new Set(selected).size !== selected.length) throw new Error("Aynı sütunu birden fazla alana bağlama.");
  return rows.map(row => Object.fromEntries(customerCsvColumns.map(([key]) => [key, row[mapping[key]] ?? ""])));
}

export function buildWhatsAppQuoteMessage(input: {
  customerName: string | null; businessName: string; quoteNumber: string; publicUrl: string;
}) {
  const greeting = input.customerName ? `Merhaba ${input.customerName},` : "Merhaba,";
  return `${greeting}\n\nHazırladığımız teklifinizi aşağıdaki bağlantıdan inceleyebilirsiniz:\n${input.publicUrl}\n\nTeklif No: ${input.quoteNumber}\n${input.businessName}`;
}

export function buildWhatsAppUrl(message: string, phone: string | null) {
  const digits = phone?.replace(/\D/g, "") || "";
  const normalized = digits.startsWith("0") && digits.length === 11 ? `90${digits.slice(1)}` : digits;
  const target = normalized.length >= 10 && normalized.length <= 15 ? normalized : "";
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
}

export function sanitizePdfFilename(quoteNumber: string, customerName: string | null) {
  const slug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i").replace(/İ/g, "I").replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 80);
  return `Teklif-${slug(quoteNumber)}${customerName ? `-${slug(customerName)}` : ""}.pdf`;
}

export function normalizeTurkishPhone(value: string): string | null {
  const compact = value.trim().replace(/[\s().-]/g, "");
  let digits = compact.startsWith("+") ? compact.slice(1) : compact;
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith("90") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (!/^[2-5]\d{9}$/.test(digits)) return null;
  return `+90${digits}`;
}

export function formatTurkishPhone(phone: string | null): string {
  if (!phone) return "—";
  const normalized = normalizeTurkishPhone(phone);
  if (!normalized) return phone;
  const digits = normalized.slice(3);
  return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`;
}

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });
export function formatCustomerDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

export function customerInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : words[0]?.slice(0, 2) || "M").toLocaleUpperCase("tr-TR");
}

export function customerLocation(district: string | null, city: string | null): string {
  return [district, city].filter(Boolean).join(", ");
}

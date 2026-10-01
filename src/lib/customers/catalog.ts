import type { CustomerSource } from "@/types/database";

export const customerSources: { value: CustomerSource; label: string }[] = [
  { value: "referral", label: "Referans" },
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "existing_customer", label: "Eski Müşteri" },
  { value: "other", label: "Diğer" },
];

export function customerSourceLabel(value: CustomerSource | null) {
  return customerSources.find((item) => item.value === value)?.label || "—";
}

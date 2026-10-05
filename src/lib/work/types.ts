export const entryKinds = { followup: "Teklif takibi", visit: "Keşif randevusu", note: "Saha notu", expense: "Gider kaydı", extra_work: "Ek iş", attachment: "Dosya", revision_request: "Revizyon talebi" } as const;
export type EntryKind = keyof typeof entryKinds;
export type WorkEntry = { id: string; business_id: string; job_id: string | null; quote_id: string | null;
  kind: EntryKind; title: string; note: string; amount: number | null; scheduled_at: string | null;
  status: "open" | "done" | "approved" | "declined"; metadata: Record<string, unknown>; created_at: string; updated_at: string };

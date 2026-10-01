import { db } from "./supabase";

export async function saveMobileJob(input: { jobId: string | null; customerId: string | null;
  title: string; description: string; fields: Record<string, unknown> }) {
  const origin = process.env.EXPO_PUBLIC_API_URL;
  if (!origin || !/^https?:\/\//.test(origin)) throw new Error("Mobil API adresi ayarlanmamış.");
  const { data } = await db().auth.getSession();
  if (!data.session) throw new Error("Oturum sona erdi. Tekrar giriş yap.");
  const response = await fetch(`${origin.replace(/\/$/, "")}/api/mobile/jobs`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify(input),
  });
  const result = await response.json() as { id?: string; totalCost?: number; error?: string; warnings?: string[] };
  if (!response.ok || !result.id) throw new Error(result.error || "İş kaydedilemedi.");
  return { id: result.id, totalCost: result.totalCost || 0, warnings: result.warnings || [] };
}

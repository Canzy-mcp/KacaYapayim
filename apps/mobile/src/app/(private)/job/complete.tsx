import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import type { ActualJobCost, JobCostBreakdown } from "@kacayapayim/core/types";
import { Button, Card, Field, Notice, Screen, SectionTitle } from "@/src/components/ui";
import { db } from "@/src/lib/supabase";
import { useAppSession } from "@/src/lib/session";
import { money, numberFromInput } from "@/src/lib/format";

export default function CompleteJob() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { business } = useAppSession();
  const [estimates, setEstimates] = useState<JobCostBreakdown[]>([]);
  const [actuals, setActuals] = useState<Record<string, string>>({});
  const [extraName, setExtraName] = useState(""); const [extraCost, setExtraCost] = useState("");
  const [notes, setNotes] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [loadedVersion, setLoadedVersion] = useState<string | null>(null);
  useEffect(() => {
    if (!id || !business) return;
    void Promise.all([
      db().from("job_cost_breakdown").select("*").eq("job_id", id).order("created_at"),
      db().from("actual_job_costs").select("*").eq("job_id", id),
      db().from("jobs").select("updated_at").eq("id", id).eq("business_id", business.id).maybeSingle(),
    ]).then(([est, actual, job]) => {
      if (est.error || actual.error || job.error || !job.data) { setError("Maliyetler yüklenemedi."); return; }
      setLoadedVersion(job.data.updated_at);
      setEstimates(est.data || []);
      const saved = new Map((actual.data || []).map((line: ActualJobCost) => [line.estimated_breakdown_id, line.total_cost]));
      setActuals(Object.fromEntries((est.data || []).map(line => [line.id, String(saved.get(line.id) ?? line.total_cost)])));
    });
  }, [id, business]);
  async function complete() {
    if (!id || !business || !loadedVersion) return;
    const lines = estimates.map(item => ({ estimatedId: item.id, name: item.name, category: item.category,
      totalCost: numberFromInput(actuals[item.id] || "") }));
    if (lines.some(item => !Number.isFinite(item.totalCost) || item.totalCost < 0)) {
      setError("Gerçek maliyet tutarlarını kontrol et."); return;
    }
    if (extraName.trim() || extraCost.trim()) {
      const value = numberFromInput(extraCost);
      if (!extraName.trim() || !Number.isFinite(value) || value < 0) { setError("Ek maliyeti kontrol et."); return; }
      lines.push({ estimatedId: null as never, name: extraName.trim(), category: "other", totalCost: value });
    }
    setBusy(true); setError("");
    const { data: current, error: checkError } = await db().from("jobs").select("updated_at")
      .eq("id", id).eq("business_id", business.id).maybeSingle();
    if (checkError || !current) { setBusy(false); setError("İşin güncel durumu kontrol edilemedi."); return; }
    if (current.updated_at !== loadedVersion) {
      setBusy(false); setError("Bu iş başka bir cihazda değişti. Güncel maliyetleri görmek için ekranı yeniden aç."); return;
    }
    const { error: saveError } = await db().rpc("save_actual_job_costs", { p_job_id: id,
      p_lines: lines.map(line => ({ ...line, totalCost: line.totalCost.toFixed(2) })), p_notes: notes.trim() || null });
    setBusy(false);
    if (saveError) { setError("İş tamamlanamadı. Kabul edilen teklif ve maliyetleri kontrol et."); return; }
    router.replace({ pathname: "/job/[id]", params: { id } });
  }
  return <Screen title="Gerçek maliyet" subtitle="İş bittiğinde ödenen gerçek tutarları gir.">
    {Boolean(error) && <Notice error>{error}</Notice>}
    {estimates.map(item => <Card key={item.id}>
      <SectionTitle>{item.name}</SectionTitle>
      <Notice>Tahmin: {money(item.total_cost)}</Notice>
      <Field label="Gerçek tutar (TL)" value={actuals[item.id] || ""}
        onChangeText={value => setActuals(current => ({ ...current, [item.id]: value }))} keyboardType="decimal-pad" />
    </Card>)}
    <SectionTitle>Ek harcama</SectionTitle>
    <Field label="Ad (isteğe bağlı)" value={extraName} onChangeText={setExtraName} />
    <Field label="Tutar (TL)" value={extraCost} onChangeText={setExtraCost} keyboardType="decimal-pad" />
    <Field label="Tamamlama notu (isteğe bağlı)" value={notes} onChangeText={setNotes} multiline />
    <Button title={busy ? "Kaydediliyor..." : "İşi Tamamla"} disabled={busy || !estimates.length || !loadedVersion} onPress={complete} />
    <Button title="Geri" quiet onPress={() => router.back()} />
  </Screen>;
}

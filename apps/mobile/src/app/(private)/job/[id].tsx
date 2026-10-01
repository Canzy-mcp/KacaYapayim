import { useCallback, useMemo, useState } from "react";
import { Alert, Text } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import type { Job, JobCostBreakdown, Quote } from "@kacayapayim/core/types";
import { calculatePricingSummary, validateMargins } from "@kacayapayim/core/pricing";
import { Button, Card, Field, Notice, Row, Screen, SectionTitle, palette } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";
import { date, money, numberFromInput } from "@/src/lib/format";

export default function JobDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { business } = useAppSession();
  const [job, setJob] = useState<Job | null>(null); const [lines, setLines] = useState<JobCostBreakdown[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [target, setTarget] = useState(""); const [minimum, setMinimum] = useState(""); const [sale, setSale] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const reload = useCallback(async () => {
    if (!business || !id) return;
    const [jobResult, lineResult, quoteResult] = await Promise.all([
      db().from("jobs").select("*").eq("id", id).eq("business_id", business.id).maybeSingle(),
      db().from("job_cost_breakdown").select("*").eq("job_id", id).order("created_at"),
      db().from("quotes").select("*").eq("job_id", id).eq("business_id", business.id).order("created_at", { ascending: false }),
    ]);
    if (jobResult.error || lineResult.error || quoteResult.error) { setError("İş yüklenemedi."); return; }
    const loaded = jobResult.data;
    setJob(loaded); setLines(lineResult.data || []); setQuotes(quoteResult.data || []);
    if (loaded) {
      const t = loaded.target_profit_margin ?? business.default_profit_margin;
      const m = loaded.minimum_profit_margin ?? business.minimum_profit_margin;
      setTarget(String(t)); setMinimum(String(m));
      setSale(String(loaded.selected_sale_price ?? calculatePricingSummary(loaded.estimated_cost, t, m).roundedRecommendedPrice));
    }
  }, [business, id]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  const preview = useMemo(() => {
    if (!job) return null;
    try { return calculatePricingSummary(job.estimated_cost, numberFromInput(target), numberFromInput(minimum), numberFromInput(sale)); }
    catch { return null; }
  }, [job, target, minimum, sale]);
  async function savePricing(acknowledgeRisk = false) {
    if (!job || !business || !preview || !validateMargins(preview.targetMargin, preview.minimumMargin)) {
      setError("Fiyat ve marjları kontrol et."); return;
    }
    if (["loss", "below_minimum"].includes(preview.status) && !acknowledgeRisk) {
      Alert.alert("Düşük fiyat", "Bu fiyat minimum kâr hedefinin altında. Yine de kaydetmek istiyor musun?", [
        { text: "Vazgeç", style: "cancel" }, { text: "Onayla", onPress: () => { void savePricing(true); } },
      ]); return;
    }
    setBusy(true); setError("");
    const { data: current, error: checkError } = await db().from("jobs").select("updated_at")
      .eq("id", job.id).eq("business_id", business.id).maybeSingle();
    if (checkError || !current) { setBusy(false); setError("İşin güncel durumu kontrol edilemedi."); return; }
    if (current.updated_at !== job.updated_at) {
      setBusy(false); setError("Bu iş başka bir cihazda değişti. Güncel bilgileri yeniden açıp kontrol et.");
      await reload(); return;
    }
    const { error: saveError } = await db().rpc("save_job_pricing", { p_job_id: job.id,
      p_target_margin: preview.targetMargin, p_minimum_margin: preview.minimumMargin,
      p_selected_sale_price: preview.selectedPrice, p_acknowledge_risk: acknowledgeRisk });
    setBusy(false);
    if (saveError) { setError("Fiyat kaydedilemedi. Tekrar dene."); return; }
    await reload();
  }
  async function start() {
    if (!job) return;
    const { error: startError } = await db().rpc("start_job", { p_job_id: job.id });
    if (startError) setError("İş başlatılamadı."); else await reload();
  }
  return <Screen title={job?.title || "İş"} subtitle={job ? `${date(job.created_at)} · ${job.status}` : "Yükleniyor..."}>
    {Boolean(error) && <Notice error>{error}</Notice>}
    {!job ? <Notice>İş bulunamadı veya yüklenemedi.</Notice> : <>
      <Card><Text style={{ color: palette.muted }}>Tahmini gerçek maliyet</Text>
        <Text style={{ fontSize: 31, fontWeight: "700", color: palette.text, marginTop: 4 }}>{money(job.estimated_cost)}</Text>
        {lines.map(line => <Row key={line.id} title={line.name} subtitle={`${line.quantity} × ${money(line.unit_cost)}`}
          right={money(line.total_cost)} />)}
      </Card>
      <SectionTitle>Fiyatlandırma</SectionTitle>
      <Field label="Hedef kâr marjı (%)" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
      <Field label="Minimum kâr marjı (%)" value={minimum} onChangeText={setMinimum} keyboardType="decimal-pad" />
      <Field label="Müşteriye verilecek fiyat (TL)" value={sale} onChangeText={setSale} keyboardType="decimal-pad" />
      {preview && <Card style={{ backgroundColor: palette.blueSoft }}><Text style={{ color: palette.muted }}>Bu fiyatla tahmini kâr</Text>
        <Text style={{ color: palette.blue, fontSize: 27, fontWeight: "700", marginTop: 3 }}>{money(preview.profit)}</Text>
        <Text style={{ color: palette.muted, marginTop: 5 }}>Gerçekleşen marj: %{preview.profitMargin?.toFixed(1) || "0"}</Text>
        <Text style={{ color: palette.muted }}>Minimum fiyat: {money(preview.minimumPrice)}</Text></Card>}
      <Button title={busy ? "Kaydediliyor..." : "Fiyatı Kaydet"} disabled={busy || !preview} onPress={() => { void savePricing(); }} />
      <Button title="Teklif Hazırla" disabled={!job.customer_id || !job.selected_sale_price}
        onPress={() => router.push({ pathname: "/quote/new", params: { jobId: job.id } })} />
      {!job.customer_id && <Notice>Teklif hazırlamak için işe müşteri bağlamalısın. Yeni iş oluştururken müşteri seçebilirsin.</Notice>}
      {quotes.length > 0 && <><SectionTitle>Teklifler</SectionTitle><Card>{quotes.map(quote => <Row key={quote.id}
        title={quote.quote_number || quote.title} subtitle={quote.status} right={money(quote.sale_price)}
        onPress={() => router.push({ pathname: "/quote/[id]", params: { id: quote.id } })} />)}</Card></>}
      {job.status === "accepted" && <Button title="İşi Başlat" onPress={() => { void start(); }} />}
      {job.status === "in_progress" && <Button title="Gerçek Maliyet ve Tamamlama" onPress={() =>
        router.push({ pathname: "/job/complete", params: { id: job.id } })} />}
      {job.status === "completed" && <Card><Text style={{ color: palette.muted }}>Gerçek kâr</Text>
        <Text style={{ color: palette.green, fontSize: 27, fontWeight: "700" }}>{money(job.actual_profit)}</Text></Card>}
      <Button title="İşlere Dön" quiet onPress={() => router.replace("/(tabs)/jobs")} />
    </>}
  </Screen>;
}

import { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import type { Job } from "@kacayapayim/core/types";
import {quoteAmounts,taxLabels,type TaxMode} from "@kacayapayim/core/quote-tax";
import { Button, Card, Choice, Field, Notice, Screen, SectionTitle } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db, secureStorage } from "@/src/lib/supabase";
import { money } from "@/src/lib/format";

type Item = { name: string; description: string };
export default function NewQuote() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>(); const { business, session } = useAppSession();
  const draftKey = session && jobId ? `quote_draft_${session.user.id}_${jobId}` : "";
  const [job, setJob] = useState<Job | null>(null); const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); const [items, setItems] = useState<Item[]>([]);
  const [duration, setDuration] = useState(""); const [payment, setPayment] = useState("");
  const [validUntil, setValidUntil] = useState(() => { const value = new Date(); value.setDate(value.getDate() + 14); return value.toISOString().slice(0, 10); });
  const [notes, setNotes] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [taxMode,setTaxMode]=useState<TaxMode>("unspecified");const [taxRateText,setTaxRateText]=useState("");
  const [ready, setReady] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!business || !jobId) return;
    void db().from("jobs").select("*").eq("id", jobId).eq("business_id", business.id).maybeSingle()
      .then(async ({ data }) => {
        setJob(data); if (!data) return;
        setTitle(data.title); setDescription(data.description || "");
        const snapshot = data.calculation_snapshot as { quoteScope?: Item[] } | null;
        setItems(snapshot?.quoteScope?.length ? snapshot.quoteScope : [{ name: data.title, description: "" }]);
        const draft = draftKey ? await secureStorage.getItem(draftKey) : null;
        if (draft) {
          try {
            const parsed = JSON.parse(draft) as { title: string; description: string; items: Item[];
              duration: string; payment: string; validUntil: string; notes: string };
            setTitle(parsed.title); setDescription(parsed.description); setItems(parsed.items);
            setDuration(parsed.duration); setPayment(parsed.payment); setValidUntil(parsed.validUntil); setNotes(parsed.notes);
          } catch { /* Ignore a damaged local draft. */ }
        }
        setReady(true);
      });
  }, [business, jobId, draftKey]);
  useEffect(() => {
    if (!ready || !draftKey) return;
    draftTimer.current = setTimeout(() => {
      void secureStorage.setItem(draftKey, JSON.stringify({ title, description, items, duration, payment, validUntil, notes })).catch(() => {});
    }, 400);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [ready, draftKey, title, description, items, duration, payment, validUntil, notes]);
  async function save() {
    if (!job || !job.customer_id || !job.selected_sale_price || !title.trim() ||
      !items.length || items.some(item => !item.name.trim()) || !/^\d{4}-\d{2}-\d{2}$/.test(validUntil)) {
      setError("Teklif bilgilerini, müşteriyi ve fiyatı kontrol et."); return;
    }
    const taxRate=taxRateText.trim()?Number(taxRateText.replace(",",".")):null;
    if(taxMode!=="unspecified"&&(taxRate===null||!Number.isFinite(taxRate)||taxRate<0||taxRate>100)){setError("0–100 arasında KDV oranı gir.");return;}
    setBusy(true); setError("");
    const { data: id, error: saveError } = await db().rpc("save_quote_with_tax_rate", {
      p_tax_mode:taxMode,p_tax_rate:taxRate,
      p_quote_id: null, p_job_id: job.id, p_status: "ready", p_title: title.trim(),
      p_description: description.trim() || null, p_items: items.map(item => ({ name: item.name.trim(), description: item.description.trim() })),
      p_exclusions: [], p_duration: duration.trim() || null, p_payment_terms: payment.trim() || null,
      p_valid_until: validUntil, p_notes: notes.trim() || null, p_sale_price: null, p_acknowledge_risk: false,
    });
    setBusy(false);
    if (saveError || !id) { setError(saveError?.message.includes("BILLING_QUOTE_LIMIT")
      ? "Bu ayki teklif hakkını kullandın. Paketini kontrol et." : "Teklif oluşturulamadı. Bilgileri kontrol et."); return; }
    if (draftTimer.current) clearTimeout(draftTimer.current);
    setReady(false);
    if (draftKey) await secureStorage.removeItem(draftKey);
    router.replace({ pathname: "/quote/[id]", params: { id } });
  }
  return <Screen title="Teklif hazırla" subtitle={job ? `Satış fiyatı: ${money(job.selected_sale_price)}` : "İş yükleniyor..."}>
    {Boolean(error) && <Notice error>{error}</Notice>}
    {!job ? <Notice>İş bulunamadı.</Notice> : <>
      <Field label="Teklif başlığı" value={title} onChangeText={setTitle} />
      <Field label="Açıklama" value={description} onChangeText={setDescription} multiline />
      <SectionTitle>İş kapsamı</SectionTitle>
      {items.map((item, index) => <Card key={index}>
        <Field label={`Madde ${index + 1}`} value={item.name} onChangeText={value => setItems(current => current.map((row, i) =>
          i === index ? { ...row, name: value } : row))} />
        <Field label="Açıklama" value={item.description} onChangeText={value => setItems(current => current.map((row, i) =>
          i === index ? { ...row, description: value } : row))} />
      </Card>)}
      <Button title="Kapsam Maddesi Ekle" quiet onPress={() => setItems(current => [...current, { name: "", description: "" }])} />
      <SectionTitle>KDV ve toplam</SectionTitle>{Object.entries(taxLabels).map(([k,label])=><Choice key={k} title={label} selected={taxMode===k} onPress={()=>setTaxMode(k as TaxMode)}/>)}{taxMode!=="unspecified"&&<Field label="KDV oranı (%)" value={taxRateText} onChangeText={setTaxRateText} keyboardType="decimal-pad"/>}<Notice>Fiyat vergisiz tutardır. Müşteri toplamı: {money(quoteAmounts(job.selected_sale_price??0,taxMode,taxRateText.trim()?Number(taxRateText.replace(",",".")):null).total)}</Notice><SectionTitle>Koşullar</SectionTitle>
      <Field label="Tahmini süre" value={duration} onChangeText={setDuration} placeholder="Örnek: 3 iş günü" />
      <Field label="Ödeme koşulları" value={payment} onChangeText={setPayment} multiline />
      <Field label="Geçerlilik tarihi (YYYY-AA-GG)" value={validUntil} onChangeText={setValidUntil} />
      <Field label="Notlar" value={notes} onChangeText={setNotes} multiline />
      <Button title={busy ? "Oluşturuluyor..." : "Teklifi Oluştur"} disabled={busy} onPress={save} />
      <Button title="Geri" quiet onPress={() => router.back()} />
    </>}
  </Screen>;
}

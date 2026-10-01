import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import { Text } from "react-native";
import type { BusinessCostItem, Customer } from "@kacayapayim/core/types";
import { calculateProfessionJob } from "@kacayapayim/core/professions/engine";
import { validateFieldValues, type FieldValues, type ProfessionTemplate } from "@kacayapayim/core/professions/schema";
import { calculatePricingSummary } from "@kacayapayim/core/pricing";
import { DynamicForm } from "@/src/components/dynamic-form";
import { Button, Card, Choice, Field, Notice, Screen, SectionTitle, palette } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db, secureStorage } from "@/src/lib/supabase";
import { errorText, money } from "@/src/lib/format";
import { saveMobileJob } from "@/src/lib/mobile-api";

export default function NewJob() {
  const { business, session } = useAppSession(); const [template, setTemplate] = useState<ProfessionTemplate | null>(null);
  const [costs, setCosts] = useState<BusinessCostItem[]>([]); const [settings, setSettings] = useState<Record<string, number>>({});
  const [customers, setCustomers] = useState<Customer[]>([]); const [customerId, setCustomerId] = useState<string | null>(null);
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  const [values, setValues] = useState<FieldValues>({}); const [ready, setReady] = useState(false);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftKey = session ? `job_draft_${session.user.id}` : "";
  useEffect(() => {
    if (!business?.profession_id) return;
    let active = true;
    async function load() {
      try {
        const client = db();
        const { data: profession } = await client.from("professions").select("current_version")
          .eq("id", business!.profession_id!).eq("is_active", true).eq("is_public", true).single();
        if (!profession?.current_version) throw new Error("Yayınlanmış meslek şablonu bulunamadı.");
        const { data: version } = await client.from("profession_template_versions").select("template")
          .eq("profession_id", business!.profession_id!).eq("version", profession.current_version)
          .eq("status", "published").single();
        if (!version) throw new Error("İş formu yüklenemedi.");
        const loaded = version.template as ProfessionTemplate;
        await client.rpc("ensure_my_cost_defaults");
        const [costResult, settingsResult, customerResult, draft] = await Promise.all([
          client.from("business_cost_items").select("*").eq("business_id", business!.id),
          client.from("business_profession_settings").select("settings").eq("business_id", business!.id)
            .eq("profession_id", business!.profession_id!).maybeSingle(),
          client.from("customers").select("*").eq("business_id", business!.id).eq("is_archived", false).order("name").limit(100),
          draftKey ? secureStorage.getItem(draftKey) : Promise.resolve(null),
        ]);
        if (costResult.error || settingsResult.error || customerResult.error) throw new Error("İş verileri yüklenemedi.");
        if (!active) return;
        setTemplate(loaded); setCosts(costResult.data || []);
        setSettings(settingsResult.data?.settings as Record<string, number> || {});
        setCustomers(customerResult.data || []);
        if (draft) {
          try {
            const parsed = JSON.parse(draft) as { professionId: string; title: string; description: string;
              customerId: string | null; values: FieldValues };
            if (parsed.professionId === business!.profession_id) {
              setTitle(parsed.title); setDescription(parsed.description); setCustomerId(parsed.customerId); setValues(parsed.values);
            }
          } catch { /* Expired local draft can be ignored. */ }
        }
        setReady(true);
      } catch (cause) { if (active) setError(errorText(cause)); }
    }
    void load(); return () => { active = false; };
  }, [business, draftKey]);
  useEffect(() => {
    if (!ready || !draftKey || !business) return;
    draftTimer.current = setTimeout(() => {
      void secureStorage.setItem(draftKey, JSON.stringify({ professionId: business.profession_id,
        title, description, customerId, values })).catch(() => {});
    }, 400);
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current); };
  }, [ready, draftKey, business, title, description, customerId, values]);
  const preview = useMemo(() => {
    if (!template) return null;
    try {
      const validated = validateFieldValues(template, values);
      if (Object.keys(validated.errors).length) return null;
      const calculation = calculateProfessionJob({ template, fieldValues: values, businessCosts: costs,
        businessSettings: settings });
      const pricing = business ? calculatePricingSummary(calculation.totalCost,
        business.default_profit_margin, business.minimum_profit_margin) : null;
      return { calculation, pricing };
    } catch { return null; }
  }, [template, values, costs, settings, business]);
  async function save() {
    if (!template || !business || !title.trim()) { setError("İş başlığını ve formu kontrol et."); return; }
    setBusy(true); setError("");
    try {
      const result = await saveMobileJob({ jobId: null, customerId, title: title.trim(), description,
        fields: values as Record<string, unknown> });
      if (draftTimer.current) clearTimeout(draftTimer.current);
      setReady(false);
      await secureStorage.removeItem(draftKey);
      router.replace({ pathname: "/job/[id]", params: { id: result.id } });
    } catch (cause) { setError(errorText(cause)); } finally { setBusy(false); }
  }
  return <Screen title="Yeni iş" subtitle={business?.profession || "Meslek iş formu"}>
    {Boolean(error) && <Notice error>{error}</Notice>}
    {!template && !error && <Notice>İş formu yükleniyor...</Notice>}
    {template && <>
      <Field label="İş başlığı" value={title} onChangeText={setTitle} placeholder="Örnek: Salon boya işi" />
      <Field label="Açıklama (isteğe bağlı)" value={description} onChangeText={setDescription} multiline />
      <SectionTitle>Müşteri</SectionTitle>
      <Choice title="Şimdilik müşteri seçme" selected={!customerId} onPress={() => setCustomerId(null)} />
      {customers.map(item => <Choice key={item.id} title={item.name} selected={customerId === item.id}
        onPress={() => setCustomerId(item.id)} />)}
      {!customers.length && <Notice>Teklif oluşturmak için müşteri gerekli. Önce müşterini ekleyebilirsin.</Notice>}
      <Button title="Müşteri Ekle" quiet onPress={() => router.push({ pathname: "/customer/new", params: { returnTo: "job" } })} />
      <DynamicForm template={template} values={values} onChange={setValues} />
      {preview ? <Card style={{ backgroundColor: palette.blueSoft }}>
        <Text style={{ color: palette.muted }}>Tahmini gerçek maliyet</Text>
        <Text style={{ color: palette.text, fontSize: 26, fontWeight: "700", marginTop: 4 }}>{money(preview.calculation.totalCost)}</Text>
        <Text style={{ color: palette.muted, marginTop: 15 }}>Hedef marjla önerilen fiyat</Text>
        <Text style={{ color: palette.blue, fontSize: 28, fontWeight: "700", marginTop: 3 }}>{money(preview.pricing?.roundedRecommendedPrice)}</Text>
        {preview.calculation.warnings.map(warning => <Text key={warning} style={{ color: palette.red, marginTop: 8 }}>{warning}</Text>)}
      </Card> : <Notice>Sonuç için zorunlu alanları ve maliyetlerini tamamla. Eksik birim fiyat varsa Maliyetlerim ekranından güncelle.</Notice>}
      <Button title={busy ? "Kaydediliyor..." : "Hesapla ve Kaydet"} disabled={busy || !preview} onPress={save} />
      <Button title="Maliyetlerim" quiet onPress={() => router.push("/costs")} />
      <Button title="Geri" quiet onPress={() => router.back()} />
    </>}
  </Screen>;
}

import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import { Text } from "react-native";
import * as Crypto from "expo-crypto";
import type { BusinessCostItem, CostCategory, CostUnit } from "@kacayapayim/core/types";
import { Button, Card, Choice, Empty, Field, Notice, Screen, SectionTitle, palette } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";
import { money, numberFromInput } from "@/src/lib/format";

const categories: { value: CostCategory; label: string }[] = [
  { value: "material", label: "Malzeme" }, { value: "labor", label: "İşçilik" },
  { value: "transport", label: "Yol" }, { value: "consumable", label: "Sarf" }, { value: "other", label: "Diğer" },
];
const units: { value: CostUnit; label: string }[] = [
  { value: "piece", label: "Adet" }, { value: "liter", label: "Litre" }, { value: "meter", label: "Metre" },
  { value: "square_meter", label: "m²" }, { value: "hour", label: "Saat" }, { value: "day", label: "Gün" },
  { value: "fixed", label: "Sabit" },
];
export default function Costs() {
  const { business } = useAppSession(); const [rows, setRows] = useState<BusinessCostItem[]>([]);
  const [editing, setEditing] = useState<BusinessCostItem | null>(null);
  const [price, setPrice] = useState(""); const [name, setName] = useState("");
  const [category, setCategory] = useState<CostCategory>("material"); const [unit, setUnit] = useState<CostUnit>("piece");
  const [adding, setAdding] = useState(false); const [error, setError] = useState("");
  const reload = useCallback(async () => {
    if (!business) return;
    const initialization = await db().rpc("ensure_my_cost_defaults");
    if (initialization.error) { setError("Hazır maliyetler yüklenemedi."); return; }
    const { data, error: readError } = await db().from("business_cost_items").select("*")
      .eq("business_id", business.id).order("sort_order").order("created_at");
    if (readError) setError("Maliyetler yüklenemedi."); else { setRows(data || []); setError(""); }
  }, [business]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  async function savePrice() {
    if (!editing || !business) return;
    const value = numberFromInput(price);
    if (!Number.isFinite(value) || value < 0 || value > 1e9) { setError("Geçerli bir tutar gir."); return; }
    const { error: saveError } = await db().from("business_cost_items").update({ unit_cost: value })
      .eq("id", editing.id).eq("business_id", business.id);
    if (saveError) { setError("Maliyet kaydedilemedi."); return; }
    setEditing(null); await reload();
  }
  async function add() {
    if (!business) return;
    const value = numberFromInput(price);
    if (!name.trim() || name.length > 120 || !Number.isFinite(value) || value < 0 || value > 1e9) {
      setError("Ad ve tutarı kontrol et."); return;
    }
    const { error: saveError } = await db().from("business_cost_items").insert({ business_id: business.id,
      template_id: null, key: `custom_${Crypto.randomUUID().replaceAll("-", "")}`, name: name.trim(),
      category, unit, unit_cost: value, is_active: true });
    if (saveError) { setError("Ek maliyet kaydedilemedi."); return; }
    setAdding(false); setName(""); setPrice(""); await reload();
  }
  return <Screen title="Maliyetlerim" subtitle="Hesaplamada kullandığın birim fiyatları güncelle.">
    {Boolean(error) && <Notice error>{error}</Notice>}
    {editing ? <Card><SectionTitle>{editing.name}</SectionTitle>
      <Text style={{ color: palette.muted, marginBottom: 16 }}>Bu maliyet yeni hesaplamalarda kullanılacak.</Text>
      <Field label="Birim maliyet (TL)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <Button title="Kaydet" onPress={savePrice} /><Button title="Vazgeç" quiet onPress={() => setEditing(null)} />
    </Card> : adding ? <Card><Field label="Maliyet adı" value={name} onChangeText={setName} />
      <Field label="Birim fiyat (TL)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <SectionTitle>Kategori</SectionTitle>{categories.map(item => <Choice key={item.value} title={item.label}
        selected={category === item.value} onPress={() => setCategory(item.value)} />)}
      <SectionTitle>Birim</SectionTitle>{units.map(item => <Choice key={item.value} title={item.label}
        selected={unit === item.value} onPress={() => setUnit(item.value)} />)}
      <Button title="Ek Maliyeti Kaydet" onPress={add} /><Button title="Vazgeç" quiet onPress={() => setAdding(false)} />
    </Card> : <>
      <Button title="Ek Maliyet Ekle" onPress={() => { setAdding(true); setPrice(""); }} />
      {rows.length ? <Card>{rows.map(item => <Text key={item.id} onPress={() => {
        setEditing(item); setPrice(String(item.unit_cost)); setError("");
      }} accessibilityRole="button" style={{ paddingVertical: 13, color: palette.text, fontSize: 15,
        borderBottomWidth: 1, borderColor: palette.border }}>
        {item.name}  ·  {money(item.unit_cost)}{item.is_active ? "" : "  (pasif)"}
      </Text>)}</Card> : !error && <Empty title="Maliyet bulunamadı" detail="Meslek seçiminin ardından hazır maliyetler burada görünür." />}
      <Button title="İşlere Dön" quiet onPress={() => router.back()} />
    </>}
  </Screen>;
}

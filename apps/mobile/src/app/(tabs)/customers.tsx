import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import type { Customer } from "@kacayapayim/core/types";
import { Button, Card, Empty, Field, Notice, Row, Screen } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";

export default function Customers() {
  const { business } = useAppSession(); const [rows, setRows] = useState<Customer[]>([]);
  const [error, setError] = useState(""); const [query, setQuery] = useState(""); const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 30;
  const page = useCallback(async (offset: number, search: string) => {
    if (!business) return null;
    let request = db().from("customers").select("*").eq("business_id", business.id).eq("is_archived", false).order("name");
    if (search.trim()) request = request.ilike("name", `%${search.trim().slice(0, 80)}%`);
    return request.range(offset, offset + pageSize - 1);
  }, [business]);
  useFocusEffect(useCallback(() => {
    if (!business) return;
    let active = true;
    const timer = setTimeout(() => { void page(0, query).then(result => {
        if (!active) return;
        if (result?.error) setError("Müşteriler yüklenemedi.");
        else { setRows(result?.data || []); setHasMore((result?.data || []).length === pageSize); setError(""); }
      }); }, query ? 300 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [business, query, page]));
  async function more() {
    setLoadingMore(true);
    const result = await page(rows.length, query);
    setLoadingMore(false);
    if (result?.error) { setError("Daha fazla müşteri yüklenemedi."); return; }
    setRows(current => [...current, ...(result?.data || []).filter(item => !current.some(existing => existing.id === item.id))]);
    setHasMore((result?.data || []).length === pageSize);
  }
  return <Screen title="Müşteriler" subtitle="Tekliflerini kime verdiğini takip et.">
    <Button title="Müşteri Ekle" onPress={() => router.push("/customer/new")} />
    <Field label="Müşteri ara" value={query} onChangeText={setQuery} placeholder="Ada göre ara" />
    {Boolean(error) && <Notice error>{error}</Notice>}
    {rows.length ? <Card>{rows.map(item => <Row key={item.id} title={item.name}
      subtitle={[item.company_name, item.phone].filter(Boolean).join(" · ") || undefined}
      onPress={() => router.push({ pathname: "/customer/[id]", params: { id: item.id } })} />)}</Card>
      : !error && <Empty title={query ? "Sonuç bulunamadı" : "Henüz müşteri yok"} detail={query ? "Başka bir ad dene." : "İlk teklifini hazırlamadan önce müşterini ekleyebilirsin."} />}
    {hasMore && <Button title={loadingMore ? "Yükleniyor..." : "Daha Fazla Göster"} quiet disabled={loadingMore} onPress={() => { void more(); }} />}
  </Screen>;
}

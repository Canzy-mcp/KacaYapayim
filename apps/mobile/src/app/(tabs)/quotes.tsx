import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import type { Quote } from "@kacayapayim/core/types";
import { Button, Card, Empty, Field, Notice, Row, Screen } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";
import { date, money } from "@/src/lib/format";

export default function Quotes() {
  const { business } = useAppSession(); const [rows, setRows] = useState<Quote[]>([]); const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const page = useCallback(async (offset: number, search: string) => {
    if (!business) return null;
    let request = db().from("quotes").select("*").eq("business_id", business.id)
      .order("created_at", { ascending: false });
    if (search.trim()) request = request.ilike("title", `%${search.trim().slice(0, 80)}%`);
    return request.range(offset, offset + 29);
  }, [business]);
  useFocusEffect(useCallback(() => {
    if (!business) return;
    let active = true;
    const timer = setTimeout(() => { void page(0, query).then(result => {
        if (!active) return;
        if (result?.error) setError("Teklifler yüklenemedi.");
        else { setRows(result?.data || []); setHasMore((result?.data || []).length === 30); setError(""); }
      }); }, query ? 300 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [business, query, page]));
  async function more() {
    if (loadingMore) return;
    setLoadingMore(true);
    const result = await page(rows.length, query);
    setLoadingMore(false);
    if (result?.error) { setError("Daha fazla teklif yüklenemedi."); return; }
    setRows(current => [...current, ...(result?.data || []).filter(item => !current.some(existing => existing.id === item.id))]);
    setHasMore((result?.data || []).length === 30);
  }
  return <Screen title="Teklifler" subtitle="Hazırladığın ve paylaştığın teklifler.">
    <Field label="Teklif ara" value={query} onChangeText={setQuery} placeholder="Başlığa göre ara" />
    {Boolean(error) && <Notice error>{error}</Notice>}
    {rows.length ? <Card>{rows.map(item => <Row key={item.id} title={item.title}
      subtitle={`${item.quote_number} · ${item.status} · ${date(item.created_at)}`} right={money(item.sale_price)}
      onPress={() => router.push({ pathname: "/quote/[id]", params: { id: item.id } })} />)}</Card>
      : !error && <Empty title={query ? "Sonuç bulunamadı" : "Henüz teklif yok"}
        detail={query ? "Başka bir başlık dene." : "Bir işin maliyetini hesaplayıp fiyatını kaydettikten sonra teklif oluşturabilirsin."} />}
    {hasMore && <Button title={loadingMore ? "Yükleniyor..." : "Daha Fazla Göster"} quiet disabled={loadingMore} onPress={() => { void more(); }} />}
    <Button title="İşlere Git" quiet onPress={() => router.push("/(tabs)/jobs")} />
  </Screen>;
}

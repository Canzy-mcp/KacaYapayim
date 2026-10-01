import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import type { Job } from "@kacayapayim/core/types";
import { Button, Card, Empty, Notice, Row, Screen } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";
import { date, money } from "@/src/lib/format";

export default function Jobs() {
  const { business } = useAppSession(); const [rows, setRows] = useState<Job[]>([]); const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const page = useCallback(async (offset: number) => business ? db().from("jobs").select("*")
    .eq("business_id", business.id).order("created_at", { ascending: false }).range(offset, offset + 29) : null, [business]);
  useFocusEffect(useCallback(() => {
    if (!business) return;
    let active = true;
    void page(0).then(result => {
        if (!active) return;
        if (result?.error) setError("İşler yüklenemedi.");
        else { setRows(result?.data || []); setHasMore((result?.data || []).length === 30); setError(""); }
      });
    return () => { active = false; };
  }, [business, page]));
  async function more() {
    if (loadingMore) return;
    setLoadingMore(true);
    const result = await page(rows.length);
    setLoadingMore(false);
    if (result?.error) { setError("Daha fazla iş yüklenemedi."); return; }
    setRows(current => [...current, ...(result?.data || []).filter(item => !current.some(existing => existing.id === item.id))]);
    setHasMore((result?.data || []).length === 30);
  }
  return <Screen title="İşler" subtitle="Maliyet, teklif ve gerçekleşen kâr bir arada.">
    <Button title="Yeni İş Hesapla" onPress={() => router.push("/job/new")} />
    {Boolean(error) && <Notice error>{error}</Notice>}
    {rows.length ? <Card>{rows.map(job => <Row key={job.id} title={job.title}
      subtitle={`${date(job.created_at)} · ${job.status}`} right={money(job.estimated_cost)}
      onPress={() => router.push({ pathname: "/job/[id]", params: { id: job.id } })} />)}</Card>
      : !error && <Empty title="Henüz iş yok" detail="Malzeme ve işçilik bilgilerini girerek ilk işini hesapla." />}
    {hasMore && <Button title={loadingMore ? "Yükleniyor..." : "Daha Fazla Göster"} quiet disabled={loadingMore} onPress={() => { void more(); }} />}
  </Screen>;
}

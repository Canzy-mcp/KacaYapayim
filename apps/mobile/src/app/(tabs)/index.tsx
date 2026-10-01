import { useCallback, useState } from "react";
import { useFocusEffect, router } from "expo-router";
import { Text, View } from "react-native";
import type { Job, Quote } from "@kacayapayim/core/types";
import { Button, Card, Empty, Notice, Row, Screen, SectionTitle, palette } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";
import { money, date } from "@/src/lib/format";

export default function Dashboard() {
  const { business, profile } = useAppSession();
  const [jobs, setJobs] = useState<Job[]>([]); const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState("");
  useFocusEffect(useCallback(() => {
    if (!business) return;
    let active = true;
    void Promise.all([
      db().from("jobs").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(5),
      db().from("quotes").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(5),
    ]).then(([jobResult, quoteResult]) => {
      if (!active) return;
      if (jobResult.error || quoteResult.error) setError("Özet şu anda yüklenemedi. Bağlantını kontrol et.");
      else { setJobs(jobResult.data || []); setQuotes(quoteResult.data || []); setError(""); }
    });
    return () => { active = false; };
  }, [business]));
  return <Screen title={`Merhaba${profile?.first_name ? `, ${profile.first_name}` : ""}.`}
    subtitle={business?.name || "İşletmenin özeti"}>
    <Card style={{ backgroundColor: "#152D49", borderColor: "#152D49" }}>
      <Text style={{ color: "#D0E5FF", fontSize: 13 }}>Hedef kâr marjın</Text>
      <Text style={{ color: "white", fontSize: 34, fontWeight: "700", marginTop: 4 }}>%{business?.default_profit_margin || 0}</Text>
      <Text style={{ color: "#D0E5FF", marginTop: 5 }}>Önce gerçek maliyetini gör, sonra fiyatını belirle.</Text>
      <Button title="Yeni İş Hesapla" onPress={() => router.push("/job/new")} />
    </Card>
    {Boolean(error) && <Notice error>{error}</Notice>}
    <View style={{ flexDirection: "row", gap: 10 }}>
      <Card style={{ flex: 1 }}><Text style={{ color: palette.muted }}>Son işler</Text>
        <Text style={{ fontSize: 27, fontWeight: "700", color: palette.text, marginTop: 5 }}>{jobs.length}</Text></Card>
      <Card style={{ flex: 1 }}><Text style={{ color: palette.muted }}>Son teklifler</Text>
        <Text style={{ fontSize: 27, fontWeight: "700", color: palette.text, marginTop: 5 }}>{quotes.length}</Text></Card>
    </View>
    <SectionTitle>Son işler</SectionTitle>
    {jobs.length ? <Card>{jobs.map(job => <Row key={job.id} title={job.title}
      subtitle={`${date(job.created_at)} · ${job.status}`} right={money(job.estimated_cost)}
      onPress={() => router.push({ pathname: "/job/[id]", params: { id: job.id } })} />)}</Card>
      : <Empty title="Henüz iş yok" detail="İlk işini eklediğinde maliyet ve fiyat burada görünecek." />}
  </Screen>;
}

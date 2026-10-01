import { brandImageDataUri } from "@/src/lib/brand";
import { useCallback, useState } from "react";
import { Linking, Share, Text } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { Customer, Quote, QuoteItem } from "@kacayapayim/core/types";
import { Button, Card, Notice, Row, Screen, SectionTitle, palette } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { db } from "@/src/lib/supabase";
import { date, money } from "@/src/lib/format";

const escape = (value: string) => value.replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);

export default function QuoteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { business } = useAppSession();
  const [quote, setQuote] = useState<Quote | null>(null); const [items, setItems] = useState<QuoteItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null); const [error, setError] = useState("");
  const reload = useCallback(async () => {
    if (!id || !business) return;
    const [quoteResult, itemResult] = await Promise.all([
      db().from("quotes").select("*").eq("id", id).eq("business_id", business.id).maybeSingle(),
      db().from("quote_items").select("*").eq("quote_id", id).order("sort_order"),
    ]);
    if (quoteResult.error || itemResult.error) { setError("Teklif yüklenemedi."); return; }
    setQuote(quoteResult.data); setItems(itemResult.data || []);
    if (quoteResult.data?.customer_id) {
      const { data } = await db().from("customers").select("*").eq("id", quoteResult.data.customer_id)
        .eq("business_id", business.id).maybeSingle();
      setCustomer(data);
    }
  }, [id, business]);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, "");
  const publicUrl = quote && webUrl ? `${webUrl}/t/${quote.public_token}` : null;
  async function share() {
    if (!quote || !publicUrl) { setError("Public web adresi ayarlanmamış."); return; }
    try {
      const result = await Share.share({ title: "KaçaYapayım Teklif", message: `${quote.title}\n${publicUrl}`, url: publicUrl });
      if (result.action === Share.sharedAction) {
        const { error: markError } = await db().rpc("mark_quote_sent", { p_quote_id: quote.id });
        if (markError) setError("Paylaşım açıldı ancak gönderildi durumu kaydedilemedi."); else await reload();
      }
    } catch { setError("Paylaşım açılamadı."); }
  }
  async function pdf() {
    if (!quote || !business) return;
    try {
      const html = `<html><head><meta name="viewport" content="width=device-width" />
        <style>body{font-family:-apple-system,Arial,sans-serif;color:#1d1d1f;padding:36px}h1{font-size:28px}
        .brand{color:#0071e3;font-weight:700}.muted{color:#6e6e73}.line{border-bottom:1px solid #ddd;padding:12px 0}
        .price{font-size:28px;font-weight:700;margin-top:25px}</style></head><body>
        <div class="brand"><img src="${brandImageDataUri}" alt="KaçaYapayım" width="36" height="36" style="vertical-align:middle;margin-right:8px"/>KaçaYapayım</div><h1>${escape(quote.title)}</h1>
        <p class="muted">${escape(business.name)} · ${escape(quote.quote_number)}</p>
        <p>Müşteri: ${escape(customer?.name || "")}</p>
        ${quote.description ? `<p>${escape(quote.description)}</p>` : ""}
        <h2>İş kapsamı</h2>${items.map(item => `<div class="line"><strong>${escape(item.name)}</strong><br/>${escape(item.description || "")}</div>`).join("")}
        <p class="price">${escape(money(quote.sale_price))}</p>
        <p>Geçerlilik: ${escape(date(quote.valid_until))}</p>
        ${quote.estimated_duration_text ? `<p>Süre: ${escape(quote.estimated_duration_text)}</p>` : ""}
        ${quote.payment_terms ? `<p>Ödeme: ${escape(quote.payment_terms)}</p>` : ""}
        ${quote.notes ? `<p>Not: ${escape(quote.notes)}</p>` : ""}
        </body></html>`;
      const result = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: "application/pdf", dialogTitle: "Teklifi paylaş" });
      else setError("Bu cihazda PDF paylaşımı kullanılamıyor.");
    } catch { setError("PDF oluşturulamadı."); }
  }
  return <Screen title="Teklif" subtitle={quote ? `${quote.quote_number} · ${quote.status}` : "Yükleniyor..."}>
    {Boolean(error) && <Notice error>{error}</Notice>}
    {!quote ? <Notice>Teklif bulunamadı veya yüklenemedi.</Notice> : <>
      <Card><Text style={{ color: palette.muted }}>{customer?.name || "Müşteri"}</Text>
        <Text style={{ fontSize: 23, color: palette.text, fontWeight: "700", marginTop: 8 }}>{quote.title}</Text>
        <Text style={{ color: palette.muted, marginTop: 8 }}>{quote.description}</Text>
        <Text style={{ color: palette.blue, fontSize: 30, fontWeight: "700", marginTop: 24 }}>{money(quote.sale_price)}</Text>
        <Text style={{ color: palette.muted, marginTop: 6 }}>Geçerlilik: {date(quote.valid_until)}</Text>
      </Card>
      <SectionTitle>İş kapsamı</SectionTitle>
      <Card>{items.map(item => <Row key={item.id} title={item.name} subtitle={item.description || undefined} />)}</Card>
      {Boolean(quote.payment_terms) && <><SectionTitle>Ödeme koşulları</SectionTitle><Card><Text>{quote.payment_terms}</Text></Card></>}
      {quote.status !== "draft" && <>
        <Button title="Teklifi Paylaş" onPress={() => { void share(); }} />
        <Button title="PDF Paylaş" quiet onPress={() => { void pdf(); }} />
        {Boolean(publicUrl) && <Button title="Müşteri Görünümünü Aç" quiet onPress={() => { if (publicUrl) void Linking.openURL(publicUrl); }} />}
      </>}
      {Boolean(quote.viewed_at) && <Notice>Teklif {date(quote.viewed_at)} tarihinde görüntülendi.</Notice>}
      {quote.status === "accepted" && <Notice>Müşteri teklifi kabul etti. İşler ekranından devam edebilirsin.</Notice>}
      <Button title="Tekliflere Dön" quiet onPress={() => router.replace("/(tabs)/quotes")} />
    </>}
  </Screen>;
}

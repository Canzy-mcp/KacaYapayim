import { useCallback, useRef, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import { Button, Choice, Notice, Screen, palette } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { writeMarket } from "@/src/lib/marketplace";
import type { MarketAction, MarketCategory } from "@kacayapayim/core/marketplace";

export function useMarketLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState("");
  const generation = useRef(0);
  const [refresh, setRefresh] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setError("");
    void load().then((value) => { if (active && refresh === generation.current) setData(value); }).catch((cause: unknown) => {
      if (active && refresh === generation.current) setError(cause instanceof Error ? cause.message : "Bilgiler yüklenemedi.");
    });
    return () => { active = false; };
  }, [load, refresh]));
  return { data, error, refresh: () => { generation.current += 1; setRefresh(generation.current); } };
}

export function useMarketWrite(refresh: () => void) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean }>();
  async function run(action: MarketAction, payload: Record<string, string | string[] | boolean>, success?: (id: string | null) => void) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setNotice(undefined);
    try {
      const id = await writeMarket(action, payload);
      success?.(id);
      setNotice({ text: "Kaydedildi." });
      refresh();
    } catch (cause) {
      setNotice({ text: cause instanceof Error ? cause.message : "İşlem tamamlanamadı.", error: true });
    } finally { lock.current = false; setBusy(false); }
  }
  return { run, busy, notice };
}

export function ServiceScreen({ title, children }: { title: string; children: React.ReactNode }) {
  return <Screen title={title}><Button title="Hizmet merkezine dön" quiet onPress={() => router.navigate("/hizmet")} />{children}</Screen>;
}

export function RequireMarketUser({ children }: { children: React.ReactNode }) {
  const { session, loading, requiresMfa } = useAppSession();
  if (loading) return <Screen><Notice>Oturum kontrol ediliyor…</Notice></Screen>;
  if (!session) return <ServiceScreen title="Hesabınla devam et"><Button title="Giriş yap" onPress={() => router.push({ pathname: "/(auth)/login", params: { next: "/hizmet" } })} />
    <Button title="Hesap oluştur" quiet onPress={() => router.push({ pathname: "/(auth)/register", params: { hesap: "musteri" } })} /></ServiceScreen>;
  if (requiresMfa) return <ServiceScreen title="Girişini doğrula"><Button title="İki aşamalı doğrulama" onPress={() => router.push("/mfa")} /></ServiceScreen>;
  return <>{children}</>;
}

export function ServiceCategories({ categories, selected, toggle }: { categories: MarketCategory[]; selected: string[]; toggle: (key: string) => void }) {
  return <View style={{ marginTop: 8 }}>{categories.map((category) => <Choice key={category.slug} title={category.name} selected={selected.includes(category.slug)} onPress={() => toggle(category.slug)} />)}</View>;
}

export function ServiceText({ children }: { children: React.ReactNode }) {
  return <Text style={{ marginTop: 8, color: palette.muted, lineHeight: 21 }}>{children}</Text>;
}

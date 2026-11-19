import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { router, useFocusEffect } from "expo-router";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Notice, palette } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { writeMarket } from "@/src/lib/marketplace";
import type { MarketAction, MarketCategory } from "@kacayapayim/core/marketplace";

type MarketFeedback = { text: string; error?: boolean; action: MarketAction };

export function useMarketLoad<T>(load: () => Promise<T>) {
  const [result, setResult] = useState<{ load: typeof load; data?: T; error?: string; loading: boolean }>();
  const generation = useRef(0);
  const [refresh, setRefresh] = useState(0);
  const reload = useCallback(() => { generation.current += 1; setRefresh(generation.current); }, []);
  useFocusEffect(useCallback(() => {
    let active = true;
    setResult((previous) => ({ load, data: previous?.load === load ? previous.data : undefined, loading: true }));
    void Promise.resolve().then(load).then((data) => {
      if (active && refresh === generation.current) setResult({ load, data, loading: false });
    }).catch((cause: unknown) => {
      if (active && refresh === generation.current) {
        setResult((previous) => ({ load, data: previous?.load === load ? previous.data : undefined,
          error: cause instanceof Error ? cause.message : "Bilgiler yüklenemedi.", loading: false }));
      }
    });
    return () => { active = false; };
  }, [load, refresh]));
  const current = result?.load === load ? result : undefined;
  return { data: current?.data, error: current?.error, loading: current?.loading ?? true, refresh: reload };
}

export function useMarketWrite(refresh: () => void) {
  const lock = useRef(false);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<MarketFeedback>();

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function run(action: MarketAction, payload: Record<string, string | string[] | boolean>, success?: (id: string | null) => void) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setNotice(undefined);
    try {
      const id = await writeMarket(action, payload);
      if (mounted.current) {
        success?.(id);
        setNotice({ text: "Kaydedildi.", action });
        refresh();
      }
      return true;
    } catch (cause) {
      if (mounted.current) setNotice({ text: cause instanceof Error ? cause.message : "İşlem tamamlanamadı.", error: true, action });
      return false;
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return { run, busy, notice };
}

export function ServiceScreen({ title, subtitle, home, children }: { title: string; subtitle?: string; home?: boolean; children: ReactNode }) {
  return <SafeAreaView style={styles.screen}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <Image source={require("../../assets/images/favicon.png")} accessible={false} style={styles.logo} />
          <Text style={styles.wordmark}>KaçaYapayım</Text>
        </View>
        {!home && <Pressable accessibilityRole="button" accessibilityLabel="Geri dön" onPress={() => {
          if (router.canGoBack()) router.back();
          else router.replace("/hizmet");
        }} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
          <Text style={styles.backText}>‹  Geri</Text>
        </Pressable>}
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>
    </ScrollView>
  </SafeAreaView>;
}

export function ServiceLoadState({ loading, error, refresh }: { loading: boolean; error?: string; refresh?: () => void }) {
  if (error) return <View accessibilityLiveRegion="polite">
    <Notice error>{error}</Notice>
    {refresh && <Button title="Tekrar dene" quiet onPress={refresh} />}
  </View>;
  if (loading) return <View style={styles.progress} accessibilityLiveRegion="polite" accessibilityRole="progressbar">
    <ActivityIndicator color={palette.blue} />
    <Text style={styles.progressText}>Yükleniyor…</Text>
  </View>;
  return null;
}

export function ServiceFeedback({ notice, actions }: { notice?: MarketFeedback; actions?: MarketAction[] }) {
  if (!notice || actions && !actions.includes(notice.action)) return null;
  return <View accessibilityLiveRegion="polite" accessibilityRole={notice.error ? "alert" : undefined}>
    <Notice error={notice.error}>{notice.text}</Notice>
  </View>;
}

export function RequireMarketUser({ children, next = "/hizmet" }: { children: ReactNode; next?: string }) {
  const { session, loading, requiresMfa } = useAppSession();
  if (loading) return <ServiceScreen title="Oturum kontrol ediliyor"><ServiceLoadState loading /></ServiceScreen>;
  if (!session) return <ServiceScreen title="Hesabınla devam et" subtitle="İlan vermek, ustaya çağrı göndermek ve taleplerini yönetmek için giriş yap.">
    <Button title="Giriş yap" onPress={() => router.push({ pathname: "/(auth)/login", params: { next } })} />
    <Button title="Hesap oluştur" quiet onPress={() => router.push({ pathname: "/(auth)/register", params: { hesap: "musteri", next } })} /></ServiceScreen>;
  if (requiresMfa) return <ServiceScreen title="Girişini doğrula">
    <Button title="İki aşamalı doğrulama" onPress={() => router.push({ pathname: "/mfa", params: { next } })} />
  </ServiceScreen>;
  return <Fragment key={session.user.id}>{children}</Fragment>;
}

export function ServiceCategories({ categories, selected, toggle, multiple = false }: {
  categories: MarketCategory[]; selected: string[]; toggle: (key: string) => void; multiple?: boolean;
}) {
  return <View style={styles.chips}>{categories.map((category) => {
    const checked = selected.includes(category.slug);
    return <Pressable key={category.slug} accessibilityRole={multiple ? "checkbox" : "radio"}
      accessibilityState={{ checked }} onPress={() => toggle(category.slug)}
      style={({ pressed }) => [styles.chip, checked && styles.selectedChip, pressed && styles.pressed]}>
      <Text style={[styles.chipText, checked && styles.selectedChipText]}>{category.name}</Text>
    </Pressable>;
  })}</View>;
}

export function ServiceText({ children }: { children: ReactNode }) {
  return <Text style={styles.serviceText}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  scroll: { flexGrow: 1 },
  content: { alignSelf: "center", width: "100%", maxWidth: 720, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  logo: { width: 26, height: 26, borderRadius: 7 },
  wordmark: { color: palette.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.4 },
  back: { minHeight: 44, alignSelf: "flex-start", justifyContent: "center", paddingRight: 12 },
  backText: { color: palette.blue, fontSize: 16, fontWeight: "600" },
  title: { color: palette.text, fontSize: 36, fontWeight: "700", letterSpacing: -1.3, marginBottom: 6 },
  subtitle: { color: palette.muted, fontSize: 16, lineHeight: 24, marginBottom: 10 },
  progress: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 16 },
  progressText: { color: palette.muted, fontSize: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, marginBottom: 14 },
  chip: { alignItems: "center", justifyContent: "center", minHeight: 44, borderRadius: 15, paddingHorizontal: 14, borderWidth: 1, borderColor: palette.border },
  chipText: { color: palette.text, fontSize: 14, fontWeight: "600" },
  selectedChip: { backgroundColor: palette.blueSoft, borderColor: palette.blue },
  selectedChipText: { color: "#0058B0" },
  pressed: { opacity: 0.72 },
  serviceText: { marginTop: 8, color: palette.muted, fontSize: 15, lineHeight: 22 },
});

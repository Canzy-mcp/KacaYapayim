import { Redirect, Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { useAppSession } from "@/src/lib/session";
import { Loading, palette } from "@/src/components/ui";

const icon = (glyph: string) => {
  function TabIcon({ color }: { color: ColorValue }) { return <Text style={{ color, fontSize: 21 }}>{glyph}</Text>; }
  return TabIcon;
};
export default function TabLayout() {
  const { session, business, loading, requiresMfa } = useAppSession();
  if (loading) return <Loading />;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (requiresMfa) return <Redirect href="/mfa" />;
  if (!business?.onboarding_completed) return <Redirect href="/onboarding" />;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: palette.blue,
    tabBarStyle: { height: 62, paddingTop: 5, backgroundColor: "white" },
    tabBarLabelStyle: { fontSize: 11, fontWeight: "600" } }}>
    <Tabs.Screen name="index" options={{ title: "Özet", tabBarIcon: icon("◫") }} />
    <Tabs.Screen name="jobs" options={{ title: "İşler", tabBarIcon: icon("▦") }} />
    <Tabs.Screen name="quotes" options={{ title: "Teklifler", tabBarIcon: icon("▤") }} />
    <Tabs.Screen name="customers" options={{ title: "Müşteriler", tabBarIcon: icon("♧") }} />
    <Tabs.Screen name="settings" options={{ title: "Ayarlar", tabBarIcon: icon("⚙") }} />
  </Tabs>;
}

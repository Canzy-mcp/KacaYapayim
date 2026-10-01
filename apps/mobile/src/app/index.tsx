import { Redirect } from "expo-router";
import { Text } from "react-native";
import { Loading, Screen } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";
import { isConfigured } from "@/src/lib/supabase";

export default function Index() {
  const { loading, session, business } = useAppSession();
  if (!isConfigured) return <Screen title="KaçaYapayım" subtitle="Mobil kurulum bekleniyor.">
    <Text>Supabase projesi oluşturulduğunda mobil ortam ayarlarını ekleyin. Hesap ve işleriniz aynı veritabanında açılacak.</Text>
  </Screen>;
  if (loading) return <Loading />;
  if (!session) return <Redirect href="/(auth)/login" />;
  if (!business?.onboarding_completed) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}

import { Redirect, Stack, usePathname } from "expo-router";
import { Loading } from "@/src/components/ui";
import { useAppSession } from "@/src/lib/session";

export default function PrivateLayout() {
  const { loading, session, business, requiresMfa } = useAppSession();
  const pathname = usePathname();
  if (loading) return <Loading />;
  if (!session) return <Redirect href={{ pathname: "/(auth)/login", params: { next: pathname } }} />;
  if (requiresMfa) return <Redirect href="/mfa" />;
  if (!business?.onboarding_completed && pathname !== "/onboarding") return <Redirect href="/onboarding" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

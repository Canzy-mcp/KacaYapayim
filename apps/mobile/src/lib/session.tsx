import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Business, Profile } from "@kacayapayim/core/types";
import { supabase } from "./supabase";

type AppSession = { session: Session | null; business: Business | null; profile: Profile | null;
  loading: boolean; refresh: () => Promise<void> };
const Context = createContext<AppSession | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const refresh = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const { data: sessionData } = await supabase.auth.getSession();
    setSession(sessionData.session);
    if (!sessionData.session?.user) { setBusiness(null); setProfile(null); setLoading(false); return; }
    const id = sessionData.session.user.id;
    const [businessResult, profileResult] = await Promise.all([
      supabase.from("businesses").select("*").eq("owner_id", id).maybeSingle(),
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    ]);
    setBusiness(businessResult.data || null);
    setProfile(profileResult.data || null);
    setLoading(false);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => { void refresh(); }, 0);
    const listener = supabase?.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // Supabase auth callbacks must not await further Supabase calls.
      setTimeout(() => { void refresh(); }, 0);
    });
    return () => { clearTimeout(timer); listener?.data.subscription.unsubscribe(); };
  }, [refresh]);
  return <Context.Provider value={{ session, business, profile, loading, refresh }}>{children}</Context.Provider>;
}

export function useAppSession() {
  const value = useContext(Context);
  if (!value) throw new Error("SessionProvider gerekli.");
  return value;
}

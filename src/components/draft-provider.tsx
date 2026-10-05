"use client";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
const Scope = createContext<string | null>(null);
export function DraftProvider({ scope, children }: { scope: string; children: ReactNode }) {
  return <Scope.Provider value={scope}>{children}</Scope.Provider>;
}
// Session storage expires with this browser session. Every draft is scoped to owner + business.
export function useDraft<T>(name: string, value: T, restore: (value: T) => void) {
  const scope = useContext(Scope);
  const key = scope ? `ky:draft:v1:${scope}:${name}` : null;
  const restoreRef = useRef(restore); restoreRef.current = restore;
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const stopped = useRef(false);
  useLayoutEffect(() => {
    stopped.current = false;
    try {
      const raw = key && sessionStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && Date.now() - saved.at < 24 * 60 * 60 * 1000 && typeof saved.value === "object") {
          restoreRef.current(saved.value); setNotice("Kaydedilmemiş taslağın geri yüklendi.");
        } else if (key) sessionStorage.removeItem(key);
      }
    } catch { setNotice("Bu tarayıcıda taslak koruma kullanılamıyor. Ayrılmadan önce kaydet."); }
    setReady(true);
  }, [key]);
  useLayoutEffect(() => {
    if (!ready || !key || stopped.current) return;
    try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), value })); }
    catch { setNotice("Taslak korunamadı. Ayrılmadan önce kaydet."); }
  }, [key, ready, value]);
  return { notice, resume: () => { stopped.current = false; }, clear: () => { stopped.current = true; if (key) { try { sessionStorage.removeItem(key); } catch {} } } };
}

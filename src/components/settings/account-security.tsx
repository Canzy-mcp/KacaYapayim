"use client";
import { useState } from "react";
import { accountSecurityAction } from "@/app/actions/account-security";
import { Button, Input } from "@/components/ui";

export function AccountSecurity() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <section className="mt-8 rounded-2xl border border-[#dedee3] bg-white p-6">
    <h2 className="text-lg font-semibold">Hesap güvenliği</h2>
    <p className="mt-2 text-sm text-[#6e6e73]">Diğer cihazlardaki oturumlarını kapatabilir veya hesabını dosyalarıyla birlikte silebilirsin. Oturum kapatıldıktan sonra mevcut erişim anahtarları süreleri dolana kadar geçerli kalabilir.</p>
    <form className="mt-5 space-y-4" onSubmit={async event => {
      event.preventDefault(); if (busy) return;
      const form = new FormData(event.currentTarget);
      const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
      form.set("action", action || "other-sessions");
      if (action === "delete" && !window.confirm("Hesabın ve dosyaların kalıcı olarak silinecek. Devam edilsin mi?")) return;
      setBusy(true); setMessage("");
      try {
        const result = await accountSecurityAction(form);
        if (result.ok && action === "delete") {
          try { for (const key of Object.keys(sessionStorage)) if (key.startsWith("ky:draft:") || key === "ky:calculator-result") sessionStorage.removeItem(key); } catch { /* Account deletion already completed. */ }
          window.location.assign("/login");
        } else setMessage(result.ok ? "Diğer oturumlar kapatıldı." : result.error || "İşlem tamamlanamadı.");
      } catch { setMessage("İşlem tamamlanamadı. Tekrar dene."); }
      finally { setBusy(false); }
    }}>
      <Input id="security-password" name="password" label="Güncel parolan" type="password" autoComplete="current-password" required maxLength={1024} />
      <Button type="submit" name="action" value="other-sessions" disabled={busy}>Diğer oturumları kapat</Button>
      <details className="rounded-xl border border-[#dedee3] p-4"><summary className="cursor-pointer font-medium text-[#b42318]">Hesabımı kalıcı olarak sil</summary>
        <p className="my-3 text-sm">Bu işlem geri alınamaz. Önce gerekli kayıtlarını dışa aktar. Dosyalar temizlenirken işlem yarıda kalırsa tekrar deneyebilirsin.</p>
        <Input id="delete-confirmation" name="confirmation" label="Onaylamak için HESABIMI SIL yaz" autoComplete="off" />
        <Button type="submit" name="action" value="delete" variant="danger" disabled={busy} className="mt-4">Hesabımı sil</Button>
      </details>
      {message && <p role="status" className="text-sm">{message}</p>}
    </form>
  </section>;
}

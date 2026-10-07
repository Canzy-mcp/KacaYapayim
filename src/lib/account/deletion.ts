import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";

export async function deleteOwnAccount(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const service = createServiceClient();
  const { data: business, error: businessError } = await service.from("businesses").select("id")
    .eq("owner_id", userId).maybeSingle();
  if (businessError) return { ok: false, error: "Hesap bilgileri kontrol edilemedi." };
  if (business) {
    const { data: subscription, error: subscriptionError } = await service.from("subscriptions")
      .select("plan_id,status,current_period_end,provider_subscription_id").eq("business_id", business.id).maybeSingle();
    if (subscriptionError) return { ok: false, error: "Abonelik durumu kontrol edilemedi." };
    if (subscription?.provider_subscription_id &&
      (!["expired", "cancelled"].includes(subscription.status) ||
        !subscription.current_period_end || new Date(subscription.current_period_end) > new Date()))
      return { ok: false, error: "Aktif abonelik iptal edilmeden hesap silinemez. Destek ekibiyle iletişime geç." };
  }
  const lock = await service.rpc("begin_account_deletion", { p_user_id: userId });
  if (lock.error || !lock.data) return { ok: false, error: "Dosya yükleme işlemi sürüyor veya silme hazırlığı yapılamadı. Yükleme tamamlandıktan sonra tekrar dene." };
  // Empty each folder before deleting auth.users: Storage objects otherwise block deletion.
  // Re-read page zero after removals so pagination cannot skip remaining objects.
  async function emptyFolder(prefix: string): Promise<boolean> {
    for (let batch = 0; batch < 10000; batch++) {
      const { data, error } = await service.storage.from("business-assets").list(prefix, { limit: 100, sortBy: { column: "name", order: "asc" } });
      if (error || !data) return false;
      if (!data.length) return true;
      const paths: string[] = [];
      for (const item of data) {
        if (!item.name || item.name.includes("/") || item.name === "..") return false;
        const path = `${prefix}/${item.name}`;
        if (!path.startsWith(`${userId}/`)) return false;
        if (item.id) paths.push(path);
        else if (!await emptyFolder(path)) return false;
      }
      if (paths.length && (await service.storage.from("business-assets").remove(paths)).error) return false;
    }
    return false;
  }
  if (!await emptyFolder(userId)) return { ok: false, error: "Dosyalar temizlenemedi. Hesabın korunuyor; tekrar dene." };
  const { error } = await service.auth.admin.deleteUser(userId);
  return error ? { ok: false, error: "Hesap silinemedi. Tekrar dene." } : { ok: true };
}

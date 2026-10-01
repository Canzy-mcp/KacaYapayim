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
  const { error } = await service.auth.admin.deleteUser(userId);
  return error ? { ok: false, error: "Hesap silinemedi. Tekrar dene." } : { ok: true };
}

import "server-only";
import { createServiceClient } from "@/lib/supabase/admin";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export async function uploadPrivateFile(userId: string, path: string, bytes: Uint8Array, mime: string) {
  if (!path.startsWith(`${userId}/`) || !await consumeRateLimit("private-upload", 30, 3600, userId))
    return { error: "Yükleme sınırına ulaştın. Bir süre sonra tekrar dene." };
  const service = createServiceClient();
  const reserved = await service.rpc("reserve_upload", { p_user_id: userId, p_path: path, p_bytes: bytes.length });
  if (reserved.error || !reserved.data) return { error: "Dosya alanı dolu veya yükleme şu an kullanılamıyor. Toplam sınır 100 MB ve 1.000 dosya." };
  try {
    const result = await service.storage.from("business-assets").upload(path, bytes, { contentType: mime, upsert: false });
    return { error: result.error ? "Dosya yüklenemedi. Tekrar dene." : null };
  } finally {
    await service.from("storage_upload_reservations").delete().eq("path", path).eq("user_id", userId);
  }
}

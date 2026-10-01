# Production recovery runbook

Bu belge canlı Supabase projesi kurulduktan sonra proje kimliği, sorumlular ve iletişim kanallarıyla tamamlanmalıdır. Sırları buraya yazmayın.

## İlk adımlar

1. Sorunu sınıflandır: DB erişimi, migration, ödeme, public teklif/PDF veya kimlik doğrulama.
2. Hata zamanı, etkilenen route, deploy sürümü ve anonim request ID kaydet. Müşteri verisini olay notuna kopyalama.
3. Yeni deploy/migration'ı durdur. Production veritabanında test işlemi yapma.

## DB restore

1. Supabase yedek/PITR durumunu panelden doğrula ve hedef geri dönüş zamanını belirle.
2. Mevcut DB'nin ayrıca snapshot'ını al. Ayrı kurtarma projesine restore et; şema, RLS ve kritik işletme sayımlarını karşılaştır.
3. İlgili uzman onayıyla trafiği bakım durumuna alıp doğrulanmış restore'u production'a taşı.
4. Auth, public teklif, hesap motoru ve billing idempotency smoke testlerini çalıştır.
5. Restore sonrası oluşan veri kaybı aralığını ve kullanıcı iletişimini kaydet.

## Başarısız migration

1. Önceki uygulama sürümünü sakla. Destructive değişikliği otomatik ters SQL ile düzeltmeye çalışma.
2. Migration'ı staging yedeğinde tekrar üret; lock ve veri dönüşümünü incele.
3. Geri dönüş güvenliyse veri yedeğiyle beraber uygula. Değilse ileriye dönük düzeltme migration'ı hazırla.
4. `202609300012_dynamic_professions.sql` için yayınlanmış şablon snapshot'larının eski teklifleri değiştirmediğini doğrula.

## Billing webhook

Provider henüz seçilmedi. Bağlandığında imzalı olayları idempotent yeniden oynatma prosedürü ve abonelik/veritabanı uzlaştırma sorgusu ekle. Ödeme durumunu elle değiştirmeden önce provider kaydıyla eşleştir.

## Public link/PDF arızası

`/api/health`, Supabase erişimi, `get_public_quote` RPC, public token ve PDF renderer loglarını PII olmadan kontrol et. Geçersiz token ile gerçek kesintiyi ayır. Yanıtları cache'leme; olay çözülünce kabul/red ve PDF'yi test et.

## Secret rotation

Şüpheli anahtarı iptal et; yeni değeri secret store'a koy; servisleri sırayla yeniden başlat. Service role, Supabase anon key ve rate-limit HMAC değişimlerinin etkisini ayrı değerlendir. Rotasyon sonrası auth, server actions, public teklif, hız sınırı ve health testlerini yap.

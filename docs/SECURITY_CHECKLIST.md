# Production güvenlik kontrolü

- [ ] **Auth:** Supabase e-posta doğrulama, şifre sıfırlama, oturum süresi ve aynı hesapla farklı işletmeye erişim testleri. Login/kayıt/sıfırlamada DB tabanlı hız sınırı staging'de denenmeli.
- [ ] **RLS:** Her business tablosunu iki farklı hesapla dene. `get_public_quote` yalnızca public DTO vermeli; iç maliyet/kâr ve müşteri özel alanları sızmamalı. Migration 012'deki security-definer fonksiyonlarını ayrıca incele.
- [ ] **Sırlar:** Service role ve `RATE_LIMIT_HMAC_KEY` yalnızca sunucuda. `NEXT_PUBLIC_` altına gizli anahtar koyma. Repo/CI çıktısını sır taramasından geçir.
- [ ] **Rate limit:** Migration 013 uygulanmalı. Proxy istemci IP başlıklarını güvenilir şekilde üretmeli; aksi halde IP sahteciliğiyle limit aşılabilir. Üretimde hata durumunda limit fail-closed olur.
- [ ] **Public token:** Rastgele UUID, geçersiz token 404, tüm teklif yanıtları ve PDF `no-store`/`noindex`. Migration 015 sonrası public RPC'lerin anon/authenticated anahtarıyla doğrudan çağrılamadığını doğrula. Token log ve analitiğe yazılmaz. URL'nin paylaşıldığı kişilerin teklife erişebileceğini kullanıcıya belirt.
- [ ] **CSRF:** Public karar/görüntüleme isteklerinde Origin karşılaştırması var. Server actions için framework davranışı ve gerçek proxy origin ayarlarını staging'de test et.
- [ ] **Admin:** `platform_admins` ve admin aksiyonları yalnızca yetkili kullanıcı. Admin sayfası `noindex` olsa da yetki kontrolleri bağımsız test edilmeli.
- [ ] **Billing:** Gerçek provider henüz yok. Webhook eklendiğinde imza, olay kimliği idempotency, tutar/plan ve abonelik geçişleri doğrulanmalı. Checkout hız limiti mevcut.
- [ ] **Uploads:** Mevcut kodda aktif dosya yükleme endpoint'i yok. Logo upload eklenirse MIME magic bytes, uzantı, boyut, rastgele ad, storage policy ve SVG/çalıştırılabilir dosya engeli gerekli.
- [ ] **Headers:** CSP, nosniff, frame/referrer/permissions başlıklarını production yanıtında kontrol et. CSP'de Next hidratasyonu için `unsafe-inline` bulunuyor; nonce tabanlı sertleştirme daha sonra planlanmalı.
- [ ] **Loglar:** Müşteri adı, telefon, adres, maliyet satırları, public token ve teklif metni loglara yazılmamalı. Mevcut konsol hatalarını PII bakımından gözden geçir.
- [ ] **Yedek:** Otomatik yedek ve başarılı restore tatbikatı olmadan production verisi toplama.
- [ ] **Hesap silme:** Aktif abonelik ve yasal saklama politikası netleşmeden eksik silme butonu yayınlama. Bu akış henüz uygulanmadı.

Hız sınırı tablosundaki HMAC IP özetleri süresiz tutulmamalı; production bakım görevine `created_at < now() - interval '48 hours'` kayıtlarını temizleyen iş ekle. Zamanlanmış görev kurulana kadar periyodik manuel temizlik planla.

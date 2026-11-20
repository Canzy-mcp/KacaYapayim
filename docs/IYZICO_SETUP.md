# iyzico tek seferlik usta üyelik ödemesi kurulumu

Ustalar bir kez **199 TL** öder ve üyelikleri süresizdir. Abonelik, ödeme planı veya yenileme yoktur. Uygulama iyzico **Checkout Form (CF)** ile tek ödeme alır. Tutar sunucuda sabittir (`ENTRY_FEE_KURUS = 19900`, `src/lib/billing/catalog.ts`); istemciden alınmaz. [Checkout Form](https://docs.iyzico.com/en/payment-methods/checkoutform) · [Başlatma](https://docs.iyzico.com/en/payment-methods/checkoutform/cf-implementation/cf-initialize) · [Sonuç sorgulama](https://docs.iyzico.com/en/payment-methods/checkoutform/cf-implementation/cf-retrieve) · [Webhook](https://docs.iyzico.com/en/advanced/webhook)

## Akış

1. `/billing` sayfasında işletme sahibi fatura bilgilerini girer (ad, soyad, e-posta, şehir, adres, cep telefonu, TCKN/VKN; iyzico bu alanları zorunlu tutar).
2. Sunucu `POST /payment/iyzipos/checkoutform/initialize/auth/ecom` çağırır: `price` ve `paidPrice` `199.00`, `currency` `TRY`, tek `VIRTUAL` sepet kalemi. `basketId` ve `conversationId` işletmeye bağlı sabit değerdir (`entry-<işletme-id>`). Token, `private.billing_checkout_attempts` tablosuna `pro` / `once` / `entry-fee` olarak kaydedilir.
3. iyzico kullanıcıyı `APP_URL/api/billing/iyzico/callback` adresine POST ile `token` göndererek döndürür. Yönlendirmeye güvenilmez: sunucu `POST /payment/iyzipos/checkoutform/auth/ecom/detail` ile sonucu sorgular ve yalnızca `status=success`, `paymentStatus=SUCCESS`, `paidPrice` = `price` = 199.00, `currency=TRY` ve `basketId`/`conversationId` kayıtlı işletmeyle eşleşirse üyeliği açar. `paymentId`, `subscriptions.provider_subscription_id` olarak saklanır; satırın bitişi `2126-01-01` olur.
4. Webhook (`APP_URL/api/billing/iyzico/webhook`) `X-IYZ-SIGNATURE-V3` başlığıyla gelir. İmza HPP/CF biçimidir: `hex(HMAC-SHA256(secretKey, secretKey + iyziEventType + iyziPaymentId + token + paymentConversationId + status))`. Geçerli imzalı bir `SUCCESS` bildirimi yalnızca token’ı işaret eder; ödeme yine iyzico’dan sorgulanır. Geçersiz imzaya 401 dönülür. Aynı ödeme tekrar gelirse ikinci kayıt oluşmaz.

## Ortam değişkenleri

`BILLING_PROVIDER=iyzico`, `IYZICO_ENV` (`sandbox` veya `production`), `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_MERCHANT_ID`, `APP_URL` (HTTPS). Plan referans kodları artık gerekmez; eski `IYZICO_PLAN_*` değişkenlerini silebilirsin. Değişkenler eksikse `/billing` ve `/fiyatlandirma` "Çok yakında" gösterir ve hiçbir şey bozulmaz.

## Vercel ve bildirim adresleri

1. Sandbox için ayrı bir Supabase projesi ve iyzico’nun erişebileceği bir Preview dağıtımı kullan. Migration’ı önce test veritabanına uygula. Deployment Protection, iyzico’nun callback ve webhook POST isteklerine izin vermeli.
2. Preview’da Supabase değişkenlerini, `SUPABASE_SERVICE_ROLE_KEY`, `RATE_LIMIT_HMAC_KEY` ve yukarıdaki iyzico değişkenlerini tanımla; hazır olunca `BILLING_PROVIDER=iyzico` ile yeniden dağıt.
3. iyzico panelinde **Ayarlar → Firma Ayarları → İşyeri Bildirimleri** altında Checkout Form/HPP bildirim adresini `APP_URL/api/billing/iyzico/webhook` (canlıda `https://www.kacayapayim.com/api/billing/iyzico/webhook`) yap ve `X-IYZ-SIGNATURE-V3` imzasının hesapta açık olduğunu doğrula. İmza özelliği hesap bazında açılır.
4. Callback adresini uygulama her oturumda iyzico’ya gönderir (`APP_URL/api/billing/iyzico/callback`).

## Sandbox doğrulaması

- `/billing` üzerinden ödemeyi başlat; iyzico sayfasına yönlendirmeyi ve tutarın 199 TL olduğunu gör. API `paymentPageUrl` döndürmezse barındırılan sayfanın token’la açıldığını doğrula.
- [Test kartlarıyla](https://docs.iyzico.com/en/add-ons/test-cards) başarılı ve reddedilen ödeme dene. Başarıda üyelik açılmalı, reddedilende kapalı kalmalı, aynı callback tekrarında ikinci kayıt oluşmamalı.
- Callback ulaşmadan tamamlanan ödemede imzalı webhook’un üyeliği açtığını, webhook da ulaşmazsa `/billing` sayfasının açılışta bekleyen token’ı sorgulayıp açtığını doğrula.
- Gerçek V3 başlığını canlı bildirimle karşılaştır. Belgedeki örnek mesajı HMAC anahtarı da yapıyor (`secretKey` hem mesajın başında hem anahtar); uygulama bu yorumu kullanır. Uyuşmazlık varsa `verifyCheckoutFormWebhook` (`src/lib/billing/iyzico-protocol.ts`) güncellenir.
- Üyeliksiz bir ustanın teklif oluşturamadığını, profil yayınlayamadığını ve pazar yerinde teklif veremediğini (`BILLING_ENTRY_REQUIRED`), ödeme sonrası yapabildiğini doğrula.

## Mevcut ustalar

`20261120000500_entry_fee.sql`, göç anında `onboarding_completed = true` olan her işletmeye `grandfathered` sağlayıcılı süresiz üyelik satırı yazar. Sonradan kayıt olanlar ödeme yapar.

## Canlıya geçiş

- [ ] Sandbox’ta ödeme, reddedilen ödeme, callback, imzalı webhook ve tekrar gönderim doğrulandı.
- [ ] Canlı hesapta V3 imza desteği açık.
- [ ] Canlı veritabanında `20261120000200`, `20261120000300`, `20261120000400` ve `20261120000500` sırasıyla uygulandı (tek işlemde, SQL editöründe; `db push` kullanılmaz).
- [ ] Vercel Production’da `APP_URL=https://www.kacayapayim.com`, `IYZICO_ENV=production`, `RATE_LIMIT_HMAC_KEY`, canlı anahtarlar ve işyeri numarası tanımlandı.
- [ ] Canlı webhook adresi ayarlandı, `BILLING_PROVIDER=iyzico` tanımlandı, yeniden dağıtıldı ve kontrollü bir ödemeyle callback ve webhook sonuçları karşılaştırıldı.

Entegrasyon açılmadan önce `BILLING_PROVIDER` boş kalabilir. Kesinti sırasında alınan ödemeleri iyzico panelinden karşılaştırıp bildirimleri yeniden işlemek gerekir.

# iyzico abonelik kurulumu

## Ürün ve ödeme planları

1. iyzico Sandbox hesabında abonelik ürününü ve `X-IYZ-SIGNATURE-V3` bildirim imzasını açtır. Canlı hesap için de aynı özelliklerin açık olduğunu doğrula. [Abonelik entegrasyonu](https://docs.iyzico.com/urunler/abonelik/abonelik-entegrasyonu) · [Webhook belgeleri](https://docs.iyzico.com/ek-servisler/webhook)
2. Üye işyeri panelinde **Abonelik** bölümünden **KaçaYapayım** adında bir ürün ve aşağıdaki dört ödeme planını oluştur. Para birimini TRY, ödeme tipini `RECURRING`, aralık adedini 1 ve deneme süresini 0 gün olarak ayarla. İptale kadar yenilenmesi için tekrar sayısını boş bırak. [Ödeme planı ayarları](https://docs.iyzico.com/urunler/abonelik/abonelik-entegrasyonu/odeme-plani)
3. Her ödeme planının `pricingPlanReferenceCode` değerini ilgili değişkene gir. Uygulama, ilk ödeme öncesi iyzico’daki planın fiyatını, para birimini ve dönemini kendi kataloğuyla karşılaştırır.

| Plan | Dönem | Tutar | Değişken |
| --- | --- | ---: | --- |
| Usta | Aylık | 399 TL | `IYZICO_PLAN_USTA_MONTHLY` |
| Usta | Yıllık | 3.990 TL | `IYZICO_PLAN_USTA_YEARLY` |
| Pro | Aylık | 799 TL | `IYZICO_PLAN_PRO_MONTHLY` |
| Pro | Yıllık | 7.990 TL | `IYZICO_PLAN_PRO_YEARLY` |

## Vercel ve bildirim adresleri

1. Sandbox testleri için ayrı bir Supabase projesi ve iyzico’nun erişebileceği bir Vercel Preview dağıtımı kullan. Billing göçünü önce test veritabanına uygula. Vercel Deployment Protection ayarının iyzico’nun callback ve webhook POST isteklerine izin verdiğini doğrula.
2. **Preview** ortamında test projesinin Supabase değişkenlerini ve `SUPABASE_SERVICE_ROLE_KEY` değerini ayarla. `APP_URL` için sabit, herkese açık bir HTTPS adresi kullan. `IYZICO_ENV=sandbox` ile sandbox API anahtarını (`IYZICO_API_KEY`), gizli anahtarı (`IYZICO_SECRET_KEY`), üye işyeri numarasını (`IYZICO_MERCHANT_ID`) ve dört sandbox plan kodunu tanımla. Hazır olduğunda `BILLING_PROVIDER=iyzico` ile yeniden dağıt.
3. iyzico panelinde **Ayarlar → Firma Ayarları → İşyeri Bildirimleri** bölümündeki abonelik bildirim adresini ayarla. Sandbox için `APP_URL/api/billing/iyzico/webhook`, canlı için `https://www.kacayapayim.com/api/billing/iyzico/webhook` kullan. [Bildirim ayarları](https://docs.iyzico.com/ek-servisler/webhook)
4. Callback adresini uygulama her ödeme oturumunda iyzico’ya gönderir. Sandbox adresi `APP_URL/api/billing/iyzico/callback`, canlı adresi `https://www.kacayapayim.com/api/billing/iyzico/callback`. Her iki uç da POST kabul eder. Callback, token sonucunu iyzico API’sinden sorguladıktan sonra kullanıcıyı paket durumuna yönlendirir.

Fatura formunun verileri yalnızca ilgili oturum başlatılırken sunucuda işlenir ve iyzico’ya gönderilir. Uygulama veritabanı, oturuma ait token ve paket eşleşmesini tutar. Anahtarları yalnızca Vercel’in sunucu değişkenlerine gir.

## Sandbox doğrulaması

- İşletme sahibi olarak `/billing` üzerinden dört planı seçerek tutarı, dönemi ve iyzico ödeme sayfasına yönlendirmeyi kontrol et. API’nin `paymentPageUrl` verdiği akışı ve bu alan yoksa barındırılan ödeme sayfasının abonelik token’ını kabul ettiğini doğrula. Abonelik API’si bu alanı yanıt şemasında garanti etmiyor. Hesabında barındırılan sayfa çalışmıyorsa yayına almadan önce iyzico’dan abonelikler için bu özelliği doğrulat. [Abonelik API’si](https://docs.iyzico.com/urunler/abonelik/abonelik-entegrasyonu/abonelik-islemleri) · [Barındırılan ödeme sayfası örneği](https://docs.iyzico.com/en/payment-methods/checkoutform/cf-implementation/cf-sample-imp.)
- iyzico’nun resmi listesinden başarılı ve reddedilen test kartı seç. Başarıda callback’in hesabı doğru pakete geçirdiğini, reddedilen ödemede Ücretsiz paketin sürdüğünü ve aynı callback tekrar geldiğinde ikinci abonelik kaydı oluşmadığını kontrol et. Formda telefon ve TCKN/VKN isteğe bağlıdır. iyzico’nun abonelik şeması bu alanları müşteriden bekleyebildiği için hesabında boş gönderimi ve kabul edilen kimlik biçimini de test et. [Test kartları](https://docs.iyzico.com/en/add-ons/test-cards) · [Abonelik formu alanları](https://docs.iyzico.com/on-hazirliklar/api-reference-beta/abonelik/abonelik/abonelik-baslatma)
- İmzalı bir sandbox abonelik bildirimiyle HMAC alan sırasını doğrula. Uygulama sırasıyla `merchantId`, `secretKey`, `iyziEventType`, `subscriptionReferenceCode`, `orderReferenceCode` ve `customerReferenceCode` alanlarını birleştirir. Belgenin açıklamasında alan sırası farklı görünebildiği için hesabından gelen gerçek V3 başlığıyla karşılaştır. Başarılı ve başarısız yenileme, aynı bildirimin yeniden gönderimi ve geçersiz imza için sonucu kontrol et. Geçersiz imzaya 401 dönülür. [Abonelik bildirim imzası](https://docs.iyzico.com/ek-servisler/webhook)
- İşletme sahibiyle iptal onayını dene. İptal iyzico tarafından doğrulanınca uygulama Ücretsiz pakete geçer. iyzico’nun `activate` ucu bekleyen abonelikler içindir. İptal sonrası yeni abonelik için yeniden ödeme akışı kullanılır. [Abonelik işlemleri](https://docs.iyzico.com/urunler/abonelik/abonelik-entegrasyonu/abonelik-islemleri)

## Canlıya geçiş

- [ ] Sandbox’ta barındırılan ödeme sayfası, fatura alanları, callback, imzalı webhook, yenileme ve iptal doğrulandı.
- [ ] Canlı iyzico hesabında abonelik ürünü ile V3 imza desteği açık. Dört canlı planın fiyat ve dönemleri uygulama kataloğuyla eşleşiyor.
- [ ] Canlı veritabanında `20261120000200_iyzico_billing.sql` uygulandı.
- [ ] Vercel **Production** ortamında `APP_URL=https://www.kacayapayim.com`, `IYZICO_ENV=production`, canlı anahtarlar, canlı işyeri numarası ve canlı plan kodları tanımlandı.
- [ ] Canlı webhook adresi ayarlandı. `BILLING_PROVIDER=iyzico` tanımlandı, yeniden dağıtım yapıldı ve kontrollü bir abonelikten gelen callback ve webhook sonuçları karşılaştırıldı.

Entegrasyon açılmadan önce `BILLING_PROVIDER` boş kalabilir. Canlı abonelikler başladıktan sonra bu değişkenin boşaltılması webhook işlemeyi de durdurur. Kesinti sırasında oluşan ödeme ve iptal olaylarını iyzico panelinden karşılaştırıp bildirimleri yeniden işlemek gerekir.

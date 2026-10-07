# KaçaYapayım

Next.js tabanlı usta uygulaması: müşteri ve maliyet yönetimi, meslek hesabı veya genel iş hesabı, fiyatlandırma, profesyonel teklif, revizyon, iş takibi, özel dosyalar ve atanmış iş görüntüleme.

6 Ekim güvenlik ve ürün geliştirmeleri [AUDIT_IMPLEMENTATION_2026-10-06.md](docs/AUDIT_IMPLEMENTATION_2026-10-06.md) içinde. Elle tahsilat takibi eklendi; ödeme sağlayıcısı bağlı değil. Bu paketin canlı veritabanı geçişi ve web yayını henüz yapılmadı.

## Supabase projesini bağlama

1. Supabase'de yeni bir proje oluşturun. Proje URL'sini, **anon/publishable** anahtarını ve sunucuda kullanılacak **service role** anahtarını `.env.example` dosyasını `.env.local` olarak kopyalayıp ilgili alanlara yazın. Service role anahtarını tarayıcı koduna veya `NEXT_PUBLIC_` değişkenine koymayın. `APP_URL` yerelde `http://localhost:3005`, yayında uygulamanın gerçek adresi olmalı.
2. Supabase CLI ile projeyi bağlayın. Mevcut canlı projede depo ve migration kayıt geçmişi farklı olduğu için toplu `db push` yapmayın, eski migration'ları yeniden uygulamayın. Önce [yayın sırasını](docs/AUDIT_IMPLEMENTATION_2026-10-06.md) ve staging şema eşlemesini tamamlayın. Boş ortamın migration zinciri `npm run test:database` ile izole PostgreSQL üzerinde doğrulanır; bu, canlı geçmişi otomatik hizalamaz.
3. Supabase Auth URL ayarlarında Site URL'yi uygulama adresine ayarlayın; izinli yönlendirme adreslerine `http://localhost:3005/auth/callback` ve yayın adresindeki `/auth/callback` yolunu ekleyin.
4. E-posta doğrulaması açıksa **Confirm signup** şablonundaki bağlantıyı `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email` olarak ayarlayın. **Reset password** şablonundaki bağlantıyı `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery` olarak ayarlayın. Böylece sunucu oturumu cookie içine güvenle yazabilir.
5. Değişkenleri ekledikten sonra uygulamayı yeniden derleyin veya geliştirme sunucusunu yeniden başlatın: `npm run dev`.

Şema tipleri `packages/core/src/types/database.ts` içinde tutuluyor; web uygulamasındaki eski import yolu aynı pakete yönleniyor. Supabase projesi kurulduktan sonra `supabase gen types --lang typescript --linked` çıktısıyla güncellenmelidir.

## Mobil uygulama

`apps/mobile`, Expo Router ve React Native kullanan gerçek iOS/Android uygulamasıdır. WebView değildir. Web projesi kök dizinde kalır; iki uygulama `packages/core` içindeki meslek formu, maliyet ve fiyatlandırma kurallarını paylaşır. Mobil iş kaydı `/api/mobile/jobs` üzerinden kimlik doğrulaması ve sunucu hesabı yapılarak tamamlanır. Müşteri, maliyet, fiyat ve teklif işlemleri mevcut Supabase RLS ve RPC kurallarını kullanır.

Mobil yapılandırma için `apps/mobile/.env.example` dosyasını `apps/mobile/.env.local` olarak kopyalayıp aynı Supabase projesinin URL ve **publishable** anahtarını girin. `EXPO_PUBLIC_API_URL` ve `EXPO_PUBLIC_WEB_URL` fiziksel cihazın erişebildiği HTTPS staging/yayın adresi olmalıdır. Yerel cihaz testinde `localhost` yerine bilgisayarın LAN adresi kullanılabilir. Service role anahtarı mobil uygulamaya eklenmez. Supabase Auth izinli yönlendirme adreslerine `kacayapayim://auth/callback` ekleyin; e-posta şablonlarının `redirectTo` adresini koruduğunu test edin.

`npm run mobile` Expo geliştirme sunucusunu açar. `npm run mobile:typecheck` mobil tip kontrolünü yapar. Mobil sürüm ve mağaza hazırlığının kalan adımları [MOBILE_RELEASE_CHECKLIST.md](docs/MOBILE_RELEASE_CHECKLIST.md) içinde yer alır. KaçaYapayım Supabase projesi bağlı. Yeni web akışları geçici hesapla doğrulandı; fiziksel mobil cihaz, ortak veri ve mağaza testleri [MOBILE_RELEASE_CHECKLIST.md](docs/MOBILE_RELEASE_CHECKLIST.md) üzerinden ayrıca tamamlanmalı.

## Dinamik meslekler

Boyacı, elektrikçi, tesisatçı ve klimacı şablonları 012 migration'ında yayınlanır. Yeni meslekler `/admin/professions` üzerinden sürümlü taslak olarak oluşturulup yayınlanabilir. Yönetici erişimi için, yönetici hesabı oluşturulduktan sonra SQL Editor'de `insert into public.platform_admins(user_id) values ('YÖNETİCİ_AUTH_UUID');` işlemini uygulayın. Bu tabloya uygulama kullanıcılarının yazma izni yoktur. Şablon yayımlama işlemi sürümü ve yayınlayan kullanıcıyı saklar; eski işlerin şablon ve hesap özetleri değişmez. Yeni meslek işleri sunucuda hesaplanıp service role ile tek veritabanı işlemi içinde kaydedilir. Ödeme sağlayıcısı gibi bu anahtar da yalnızca sunucuda tutulur.

`/demo/professions` dört mesleğin etkileşimli iş formunu ve örnek maliyet hesabını gösterir. Demo Supabase bağlı olduğunda da açıktır ve gerçek işletme kayıtlarını kullanmaz. Yeni meslek yayını yönetici MFA doğrulaması ve sunucuda başarılı örnek iş hesabı gerektirir.

## Paketler ve ödeme bağlantısı

`/pricing` herkese açık, `/billing` giriş yapan işletme sahibine açıktır. Ücretsiz plan ayda 5 teklif ve 20 aktif müşteriye izin verir. Teklif dönemi İstanbul saatine göre takvim ayıdır; arşivlenen müşteri aktif sınıra dahil değildir. Sınırlar veritabanı tetikleyicilerinde işlem içinde kontrol edilir. Aboneliği olmayan ve süresi dolmuş işletmeler Ücretsiz plana döner; eski kayıtlar silinmez. Paket fiyatları ve özellikleri `plans` tablosundan gelir; migration'daki ilk seed ve `src/lib/billing/catalog.ts` içindeki kurulum öncesi görünüm aynı başlangıç değerlerini kullanır.

Supabase projesi bağlıdır, ödeme sağlayıcısı bağlı değildir. Ücretli paket satın alma, iptal, devam ettirme ve mağaza abonelik doğrulama düğmeleri bu yüzden kapalıdır; ücretli planı tarayıcı yönlendirmesiyle etkinleştiren bir yol yoktur. `src/lib/billing/provider.ts` Google Play, App Store veya başka bir sağlayıcı için adaptör sözleşmesini tanımlar. Bir adaptör eklendiğinde mağazanın imzalı bildirimini ve satın almayı doğrulamalı, olayı `billing_events` içinde tekil kimlikle işlemeli ve aboneliği sunucudan güncellemelidir. Sağlayıcı anahtarları yalnızca sunucuda tutulmalıdır.

## Kontrol

`npm run typecheck`, `npm test` ve `npm run build` yerel kontrolleri çalıştırır. Fiyat ve gerçek kâr hesabı, durum uygunluğu, İstanbul tarih filtreleri, kabul oranı, WhatsApp URL kodlaması ve müşteri önizlemesinin veri ayrımı birim testindedir. PDF örnek veriyle A4 olarak görsel doğrulandı. Bağlı veritabanında arama, sayfalama, revizyon, paket taslakları ve işletme/ekip yetki ayrımı transaction içinde test edildi. Gerçek kayıt akışı geçici hesapla doğrulandı ve test verileri temizlendi. Public karar API'si, PDF, logo ve dashboard için yeni sürümün hosting sonrası smoke testi ayrıca yapılmalı.

Giriş yapmamış kullanıcılar çalışma alanından `/login` sayfasına; ilk kurulumu bitirmemiş kullanıcılar `/onboarding` sayfasına yönlendirilir. Dashboard dönem filtresi teklifleri oluşturulma, kabul ve red tarihine; tamamlanan işleri tamamlanma tarihine; aktif işleri kabul tarihine göre hesaplar. Güncel iş durumları döneme bağlı değildir ve bu ayrım ekranda belirtilir. Tutarlar veritabanında `numeric` olarak toplanır; işletme kimliği oturum sahibinden belirlenir.

`/demo` içindeki ana sayfa, teklifler, müşteriler, maliyetler, paketler ve ayarlar yalnızca örnek verilerle çalışır; kayıt işlemi yapmaz. Public demo gerçek giriş akışından bağımsızdır.

## İş takibi ve ekip

`/work` takip, keşif, saha notu, gider ve ek iş kayıtlarını gösterir. İş dosyaları özel depolamadadır. İş detayında e-posta ile bağlı bir görüntüleyici daveti oluşturulur; `/team-invite/[token]` doğrulanmış hesapla kabul edilir, `/team-work` yalnızca atanmış işin sınırlı görünümünü sunar. Davet bağlantısı kullanıcı tarafından paylaşılır; otomatik mesaj gönderilmez.

KDV seçimi müşteri toplamını değiştirir; vergi kâra eklenmez. Hizmet paketleri üç ayrı taslak oluşturur, tek seçenek kabul edilir ve teklif kotasına dahildir. İşe bağlı saha giderleri gerçekleşen maliyete otomatik eklenir; tamamlama formunda aynı gider tekrar girilmemelidir. İşletme logosunun gösterimi mevcut paket özelliğine bağlıdır. `/team-access` işlere verilen ekip yetkilerini topluca gösterir. Onaylı ek iş ayrı bir maliyet ve teklif kaydı oluşturur; kabul edilmiş teklif ve gelir kendiliğinden değişmez.

`ANALYTICS_ENABLED` varsayılan olarak kapalıdır. Açıldığında public kampanya ölçümünden önce ziyaretçi tercihi alınır. `/admin/analytics` yalnızca platform yöneticilerine açıktır ve sunucu anahtarı gerektirir.

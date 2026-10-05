# KaçaYapayım

Next.js tabanlı usta uygulaması: müşteri ve maliyet yönetimi, meslek hesabı veya genel iş hesabı, fiyatlandırma, profesyonel teklif, revizyon, iş takibi, özel dosyalar ve atanmış iş görüntüleme.

5 Ekim 2026 geliştirme teslimi ve doğrulamalar [PRODUCT_IMPROVEMENTS_2026-10-05.md](docs/PRODUCT_IMPROVEMENTS_2026-10-05.md) içinde. Ödeme ve tahsilat bu çalışmanın dışında tutuldu; yeni web sürümü henüz hosting ortamına yayınlanmadı.

## Supabase projesini bağlama

1. Supabase'de yeni bir proje oluşturun. Proje URL'sini, **anon/publishable** anahtarını ve sunucuda kullanılacak **service role** anahtarını `.env.example` dosyasını `.env.local` olarak kopyalayıp ilgili alanlara yazın. Service role anahtarını tarayıcı koduna veya `NEXT_PUBLIC_` değişkenine koymayın. `APP_URL` yerelde `http://localhost:3005`, yayında uygulamanın gerçek adresi olmalı.
2. Supabase CLI ile projeyi bağlayın: `supabase login`, `supabase link --project-ref <proje-ref>`, ardından `supabase db push --dry-run` ve `supabase db push`. Bu işlem `supabase/migrations` içindeki tüm migration'ları tarih sırasıyla uygular. 012, sürümlü meslek şablonlarını ve genel iş kaydını; 017, hesap silme için ilişkili kayıtların silinmesini ekler. Mevcut veritabanında uygulamadan önce staging yedeğiyle denetleyin.
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

Supabase bağlı değilken `/demo/professions` dört mesleğin etkileşimli iş formunu ve örnek maliyet hesabını gösterir. Demo kayıt yapmaz.

## Paketler ve ödeme bağlantısı

`/pricing` herkese açık, `/billing` giriş yapan işletme sahibine açıktır. Ücretsiz plan ayda 5 teklif ve 20 aktif müşteriye izin verir. Teklif dönemi İstanbul saatine göre takvim ayıdır; arşivlenen müşteri aktif sınıra dahil değildir. Sınırlar veritabanı tetikleyicilerinde işlem içinde kontrol edilir. Aboneliği olmayan ve süresi dolmuş işletmeler Ücretsiz plana döner; eski kayıtlar silinmez. Paket fiyatları ve özellikleri `plans` tablosundan gelir; migration'daki ilk seed ve `src/lib/billing/catalog.ts` içindeki kurulum öncesi görünüm aynı başlangıç değerlerini kullanır.

Supabase projesi bağlıdır, ödeme sağlayıcısı bağlı değildir. Ücretli paket satın alma, iptal, devam ettirme ve mağaza abonelik doğrulama düğmeleri bu yüzden kapalıdır; ücretli planı tarayıcı yönlendirmesiyle etkinleştiren bir yol yoktur. `src/lib/billing/provider.ts` Google Play, App Store veya başka bir sağlayıcı için adaptör sözleşmesini tanımlar. Bir adaptör eklendiğinde mağazanın imzalı bildirimini ve satın almayı doğrulamalı, olayı `billing_events` içinde tekil kimlikle işlemeli ve aboneliği sunucudan güncellemelidir. Sağlayıcı anahtarları yalnızca sunucuda tutulmalıdır.

## Kontrol

`npm run typecheck`, `npm test` ve `npm run build` yerel kontrolleri çalıştırır. Fiyat ve gerçek kâr hesabı, durum uygunluğu, İstanbul tarih filtreleri, kabul oranı, WhatsApp URL kodlaması ve müşteri önizlemesinin veri ayrımı birim testindedir. PDF örnek veriyle A4 olarak görsel doğrulandı. Bağlı veritabanında arama, sayfalama, revizyon, paket taslakları ve işletme/ekip yetki ayrımı transaction içinde test edildi. Gerçek kayıt akışı geçici hesapla doğrulandı ve test verileri temizlendi. Public karar API'si, PDF, logo ve dashboard için yeni sürümün hosting sonrası smoke testi ayrıca yapılmalı.

Giriş yapmamış kullanıcılar çalışma alanından `/login` sayfasına; ilk kurulumu bitirmemiş kullanıcılar `/onboarding` sayfasına yönlendirilir. Dashboard dönem filtresi teklifleri oluşturulma, kabul ve red tarihine; tamamlanan işleri tamamlanma tarihine; aktif işleri kabul tarihine göre hesaplar. Güncel iş durumları döneme bağlı değildir ve bu ayrım ekranda belirtilir. Tutarlar veritabanında `numeric` olarak toplanır; işletme kimliği oturum sahibinden belirlenir.

Supabase henüz bağlı değilse `/login` sayfası **Şifresiz Demoya Gir** bağlantısını gösterir. `/demo` içindeki ana sayfa, teklifler, müşteriler, maliyetler, paketler ve ayarlar yalnızca örnek verilerle çalışır; kayıt işlemi yapmaz. Supabase yapılandırıldığında demo yolu kapanır ve gerçek giriş akışı açılır.

## İş takibi ve ekip

`/work` takip, keşif, saha notu, gider ve ek iş kayıtlarını gösterir. İş dosyaları özel depolamadadır. İş detayında e-posta ile bağlı bir görüntüleyici daveti oluşturulur; `/team-invite/[token]` doğrulanmış hesapla kabul edilir, `/team-work` yalnızca atanmış işin sınırlı görünümünü sunar. Davet bağlantısı kullanıcı tarafından paylaşılır; otomatik mesaj gönderilmez.

KDV seçimi bilgi amaçlıdır ve tutarı değiştirmez. Hizmet paketleri üç ayrı taslak oluşturur ve teklif kotasına dahildir. Gider kayıtları gerçekleşen maliyete otomatik eklenmez. İşletme logosunun gösterimi mevcut paket özelliğine bağlıdır.

`ANALYTICS_ENABLED` varsayılan olarak kapalıdır. Açıldığında public kampanya ölçümünden önce ziyaretçi tercihi alınır. `/admin/analytics` yalnızca platform yöneticilerine açıktır ve sunucu anahtarı gerektirir.

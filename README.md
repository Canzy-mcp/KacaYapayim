# KaçaYapayım

KaçaYapayım, müşterilerin usta bulduğu ve teklif aldığı, ustaların da hizmet profillerini, maliyetlerini ve işlerini yönettiği bir web ve mobil uygulamadır.

## Hizmet pazar yeri

- Müşteriler `/usta-bul` üzerinden bölge ve hizmete göre arayabilir. Seçtikleri ustaya çağrı gönderebilir veya `/talepler/yeni` üzerinden ilan açabilirler.
- Ustalar `/usta-talepleri` üzerinden profillerini yayımlar, uygun talepleri görür ve teklif verir. Müşteri ile seçilen usta randevu ve iş durumunu talep üzerinden yönetir.
- Platform yöneticileri iki aşamalı doğrulamadan sonra `/admin/talepler` üzerinden bildirimleri inceleyebilir. Moderasyon kararlarının geçmişi veritabanında tutulur.

Pazar yeri sürümünü doğrulamak için `npm ci`, `npm run verify` ve `node scripts/check-dependency-audit.mjs` çalıştır. Geçişten önce staging ortamında migration geçmişini karşılaştır. Temel pazar yeri şeması varsa `20261119000100_marketplace_integrity.sql` ve `20261119000200_marketplace_privacy.sql` ileri migration'larını sırasıyla doğrula. Web'de müşteri, usta ve moderatör rollerini, mobilde ise giriş ve e-posta dönüşünü ayrı test hesaplarıyla kontrol et.

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

## Usta rehberi ve hizmet talepleri

Web’de `/usta-bul` usta rehberini, `/talepler` müşteri hesabını ve `/usta-talepleri` usta panelindeki hizmet işlerini açar. Expo uygulamasında aynı akışlar Hizmet Merkezi’ndedir. Müşteri doğrudan çağrı gönderebilir veya bölgesindeki ustalara ilan açabilir. Yayımlanan usta profili kategori ve hizmet bölgelerini belirler. Teklif kabul edildiğinde iş, ustanın mevcut iş takibinde de görünür.

Yayımdan önce hizmet platformu migration’ını staging veritabanına uygula. Bireysel müşteri ve iki usta hesabıyla ilan, özel çağrı, teklif seçimi, randevu, mesaj ve tamamlanma akışını doğrula. Moderasyon ekranı `/admin/talepler`; erişim mevcut platform yöneticisi kaydını ve iki aşamalı oturum doğrulamasını gerektirir. Bildirimler uygulama içi kutudadır. Usta tahsilatı panelden kaydedebilir. Çevrimiçi tahsilat bir ödeme sağlayıcısı gerektirir.

## Dinamik meslekler

Boyacı, elektrikçi, tesisatçı ve klimacı şablonları 012 migration'ında yayınlanır. Yeni meslekler `/admin/professions` üzerinden sürümlü taslak olarak oluşturulup yayınlanabilir. Yönetici erişimi için, yönetici hesabı oluşturulduktan sonra SQL Editor'de `insert into public.platform_admins(user_id) values ('YÖNETİCİ_AUTH_UUID');` işlemini uygulayın. Bu tabloya uygulama kullanıcılarının yazma izni yoktur. Şablon yayımlama işlemi sürümü ve yayınlayan kullanıcıyı saklar; eski işlerin şablon ve hesap özetleri değişmez. Yeni meslek işleri sunucuda hesaplanıp service role ile tek veritabanı işlemi içinde kaydedilir. Ödeme sağlayıcısı gibi bu anahtar da yalnızca sunucuda tutulur.

`/demo/professions` dört mesleğin etkileşimli iş formunu ve örnek maliyet hesabını gösterir. Demo Supabase bağlı olduğunda da açıktır ve gerçek işletme kayıtlarını kullanmaz. Yeni meslek yayını yönetici MFA doğrulaması ve sunucuda başarılı örnek iş hesabı gerektirir.

## Üyelik ve ödeme

`/fiyatlandirma` herkese açık, `/billing` giriş yapan işletme sahibine açıktır. Müşteriler ücretsizdir. Ustalar tek seferlik 199 TL usta üyeliği öder (süresiz, abonelik yok); sabit tutar `ENTRY_FEE_KURUS` olarak sunucuda tutulur. Üyeliği olmayan usta teklif oluşturamaz (`BILLING_QUOTE_LIMIT`), pazar yerinde profil yayınlayamaz veya teklif veremez (`BILLING_ENTRY_REQUIRED`); göç anında kayıtlı işletmeler ücretsiz ve süresiz devam eder. Üyelik, `subscriptions` tablosundaki `pro` planlı satırdır ve yalnızca iyzico Checkout Form sonucu sunucuda doğrulandıktan sonra yazılır. Kurulum: `docs/IYZICO_SETUP.md`.

## Kontrol

`npm run typecheck`, `npm test` ve `npm run build` yerel kontrolleri çalıştırır. Fiyat ve gerçek kâr hesabı, durum uygunluğu, İstanbul tarih filtreleri, kabul oranı, WhatsApp URL kodlaması ve müşteri önizlemesinin veri ayrımı birim testindedir. PDF örnek veriyle A4 olarak görsel doğrulandı. Bağlı veritabanında arama, sayfalama, revizyon, paket taslakları ve işletme/ekip yetki ayrımı transaction içinde test edildi. Gerçek kayıt akışı geçici hesapla doğrulandı ve test verileri temizlendi. Public karar API'si, PDF, logo ve dashboard için yeni sürümün hosting sonrası smoke testi ayrıca yapılmalı.

Giriş yapmamış kullanıcılar çalışma alanından `/login` sayfasına; ilk kurulumu bitirmemiş kullanıcılar `/onboarding` sayfasına yönlendirilir. Dashboard dönem filtresi teklifleri oluşturulma, kabul ve red tarihine; tamamlanan işleri tamamlanma tarihine; aktif işleri kabul tarihine göre hesaplar. Güncel iş durumları döneme bağlı değildir ve bu ayrım ekranda belirtilir. Tutarlar veritabanında `numeric` olarak toplanır; işletme kimliği oturum sahibinden belirlenir.

`/demo` içindeki ana sayfa, teklifler, müşteriler, maliyetler, paketler ve ayarlar yalnızca örnek verilerle çalışır; kayıt işlemi yapmaz. Public demo gerçek giriş akışından bağımsızdır.

## İş takibi ve ekip

`/work` takip, keşif, saha notu, gider ve ek iş kayıtlarını gösterir. İş dosyaları özel depolamadadır. İş detayında e-posta ile bağlı bir görüntüleyici daveti oluşturulur; `/team-invite/[token]` doğrulanmış hesapla kabul edilir, `/team-work` yalnızca atanmış işin sınırlı görünümünü sunar. Davet bağlantısı kullanıcı tarafından paylaşılır; otomatik mesaj gönderilmez.

KDV seçimi müşteri toplamını değiştirir; vergi kâra eklenmez. Hizmet paketleri üç ayrı taslak oluşturur, tek seçenek kabul edilir ve teklif kotasına dahildir. İşe bağlı saha giderleri gerçekleşen maliyete otomatik eklenir; tamamlama formunda aynı gider tekrar girilmemelidir. İşletme logosunun gösterimi mevcut paket özelliğine bağlıdır. `/team-access` işlere verilen ekip yetkilerini topluca gösterir. Onaylı ek iş ayrı bir maliyet ve teklif kaydı oluşturur; kabul edilmiş teklif ve gelir kendiliğinden değişmez.

`ANALYTICS_ENABLED` varsayılan olarak kapalıdır. Açıldığında public kampanya ölçümünden önce ziyaretçi tercihi alınır. `/admin/analytics` yalnızca platform yöneticilerine açıktır ve sunucu anahtarı gerektirir.

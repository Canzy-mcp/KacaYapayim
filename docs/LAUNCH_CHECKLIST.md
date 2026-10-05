# KaçaYapayım lansman kontrol listesi

Durum: **5 Ekim 2026 ürün geliştirmeleri hosting'e henüz yayınlanmadı**. KaçaYapayım Supabase projesi bağlı; bu teslimdeki ek migration'lar uygulandı. Ödeme ve tahsilat kapsam dışında. Önceki yayının durumu için QUOTE_SMOKE_TEST_2026-10-04.md, yeni değişiklikler için PRODUCT_IMPROVEMENTS_2026-10-05.md belgesini kullan. Yerel build yayın ve dış bağımlılıkları doğrulamaz.

## Ortam ve veri

- [ ] Ayrı local, staging ve production Supabase projelerini oluştur. Production DB'yi geliştirme için kullanma.
- [ ] `.env.example` değerlerini her ortamda doldur; sırları hosting secret store'da tut. `DEPLOYMENT_ENV=production` eksik kritik değişkenlerde build'i durdurur.
- [ ] `APP_URL` için tek HTTPS canonical host seç. www/non-www ve HTTP yönlendirmesini edge'de de doğrula.
- [ ] Tüm migration'ları dosya sırasıyla staging'de uygula; 5 Ekim ürün migration'ları bağlı projeye uygulanmış durumda. Özellikle `012_dynamic_professions` için mevcut veri, lock süresi ve rollback planını kontrol et. 015 ve uygulama kodunu kontrollü bakım penceresinde birlikte yayınla; RPC yetkileri değişir.
- [ ] Production migration öncesi otomatik Supabase backup/point-in-time seçeneğini aç; dışa alınan şifreli yedeği geri yükleyerek test et.
- [ ] Production seed yalnızca plan, meslek ve şablon sistem verisi içersin; demo müşteri/teklif/maliyet yükleme.
- [ ] Supabase Auth URL ve e-posta doğrulama/şifre sıfırlama yönlendirmelerini production domain ile test et.
- [ ] RLS ve public teklif RPC erişimini gerçek staging kullanıcılarıyla denetle.

## Ürün ve güvenlik

- [ ] Login, kayıt, onboarding, maliyet, dört meslek hesabı, fiyat, teklif, paylaşım, PDF, kabul/red, gerçek kâr ve dashboard smoke testlerini staging'de tamamla.
- [ ] Rate-limit migration'ı ve `RATE_LIMIT_HMAC_KEY` ile yük testi yap. Proxy'nin `x-real-ip`/`x-forwarded-for` başlıklarını istemciden gelen değerle değil güvenilir kaynakla yazdığını doğrula.
- [ ] Auth, admin, billing ve dosya yükleme yollarını manuel güvenlik denetiminden geçir. Logo ve iş dosyası yükleme eklendi; MIME/içerik, boyut ve owner storage policy mevcut. Yeni yayın üzerinde imzalı dosya açma ve PDF logosunu doğrula.
- [ ] Ödeme kapsam dışında olduğu sürece satın alma akışını kapalı tut. Checkout/portal/webhook ayrı bir çalışma olarak ele alınmalı.
- [ ] Account deletion ve veri dışa aktarma politikasını hukuk/billing gereksinimlerine göre kararlaştır; mevcut hesap silme akışını ve CSV dışa aktarımı yeni yayın üzerinde doğrula.
- [ ] CSP ile gerçek auth, PDF ve ödeme akışlarını tarayıcıda test et.
- [ ] `/api/health` için uptime kontrolü kur; yapılandırılmış production ortamında 200 bekle.

## Public site ve büyüme

- [ ] Gerçek işletme adı, destek adresi, veri sorumlusu ayrıntıları ve hukuki incelemeyi tamamla; taslak yasal metinleri kesinleştir. Yalnızca bundan sonra `LEGAL_REVIEW_APPROVED=true` ayarla.
- [ ] Kullanılan barındırma, ödeme, analitik ve hata izleme sağlayıcılarını gizlilik metnine yalnızca etkinleştirildiklerinde ekle.
- [ ] Analytics migration'ını uygula, gizlilik değerlendirmesinden sonra `ANALYTICS_ENABLED=true` yap. Kampanya ölçümünde izin tercihini test et. Yeni yönetici raporunun 7/30 günlük işletme gruplarını ve ölçüm başlangıcını kontrol et.
- [ ] Error monitoring sağlayıcısı seç; PII filtreleme, PDF ve server hata testleri yap. Şu anda dış sağlayıcı bağlı değil.
- [ ] Search Console ve Bing Webmaster doğrulama meta değerlerini ayarla, `sitemap.xml` gönder ve index coverage izle.
- [ ] Staging'in tüm yanıtlarında `noindex` ve boş sitemap'i, production public metadata/canonical/sitemap'i doğrula.
- [ ] 320/375/390/430 px ile iPhone Safari ve Android Chrome'da homepage, hesaplayıcı, teklif ve auth akışlarını dene.
- [ ] Gerçek tarayıcıda LCP, INP ve CLS ölç; büyük resim/video bulunmuyor, ancak gerçek cihaz ölçümü yapılmadı.
- [ ] Schema.org doğrulama aracıyla Organization, WebApplication, BreadcrumbList ve Article işaretlerini kontrol et.
- [ ] GEO benchmark setini aylık manuel incele; kaynak gösterimi, doğru ürün tanımı ve ziyaret dönüşümlerini kaydet. Otomatik AI scraping yapma.

## Yayın sonrası günlük bakış

- [ ] Ziyaret, kayıt, onboarding, ilk hesap, ilk teklif, ilk paylaşım, kabul hunisini izle. İzinli kampanya sayaçları ve yönetici ürün raporlarını ayrı değerlendir.
- [ ] Hata ve 5xx oranı, PDF başarısızlığı, health durumu, sayfa hızı, organik girişler ve arama/AI yönlendirmelerini izle.
- [ ] Ana ürün KPI: aktif işletme başına aylık oluşturulan teklif. Aktivasyon: ilk paylaşılan teklif. Retansiyon: son 30 günde tekrar teklif oluşturan işletme oranı. Bunlar için erişim kontrollü /admin/analytics raporu eklendi.

## Bu teslimde tamamlanan kontroller

- [x] Web ve mobil tip kontrolleri, 49 birim testi.
- [x] Veritabanı arama, revizyon, paket ve sahiplik/ekip erişimi testleri.
- [x] Gerçek oturumla müşteri → genel iş → fiyat → teklif ve CSV akışı.
- [x] Gerçek oturumla paket taslakları, saha notu, özel dosya yükleme ve ekip daveti.
- [x] Mobil web taslak kurtarma, pencere odağı ve taşma kontrolü.
- [x] Geçici hesap ve test dosyalarının temizlenmesi.
- [ ] Yeni kaynakları hosting ortamına yayınla, public karar/revizyon/PDF ve logo smoke testini çalıştır.
- [ ] Fiziksel cihazlarda sesli yazma, Safari/Chrome ve native mobil akışlarını kontrol et.
- [ ] PILOT_PLAN_2026-10-05.md planını gerçek katılımcılarla uygula.

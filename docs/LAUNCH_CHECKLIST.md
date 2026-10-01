# KaçaYapayım lansman kontrol listesi

Durum: **canlı yayına hazır değil**. 30 Eylül 2026 itibarıyla Supabase projesi, production alan adı, yasal işletme ve destek bilgileri ile ödeme sağlayıcısı seçilmedi. Kodun yerel build'i bu dış bağımlılıkları doğrulamaz.

## Ortam ve veri

- [ ] Ayrı local, staging ve production Supabase projelerini oluştur. Production DB'yi geliştirme için kullanma.
- [ ] `.env.example` değerlerini her ortamda doldur; sırları hosting secret store'da tut. `DEPLOYMENT_ENV=production` eksik kritik değişkenlerde build'i durdurur.
- [ ] `APP_URL` için tek HTTPS canonical host seç. www/non-www ve HTTP yönlendirmesini edge'de de doğrula.
- [ ] 001–016 migration'larını staging'de sırayla uygula. Özellikle `012_dynamic_professions` için mevcut veri, lock süresi ve rollback planını kontrol et. 015 ve uygulama kodunu kontrollü bakım penceresinde birlikte yayınla; RPC yetkileri değişir.
- [ ] Production migration öncesi otomatik Supabase backup/point-in-time seçeneğini aç; dışa alınan şifreli yedeği geri yükleyerek test et.
- [ ] Production seed yalnızca plan, meslek ve şablon sistem verisi içersin; demo müşteri/teklif/maliyet yükleme.
- [ ] Supabase Auth URL ve e-posta doğrulama/şifre sıfırlama yönlendirmelerini production domain ile test et.
- [ ] RLS ve public teklif RPC erişimini gerçek staging kullanıcılarıyla denetle.

## Ürün ve güvenlik

- [ ] Login, kayıt, onboarding, maliyet, dört meslek hesabı, fiyat, teklif, paylaşım, PDF, kabul/red, gerçek kâr ve dashboard smoke testlerini staging'de tamamla.
- [ ] Rate-limit migration'ı ve `RATE_LIMIT_HMAC_KEY` ile yük testi yap. Proxy'nin `x-real-ip`/`x-forwarded-for` başlıklarını istemciden gelen değerle değil güvenilir kaynakla yazdığını doğrula.
- [ ] Auth, admin, billing ve dosya yükleme yollarını manuel güvenlik denetiminden geçir. Bu repoda logo için gerçek upload endpoint'i bulunmuyor; eklendiğinde MIME, boyut ve storage policy gerekir.
- [ ] Ödeme sağlayıcısı seç, checkout/portal/webhook imza doğrulaması ve idempotency testlerini tamamla. Sağlayıcı henüz bağlı değil.
- [ ] Account deletion ve veri dışa aktarma politikasını hukuk/billing gereksinimlerine göre kararlaştır; mevcut uygulamada tamamlanmış silme akışı yok.
- [ ] CSP ile gerçek auth, PDF ve ödeme akışlarını tarayıcıda test et.
- [ ] `/api/health` için uptime kontrolü kur; yapılandırılmış production ortamında 200 bekle.

## Public site ve büyüme

- [ ] Gerçek işletme adı, destek adresi, veri sorumlusu ayrıntıları ve hukuki incelemeyi tamamla; taslak yasal metinleri kesinleştir. Yalnızca bundan sonra `LEGAL_REVIEW_APPROVED=true` ayarla.
- [ ] Kullanılan barındırma, ödeme, analitik ve hata izleme sağlayıcılarını gizlilik metnine yalnızca etkinleştirildiklerinde ekle.
- [ ] Analytics migration'ını uygula, gizlilik değerlendirmesinden sonra `ANALYTICS_ENABLED=true` yap. Toplu sayaçlar tekil ziyaretçi/işletme retansiyonu yerine geçmez.
- [ ] Error monitoring sağlayıcısı seç; PII filtreleme, PDF ve server hata testleri yap. Şu anda dış sağlayıcı bağlı değil.
- [ ] Search Console ve Bing Webmaster doğrulama meta değerlerini ayarla, `sitemap.xml` gönder ve index coverage izle.
- [ ] Staging'in tüm yanıtlarında `noindex` ve boş sitemap'i, production public metadata/canonical/sitemap'i doğrula.
- [ ] 320/375/390/430 px ile iPhone Safari ve Android Chrome'da homepage, hesaplayıcı, teklif ve auth akışlarını dene.
- [ ] Gerçek tarayıcıda LCP, INP ve CLS ölç; büyük resim/video bulunmuyor, ancak gerçek cihaz ölçümü yapılmadı.
- [ ] Schema.org doğrulama aracıyla Organization, WebApplication, BreadcrumbList ve Article işaretlerini kontrol et.
- [ ] GEO benchmark setini aylık manuel incele; kaynak gösterimi, doğru ürün tanımı ve ziyaret dönüşümlerini kaydet. Otomatik AI scraping yapma.

## Yayın sonrası günlük bakış

- [ ] Ziyaret, kayıt, onboarding, ilk hesap, ilk teklif, ilk paylaşım, kabul ve ücretli dönüşüm hunisini izle. Mevcut anonim sayaçların eksik aşamaları için veri modelini tamamla.
- [ ] Hata ve 5xx oranı, PDF başarısızlığı, health durumu, sayfa hızı, organik girişler ve arama/AI yönlendirmelerini izle.
- [ ] Ana ürün KPI: aktif işletme başına aylık oluşturulan teklif. Aktivasyon: ilk paylaşılan teklif. Retansiyon: son 30 günde tekrar teklif oluşturan işletme oranı. Bunlar için erişim kontrollü işletme bazlı rapor gerekir.

# KaçaYapayım inceleme raporu

İnceleme tarihi: 6 Ekim 2026. Kapsam: Next.js web uygulaması, Expo mobil kaynakları, ortak hesap motoru, Supabase şeması ve erişim kuralları, canlı tanıtım sayfaları, bağımlılıklar ve mevcut doğrulamalar.

## Değerlendirme

Ürünün maliyet hesabı ve teklif hazırlama çekirdeği üzerinde anlamlı bir çalışma yapılmış. Marj ile maliyet üstü artış ayrımı, KDV'nin kâra gelir olarak eklenmemesi, maliyet anlık görüntüleri, müşteriye gösterilen veri ile iç maliyet verisinin ayrılması ve paket seçiminin işlem içinde kilitlenmesi korunmalı.

Şu an önceliğim yeni özellik sayısını artırmaktan önce hesap silmeyi dosyalarla birlikte tamamlamak, canlıdaki taslak gizlilik metnini kesinleştirmek, eski teklif revizyonlarının davranışını netleştirmek ve kırık demo bağlantılarını düzeltmek olurdu. Kullanıcı sayısı arttıkça sınırsız kayıt yükleme, depolama kotası ve iş listesindeki 50 kayıt sınırı da sorun çıkarır.

İnceleme sırasında doğrulanmış bir işletmeler arası veri sızıntısı veya kritik seviyede sömürü gösterilmedi. Bu sonuç, tüm sistemin açık içermediği anlamına gelmez. Canlı ortamda saldırı, yük testi, hesap oluşturma, dosya yükleme veya silme yapılmadı; veritabanında yalnızca şema, fonksiyon, politika ve toplu durum bilgileri okundu. Özel kullanıcı kayıtları rapora alınmadı.

## Doğrulananlar ve incelemenin sınırları

| Kontrol | Sonuç | Yorum |
|---|---|---|
| Birim testleri | 55/55 geçti | Hesap, fiyat, KDV, veri ayrımı, CSV ve gövde sınırı gibi alanlar; tam uçtan uca güvenlik testi değil |
| Web tür kontrolü | Geçti | `npm run typecheck` |
| Mobil tür kontrolü | Geçti | `npm run mobile:typecheck` |
| Mobil lint | Geçti | `npm run lint -w @kacayapayim/mobile` |
| Güncel npm audit | 19 high, 0 critical | Uyarılar Expo/Metro/React Native araç zincirinde; 19 bağımsız kök açık olarak yorumlanmamalı |
| Public tabloların RLS durumu | RLS kapalı tablo bulunmadı | Tek başına doğru politika garantisi vermez |
| Anon rolünün public SECURITY DEFINER erişimi | Bulunmadı | Bu sorgu yalnızca public şemasındaki ayrıcalıklı fonksiyonları kapsar |
| Supabase security advisor | 8 ayrıcalıklı RPC uyarısı, 1 parola koruma uyarısı, 8 politikasız RLS bilgi kaydı | Uyarıların açıklaması aşağıda |
| Supabase performance advisor | 10 indekslenmemiş FK, 3 RLS değerlendirme uyarısı, 8 kullanılmamış indeks | Canlı advisor çıktısı |
| Dosya deposu | Özel; 5 MB dosya sınırı; PNG/JPEG/WebP/PDF izinli | Toplam kullanıcı kotası farklı bir kontrol |
| Zamanlanmış bakım | `pg_cron` kurulu değil | Hosting üzerinden başka bir bakım işi bulunup bulunmadığı doğrulanmadı |
| Demo bağlantısı | Canlı `/demo` 404 ekranı | Ana sayfada demo bağlantıları hâlâ gösteriliyor |
| Gizlilik sayfası | Canlıda taslak ve veri sorumlusu yer tutucusu var | Kaynak kodla tutarlı |

Bu turda üretim build'i yeniden çalıştırılmadı. Önceki yayın belgesindeki SQL ve canlı teklif testleri tarihli kanıt olarak okundu, bugün yeniden yapılmış gibi sayılmadı. Fiziksel Android/iPhone, imzalı mağaza uygulaması, ekran okuyucu ve tam klavye senaryoları denenmedi. Canlı ekran görüntüsü yakalama aracı görüntü üretmedi; canlı metin ve erişilebilirlik ağacı incelendi. Görsel değerlendirme ayrıca depodaki tarihli ekran görüntülerine ve bileşen kaynaklarına dayanıyor; bunlar yeni canlı ekran görüntüleri değildir.

## Öncelik listesi

P1: Kullanıcı verisi ve güvenilir ürün davranışı için ilk ele alınacaklar. P2: Yakın geliştirme döneminde çözülmesi gerekenler. P3: Kullanım verisiyle önceliklendirilecek iyileştirmeler. İş sırası hem güvenlik etkisini hem kullanıcıya verdiği zararı dikkate alır.

| No | Öncelik | Bulgu | Kanıt türü |
|---|---|---|---|
| S01 | P1 | Dosya sahibi hesabın silinmesi için Storage temizliği yok | Kod + resmi Supabase davranışı |
| S02 | P1 | Canlı gizlilik metni ve veri sorumlusu bilgisi tamamlanmamış | Canlı gözlem |
| S03 | P1 | Sızdırılmış parola koruması kapalı | Canlı advisor |
| P01 | P1 | Demo çağrıları 404 ekranına götürüyor | Canlı gözlem + kod |
| P02 | P1 | Yeni revizyon eski teklifin durumunu değiştirmiyor | Canlı fonksiyon tanımı; kabul senaryosu ayrıca test edilmeli |
| P03 | P1 | İş filtreleri yalnızca son 50 iş üzerinde çalışıyor | Kod |
| S04 | P2 | Hassas işlem öncesi taze doğrulama ve oturum yönetimi eksik | Kod |
| S05 | P2 | Kayıt kapatma bayrağı sadece web server action'da | Web ve mobil kod |
| S06 | P2 | Dosya türü kontrolü tam çözümleme ve yeniden kodlama yapmıyor | Kod; PDF logo işlemesinde piksel sınırı zaten var |
| S07 | P2 | Toplam Storage/kayıt kotası ve yükleme hız sınırı yok | İncelenen uygulama ve bucket kontrolleri |
| S08 | P2 | Public logo indirmesi istek başına service role kullanıyor | Kod |
| S09 | P2 | Public teklif bağlantısını iptal/yenileme akışı görünmüyor | İncelenen paylaşım aksiyonları |
| S10 | P2 | CSP, inline script çalışmasına izin veriyor | Kod |
| S11 | P2 | Üretim kontrolleri özel ortam bayrağına bağlı | Kod + canlı yasal yer tutucusu |
| S12 | P2 | IP sınırları proxy güvenine bağlı; kullanıcı/işletme sınırları eksik | Kod |
| S13 | P2 | Bakım ve geri yükleme kanıtı eksik | Kod, belgeler ve canlı metadata |
| S14 | P2 | Mobil bağımlılıklarda 19 high uyarısı sürüyor | Güncel npm audit |
| S15 | P2 | Ayrıcalıklı RPC'lerin negatif test matrisi CI'a bağlanmalı | Canlı advisor + mevcut test yapısı |
| U01 | P2 | Bazı küçük metinler ve tehlike düğmesi rengi yetersiz kontrastta | Renk değerleri üzerinden ölçüm |
| U02 | P2 | Ayarlar formunun hata metinleri alanlara programatik bağlı değil | Kod |
| U03 | P2 | Alt sayfalarda menü aktifliği kayboluyor | Kod |
| U04 | P2 | Mobilde maliyet ve paket ekranlarına erişim dolaylı | Menü kodu |
| U05 | P2 | Genel iş formu çok maliyet satırında uzun ve yorucu | Kod + tarihli mobil görüntü |
| U06 | P2 | Para girişi ve sayısal alan davranışı tutarlı değil | Kod |
| O01 | P2 | İş takibi tüm kayıtları belleğe alıyor; CSV export ağır büyüyebilir | Kod |
| O02 | P2 | Migration geçmişi ile depo geçmişi birebir görünmüyor | Canlı 9 kayıt; depoda 25 SQL migration |
| O03 | P2 | Güvenlik ve ürün belgelerinde eski bilgiler var | Belgeler + kod |
| O04 | P2 | Sağlık kontrolü tüm ürünün çalıştığını ölçmüyor | Kod |
| U07 | P3 | Bildirimler okundu/okunmadı yerine son 7 gün sayımıyla gösteriliyor | Kod |
| U08 | P3 | Klavye menü davranışı ARIA menu modeliyle tamamlanmamış | Kod |
| U09 | P3 | Marka ve tema değerleri bileşenlerde tekrarlanıyor | Kod |

## Güvenlik ve veri yaşam döngüsü

### S01. Hesap silme, dosyaları hesaba katmıyor

`src/lib/account/deletion.ts:18` kullanıcıyı doğrudan `auth.admin.deleteUser(userId)` ile siliyor. Abonelik denetimi var fakat Storage objelerini listeleyen veya temizleyen bir adım yok. Dosyalar `uploadWorkFile` ve `saveLogo` içinde kullanıcının oturumuyla yükleniyor.

Supabase, Storage objelerinin sahibi olan Auth kullanıcısının silinemeyeceğini açıkça belgeliyor. Bu yüzden hiç dosya yüklememiş hesapla geçen bir silme testi, logo veya saha fotoğrafı bulunan hesabın silinmesini doğrulamaz. İncelemede canlı Storage boştu; sorun canlıda dosya oluşturarak tetiklenmedi. [Supabase kullanıcı silme davranışı](https://supabase.com/docs/guides/auth/managing-user-data#deleting-users)

**Çözüm:** Silme talebini bir işlem kaydıyla başlat; ilgili dosyaları Storage API üzerinden sayfalı ve tekrar çalıştırılabilir biçimde kaldır; temizlik tamamlanınca Auth kullanıcısını sil. Depolama dosyaları ile veritabanı ilişkilerinin tek SQL transaction'ı olmadığını kabul ederek yarım kalma ve yeniden deneme tasarla. Aktif abonelik ve saklanması gereken kayıtlar için açık politika belirle. Web ayarlarına da veri dışa aktarma ve hesap silme erişimi ekle; bugün silme uç noktası mobil akışta kullanılıyor.

**Kabul ölçütü:** Logo + 100'den fazla fotoğraf/PDF bulunan staging hesabı silinebiliyor; başka işletmenin dosyaları korunuyor; yarım kalan silme kaldığı yerden devam ediyor; başarılı silmenin ardından refresh token yeni oturum üretemiyor.

### S02. Canlı gizlilik metni hâlâ lansman taslağı

[Canlı gizlilik sayfasında](https://www.kacayapayim.com/gizlilik) “Yasal işletme adı yayın öncesi eklenecek” yazıyor. Saklama süreleri kesinleşmemiş, barındırma sağlayıcısı da ileride seçilecekmiş gibi anlatılmış. Yayın belgesi Vercel'de canlı yayını belirtirken metin bu gerçek veri akışını yansıtmıyor.

**Çözüm:** Hesap verileri, kullanıcının müşteri verileri, özel dosyalar, ekip davetleri, loglar, HMAC IP özetleri ve yedekler için bir veri envanteri çıkar. Veri sorumlusu/veri işleyen rollerini, gerçek sağlayıcıları, işleme amaçlarını, hukuki sebepleri, saklama/silme işlemlerini ve başvuru yolunu metne işle. Yurt dışı aktarım ve sözleşme gereksinimleri somut altyapıya göre hukuk incelemesinden geçmeli. Aydınlatma ile açık rıza farklı işlemler; kayıt formuna tek genel “her şeye izin veriyorum” kutusu eklemek yeterli çözüm olmaz. [KVKK rol ve aydınlatma açıklaması](https://www.kvkk.gov.tr/Icerik/6874/2020-71), [aydınlatma ve rızanın ayrılması](https://www.kvkk.gov.tr/Icerik/5420/2018-90)

Bu bulgu tamamlanmamış yayın içeriği ve süreç boşluğudur; tüm işleme faaliyetleri hakkında hukuki uygunluk hükmü verilmedi.

### S03. Sızdırılmış parola koruması kapalı

Canlı advisor `auth_leaked_password_protection` uyarısını verdi. Uygulamada en az 8 karakter kontrolü var fakat sızdırılmış şifre kontrolünün yerini tutmuyor.

**Çözüm:** Supabase Auth ayarlarında erişilebilir plan/özellik koşullarını doğrulayıp korumayı etkinleştir. Önce yönetici hesaplarına, sonra isteyen işletme sahiplerine MFA ekle. Tüm kullanıcıları gereksiz karmaşık şifre kurallarıyla zorlamak yerine güçlü parola, parola yöneticisi ve riskli işlemlerde tekrar doğrulama kullan. [Supabase parola güvenliği](https://supabase.com/docs/guides/auth/password-security)

### S04. Hesap silmede ve güvenlik ayarlarında taze doğrulama

Mobil silme endpoint'i bearer token için `getUser(token)` çağırıyor; bu doğru bir başlangıç. Ancak `HESABIMI SIL` yazısı kimlik doğrulama sağlamıyor ve oturumun ne kadar önce doğrulandığı kontrol edilmiyor. Webde oturum listesi, diğer cihazlardan çıkış veya yönetici için MFA zorunluluğu görünmüyor.

**Çözüm:** Hesap silme ve güvenlik değişikliklerinde kısa süreli tekrar kimlik doğrulaması kullan. Kullanıcıya cihaz/oturum listesi ve “diğer oturumları kapat” işlevi sun. JWT silme sonrası süresi dolana kadar geçerli kalabildiğinden, yalnızca çıkış düğmesini güvenlik sınırı olarak kabul etme; yüksek etkili işlemlerde gerekli oturum geçerliliği denetimini tasarla. [Supabase silme ve mevcut JWT açıklaması](https://supabase.com/docs/guides/auth/managing-user-data#deleting-users)

### S05. `PUBLIC_SIGNUPS_ENABLED` tam bir kayıt kapatma mekanizması değil

Web `registerAction` bu bayrağı okuyor. Mobil `apps/mobile/src/app/(auth)/register.tsx:22` doğrudan Supabase `signUp` çağırıyor. Publishable anahtar zaten public olduğundan web formunu kapatmak Auth servisinde kayıt açılışını durdurmaz.

**Çözüm:** Pilot/davetli kullanım gerekiyorsa Supabase Auth kayıt ayarı veya sunucu tarafı bir kayıt hook'u üzerinden uygula. Aynı kural web, native ve doğrudan Auth API için geçerli olmalı. Bu turda kayıtların gerçekten kapalı tutulmasının istenip istenmediği veya sağlayıcı panelinde kapalı olup olmadığı doğrulanmadı; tespit bayrağın kapsamıyla ilgilidir.

### S06 ve S07. Dosya doğrulama ile toplam kota ayrı eksikler

İzinli türler, 2 MB logo/5 MB iş dosyası sınırı ve başlık imzası denetimi mevcut. Ancak PNG'nin ilk dört baytını veya PDF'nin `%PDF-` başlığını kontrol etmek dosyanın bütünüyle geçerli ve güvenli olduğunu kanıtlamaz. Görseller upload sırasında çözülüp yeniden kodlanmıyor; metadata temizliği ve upload piksel sınırı görünmüyor. PDF üretimindeki logo dönüştürmesinde `limitInputPixels:16000000` zaten var ve korunmalı.

**Çözüm:** Görselleri sınırlı piksel/decode bütçesiyle çöz, yeniden kodla, EXIF'i kaldır. PDF'leri özel depoda tut; kullanım riskine uygun tarama/karantina ve indirme davranışı belirle. Bucket MIME bilgisinin de istemciden gelebileceğini hesaba kat. Gereksiz şekilde tüm PDF'leri public içerik gibi sunma.

Tek dosya sınırı toplam depolama tüketimini sınırlamaz. Upload action'ında kullanıcı bazlı hız limiti yok; Storage insert politikası da kullanıcının kendi klasörüne doğrudan upload yapmasına izin veriyor. Sadece Next.js action'ına limit eklemek doğrudan Storage API yolunu kapatmaz.

**Kabul ölçütü:** Kullanıcı/işletme için toplam bayt, dosya adedi ve istek bütçesi uygulanıyor; limiti doğrudan Storage API üzerinden aşmak mümkün değil; bozuk görseller ve aşırı piksel içeren dosyalar reddediliyor. Kaynak tüketimi için bkz. [OWASP API4](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/).

### S08. Public logo servisi güçlendirilmeli

`src/app/api/business/logo/[id]/route.ts` kimliksiz istekte service role ile logo mapping'ini okuyup Storage'dan indiriyor. Logo herkese açık gösterilecek bir varlık olabilir; bunu doğrudan yetkisiz erişim açığı diye sınıflandırmıyorum. Bununla birlikte rate limit yok, başarılı yanıt için yalnızca 300 saniyelik public cache var ve hatalar kontrollü gözlemlenmiyor. Logo mapping politikası kendi kullanıcı klasörünü denetliyor ama `/logo/` alt dizinine sınır koymuyor.

**Çözüm:** İşletmenin public marka varlığını ayrı bir kuralla tanımla. Mapping'i logo dizinine ve geçerli görsele sınırla. ETag/cache ve kenar katmanında istek sınırı kullan. Genel iş dosyalarıyla public marka görseli arasındaki ayrımı veritabanında da koru.

### S09. Teklif bağlantısı paylaşımı erişim vermek anlamına geliyor

Public teklif bağlantısını bilen kişi içeriği görebiliyor ve karar verebiliyor. Rastgele token ve veri projeksiyonu iyi; Origin kontrolü ise kişinin gerçekten müşteri olduğunu kanıtlamaz. İncelenen paylaşım aksiyonlarında bağımsız “bağlantıyı iptal et” veya “yeni bağlantı oluştur” akışı yok.

**Çözüm:** Paylaşım kartına bağlantıyı bilenlerin erişebileceğini belirt. İptal ve token yenileme ekle. Geçerlilik tarihinin yalnızca karar vermeyi mi yoksa içeriği okumayı da mı kapattığını açıkça ayır. Büyük tutarlı tekliflerde isteğe bağlı alıcı doğrulaması eklenebilir; her küçük teklife OTP zorunluluğu getirmek akışı yavaşlatır. Karar anında teklif sürümü, içerik özeti, zaman ve doğrulama yöntemi için uygun denetim kaydı tut; token veya gereksiz kişisel veriyi loglama.

### S10 ve S11. CSP ve üretim koşulları

`next.config.ts:16` script CSP'sinde `'unsafe-inline'` kullanıyor. CSP, frame koruması, nosniff ve diğer başlıklar mevcut; ancak bu izin XSS'e karşı CSP'nin sağlayacağı ek korumayı azaltıyor. Bir XSS açığı gösterilmedi.

**Çözüm:** Nonce veya uygun hash yaklaşımını önce report-only olarak doğrula. Next.js hidratasyonu, JSON-LD, cache ve statik üretim etkilerini test et; izinleri körlemesine kaldırma. [Next.js CSP rehberi](https://nextjs.org/docs/app/guides/content-security-policy)

Üretim env ve hukuk kontrolleri `DEPLOYMENT_ENV === 'production'` koşuluna bağlı. Yanlış veya eksik özel bayrak, gerçek production build'inin bu kontrolleri atlamasına izin verebilir. Canlıdaki legal yer tutucusu beklenen yayın hazırlığı ile gerçek çıktı arasında fark olduğunu gösteriyor; bunun kesin nedeni hosting env değerleri okunmadan belirlenemez.

**Çözüm:** Hosting'in deployment ortamıyla özel bayrağı eşleştir, bilinmeyen ortam değerlerini reddet ve production smoke testinde zorunlu gerçek içerikleri doğrula. Sadece `LEGAL_REVIEW_APPROVED=true` değeri görmek, metnin tamamlandığını kanıtlamaz.

### S12 ve S13. Hız sınırı, bakım ve geri dönüş

HMAC IP özeti ve atomik DB limit sayacı iyi tasarlanmış. Proxy'nin `x-real-ip`/`x-forwarded-for` değerlerini güvenilir biçimde üretmesine dayanıyor. Proxy davranışı bu turda saldırı isteğiyle sınanmadı. Sadece IP kullanılması aynı işyeri ağı veya mobil NAT'taki farklı kullanıcıları birlikte sınırlayabilir.

**Çözüm:** IP yanında doğrulanmış kullanıcı, işletme ve gerekirse teklif token'ının HMAC özeti için ayrı bütçeler koy. Özellikle yükleme, export ve private PDF gibi pahalı işlemleri kapsa. Auth servisine doğrudan giden yolların sağlayıcı limitlerini ayrıca doğrula. Limit servisi arızasında işlemin reddedilmesi ve kullanıcıya doğru hata sunulması ayrı ayrı test edilmeli; lookup limitinin 404 gibi görünmesi de kullanıcıyı yanıltabilir.

`pg_cron` yok; inceleme anında 48 saatten eski limit kaydı da yoktu. Bu, zamanlanmış temizlik olmadığına kesin kanıt değildir. Hosting/external scheduler denetlenerek bakımın sahibi ve periyodu belirlenmeli. Veritabanı yedeği, Storage dosyaları ve geri yükleme birlikte planlanmalı; başarılı staging restore raporu olmadan yalnızca “yedek açık” bilgisi yeterli değildir.

### S14. Bağımlılık uyarıları yönetilmeli

Güncel `npm audit` 19 yüksek önem uyarısı veriyor. Başlıca kök zincirler `braces` ve `node-forge`; Expo/Metro/RN paketlerine dolaylı olarak yayılıyor. Bu paketlerin bir kısmı package.json'da dependencies altında olsa da bulgular araç/derleme zincirine bağlı; hepsini web sunucusunda uzaktan çalıştırılabilen açık diye sunmak yanlış olur.

**Çözüm:** Web çalışma zamanı ile mobil derleme SBOM'unu ayır, her kök uyarıda etkilenen kodun nerede çalıştığını belirle. Expo uyumlu yamayı izle. `npm audit fix --force` önerilerindeki çok eski Expo/RN sürümlerine toplu geçiş yapma. Build ortamına güvenilmeyen dosya/sertifika girdisini ve kullanılan imzalama akışını değerlendir. [node-forge imza doğrulama bildirimi](https://github.com/advisories/GHSA-86w9-cpqp-85rv)

### S15. Advisor uyarılarını doğru yorumlamak

8 public SECURITY DEFINER fonksiyon: `ensure_my_cost_defaults`, `get_dashboard_overview`, `mark_quote_sent`, `save_actual_job_costs`, `save_job_pricing`, `save_painter_job`, `save_quote`, `start_job`. İncelenen fonksiyonlarda oturum/sahiplik kontrolleri mevcut; sırf advisor uyarı verdi diye hepsinin yetkisini kaldırmak uygulamayı bozabilir.

**Çözüm:** Her fonksiyon için anonim, A işletmesi sahibi, B işletmesi sahibi, atanmış ekip kullanıcısı ve yönetici rollerini içeren izin matrisi çıkar. Parametreyle gelen kimliğin sahipliği DB içinde doğrulanmalı. Yetki yükseltme gerçekten gerekiyorsa private şemada tutulmalı; gerekmiyorsa invoker tercih edilmeli. [Supabase RLS ve rol modeli](https://supabase.com/docs/guides/database/postgres/row-level-security)

Politikası olmayan 8 RLS tablosu arasında analytics, billing event, platform_admins, counters ve rate limit tabloları var. Bunlar istemci erişimi kapalı, yalnızca servis tarafından kullanılan tablolar olabilir. “Policy yok” uyarısını açık sayıp herkese okuma politikası eklememek gerekir.

## Ürün ve tasarım düzeltmeleri

### P01. Demo bağlantısı canlı üründe kırık

Ana sayfada “Gerçek demoyu aç” ve “Demoyu incele” bağlantıları `/demo` adresine gidiyor. `src/app/demo/layout.tsx:8` Supabase yapılandırıldığında `notFound()` çağırıyor; canlı `/demo` 404 ekranı gösterdi.

**Çözüm:** İzole örnek verilerle çalışan public demoyu koru veya CTA'ları mevcut ücretsiz hesaplayıcıya yönlendir. Demo hiçbir gerçek işletme verisini kullanmamalı. Bu kısa düzeltme kayıt öncesi ürün keşfindeki açık bir kopuşu giderir.

### P02. Revizyonun eski teklif üzerindeki etkisi belirsiz

Canlı `private.copy_my_quote` yeni draft oluşturuyor, parent ve revision numarasını atıyor; eski teklifin durumunu değiştirmiyor. Revizyon geçmişi görünüyor fakat public karar yolunda en güncel revizyon şartı görünmüyor. Paket grubu kilidi farklı bir iş kuralı ve bu sorunun yerine geçmez.

**Risk:** Eski revizyon gönderilmiş/geçerli durumdayken müşteri eski bağlantıyla karar verebilir. Yeni revizyonun oluşturulmasıyla mı yoksa yayımlanmasıyla mı öncekinin kapanacağı ürün kararı olarak belirlenmeli. Bu ihtimal kontrollü staging senaryosuyla doğrulanmalı; bugün canlıda eski teklif kabulü denenmedi.

**Önerim:** Yeni revizyon taslakken önceki teklif geçerli kalsın. Yeni revizyon yayımlandığında önceki sürümü `superseded` gibi ayrı bir durumla kapat; eski bağlantı yeni sürüme yönlendirsin ve eski içerikten kabul yapılamasın. Revizyon ağacı içinde tek etkin karar sürümünü transaction içinde koru. Aynı eski sürümden paralel revizyon üretimine de kural koy.

### P03. İş listesi eski kayıtları gizleyebilir

`src/lib/jobs/service.ts` en fazla 50 son iş getiriyor. `src/app/(workspace)/jobs/page.tsx:20` bunu çağırıp durum filtresini sonuç üzerinde uyguluyor. Son 50 kayıtta tamamlanan iş yoksa, daha eski tamamlanan işler bulunduğu halde “Bu durumda iş bulunamadı” denebilir.

**Çözüm:** İşletme, durum, tarih ve aramayı SQL sorgusuna taşı; cursor veya açık sayfalama ekle. Toplam ve filtrelenmiş kayıt sayısını göster. `scheduled` durumunun mevcut liste filtrelerinde olmamasını da gider.

**Kabul ölçütü:** 251 işli fixture'da eski tamamlanan ve planlanan işler filtreyle bulunabiliyor; bir sonraki sayfada tekrar/atlama yok; başka işletme kaydı gelmiyor.

### U01. Kontrast ölçümleri

Renk değerlerinden WCAG formülüyle hesaplanan sonuçlar:

| Yazı / zemin | Oran | Değerlendirme |
|---|---|---|
| Beyaz / `#FF3B30` danger düğmesi | 3,55:1 | 14 px normal yazıda 4,5 hedefinin altında |
| `#8a8a91` / beyaz | 3,43:1 | Küçük yardımcı metinde yetersiz |
| `#8a8a91` / `#F5F5F7` | 3,15:1 | Küçük yardımcı metinde yetersiz |
| `#9d9da3` / beyaz | 2,70:1 | Placeholder okunabilirliği zayıf |
| `#6E6E73` / beyaz | 5,07:1 | Normal metin için yeterli |
| Beyaz / `#0071E3` | 4,70:1 | Normal metin için yeterli |

Bu ölçümler opak renk çiftleri için; tüm canlı sayfaların WCAG denetimi değildir. Disabled öğeler ve büyük metinlerin kuralları farklıdır. **Çözüm:** Tehlike düğmesini koyulaştır, ikincil metin token'ını standartlaştır, placeholder'ı görünür etiketin yerine kullanma. [W3C minimum kontrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

### U02 ve U08. Form ve klavye erişilebilirliği

Giriş formunda `aria-invalid` ve `aria-describedby` var. Ayarlar formunda `ErrorText` id almıyor ve Input'a hata bağlantısı aktarılmıyor. Görsel hata var ama ekran okuyucu bağlamı eksik. Hatalı gönderimden sonra ilk hataya odak veya bağlantılı hata özeti yok.

**Çözüm:** Ortak Field bileşeni kullan; hata metnini id ile bağla; başarısız gönderimde odaklanabilir özet veya ilk hataya odak ekle. Kaydetme sonucu live region'da bildirilsin.

Profil dropdown'ı `role=menu` kullanıyor; Escape ve dış tıklama var ama ok tuşları, menüye odak aktarımı ve kapatınca trigger'a dönüş tamamlanmamış. Menü kalıbını tamamla veya normal disclosure navigation kullan. Native Dialog'daki modal, Escape ve önceki odağa dönüş yaklaşımını koru; daha önce test edilmiş olması tüm menülerin aynı kaliteye sahip olduğunu göstermez.

### U03 ve U04. Navigasyon

Aktif menü için `pathname === href` karşılaştırması kullanılıyor. `/quotes/uuid` detayında Teklifler aktif görünmüyor. Kök yol ve alt yol eşleşmesini kullan; ilgili bölüm aktif kalsın.

Mobil alt menü 5 hedefle sınırlı; bu iyi. Ancak Maliyetlerim alt menüden çıkarılmış, kullanıcı dropdown'ında da doğrudan maliyet bağlantısı yok. Bir ustanın güncel maliyetlerini düzenlemesi sık yapılacak bir iş olduğundan mobilde keşfedilebilir olmalı. Mevcut 5 hedefi pilotta sınayıp bir “Diğer” menüsü veya sayfa içi kısa yol tasarla. Merkezi Yeni Teklif düğmesini korurken İşlerim ve İş Takibi kavramlarını tek akışta anlaşılır hale getir.

### U05 ve U06. Saha kullanımı ve para girişi

Genel iş formunda her maliyet ayrı büyük kart; mobil görüntüde tek satır bile uzun bir alan kaplıyor. En fazla 60 satır destekleniyor. Bu düzen birkaç kalemde rahat, çok satırda toplamı ve kaydetmeyi sürekli aşağı taşır.

**Çözüm:** Aktif satır açık, tamamlanan satır özet halinde olsun. Mobilde klavye ve alt navigasyonu örtmeyen toplam/kaydet alanı kullan. Sık kalem ekleme, önceki satırı kopyalama ve malzeme kataloğu erişimini ekle. Masaüstünde satır düzeni daha yoğun olabilir. İlk kaydetmede eksik satıra kaydır ve alanı göster.

Genel form miktar ve maliyeti `type=number` + `Number(value)` ile yönetiyor; başka akışlar Türkçe para ayrıştırıcısı kullanıyor. Geçici boş değer ve `1.234,50` girişi için tutarlı davranış tanımlanmalı. Metin tabanlı decimal giriş, açık birim, görünür yuvarlama ve ortak kuruş hesabı öneriyorum. Her tuşta değeri zorla biçimlendirmek cursor'ı bozmamalı.

### U07. Bildirimler karar tarihi ve okunma durumuna dayanmalı

`WorkReminders` kabul/red sayılarını `updated_at >= son 7 gün` ile getiriyor. Bir teklifte sonraki değişiklik, eski kararın yeniymiş gibi sayılmasına yol açabilir. Bildirim görünümü bu haliyle inbox değil, dönem özeti.

**Çözüm:** Kabul için `accepted_at`, ret için `rejected_at` kullan. Bildirim gerekiyorsa tekil olay kimliği, okundu durumu, ilgili teklife doğrudan bağlantı ve yinelenmeyen teslim kaydı ekle. Sağlayıcı yokken SMS/push teslim edilmiş gibi davranma; mevcut açık paylaşım açıklamalarını koru.

### U09. Görsel yön

Mevcut beyaz/gri yüzeyler, mavi ana eylem ve düzenli kart dili ürünün amacına uygun. Baştan renk paleti veya logo değiştirmek ilk ihtiyaç değil. Küçük yazıların okunması, büyük tutarların hiyerarşisi ve saha kullanımının hızlanması daha değerli.

Renkleri semantik token'lara taşı: metin, ikincil metin, sınır, başarı, uyarı, hata, ana eylem. Finansal ekranlarda miktar/birim/para hizasını koru; salt renkle durum anlatma. Karanlık tema ancak bağımsız kontrast doğrulamasıyla eklenmeli. Yeni animasyonlardan önce form sonucu, kaydetme ve yükleme geri bildirimlerini güçlendir. Reduced-motion CSS'i zaten var.

## Performans, yayın ve bakım

**O01:** `listWorkEntries` 500'lük sayfalarla bütün geçmişi toplayıp ekrana gönderiyor. Bu, veritabanı sayfalaması yapıyor görünse de kullanıcının ihtiyacı için sınırlı sorgu değil. Durum, tür, tarih ve cursor DB'de uygulanmalı; kullanıcı önce açık kayıtları görmeli. CSV export da tüm satırları belleğe alıyor ve üst sınırı yüz binlerce satıra yaklaşabiliyor. Streaming veya arka plan export işi ve indirme süresi/kotası kullan; kullanıcıya ilerleme göster. Private PDF uç noktasına da bütçe ekle; public PDF'de mevcut limit korunmalı.

**Veritabanı:** Advisor'ın 10 eksik FK indeksi arasında `quotes.parent_quote_id`, `work_entries.author_user_id`, package group ve subscription ilişkileri var. Gerçek sorguları EXPLAIN ile inceleyip gereken indeksleri ekle. 3 RLS uyarısı `feedback`, `job_viewers`, `service_package_groups` politikalarında; uygun yerlerde `(select auth.uid())` yaklaşımını değerlendirebilirsin. 8 kullanılmamış indeksi yeni projede hemen silme; pilot trafiği ve bakım ihtiyacı görülmeden bu bilgi karar için yetersiz.

**O02:** Canlı migration tablosunda 9 kayıt var, depoda 25 SQL dosyası bulunuyor. İlk şemanın farklı yöntemle kurulmuş olması mümkün. Bu, canlıda tablo eksikliği kanıtı değil ama yeni ortamı birebir üretme konusunda boşluk. Boş staging'de tam migration zincirini kur; şema/fonksiyon/ACL farkını çıkar; başlangıç şeması ve migration geçmişini kontrollü biçimde hizala. Canlıda eski SQL dosyalarını gelişigüzel yeniden çalıştırma.

**O03:** SECURITY_CHECKLIST dosya yükleme ve silmenin bulunmadığını söylüyor; README gider/KDV/delivery durumunda daha yeni yayın belgesiyle çelişen açıklamalar taşıyor. Her özellik için “kaynakta var / canlı webde var / native'de var / cihazda test edildi” tablosu tut. Güncel güvenlik kontrol listesi release işleminin parçası olsun.

**O04:** `/api/health`, plans tablosuna erişimi ölçüyor. Auth, dosya upload, mail, public teklif kabulü veya PDF çalışıyor anlamına gelmiyor. Bağımsız sentetik staging testleri ve kırmızı alarm eşikleri ekle. Hata logunun PII serialize etmemesi iyi; request id, operasyon, hata sınıfı ve süreyle teşhisi geliştir. Sağlık kontrolüne sır veya özel iş verisi koyma.

Depoda `.github` workflow klasörü bulunmadı; Vercel veya başka CI politikası bu turda doğrulanmadı. PR/release kontrollerinde birim testleri, tür kontrolü, mobil lint, gerekli SQL negatif testleri ve deploy sonrası smoke test zorunlu hale getirilmeli. Gerçek Core Web Vitals alan verisi olmadan performans puanı uydurulmamalı.

## Eklenebilecek özellikler ve önerilen sıra

| Sıra | Özellik | Kullanıcıya katkısı | Gerekli koruma / sınır |
|---|---|---|---|
| 1 | İlk teklif için kısa rehber | Boş dashboard'dan ilk sonuca ulaşmayı kolaylaştırır | Örnek veri ile gerçek kayıt ayrı kalmalı |
| 2 | Maliyet güncellik göstergesi | Eski alış fiyatıyla düşük teklif verme riskini azaltır | Güncelleme eski iş snapshot'ını değiştirmemeli |
| 3 | Şablon ve favori maliyet kalemleri | Aynı işi yeniden yazmayı azaltır | Mevcut kopyalama/template işlevlerini geliştirme; yeniden icat etme |
| 4 | Kazanç/kayıp nedenleri | Hangi işlerde fiyat veya maliyet sorunu olduğunu gösterir | Yeterli veri yoksa kesin öneri üretme |
| 5 | Teklif değişiklik karşılaştırması | Müşteri ve işletme neyin değiştiğini kolay anlar | Tek etkin revizyon kuralı önce çözülmeli |
| 6 | Güvenli bağlantı iptali ve alıcı doğrulaması | Yanlış kişiye gönderilen link yönetilebilir | OTP ve log için gereksiz PII toplama |
| 7 | Keşif ve saha takvimi | Çakışmalar, yaklaşan işler ve geciken takip görünür | Saat dilimi, izin ve müşteri adresi erişimi |
| 8 | Gerçek bildirim inbox'ı | Müşteri kararı ve revizyon talebi kaybolmaz | Okundu durumu, idempotency ve teslim kanıtı |
| 9 | Hafif offline taslak | Sahada bağlantı kesilince iş girişi korunur | Cihazdaki müşteri verisi, logout temizliği ve çakışma çözümü |
| 10 | Maliyet gerçekleşme açıklaması | “Tahminden neden az kazandım?” sorusuna yanıt | Saha gideri ile manuel gerçekleşen satırın çift sayılmaması |
| 11 | Onaylı ek işten revizyon oluşturma | Saha değişikliği gelir tarafına doğru yansır | “Müşteri onayladı” düğmesi tek başına gelir eklememeli |
| 12 | CSV kolon eşleme ve hata dosyası | İngilizce başlıkları bilmeyen kullanıcı da aktarır | Formül güvenliği, satır kotaları ve duplicate kuralı korunmalı |
| 13 | Daha ayrıntılı veri dışa aktarma | İş, gider ve dosya arşivini kullanıcı alabilir | Hassas export için taze doğrulama ve süreli erişim |
| 14 | Ekip yetki ekranı | Kimin hangi işi gördüğü anlaşılır | İş/fiyat/kâr/not/dosya yetkileri ayrı; varsayılan en az izin |
| 15 | Kontrollü yeni meslek yayını | Mevcut dinamik şablon sistemiyle kapsama alanı artar | Taslak testleri, formül sınırları ve eski snapshot korunması |
| 16 | İsteğe bağlı tahsilat takibi | Kazanç ile nakit girişini ayırır | Ödeme entegrasyonu ve muhasebe kapsamı ayrı ürün kararı |

Ödeme, stok ve kapsamlı muhasebeyi aynı anda başlatmazdım. Önce gerçek kullanıcıların teklif ve maliyet akışını ölçmek gerekir. Yeni özelliklerin çoğu mevcut kopyalama, ekip, gider, KDV, hizmet paketi ve bildirim altyapısının tamamlanmasıdır; bunları uygulamada yokmuş gibi saymak doğru olmaz.

## Ölçülecek ürün göstergeleri

İlk girişten ilk kaydedilmiş işe, ilk paylaşılan teklife ve ilk gerçek maliyet kaydına kadar geçen süre ölçülsün. Dönüşümde hangi adımda kayıp olduğu görülsün. Haftalık tekrar kullanım, maliyet güncelleme oranı, kaydedilemeyen form oranı, kırık CTA sayısı, PDF hata oranı ve silme başarısı izlenmeli. Ölçümde mevcut kullanıcı tercihi ve minimum veri ilkesi korunmalı; public token, müşteri telefon/adres ve teklif metni analitik olaya yazılmamalı. Hedef sayılar pilot ölçülmeden belirlenmemeli.

## Uygulama planı

**İlk teslim grubu:** P01 demo bağlantısı, S02 gerçek gizlilik içeriği ve production kontrolü, S03 parola koruması, S01 dosyalı hesap silme. Demo düzeltmesi kısa; hukuk içeriği gerçek işletme bilgisi ve inceleme gerektirir. Hesap silme için hatada yeniden deneme tasarımı ve staging doğrulaması gerekir.

**İkinci teslim grubu:** P02 revizyon yaşam döngüsü, P03 DB filtreleme/sayfalama, S05 kayıt kapatma kapsamı, S07 depolama bütçesi, U01/U02 kontrast ve form erişilebilirliği. Her biri kullanıcı davranışı veya yetki sınırı değiştirdiği için kabul testleriyle teslim edilmeli.

**Üçüncü teslim grubu:** Bakım/restore, migration yeniden üretilebilirliği, CI güvenlik matrisi, CSP sertleştirme, taze doğrulama, pahalı endpoint sınırları ve performans sorguları.

**Pilot sonrası:** İlk teklif rehberi, favori kalemler, kâr sapma analizi, offline taslak ve gerçek bildirim hizmeti. Fiziksel Android/iPhone testleri ve mağaza dağıtımı ayrı kabul ölçütü taşımalı; JavaScript/Hermes paketinin üretilmesi mağaza uygulamasının yayımlandığını göstermez.

## Düzeltmelerin kabul testleri

1. A işletmesinin kullanıcısı, B işletmesinin müşteri/iş/teklif/dosya UUID'siyle read ve write yapamıyor. Aynı test doğrudan Supabase REST/RPC üzerinde de geçiyor.
2. Atanmış ekip kullanıcısı yalnızca atanmış işi görüyor; fiyat/kâr/özel müşteri iletişimine erişemiyor. Not izni kapatılınca yeni not ekleyemiyor; davet başka e-posta ile kabul edilemiyor.
3. Public teklif DTO/PDF'de iç maliyet ve kâr yok. Geçersiz, iptal edilmiş ve yenilenmiş token uygun şekilde reddediliyor.
4. Yeni revizyon yayımlandıktan sonra eski bağlantıdan kabul/ret yapılamıyor. Eşzamanlı iki karar iş/teklif durumunu çelişkili hale getirmiyor.
5. Paket grubunda tek seçim var; aynı isteğin yeniden gönderimi ikinci iş başlatmıyor.
6. Dosyalı hesap silme, yarım kalan silme ve abonelik engeli doğru çalışıyor. Kullanıcının Auth erişimi ve kendi dosyaları için kalan durum kontrol ediliyor.
7. Yükleme kotaları doğrudan Storage çağrısıyla aşılamıyor; büyük chunked body ve bozuk MIME örnekleri reddediliyor.
8. 251 işli listede filtre, sayfa geçişi, eski kayıt ve planned durum doğru. İş takibi bütün geçmişi ilk yüklemede indirmiyor.
9. Türkçe `1.234,50`, boş değer, negatif tutar, sıfır miktar ve yüksek tutar tüm para girişlerinde tutarlı. KDV ve kuruş yuvarlaması web/native/PDF'de aynı.
10. Mobil klavye açıkken toplam/kaydet görünür; alt menü içeriği örtmüyor. 320/390 px, 200% zoom ve büyük yazı boyutu deneniyor.
11. Klavye ve ekran okuyucuyla hatalı alan bulunabiliyor; modal/menu açılış-kapanış odağı doğru.
12. Production deployment eksik ortam/gerçek legal veri ile yayın kapısını geçemiyor. Demo CTA ve diğer kritik bağlantılar smoke testinde doğrulanıyor.

Rapor dışında uygulama kodu, veritabanı veya hosting ayarları değiştirilmedi. Tür kontrollerinin ürettiği gitignore kapsamındaki build metadata'sı dışında teslim edilen yeni dosya bu rapordur.

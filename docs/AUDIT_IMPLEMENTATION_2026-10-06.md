# 6 Ekim güvenlik ve ürün geliştirmeleri

Bu belge, [inceleme raporundaki](DETAILED_AUDIT_2026-10-06.md) maddelerin uygulama durumunu gösterir. Onay sonrası 7 Ekim 2026'da canlı Supabase yedeği alınıp ayrı PostgreSQL 17 örneğine geri yüklendi; ilk beş migration canlıya uygulandı. Yeni web sürümü Production'a alındı; hedefli Auth parola ayarları ve kayıt hook'u etkinleştirildi. Son Storage upload kilidi, canlı oturumla gerçek dosya akışı sınanmadan beklemede.

Hizmeti sunan kişi kullanıcı bilgisine göre Ercan Yumuşak. Adres eklenmedi. Ödeme sağlayıcısı bulunmadığı için tahsilat yalnızca elle kayıttır. Gizlilik içeriği teknik veri akışlarına göre düzenlendi; `LEGAL_REVIEW_APPROVED` yayın kontrolü kaldırılmadı veya kendiliğinden onaylanmadı.

## Güvenlik ve işletim maddeleri

| Madde | Yerelde yapılan | Canlı kabul için kalan |
|---|---|---|
| S01 | Hesap silmede abonelik kontrolü, silme kilidi, kullanıcı klasörünün 100'lük sayfalarla Storage API üzerinden temizlenmesi; hata durumunda yeniden deneme | Gerçek Storage hesabında 100'den fazla dosya ve yarım kalan işlem; Auth refresh token kontrolü |
| S02 | Gerçek hizmet sahibi, Supabase Frankfurt/Vercel, veri envanteri, tahsilat, sesli yazma ve saklama/silme anlatımı | Hukuki inceleme ve yurt dışı aktarım gereklilikleri; mevcut production kapısı |
| S03 | Web/native TOTP; yönetici için MFA; MFA'lı hesapta AAL1 okuma/yazma ve ayrıcalıklı RPC engeli | Supabase sızdırılmış parola koruması mevcut planda kullanılamıyor; plan yükseltme yapılmadı |
| S04 | Hesap silme/diğer oturumları kapatma/export öncesi güncel parola; MFA denetimi | Sağlayıcının cihaz/oturum listesini gösteren bir ekran eklenmedi. Diğer oturumları kapatma var; JWT'nin anında iptal edildiği iddia edilmiyor |
| S05 | Sağlayıcıda çalışan kayıt hook'u ve `signup_settings.enabled`; web de bu ayarı okur | Auth hook'unun sağlayıcıda kaydedilmesi; mobil ve doğrudan Auth çağrısıyla doğrulama |
| S06 | Görseller çözülüp yönü düzeltilir, WebP olarak yazılır, EXIF kaldırılır; 16 milyon piksel sınırı. PDF çözümleme, 200 sayfa sınırı, etkin içerik/ek dosya reddi | Bu kontrol antivirüs veya bütün PDF risklerinin giderildiği iddiası değildir; gerçek upload smoke testi |
| S07 | Kullanıcı başına 100 MB/1.000 dosya; atomik rezervasyon; 30 yükleme/saat; tek dosya 5 MB, logo girişi 2 MB | Son migration ile doğrudan Storage insert politikasını kaldırmak; eşzamanlı yükleme testi |
| S08 | Logo dizini sınırı hem DB hem sunucuda; ETag/önbellek/hız sınırı; marka kaydı ve işletme URL'si tek işlemde | Gerçek logo yükleme/değiştirme/silme ve hata testi |
| S09 | Link yenileme/iptal, isteğe bağlı altı haneli erişim kodu, süreli HttpOnly erişim izni, karar içeriği/sürümü/tarihi/hash kaydı | Kod kimlik doğrulaması değildir; SMS/e-posta OTP sağlayıcısı eklenmedi. Karar kaydı sahibi tarafından değiştirilemez, DB yöneticisine karşı değişmezlik garantisi verilmez |
| S10 | Nonce ile CSP Report-Only, sınırlı rapor endpoint'i, token/URL loglamama | Politika henüz zorunlu uygulanmıyor. Statik sayfalar, Next hidratasyonu ve gerçek ihlaller staging'de doğrulanmalı |
| S11 | Vercel production sinyali, ortam değeri kontrolü, gerçek legal alanlar, HTTPS ve sunucu sırrı zorunluluğu | Hosting ortam değerleri ve hukuk onayı |
| S12 | Hassas endpoint'lerde kullanıcı bazlı sınır, Vercel'in yazdığı proxy başlığı; diğer proxy'lerde açık güven ayarı; production fail-closed | Gerçek proxy ve sınır davranışı |
| S13 | Günlük 02:17 UTC bakım: 48 saatten eski sınır sayaçları, 90 günden eski üç toplu analitik tablo, eski upload rezervasyonları | Gerçek pg_cron çalışması; yedek ve ayrı ortamda geri yükleme tatbikatı yapılmadı |
| S14 | Güncel audit, web/mobil ayrı kilit dosyası bağımlılık envanteri, yeni uyarıları durduran CI kontrolü | 19 high uyarısı sürüyor; iki kök bildirim `braces` ve `node-forge`. Eski Expo/RN sürümüne zorla geçilmedi. İstisnalar 6 Kasım 2026'da yeniden inceleme gerektirir |
| S15 | Boş veritabanında migration replay; işletmeler arası ret, ekip, public DTO, MFA, quota, paylaşım ve arşiv SQL kontrolleri; CI bağlantısı | Gerçek Supabase/PostgREST, eşzamanlı karar ve production smoke matrisi |
| O01 | İş takibi filtreleri DB'de, 50 kayıt/sayfa; gider toplamı ayrı SQL aggregate; CSV ve hesap arşivi akışla indirilir | Büyük staging veri setinde süre/bellek ölçümü |
| O02 | 31 yerel migration izole PostgreSQL üzerinde baştan çalışıyor | Canlıdaki 9 migration kaydı ile eski 25 dosyanın şema/ACL/fonksiyon eşleşmesi ve kontrollü geçmiş hizalaması; eski dosyalar canlıya tekrar uygulanmamalı |
| O03 | README, bu teslim belgesi ve güvenlik kontrol listesi güncellendi | Yeni yayın ve native cihaz kanıtlarının tarihli eklenmesi |
| O04 | Health, temel tablolar/yeni kolonlar ve özel Storage bucket'ını kontrol eder; ayrıntılı hata veya özel veri döndürmez | Auth, e-posta teslimi, upload, PDF ve karar akışları için gerçek sentetik staging testleri; health bunların yerine geçmez |

## Ürün, erişilebilirlik ve ek özellikler

| Madde/özellik | Son durum |
|---|---|
| P01 demo | Supabase bağlı olsa da public örnek veri demosu açık; gerçek işletme verisi kullanılmaz |
| P02 revizyon | Taslak eski teklifi kapatmaz. Hazır olunca önceki etkin sürümler kapatılır; kabul edilmiş teklifin yerine revizyon yayımlanamaz. İptal edilen eski link canlandırılamaz. Eski link yeni sürüme otomatik yönlendirilmez; erişim kapatılır |
| P03 iş listesi | Durum/başlık/tarih sorgusu DB'de; 25 kayıt/sayfa, toplam ve Planlandı filtresi |
| U01/U09 renkler | Tehlike düğmesi ve küçük metin kontrastı düzeltildi; semantik temel renkler tanımlandı. Bütün bileşenlerde eski renk tekrarlarını kaldıran tam tema dönüşümü yapılmadı |
| U02 form hataları | Ortak Input'ta alan/hata ilişkisi, aria-invalid/describedby; ayarlarda hata özeti ve odak |
| U03/U04 navigasyon | Alt sayfalarda bölüm aktif; mobil hesap menüsünde maliyet, işler ve paket erişimi |
| U05/U06 genel form | Özetlenen maliyet satırları, favoriden ekleme, mobil toplam/kaydet alanı; Türkçe fiyat/miktar ayrıştırma; boş/geçersiz değerler korunur. Her satırda kopyalama düğmesi; 60 satır sınırı kopyalamada da korunur |
| U07 bildirim | Karar tarihi üzerinden özet; kabul/red ve revizyon talebi için tekil olaylı, okundu durumlu inbox. Harici push/SMS teslimi yok |
| U08 klavye | Profil menüsü normal disclosure navigation; Escape odağı geri verir. Tamamlama ve aktarım ortak Dialog kullanır |
| İlk teklif rehberi | Teklifi olmayan hesapta maliyet → iş → fiyat/paylaşım bağlantıları |
| Güncel maliyet | Mevcut maliyet eskime göstergesi korundu; yeni eski iş snapshot'ları değişmez |
| Şablon/favori | Mevcut şablon/kopyalama korundu; işletmeye özel favori maliyet ve genel forma hızlı ekleme |
| Kazanç/kayıp ve gerçekleşme | Mevcut sonuç özeti korundu; tamamlama formunda en büyük dört satır farkı ve ayrı saha gideri toplamı. Tutar farkından kesin neden çıkarılmaz |
| Değişiklik karşılaştırması | Önceki revizyonla müşteri içeriği, vergi/toplam, kapsam, hariç işler ve koşullar karşılaştırılır |
| Güvenli link/alıcı koruması | İptal/yenileme ve isteğe bağlı erişim kodu; alıcı kimliği ispatı iddiası yok |
| Keşif/saha takvimi | Tarih filtresi, İstanbul saati; diğer açık keşiflere bir saatten yakınsa sunucu uyarısı ve açık kullanıcı onayı. Ayrı aylık takvim görünümü yok |
| Offline taslak | Kullanıcı+işletme bazlı aynı sekmede 24 saat; ağ gelince otomatik gönderim yok. Sadece kaydedilmemiş form korunur; tam çevrim dışı uygulama değil |
| Onaylı ek iş | Kaynağın sahipliği/onayı DB'de doğrulanır; satır kilidiyle aynı ek iş tekrarında aynı yeni iş döner. Yeni maliyet/fiyat/teklif hazırlanır; eski kabul ve gelir değişmez |
| CSV eşleme/hata dosyası | Türkçe başlık önerileri, elle eşleme, önizleme, örnek dosya, formül güvenli hata indirme; 100 satır/512 KB ve 3 aktarım/saat |
| Ayrıntılı export | 7 CSV ve 22 tabloyu kapsayan hesap arşivi; güncel parola, MFA, 10 dakikalık izin, akışlı indirme; public token/davet hash'i çıkmaz. Dosya içeriği ayrı indirilir |
| Ekip yetkileri | `/team-access`: 50 yetki/sayfa, ilgili işler, not izni ve erişim iptali; yeni davet görüntüleme izniyle başlar |
| Meslek yayını | Yönetici MFA; taslak sunucuda yeniden okunup örnek hesap çalıştırılır; pozitif maliyet olmadan yayın olmaz. Önizleme ve yayın aynı örnek alan dönüşümünü kullanır; silinen sayısal giriş sıfıra çevrilmez. Bütün olası iş girdileri için matematiksel doğruluk garantisi değil |
| Tahsilat | Elle tutar/tarih/nakit-banka-diğer/not, toplam/bakiye/fazla ödeme, silme; aynı form tekrarında çift kayıt önleme. Transfer, kart veya muhasebe entegrasyonu yok |

## 7 Ekim canlı geçiş kaydı

| Adım | Sonuç |
|---|---|
| Yedek | Supabase resmi CLI bağlantı rolü ve PostgreSQL 17.11 ile custom-format veritabanı yedeği alındı. SHA-256 ve dosya boyutu `tmp/private-backups/restore-manifest.json` içinde. Yedek klasörü Windows kullanıcı ACL'i ile sınırlandı; asıl yedek `tmp/private-backups/before-audit-2026-10-07.dump` konumunda. |
| Ayrı geri yükleme | Gerçek `public`, `private`, `auth`, `storage` ve `supabase_migrations` şemaları yerel PostgreSQL 17'ye geri yüklendi. 2 kullanıcı, 2 işletme, 2 iş, 3 teklif ve 0 Storage nesnesi gözlendi. Sağlayıcı Auth/Storage servisleri, vault/extension yöneticileri ve pg_cron worker bu geri yüklemenin parçası değildir. |
| Şema karşılaştırması | İlk beş geçiş öncesinde 820 uygulama nesnesi okundu. Yerel temel şema eşleşiyor; 30 mevcut fonksiyonun gövdesi eşleşirken sağlayıcının `service_role` izinleri farklı, `rls_auto_enable` ise sağlayıcı platform yardımcısı. `update_my_settings` üzerindeki anonim çalıştırma izni gereksizdi; migration bunu kaldırıyor. Eşleşme raporu `tmp/live-schema-differences.json` içinde. |
| Geçiş provası | Altı audit migration gerçek yedek kopyasında çalıştı; yalnızca pg_cron workerı stub ile temsil edildi. Ürün ve audit SQL senaryoları test verisini transaction sonunda geri aldı. |
| Canlı ilk adım | 9 canlı geçmiş sürümü ve yalnızca yeni ilk beş dosyayı içeren geçici CLI manifesti kullanıldı. `db push --dry-run` yalnızca beş beklenen geçişi gösterdi; ardından aynı beş geçiş canlıya uygulandı. Son Storage migration bilinçli olarak uygulanmadı. |
| Vercel ayarları | Production ortamına `NEXT_PUBLIC_LEGAL_ENTITY_NAME=Ercan Yumuşak`, `NEXT_PUBLIC_SUPPORT_EMAIL=destek@kacayapayim.com`, `LEGAL_REVIEW_APPROVED=true` (kullanıcının bildirdiği hukuk incelemesi) ve `DEPLOYMENT_ENV=production` eklendi. Mevcut URL/anahtar/sır değerleri okunmadı veya dışa aktarılmadı. |
| Üretim yayını | Kullanıcı onayından sonra `6dc5bb7` commit'i `main` dalına gönderildi; Vercel Production deploy'u Ready oldu. Durum raporu `a3f868a` ile ayrıca yayınlandı. |
| Canlı duman testi | Ana sayfa, `/gizlilik`, `/kullanim-kosullari`, `/demo` ve `/api/health` HTTP 200 yanıtladı. Güvenlik başlıkları/CSP görüldü. Auth gerektiren gerçek dosya yüklemesi denenmedi. |
| Auth güvenlik ayarları | Supabase Email Auth için minimum parola 8 karaktere ayarlandı ve secure password change açıldı; mevcut parola şartı boş bırakıldı. `before_user_created` PostgreSQL hook'u etkinleştirildi. Kullanıcı kayıtları açık kaldı. |

Canlı veritabanı, Vercel ayarları/deploy'u ve Supabase Auth ayarları panellerinden doğrulandı. Önceki otomatik onay reddi, kullanıcı açık onayını aldıktan ve yedek/geri yükleme doğrulandıktan sonra burada tekrar oluşmadı.

## Bu turdaki doğrulamalar

| Kontrol | Sonuç ve sınır |
|---|---|
| Birim testleri | 64/64 geçti |
| Web tür kontrolü ve Next production build | Geçti. Yerel build, Vercel production ortamı veya hukuk onayı doğrulaması değildir |
| Mobil tür kontrolü/lint | Geçti; son lint'te uyarı yok |
| Android/iOS export | İkisinin JavaScript/Hermes paketi üretildi. APK/IPA, imzalı mağaza yayını veya fiziksel cihaz testi değildir |
| SQL | 31 migration replay + iki SQL test dosyası geçti. Gerçek Auth/Storage yerine platform fixture kullanılır; pg_cron iş kaydı test edilir, background worker çalıştırılmaz |
| SQL ek senaryolar | Kodlu erişim, signup kapalı/açık, karar snapshot/hash, revizyon inbox, silme-upload kilidi, 1.000 dosya sınırı, 22 arşiv tablosu, hassas anahtar temizliği, ek iş tekrar güvenliği |
| Canlı arşiv provası | Canlı yedek, ayrı PostgreSQL 17 örneğine geri yüklendi; 31 yerel migration ve iki DB senaryo dosyası geri yüklenen şema üzerinde çalıştı. Supabase Auth e-posta teslimi, Storage binary nesne içeriği ve cron worker davranışını doğrulamaz. |
| Yerel tarayıcı | 390 px Türkçe `2,5 × 1.234,50 = 3.086,25`; satır aç/kapat; işletme A/B taslak ayrımı ve geri yükleme; modal Escape/odak; 320 px yatay taşma düzeltmesi sonrası içerik ve görünür genişlik 305 px |
| Bağımlılık audit | 19 high, 0 critical; yeni uyarı kontrolü çalıştı |
| Envanter | Kilit dosyasından 73 web, 867 mobil bileşen. İsteğe bağlı platformlar dahildir. `npm sbom` mevcut güvenlik override sürümleri ve opsiyonel bağımlılık aralıkları nedeniyle hata verdi; envanter bu durumu gizleyen kurulum doğrulaması değildir |

Geçici tarayıcı inceleme sayfası kontrollerden sonra kaldırıldı. Gerçek müşteri verisiyle tarayıcı testi yapılmadı. 200% zoom, ekran okuyucu, fiziksel klavye/telefon klavyesi, gerçek MFA sağlayıcı akışı ve bütün yeni ekranların görsel kabulü henüz tamamlanmadı. GitHub Actions dosyası hazır; uzak workflow çalışması yapılmadı.

## Canlı geçişin kapsamı ve kalan işler

Hedef mevcut `ryspkilfryezliaobnyv` Supabase projesidir. Kullanıcıdan onay istenecek değişiklikler:

1. **Tamamlandı.** Yedek/geri yükleme provası ve şema eşlemesinin ardından ilk beş migration canlıya uygulandı.
2. **Tamamlandı.** Vercel Production ayarları kaydedildi, `6dc5bb7` üretime dağıtıldı ve kamuya açık sayfalar ile sağlık uç noktası smoke testinden geçti.
3. **Tamamlandı.** Supabase Auth minimum parola 8, secure password change ve `before_user_created` hook'u kaydedildi/etkinleşti. Kayıtlar açık; ücretli sızdırılmış parola koruması yükseltmesi yapılmadı. Gerçek kayıt/MFA e-posta akışı uçtan uca sınanmadı.
4. **Bekliyor.** Altıncı Storage lockdown migration'ını, canlı oturumla gerçek upload akışını doğruladıktan sonra uygula. Yeni uygulama sunucu upload'u kullanıyor; ancak üretimde upload smoke testi yapılmadı.
5. **Bekliyor.** Gerçek pg_cron workerı ve retention temizliğini ayrı takip et. Native dağıtım ve fiziksel cihaz kabulü ayrıca yapılmalı.

| Sıra | Migration |
|---|---|
| 1 | `20261006101414_audit_security_and_collections.sql` |
| 2 | `20261006102540_audit_mfa_and_notifications.sql` |
| 3 | `20261006150644_audit_signup_and_public_access.sql` |
| 4 | `20261006151357_audit_workflow_improvements.sql` |
| 5 | `20261006152705_audit_decision_history_and_permissions.sql` |
| Web sonrası | `20261006154115_audit_storage_upload_lockdown_final.sql` |

Bakım görevi günlük 02:17 UTC, İstanbul'da 05:17'dir. 48 saat/90 gün eşikleri günlük çalışmada değerlendirilir; tam eşik anında silme değildir. Silinen retention kayıtları geri alınamaz; daha eski yedeği geri yüklemek daha yeni müşteri işlemlerini kaybettirebilir. İlk beş migration yeni veriye uyumlu düzeltmeyle ilerleme gerektirebilir; kör bir ters migration hazırlanmadı. `supabase/config.toml` sağlayıcıdan alınmış bütün ayarları içerdiği için dosyanın tamamını kontrolsüz push etmek yerine yalnızca hedeflenen Auth farkları incelenmeli. Kayıtlı yönlendirmeler ve mobil deep link'ler ayrıca korunmalı.

**Sınırlar:** Supabase'in ücretsiz planında sağlayıcı günlük yedeklemesi yok; canlı yedek ve geri yükleme provası bu yüzden ayrıca alındı. Security Advisor'da kapalı RLS tabloları, MFA/owner denetimli `SECURITY DEFINER` RPC'leri ve ücretli plana bağlı sızdırılmış parola koruması uyarıları kaldı; ayrıntılar audit raporunda. Bu rapor hukuki tavsiye değildir; metin onayı kullanıcı tarafından bildirildi.

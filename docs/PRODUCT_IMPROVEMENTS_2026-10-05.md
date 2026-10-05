# KaçaYapayım geliştirme teslimi

5 Ekim 2026

Ödeme sağlayıcısı, tahsilat, abonelik satın alma ve mağaza ödeme doğrulaması bu çalışmanın dışında tutuldu. Web uygulamasının mevcut müşteri, hesaplama, teklif ve saha takibi akışları geliştirildi. Ücretli bir dış hizmet kurulmadı.

Uygulama kaynakları hazırlandı; bu sürüm henüz hosting ortamına yayınlanmadı. Bağlı KaçaYapayım Supabase projesine aşağıdaki ek migration'lar uygulandı. Gerçek oturum kontrolleri için oluşturulan geçici hesap, kayıtları ve yüklenen dosya temizlendi. E-posta veya WhatsApp mesajı gönderilmedi.

## Denetimdeki hatalar

| Bulgu | Yapılan değişiklik |
|---|---|
| N1: Meslek şablonu olmayınca hesap yapılamaması | Genel iş formuyla malzeme, işçilik ve diğer maliyetlerden iş ve teklif oluşturulabiliyor. |
| N2: Genel meslek formunda yalnızca ilk müşterilerin seçilebilmesi | Meslek formları ortak sunucu aramasını kullanıyor. Seçili müşteri ayrıca gösteriliyor. |
| L1: Kopyalamanın gönderim sayılması | Kopyalama, WhatsApp açma ve paylaşım ayrı işlemler. Gönderim kullanıcının “Gönderdim, İşaretle” aksiyonuyla kaydediliyor. Teslimat doğrulandığı iddia edilmiyor. |
| L2: Teklif aramasının son 200 kayıtla sınırlı olması | İşletmenin tüm tekliflerinde başlık, müşteri ve numara araması; sunucuda 30 kayıtlık sayfalama eklendi. |
| L3: Ret ve süre filtrelerinin eksikliği | Ret, süresi dolmuş ve iptal filtreleri eklendi. Arama ve durum sayfa değişiminde korunuyor. |
| F1: Kaydedilmemiş formun kaybolması | İş, teklif, paket ve takip taslakları kullanıcı/işletme kapsamında aynı sekmede 24 saat korunuyor. Kayıt sonrası taslak temizleniyor. |
| F2: Müşteri eklerken işten ayrılma | İş formundan pencere içinde müşteri oluşturuluyor; seçili müşteri ve girilen iş bilgileri korunuyor. |
| F3: Arama hatasının boş sonuç görünmesi | Bağlantı hatası ve boş sonuç ayrıldı; yeniden deneme eklendi. |
| F4: Aramayı temizleyince yüklemenin takılması | Eski istek sonucu yok sayılıyor, yükleme durumu temizleniyor. |
| F5: Müşteri kararında belirsiz hata | Teklifin değişmesi, süresinin dolması ve istek sınırı için ayrı mesajlar ve yenileme yolu eklendi. |
| U1: Pencere odağı | Ortak dialog, Tab çevrimi, Escape, önceki odağa dönüş ve arka plan kontrolü sağlıyor. Portal kullanımı iç içe form sorununu da gideriyor. |
| U2: Başarısız paylaşımın yeşil görünmesi | Hatalar kırmızı uyarı ve hata simgesiyle gösteriliyor. |
| U3: Küçük kapsam düzenleme düğmeleri | Teklif kapsamı düğmeleri 44 piksel dokunma alanına çıkarıldı. |
| J1: Hesabın erken tamamlandı sayılması | Tamamlanma olayı yalnızca geçerli, değiştirilmiş ve kısa süre sabit kalmış sonuç için gönderiliyor. İzin verilmediyse gönderilmiyor. |
| J2: Sosyal kampanya kaynağının kaybolması | Instagram, Facebook, TikTok, YouTube, WhatsApp ve LinkedIn kaynakları; kanal ve kampanya ölçümü eklendi. |
| J3: İşletme tekrar kullanımının ölçülememesi | Erişim kontrollü yönetici raporu; ilk teklif ve olgunlaşmış 7/30 günlük tekrar kullanım grupları eklendi. Ölçüm başlangıcı hesaba katılıyor. |
| N4: Logo yükleme eksikliği | Ayarlara logo yükleme/kaldırma, özel depolama ve güvenli görsel sunumu eklendi. Paket özelliği uygunsa teklif ve PDF'de gösteriliyor. |
| N5: Marjın sessizce değiştirilmesi | Ayarlar ve kurulum aynı aralığı doğruluyor; geçersiz değer açıklanıyor. |
| N6: Geri bildirimin bağlantı hatası | Hata yakalanıyor ve tekrar deneme için alanlar korunuyor. |
| A1: Tekrarlanan fiyat ayrıştırma | Türkçe sayı ve kuruş ayrıştırması tek yardımcıda toplandı. |
| N7: Güncelliğini kaybetmiş belgeler | README ve lansman kontrol listesi bağlı veritabanı ve yeni özelliklere göre güncellendi. |
| N8: Küçük sosyal paylaşım görseli | Sayfa başlığı ve açıklamasını kullanan 1200×630 görsel eklendi. |
| N3: Kota sonrası ücretli plana geçiş | İsteğin doğrultusunda ödeme kapsamından çıkarıldı. Mevcut kotalar korunuyor. |

## Geliştirme fırsatları

| Sıra | Özellik | Teslim edilen kullanım ve sınırı |
|---|---|---|
| 1 | Teklif takip tarihi | Teklif/iş detayından takip kaydı, tarih ve durum; ana sayfada yaklaşan takipler. |
| 2 | Tahsilat kaydı | Ödeme kapsamı nedeniyle uygulanmadı. |
| 3 | İş/teklif kopyalama | Benzer iş, teklif kopyası ve düzenlenebilir taslak. Kopya maliyetinin kontrol edilmesi hatırlatılıyor. |
| 4 | Müşteri revizyon isteği | Müşteri teklif bağlantısından not ile revizyon talep edebiliyor; işletmede takip kaydı oluşuyor. |
| 5 | Revizyon geçmişi | Yeni revizyon oluşturma, üst teklif bağlantısı ve bağlı sürümlerin listesi. |
| 6 | Fotoğraf/belge | İşe PNG/JPEG/WebP/PDF yüklenebiliyor. Dosyalar özel ve işletme sahibine açık; müşteri bağlantısında otomatik yayınlanmıyor. |
| 7 | Ek iş onayı | Ek iş, tutar ve kapsam kaydı; kullanıcının müşteriden aldığı onay/red kararını işaretlemesi. Müşterinin elektronik imzası veya bağımsız onay belgesi değildir. |
| 8 | KDV bilgisi | Belirtilmedi/dahil/hariç seçimi, müşteri önizlemesi ve PDF. Oran kullanıcı tarafından girilir; vergisiz fiyat, KDV tutarı ve müşteri toplamı hesaplanır. Kâr hesabı vergisiz tutarı kullanır. Fatura veya tahsilat oluşturulmaz. |
| 9 | İskonto simülasyonu | Önerilen fiyat üzerinden yüzdelik indirim, kalan kâr ve zarar/minimum marj uyarısı. |
| 10 | Hizmet paketleri | Ekonomik/standart/kapsamlı için farklı kapsam, maliyet ve fiyat; üç ayrı iş ve teklif taslağı tek işlemde oluşturuluyor. Üç teklif kotasına dahildir. Üç taslak birlikte paylaşıma hazırlanır; müşteri tek bağlantıda karşılaştırır ve birini seçer. Grup kilidi ikinci kabulü engeller, diğer paketler kapanır. |
| 11 | Keşif/takvim | İş Takibi ekranında gün filtresi ve keşif saati; bir saat içindeki diğer keşifler için uyarı. Süre, seyahat ve ekip kapasitesi planlaması içermez. |
| 12 | Eski maliyet uyarısı | Güncelleme tarihi ve 30 günden eski maliyetleri kontrol etme hatırlatması. |
| 13 | Fiş/gider | İşe bağlı gider, not ve belge kaydı. İşe bağlı giderler gerçek maliyete otomatik eklenir. Manuel gerçek maliyet satırları ayrı korunur; tekrar kaydetmek aynı gideri çoğaltmaz. |
| 14 | CSV | Müşteri önizlemesiyle içe aktarım; müşteri, teklif ve maliyet dışa aktarımı. Formül enjeksiyonuna karşı hücreler korunuyor. |
| 15 | Ekip | E-posta ile bağlı, 7 günlük ve tek kullanımlık davet bağlantısı; doğrulanmış hesapla kabul, yalnızca atanmış işin sınırlı görünümü ve erişimi kaldırma. İş sahibi ayrıca saha notu ekleme yetkisi verebilir; maliyet, fiyat, kâr ve müşteri iletişimi açılmaz. Otomatik davet e-postası gönderilmez. |
| 16 | Bildirim tercihleri | Uygulama içi takip, müşteri kararı ve maliyet hatırlatmaları için tercihler. Mobilde kullanıcının açıkça seçtiği tarih için cihazda yerel hatırlatma eklendi. SMS/e-posta sağlayıcısı ve uzaktan push imzalama erişimi olmadan bunlar etkinleştirilmedi. |
| 17 | İşletme markası | Logo yükleme/kaldırma; uygun mevcut paket özelliğiyle müşteri teklifi ve PDF logosu. |
| 18 | Gerçek pilot kanıtı | Pilot görüşme ve kayıt planı hazırlandı. Gerçek kullanıcı görüşü veya başarı rakamı üretilmedi; pilotun insanlarla yürütülmesi gerekiyor. |
| 19 | Hesaplayıcıdan devam | Aynı sekmede hesap sonucu maliyeti ve hedef marjı kayıt sonrasında genel iş hesabına taşınıyor. |
| 20 | Sesli saha notu | Kullanıcının başlattığı Türkçe tarayıcı konuşma tanıma. Desteklenmeyen tarayıcıda klavye yolu korunuyor. Fiziksel mikrofon ve cihaz testi gerekiyor. |

## Doğrulama

- Web ve mobil TypeScript kontrolü geçti.
- 55 birim testi geçti. Bunlar kuruş hassasiyeti, Türkçe fiyat, CSV, kampanya kaynağı ve mevcut hesaplama kurallarını kapsıyor.
- Bağlı veritabanında transaction içinde 251 teklif ile en eski kayıt araması, sayfalama, ret/süre filtreleri, kopyalama, revizyon ve public veri ayrımı test edildi. Testler geri alındı.
- Paketlerin tek işlemde üç taslak oluşturması test edildi. Başka işletmenin işine ekip üyesi atama, yanlış e-postayla davet kabulü, davet tekrar kullanımı ve erişim kaldırıldıktan sonra görüntüleme testleri geçti.
- Gerçek oturumla şablonu olmayan meslekte müşteri → iş → fiyat → KDV bilgili teklif → paylaşım durumu → CSV akışı geçti.
- Gerçek oturumla üç paket taslağı, saha notu, özel görsel yükleme ve ekip davet bağlantısı test edildi. Test hesabı ve dosya temizlendi.
- 390×844 mobil görünümde taslak kurtarma, kullanıcı/işletme ayrımı, dialog odağı, Escape ve müşteri arama hatası kurtarma doğrulandı. Sosyal görsel 1200×630 PNG olarak üretildi.
- `npm run build` geçti; 68 sayfa üretildi ve geçici test rotası çıktıda yer almadı. Bu yerel build, hosting yayını veya gerçek iPhone/Android testi yerine geçmez.

Yerel testte service-role anahtarı kullanılmadığı için logo/PDF ve müşterinin public karar API'sinin yeni sürümü gerçek HTTP oturumunda baştan sona denenmedi. Public veri projeksiyonu veritabanında doğrulandı; logo için sunucu anahtarı hosting secret alanında bulunmalı. Sesli yazma için gerçek mikrofon testi yapılmadı.

## Veritabanı ve güvenlik

Uygulanan migration'lar:

1. `20261004220743_product_enhancements.sql`
2. `20261004221659_quote_product_details.sql`
3. `20261004224016_team_job_access.sql`
4. `20261004224610_service_package_drafts.sql`
5. `20261004224719_service_package_scope_fix.sql`

Yeni kullanıcı işlemleri işletme sahipliğini kontrol ediyor. Müşteri teklifinde maliyet ve kâr gönderilmiyor; ekip görünümü bunlara ve müşteri iletişimine erişmiyor. Dosyalar özel bucket'ta tutuluyor, dosya türü ve boyutu sunucuda kontrol ediliyor. İş dosyaları 5 MB, logolar 2 MB ile sınırlı. Logo PDF'ye eklenirken dış URL indirilmez.

Supabase danışman denetiminde önceden var olan public SECURITY DEFINER fonksiyonları ve kapalı sızmış şifre koruması uyarıları sürüyor. Bunlar bu teslimde çözüldü diye raporlanmadı. Yeni raporlama tablolarında kullanıcıya doğrudan policy verilmemesi kasıtlı; sunucu/yönetici erişimi kullanılıyor. [Fonksiyon izinleri açıklaması](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [şifre koruması](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Kampanya ölçümü varsayılan olarak kapalıdır. Açılırsa ziyaretçi tercihi alınır; izin olmadan kampanya çerezi veya ziyaret olayı kaydedilmez. Gizlilik ve çerez metinleri yeni veri akışına göre düzeltildi; hukuki inceleme tamamlandı iddiası yoktur.

## Yayın ve dışarıda tamamlanacak işler

Yeni kodun hosting'e yayınlanması, gerçek public PDF/kabul/red/revizyon testi, fiziksel Safari/Chrome ve native mobil cihaz kontrolleri ayrı doğrulama adımlarıdır. Search Console, Bing Webmaster ve mağaza hesaplarının sahipliği kullanıcı tarafından sağlanmalıdır. Gerçek pilot katılımcılarıyla görüşmek ve izinli kullanıcı alıntısı toplamak da dışarıda yürütülür.

İzlenecek yol [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md), pilot metni [PILOT_PLAN_2026-10-05.md](PILOT_PLAN_2026-10-05.md) içindedir. Kullanıcı verisi içeren ek dış analitik veya hata izleme sağlayıcısı bağlanmadı.

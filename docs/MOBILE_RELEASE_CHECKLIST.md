# KaçaYapayım Mobil Sürüm Kontrol Listesi

Bu dosya gerçek hesap ve cihazla tamamlanacak işleri açık bırakır. Kodun derlenmesi mağazada yayın onayı anlamına gelmez.

## Ortak altyapı

- [x] Native Expo Router uygulaması; ana akışta WebView yok.
- [x] Web ve mobil aynı `packages/core` hesaplama kodunu kullanıyor.
- [x] Mobil iş kaydı, bearer oturumunu doğrulayan web API'de gerçek maliyetlerle yeniden hesaplanıyor.
- [x] Service role ve ödeme sırları mobil pakette bulunmuyor.
- [x] Hesap silme uç noktası oturumu doğruluyor; etkin mağaza/ödeme aboneliği varken silmeyi engelliyor. Silme için `202609300017_account_deletion.sql` migration'ı gerekli.
- [ ] Supabase production ve staging projelerini aç; migration sırasını iki ortamda uygula.
- [ ] Production URL, HTTPS API ve web alan adını doğrula. `com.kacayapayim.app` paket kimliğinin mağaza hesaplarında kullanılabilirliğini kesinleştir.
- [ ] RLS'yi iki ayrı işletme hesabıyla test et; müşteri, maliyet, iş ve teklif verilerinin çapraz okunmadığını doğrula.
- [ ] Webde oluşturulan işin mobilde, mobilde oluşturulan teklifin webde göründüğünü doğrula.

## Kimlik ve güvenlik

- [x] Oturum, cihazda Expo SecureStore ile saklanıyor; Supabase token yenileme açık.
- [x] Oturumsuz iş/teklif bağlantıları girişe yönlendiriliyor; girişten sonra hedef sayfa açılıyor.
- [ ] Supabase Auth izinli URL listesine `kacayapayim://auth/callback` ekle; kayıt doğrulama ve şifre sıfırlama bağlantılarını iOS/Android'de test et.
- [ ] E-posta/şifre giriş, kayıt, çıkış, token bitişi, yeniden giriş ve uygulama yeniden açılışını test et.
- [ ] API rate limit ve farklı işletmenin iş/customer ID'siyle istek reddini staging'de doğrula.
- [ ] Mobil analitik ve hata izleme sağlayıcısı seçilirse PII maskelemesini test et. Şu anda mobil istemciye analitik SDK veya crash SDK eklenmedi.

## Ürün akışı

- [x] İlk kurulum, meslek şablonu, maliyet, müşteri, dinamik iş formu, fiyat, teklif, paylaşım, iş başlangıcı ve gerçek maliyet ekranları kodlandı.
- [x] İş/teklif taslakları cihazda korunuyor; müşteri, iş ve teklif listeleri sayfalı yükleniyor.
- [x] Fiyat ve gerçekleşen maliyet kaydetmeden önce başka cihaz değişikliği kontrol ediliyor. Bu kontrol veritabanında atomik olmadığından eşzamanlı yarış testi staging'de yapılmalı.
- [ ] Boyacı, elektrikçi, tesisatçı ve klimacı için gerçek veriyle aynı sonuçları web/mobilde karşılaştır.
- [ ] Teklif limiti, müşteri limiti ve paket yetkilerini Free/Usta/Pro test hesaplarında doğrula.
- [ ] Teklif linkini dış telefonda aç; görüntülenme ve kabul/red sonucunun iki uygulamada güncellendiğini doğrula.
- [ ] PDF'nin iOS ve Android paylaşım ekranında doğru Türkçe karakter, tutar ve tarih içerdiğini doğrula.
- [ ] Çevrimdışı taslak, bağlantı kesilmesi, çift dokunma ve yeniden deneme durumlarını test et.
- [ ] 320–430 px telefon ekranları, büyük metin, VoiceOver/TalkBack ve klavye ile gezinmeyi kontrol et.

## Mağaza ve ödeme

- [ ] Apple Developer ve Google Play Console hesaplarını aç; uygulama kimliğini kesinleştir.
- [ ] Mağaza abonelik ürünlerini ve fiyatlarını oluştur; mevcut `plans` kayıtlarıyla eşleştir.
- [ ] StoreKit ve Play Billing satın alımlarını sunucuda doğrulayan sağlayıcı adaptörünü uygula. İmzalı olayları tekil ve sıralı işle; iade, iptal, yenileme ve geri yükleme testlerini yap.
- [ ] Mağaza hesabından gelen ödemeler dışında istemci yönlendirmesiyle ücretli yetki verilmediğini doğrula.
- [ ] Uygulama içi ödeme ve varsa harici ödeme anlatımını yayın anındaki [Apple App Review](https://developer.apple.com/app-store/review/guidelines/) ve [Google Play Payments](https://support.google.com/googleplay/android-developer/answer/9858738) kurallarına göre yeniden incele. Şu anda mobilde satın alma düğmesi yok.
- [ ] Gerçek gizlilik açıklaması, destek adresi, ekran görüntüsü, yaş derecesi ve mağaza metinlerini tamamla.
- [ ] EAS hesap/proje bağlantısı, iOS imzalama, Android imzalama, TestFlight ve Play internal test kurulumunu yap.
- [ ] Geliştirme ve önizleme build'lerini gerçek cihazlarda test et; ardından production build ve mağaza incelemesine gönder.

## Sürüm kapıları

- [x] Web production build, TypeScript ve mevcut testler geçti (30 Eylül 2026).
- [x] Mobil TypeScript, lint, Expo Doctor ve iOS/Android/web paketleme denetimi geçti (30 Eylül 2026). Son Expo Doctor tekrar denemesi ortamın npm erişim izni nedeniyle çalışmadı; bağımlılıklar değişmedi.
- [ ] Gerçek Supabase ile uçtan uca mobil testler geçti.
- [ ] iOS ve Android native build ve cihaz testleri geçti.
- [ ] Mağaza abonelik doğrulaması ve yasal içerik tamamlandı.

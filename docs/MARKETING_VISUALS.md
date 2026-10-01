# Public site görsel ve motion sistemi

## Tasarım kararı

Ustanın sahada telefonla fiyatına bakması ana görsel hikâyedir. Aynı fotoğrafın üzerinde örnek maliyet, hedef marj ve fiyat kartları yer alır. Gerçek ürünün demo ekranları cihaz çerçevelerinde sunulur. Mavi vurgu (#0071E3), mürekkep metin (#1D1D1F), beyaz yüzey (#FFFFFF), açık gri (#F5F5F7), sıcak taş (#EAE6DF) ve başarı yeşili (#23824A) mevcut marka ile uyumludur.

Başlıklar mevcut sistem fontuyla sıkı ama okunabilir, gövde daha rahat satır aralığıyla, para tutarları tabular rakamlarla gösterilir. Harici font yüklenmez. Sıcaklık saha görsellerinden gelir; bütün kartlara blur veya yeni vurgu renkleri eklenmez.

## Görsel kaynakları

`public/images/marketing` içindeki dört usta sahnesi 1 Ekim 2026'da imagegen ile oluşturulmuştur. Kişiler kurgusaldır; müşteri, ekip üyesi veya kullanıcı yorumu olarak sunulmaz. Sayfalarda “Temsili görsel” açıklaması bulunur. Başka bir siteden alınmış fotoğraf yoktur.

Ürün ekran görüntüleri yerel `/demo` ve `/demo/quotes` sayfalarından alınır. İçlerindeki işletmeler, müşteriler ve sonuçlar örnek verilerdir; bu bilgi ekranda ve görsel açıklamasında korunur. iOS/Android uygulamaları yayımlanmış gibi mağaza rozeti gösterilmez; telefon görüntüsü mobil web deneyimidir.

## Motion

İmza eğrisi `cubic-bezier(.2,.7,.2,1)`. Mikro etkileşim 160 ms, kart girişi 420 ms, bölüm girişi 550 ms. Hero kartlarının sırası maliyet → fiyat → paylaşım; toplam gecikme 360 ms. Scroll reveal bir kez çalışır. Sürekli float, parallax ve otomatik demo döngüsü yoktur. Demo kullanıcının düğme seçimiyle ilerler.

İçerik server-rendered ve JavaScript olmadan görünürdür. Azaltılmış hareket tercihinde bütün içerik son konumunda gösterilir. Başlık ve LCP fotoğrafı reveal ile gizlenmez. Fotoğraflar WebP, responsive `next/image`, sabit oran ve lazy loading kullanır; yalnız hero görseli önceliklidir.

## Doğrulama — 1 Ekim 2026

- Üretim derlemesi ve TypeScript kontrolü başarılı; mevcut 44 test geçti.
- Üretim sürümü localhost:3005 üzerinde test edilir. Mevcut CSP geliştirme modunun eval kullanan paketlerini engellediği için görsel QA ve etkileşim kontrolü üretim sunucusunda yapılmıştır; güvenlik başlıkları değiştirilmemiştir.
- Ana sayfa 320, 375, 390, 430, 768 ve 1440 px viewport ile kontrol edildi. Dar ekrandaki kök 320 px minimum genişliğin scrollbar kaynaklı taşması yalnız public sayfalarda düzeltildi.
- Mobil menü fare ve Enter ile açılıp kapanır. Seçim düğmeleri aria-pressed kullanır; değişen hesap ve demo sonucu aria-live ile duyurulur. Klavye odağı mevcut görünür focus halkasını korur; reveal içindeki odaklanan içerik gizlenmez.
- %30 hedef marj: 82.200 TL; %40: 95.900 TL. Aynı paylaşılan ürün hesaplama fonksiyonu kullanılır. Demo aşamaları otomatik dönmez.
- Reduced motion: global CSS geçişleri azaltır, marketing CSS reveal ve kart animasyonlarını kapatır; client observer sistem tercihini ve tercih değişikliğini dinler. Gerçek iPhone/Android cihaz ve ekran okuyucu testi henüz yapılmadı.
- Next.js build raporu: ana sayfa route JS yaklaşık 3,88 kB; first-load JS 115 kB (önceki basit sayfa yaklaşık 106 kB). Yeni animasyon bağımlılığı eklenmedi.
- Dört WebP görsel toplam yaklaşık 284 kB; ürün screenshot dosyaları yaklaşık 155 kB. next/image responsive türevleri servis eder. Fotoğraflara sabit alan, screenshotlara gerçek boyutları verilmiştir; hero fotoğrafı önceliklidir, alttaki görseller lazy yüklenir.
- Public içerik SSR/SSG olarak kalır; mevcut canonical, Open Graph, JSON-LD, sitemap ve private noindex politikaları korunur.
- LCP/INP/CLS için canlı domain ve gerçek trafik ölçümü gerekir. Bu çalışma sahadan Core Web Vitals geçiş sonucu iddia etmez. Lansmanda Search Console / gerçek kullanıcı ölçümünü kontrol edin.

- HTTP smoke kontrolü: ana sayfa, meslek listesi ve dört meslek, rehber, hesaplayıcı, metodoloji ve fiyatlandırma dahil 11 public sayfa; canonical, Open Graph, güvenlik başlıkları, JSON-LD, sitemap/robots ve private/public teklif noindex başarılı.

# KaçaYapayım marka görseli

Kaynak: kullanıcının gönderdiği logo. `public/brand/logo-source.png` özgün görseli korur.

- Web ortak bileşeni: `src/components/brand-logo.tsx`.
- Site header/footer, uygulama ve demo menüleri, auth, onboarding, 404, ürün demosu ve teklif branding alanı ortak dosyayı kullanır.
- Teklif ve PDF logoları mevcut `showBranding` tercihine tabidir. İşletmenin kendi logosu ve marka kaldırma hakkı ayrı kalır.
- Tarayıcı ve Apple touch simgeleri Next metadata dosyalarıdır; sosyal paylaşım ve Organization şeması da aynı markaya bağlanır.
- Mobil ekranlar, app icon, Android adaptive icon, splash ve web favicon güncellendi. Native uygulama simgelerinin cihazda değişmesi yeni uygulama derlemesi gerektirir.
- Kullanıcının görseli yeniden çizilmedi; yalnız kullanım alanlarına göre boyutlandırıldı. `node scripts/prepare-brand.mjs` web ve mobil türevleri üretir. Mobil icon scripti de aynı kaynaktan üretir.
- Web production build / TypeScript, mobil TypeScript ve Expo lint başarılı. Logo PNG'sinin PDF'e gömülmesi kontrol edildi.

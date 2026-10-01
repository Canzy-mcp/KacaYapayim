# KaçaYapayım mobil

Expo SDK 57, React Native ve Expo Router. iOS ve Android aynı kaynak kodunu kullanır. Uygulama aynı Supabase projesindeki web hesabına bağlanır. İş maliyeti ve teklif fiyatı `@kacayapayim/core` ile önizlenir; iş kaydı sunucuda yeniden hesaplanır.

## Başlatma

1. Repo kökünde `npm install` çalıştırın.
2. `.env.example` içeriğini `.env.local` dosyasına kopyalayın. Dört `EXPO_PUBLIC_` değeri gereklidir. Publishable anahtar istemciye açıktır; service role, mağaza sırları ve ödeme webhook anahtarları yalnızca web sunucusunda kalır.
3. Supabase Auth redirect allowlist içine `kacayapayim://auth/callback` adresini ekleyin.
4. Kök dizinde web API'yi `npm run dev` ile 3005 portunda, mobil uygulamayı ayrı terminalde `npm run mobile` ile açın. Fiziksel telefonda API ve web URL'si bilgisayarın LAN IP'si veya HTTPS staging hostu olmalıdır.

## Yapı

- `src/app`: Native ekranlar ve Expo Router yönlendirmesi.
- `src/components`: Erişilebilir form, kart ve dinamik meslek alanları.
- `src/lib/supabase.ts`: Oturum parçalarını cihazın güvenli deposunda saklar. Web önizlemesinde localStorage kullanılır.
- `src/lib/mobile-api.ts`: İş kaydını erişim tokenıyla web sunucusuna gönderir.
- `../../packages/core`: Web ve mobilin kullandığı saf hesaplama kodu ve şema tipleri.

Yerel iş ve teklif taslakları kullanıcıya özel güvenli depoda tutulur; sunucu kaydı başarılı olunca silinir. Çevrimdışı sunucu kaydı ve arka planda eşitleme yoktur. Bağlantı hataları kullanıcıya gösterilir. Liste ekranları 30 kayıtlık sayfalar halinde yüklenir.

## Kontrol

`npm run typecheck`, `npm run lint`, `npx expo-doctor` ve `npx expo export --platform all` kod ve paketlemeyi kontrol eder. iOS/Android cihaz, Supabase RLS, gerçek PDF paylaşımı ve mağaza testleri için gerçek proje ve test hesapları gerekir.

# KaçaYapayım tasarım sistemi v2

25 Kasım 2026'da eski Apple esinli sistem (teal `#075d54`, `--ky-*` değişkenleri, hap butonlar, cam efektleri) tamamen kaldırıldı. Yerine aşağıdaki sistem geldi.

## Karakter: zanaat / usta işi

Site, ustalar ve ev sahipleri için. Görsel dil gerçek malzemeden gelir: kağıt zemin, mürekkep metin, düz logo mavisi, şerit metre sarısı. Gerçek fotoğraf büyük kullanılır.

Kullanılmaz: gradyan zemin, parlama (glow), cam efekti (glassmorphism), gradyan yazı, ızgara dokusu, koyu "premium" hero. Bu kalıplar denendi ve yapay zeka üretimi gibi durduğu için reddedildi.

## Tek kaynak

Bütün token'lar `src/app/globals.css` içindeki Tailwind v4 `@theme` bloğundadır. Bileşenler üretilen utility sınıflarını kullanır (`text-ink`, `bg-primary`, `border-line`, `rounded-xl`, `shadow-card`, `font-display`). Bileşen kodunda ham hex renk yazılmaz; `tests/w2-foundation.test.mjs` bunu denetler.

## Renkler

| Token | Değer | Kullanım |
| --- | --- | --- |
| `canvas` | `#f5f2ec` | Sayfa zemini (kağıt) |
| `surface` / `surface-2` | `#ffffff` / `#faf8f3` | Kart, form, ikincil yüzey |
| `ink` / `ink-2` | `#1f1b16` / `#4a443c` | Sıcak mürekkep: metin ve bütün koyu yüzeyler (kapsül menü, footer, panel yan menüsü, bildirim) |
| `island` | `#1f1b16` | Dinamik ada kapsülleri; `ink` ile aynı ton |
| `muted` / `subtle` | `#6b6862` / `#a19c92` | Açıklama, ipucu |
| `line` / `line-strong` | `#e3ded3` / `#cfc8ba` | Çizgi ve kenar |
| `primary` | `#1554f0` | Logo mavisi; ana buton ve link |
| `tape` | `#f2c230` | Şerit metre sarısı; vurgu çizgisi, aktif menü, etiket |
| `success` / `warning` / `danger` | `#0e9f6e` / `#dc6803` / `#d92d20` | Durumlar; her birinin `-ink` ve `-soft` tonu var |

## Tipografi

- Başlık: Bricolage Grotesque (`font-display`), `h1` ve `h2` varsayılanı.
- Gövde: Inter.
- Para ve sayılar: `tabular-nums`.

## Şekil ve hareket (v2.1, Apple dokunuşu)

- Butonlar hap şeklinde (`rounded-full`), basınca yayla küçülür (`scale(.96)`).
- Köşeler: küçük öğe 12px (`rounded-lg`), kart 20px (`rounded-xl`), büyük panel 28px (`rounded-2xl`).
- Eğriler: `--ease-spring` (bas/bırak, beliren bölüm) ve `--ease-island` (kapsül açılıp kapanma).
- Pazarlama bölümleri (`Band`) kaydırınca yayla belirir (`data-reveal`). JS yoksa içerik zaten görünür.
- Gölge hafiftir; derinliği önce kenar çizgisi verir.

## Dinamik ada (siyah kapsül, `--color-island`)

- **Site menüsü** (`island-nav.tsx`): ortada yüzen kapsül. Kaydırınca linkler daralır, menü düğmesiyle yayla genişleyip açılır. Escape ile kapanır, odak düğmeye döner.
- **Hero canlı bildirimi** (`live-island.tsx`): fotoğrafın üstünde örnek bildirimler sırayla açılıp kapanır. Bildirimler temsilidir ve ekran okuyuculardan gizlidir.
- **Panel bildirimleri** (`ui/toast.tsx`): kayıt ve hata mesajları üstte ortada kapsülden açılır.
- Azaltılmış hareket tercihinde animasyonlar kapanır.

## İmza detaylar

- Bölüm etiketi: büyük harf ve önünde kısa sarı çizgi (`Eyebrow`, `.marketing-eyebrow`).
- Vurgulanan kelime: fosforlu kalem gibi sarı bant.
- Adımlar: büyük `01 / 02 / 03` numaraları, altlarında sarı çizgi.
- Footer ve panel yan menüsü düz `ink`. Footer'ın üstünde sarı şerit var. Panelde aktif sayfa sarı çizgiyle işaretlenir.

## Not

`marketing.css` içindeki katmansız kurallar Tailwind utility'lerini ezer. Bu yüzden sınıfla değiştirilmesi gereken başlık rengi ve fontu `@layer base` içinde tutulur.

# SEO / GEO denetimi — 2026-11-26

Araç: claude-seo (AgriciDaniel/claude-seo) yöntemi; canlı site `https://www.kacayapayim.com`, sitemap'teki 32 URL tarandı.

## Sağlam olanlar

- 32/32 URL 200, tek H1, canonical doğru, OG görseli var, alt eksik görsel yok.
- robots.txt: Googlebot, OAI-SearchBot, Claude-SearchBot, PerplexityBot (arama) ve GPTBot, ClaudeBot, Google-Extended, Applebot-Extended (eğitim) açık; yalnızca `/api/` kapalı.
- JSON-LD: Organization + WebSite (SearchAction), sayfa başı WebPage + BreadcrumbList, rehberlerde Article (datePublished/dateModified, publishingPrinciples), meslek sayfalarında Service, hesaplayıcılarda WebApplication, FAQPage.
- `llms.txt` ve `llms-full.txt` mevcut (Google için etkisiz; diğer AI sistemleri için opsiyonel).
- Güvenlik başlıkları: HSTS, CSP (nonce), X-Frame-Options, nosniff, Referrer-Policy.
- İçerik: rehberlerde kısa doğrudan cevap, formül, örnek; yayın politikası ve metodoloji sayfası (E-E-A-T).

## Bu turda düzeltilenler

| Sayfa | Sorun | Düzeltme |
|---|---|---|
| /usta-bul | Başlık 22, açıklama 78 karakter; BreadcrumbList yok | Meslek anahtar kelimeli başlık/açıklama; BreadcrumbList eklendi |
| /iletisim | Açıklama 49 karakter, jenerik | Anlamlı başlık ve açıklama |
| /ustalar-icin, /guvenli-hizmet, /yayin-politikasi, /nasil-calisir | `| KaçaYapayım` ekiyle başlık 61–75 karakter (SERP'te kesiliyor) | ≤60 karaktere indirildi |
| /yayin-politikasi | Açıklama 168 karakter | ≤160 karaktere indirildi |

## Açık kalanlar (öncelik sırası)

1. **Orta — HTML önbelleği:** Tüm sayfalar `Cache-Control: private, no-store` dönüyor (CSP nonce middleware'i nedeniyle dinamik render). Statik pazarlama sayfaları edge'den sunulamıyor; TTFB/LCP'yi etkiler. Nonce'suz statik CSP (hash) veya pazarlama rotalarını nonce dışında tutmak değerlendirilmeli.
2. **Orta — Usta profilleri sitemap'te yok:** `/usta-bul/[id]` sayfaları yalnızca liste bağlantısıyla keşfediliyor. Yeterli içerikli (onaylı, açıklaması dolu) profiller sitemap'e eklenebilir.
3. **Düşük — Rehber açıklamaları kısa:** Bazı rehberlerde meta açıklama 88–94 karakter; 120–155 aralığına genişletilebilir.
4. **Düşük — Bazı rehberlerde SSS yok:** is-maliyeti, teklif-fiyati, iscilik-maliyeti, boyaci-teklifi, elektrik-isi, odeme-kosullari, pazarlik rehberlerine 2–3 soruluk görünür SSS eklenebilir (AI alıntılanabilirliği).
5. **Marka sinyalleri (site dışı):** YouTube, Reddit/Ekşi, LinkedIn varlığı AI görünürlüğüyle en güçlü korelasyonu gösteriyor; Organization `sameAs` ancak gerçek profiller açıldığında eklenmeli.

# SEO kontrol listesi

## Teknik ve indeksleme

- [x] Public sayfalarda başlık, açıklama, canonical, Open Graph ve Twitter metadata.
- [x] Özel uygulama, auth, demo ve public teklif yollarında `noindex`; sitemap dışında.
- [x] Tek sitemap'te yalnızca yazılmış meslek/rehber ve çalışan hesaplayıcılar.
- [x] `robots.txt` özel sayfalardaki noindex'i görebilmesi için botu bu sayfalardan engellemez; API yollarını engeller.
- [x] Staging sitemap boş; tüm staging yanıtları noindex. Robots noindex başlığını okuyabilsin diye staging'de de crawl engeli konmaz.
- [x] Kısa slug yapısı, `/pricing` → `/fiyatlandirma` permanent redirect.
- [ ] Production domaininde canonical host/HTTPS 308 yönlendirmesini ve query canonical'ı kontrol et.
- [ ] Eski yayınlanmış slug değişirse 301/308 redirect haritasına ekle; şu anda başka slug değişimi yok.

## İçerik ve sayfa

- [x] Boyacı, elektrikçi, tesisatçı, klimacı için ayrı giriş ve hesaplama örneği.
- [x] Rehberde doğrudan cevap, formül, hesap örneği, gerçek güncelleme tarihi ve metodoloji bağlantısı.
- [x] Dört çalışan, ücretsiz hesaplayıcı; rakamlar kullanıcı cihazında hesaplanır.
- [x] Şehir sayfası oluşturulmadı. Özgün şehir verisi ve editoryal inceleme olmadan index açma.
- [ ] Meslek ve rehber metinlerini gerçek ustalarla editoryal olarak doğrula; teknik/yerel kural iddiası eklenirse birincil kaynak ve kaynak tarihi koy.
- [ ] Gerçek uygulama ekran görüntülerini optimize ederek ekle; şu an landing'de kodla çizilmiş gerçek formüle dayanan hesap örneği var.
- [ ] İç linkleri ve arama niyetini Search Console verisiyle gözden geçir.

## Yapısal veri ve performans

- [x] Ana sayfa Organization/WebSite/WebApplication; rehberde Article; detay sayfalarda BreadcrumbList.
- [ ] Canlı URL'lerde JSON-LD'yi Schema.org/Google doğrulayıcıyla kontrol et; görünür içeriğe aykırı alan ekleme.
- [ ] 320–430 px gerçek cihaz, klavye, kontrast ve Core Web Vitals testi.
- [ ] Search Console/Bing doğrulama, sitemap gönderimi, sorgu/sayfa/cihaz/ülke raporları.

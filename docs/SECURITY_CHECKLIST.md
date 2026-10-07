# Yayın güvenlik kontrolü

6 Ekim paketinin uygulanma durumu ve geçiş sırası [AUDIT_IMPLEMENTATION_2026-10-06.md](AUDIT_IMPLEMENTATION_2026-10-06.md) içinde. Aşağıdaki kutular gerçek staging/canlı kanıtı olmadan işaretlenmemeli. Kaynak kodda kontrol olması yayın kabulü değildir.

- [ ] Güncel yedek, ayrı ortamda başarılı geri yükleme, Storage dosyalarının ayrı yedek/silme yaşam döngüsü ve kayıtlı sonuç.
- [ ] Canlı migration kayıtları, önceki şema/fonksiyon/ACL ile eşleştirildi; eski SQL tekrar çalıştırılmadı.
- [ ] İlk beş audit migration'ı uygulandı; web sunucu upload doğrulamasından sonra son Storage migration'ı uygulandı.
- [ ] `npm run verify`, bağımlılık audit kontrolü ve envanter başarılı; iki bilinen mobil araç zinciri bildirimi tekrar incelendi. Yeni uyarı veya çözülemeyen audit bağlantısı sessizce geçilmez.
- [ ] Service role ve HMAC sırrı yalnızca sunucuda; istemci/native/bundle/log/CI'da sır bulunmadı.
- [ ] Hukuki sayfalar gerçek işletmeci ve veri akışlarıyla onaylandı; `LEGAL_REVIEW_APPROVED` yalnızca gerçek inceleme sonrasında ayarlandı. Production ortam ve HTTPS kontrolleri geçti.
- [ ] Supabase Auth: doğrulama/sıfırlama, 8 karakter asgari parola, güvenli parola değişikliği, kayıt hook'u; web/native/doğrudan Auth için aynı kayıt kuralı.
- [ ] Sızdırılmış parola korumasının plan koşulu çözüldü veya açık kalan risk kaydedildi; otomatik ücretli plan yükseltmesi yapılmaz.
- [ ] Yönetici MFA, kullanıcının AAL1/AAL2 akışı, ikinci cihaz, kayıp cihaz ve çıkış; RLS ve SQL/PLpgSQL okuyucuları aynı MFA sınırını koruyor.
- [ ] A/B işletmeleri birbirinin müşteri/iş/teklif/gider/tahsilat/dosya/arşiv verisini okuyamıyor veya değiştiremiyor; doğrudan REST/RPC de denendi.
- [ ] Ekip daveti doğrulanmış e-postaya bağlı, 7 gün, tek kullanım/iptal; not izni geri alınabiliyor. Fiyat/kâr/özel müşteri ve dosya bilgisi ekip DTO'sunda yok.
- [ ] Public DTO/PDF iç maliyet ve kâr içermiyor; geçersiz/kapalı/yenilenen token reddediliyor. Kodlu teklifin sayfa/PDF/karar/revizyon/görüntüleme yolları korunuyor; eski kod izni değişiklik sonrası geçersiz.
- [ ] Yeni hazır revizyon eskisini kapatıyor; kabul edilmiş teklif değişmiyor; eşzamanlı karar/paket seçimi çelişmiyor. Karar snapshot/hash ve tekil notification kayıtları doğru.
- [ ] Görsel çözümleme, EXIF temizliği, piksel/boyut; bozuk PDF, etkin içerik ve ek dosya retleri. Özel bucket ve no-store/no-referrer indirme başlıkları.
- [ ] 100 MB/1.000 dosya kotası eşzamanlı denendi; doğrudan Storage upload engelli. Upload rezervasyonu ve silme kilidi; 100'den fazla dosyalı hesap, başarısız temizlik ve tekrar deneme.
- [ ] Güncel parola ve MFA ile hesap silme/diğer oturumları kapatma/export; silme sonrası refresh token reddi. Mevcut JWT süreleri için kalan erişim sınırı açık.
- [ ] Export 500'lük sayfalarla, akış iptali/hatası ve büyük veriyle denendi. Hesap arşivinde tamamlandı işareti, başka işletme ve erişim sırlarının bulunmaması; dosya içerikleri ayrı indirilir.
- [ ] Proxy başlıkları istemciden korunuyor; kullanıcı/IP sınırları gerçek hosting'de; production hata durumunda fail-closed.
- [ ] CSP Report-Only ihlalleri incelendi; Next statik/dinamik sayfalar, hidratasyon, JSON-LD/PDF ve auth çalışıyor. Zorunlu CSP'ye geçiş ayrı kanıtla yapılır.
- [ ] Loglar müşteri telefonu/adresi, teklif içeriği, token, parola ve TOTP anahtarını içermiyor. CSP raporları yalnızca direktifi kaydeder.
- [ ] Cron gerçek worker ile günlük çalıştı; 48 saat/90 gün kayıt sınırları gözlendi. Retention geri alınamazlığı ve yedek döngüsü belgelendi.
- [ ] Health DB/bucket hazırlığı olarak yorumlandı; Auth, e-posta teslimi, dosya, PDF ve karar akışı ayrı staging smoke testinden geçti.
- [ ] 320/390 px, zoom/klavye/ekran okuyucu; fiziksel Android/iPhone, native ortak veri/MFA/silme ve mağaza kontrolleri tamamlandı.

Ödeme sağlayıcısı yoktur. Elle tahsilat kaydı transfer veya kart işlemi yapmaz. Harici e-posta/SMS/push gönderildiği iddia edilmez. Supabase `config.toml` dosyasının tamamını, canlı ayar farklarını incelemeden push etmeyin.

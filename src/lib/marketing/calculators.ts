export const calculators = [
 {slug:"kar-marji",title:"Kâr Marjı Hesaplama",description:"Toplam maliyetini ve hedef satış marjını gir; gereken teklif fiyatını gör.",kind:"margin"},
 {slug:"teklif-fiyati",title:"Teklif Fiyatı Hesaplama",description:"Malzeme, işçilik ve diğer giderleri topla; hedef kârına göre teklif fiyatı bul.",kind:"quote"},
 {slug:"boya-maliyeti",title:"Boya Maliyeti Hesaplama",description:"Alan, kat sayısı, örtücülük, fire ve litre fiyatıyla boya maliyetini hesapla.",kind:"paint"},
 {slug:"elektrik-isi-maliyeti",title:"Elektrik İşi Maliyeti Hesaplama",description:"Kablo metrajı, priz adedi ve işçilik maliyetinden toplamı ve teklif fiyatını hesapla.",kind:"electric"},
] as const;

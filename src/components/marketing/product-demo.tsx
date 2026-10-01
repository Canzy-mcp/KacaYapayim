"use client";

import { BrandLogo } from "@/components/brand-logo";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Check, ClipboardList, Eye, Send, SlidersHorizontal } from "lucide-react";
import { calculatePricingSummary } from "@kacayapayim/core/pricing";

const stages = [
  { name: "İşi gir", icon: ClipboardList, title: "İşin kapsamı belli olsun.", detail: "Duvar, tavan, kat sayısı ve iş gününü mesleğine uygun alanlara gir.", label: "Örnek boyama işi", value: "Salon ve koridor", lines: [["Duvar ve tavan", "Ayrı ölçüler"], ["Boya ve astar", "Miktar × birim maliyet"], ["İşçilik ve yol", "İşin süresine göre"]] },
  { name: "Maliyeti gör", icon: Calculator, title: "Küçük giderler de hesaba girsin.", detail: "Malzeme, işçilik, sarf ve yol giderleri tek bir hesapta toplanır.", label: "Hesaplanan maliyet", value: "57.510 TL", lines: [["Malzeme", "Boya, astar, macun"], ["İşçilik", "Usta ve yardımcı"], ["Diğer giderler", "Sarf, yol ve fire"]] },
  { name: "Fiyatı belirle", icon: SlidersHorizontal, title: "Fiyatının sana ne bırakacağını bil.", detail: "Hedef ve minimum marjını gör. Pazarlıkta ne kadar alanın kaldığını hesapla.", label: "Önerilen fiyat · %30 marj", value: "82.200 TL", lines: [["Gerçek maliyet", "57.510 TL"], ["Tahmini kâr", "24.690 TL"], ["Hesap", "Kendi maliyetlerinle"]] },
  { name: "Teklifi gönder", icon: Send, title: "Hesabın, düzenli bir teklife dönüşsün.", detail: "İş kapsamını, süreyi ve ödeme koşullarını ekle. PDF veya bağlantıyla paylaş.", label: "Müşteriye giden teklif", value: "Açık kapsam. Net fiyat.", lines: [["İş kapsamı", "Dahil ve hariç işler"], ["Ödeme koşulları", "Senin belirlediğin plan"], ["Paylaşım", "WhatsApp, bağlantı, PDF"]] },
  { name: "Sonucu takip et", icon: Eye, title: "Gönderdikten sonra da takip et.", detail: "Görüntülenme ve müşteri yanıtını gör. Kabul edilen işi tamamlayınca gerçek giderlerini kaydet.", label: "İşin sonunda", value: "Gerçek kârını gör", lines: [["Teklif", "Görüntülendi / kabul / red"], ["İş", "Başladı / tamamlandı"], ["Kâr", "Tahmin ve gerçek sonuç"]] },
] as const;

export function ProductDemo() {
  const [active, setActive] = useState(0); const stage = stages[active]; const Icon = stage.icon;
  return <div className="product-story" data-reveal>
    <div className="demo-steps" role="group" aria-label="Ürün akışını incele">{stages.map((item, index) => <button type="button" key={item.name}
      aria-pressed={active === index} onClick={() => setActive(index)} className={active === index ? "selected" : ""}>
      <span>{index + 1}</span>{item.name}<ArrowRight size={15} aria-hidden="true" /></button>)}</div>
    <div className="demo-body" aria-live="polite" aria-atomic="true"><div className="demo-explanation"><span className="demo-label">Bir işin yolculuğu</span>
      <h3>{stage.title}</h3><p>{stage.detail}</p><Link href="/demo" className="marketing-text-link">Gerçek demoyu aç <ArrowUpRightIcon/></Link></div>
      <div className="demo-panel" key={active}><div className="demo-panel-top"><BrandLogo size={28}/><span>Örnek senaryo</span></div>
        <div className="demo-result"><Icon size={24} aria-hidden="true"/><p>{stage.label}</p><strong>{stage.value}</strong></div>
        <dl>{stage.lines.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <p className="demo-note"><Check size={14} aria-hidden="true"/> Kendi girdilerinle hesaplanır.</p>
      </div>
    </div>
  </div>;
}

function ArrowUpRightIcon() { return <ArrowRight size={17} aria-hidden="true"/>; }

export function MarginExample() {
  const [margin, setMargin] = useState(30);
  const summary = calculatePricingSummary(57510, margin, 0);
  const money = (value: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(value);
  return <div className="margin-example" data-reveal>
    <div className="margin-input"><span>Örnek işin maliyeti</span><strong>57.510 <small>TL</small></strong></div>
    <fieldset><legend>Hedef kâr marjını seç</legend><div>{[20,30,40].map(value => <button type="button" key={value}
      aria-pressed={margin === value} className={margin === value ? "selected" : ""} onClick={() => setMargin(value)}>%{value}</button>)}</div></fieldset>
    <div className="margin-output" aria-live="polite" aria-atomic="true"><span>Kaça yapmalısın?</span><strong key={margin}>{money(summary.roundedRecommendedPrice)} <small>TL</small></strong>
      <p>Satış fiyatının %{margin}’u hedef kârın.</p></div>
    <p className="margin-method">Maliyet ÷ (1 − marj). Fiyat, 100 TL’ye yukarı yuvarlanır.</p>
    <Link href="/hesaplama-araclari/kar-marji" className="marketing-text-link">Kendi maliyetinle hesapla <ArrowRight size={17} aria-hidden="true" /></Link>
  </div>;
}


import { adminChallenge } from "./access";
import Link from "next/link";
import { Activity, ChartNoAxesCombined, ClipboardList, ShieldCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { linkButton, MarketEmpty, panel, plainButton } from "@/components/marketplace/ui";

export const metadata = { title: "Yönetim paneli", robots: { index: false, follow: false } };

type Breakdown = { hits: number };
type Overview = {
  new_accounts: number;
  signed_in_accounts: number;
  published_providers: number;
  listings: number;
  listings_with_offers: number;
  completed_listings: number;
  quotes: number;
  open_reports: number;
  views: number;
  channels: (Breakdown & { channel: string })[];
  popular_pages: (Breakdown & { path: string })[];
};

const format = new Intl.NumberFormat("tr-TR");
const percent = new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 1 });
const channelLabels: Record<string, string> = { direct: "Doğrudan", unknown: "Bilinmiyor", google: "Google", bing: "Bing", instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", youtube: "YouTube", whatsapp: "WhatsApp", other: "Diğer" };

function BreakdownList({ heading, rows }: { heading: string; rows: { name: string; hits: number }[] }) {
  const max = Math.max(1, ...rows.map(({ hits }) => hits));
  return <section className={panel}>
    <h2 className="text-lg font-semibold">{heading}</h2>
    {rows.length === 0 ? <p className="mt-3 text-sm text-muted">Bu dönemde ölçüm kaydı yok.</p> :
      <ol className="mt-4 space-y-4">{rows.map(({ name, hits }) => <li key={name}>
        <div className="flex items-start justify-between gap-4 text-sm"><span className="break-all">{name}</span><strong className="tabular-nums">{format.format(hits)}</strong></div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-soft" aria-hidden="true"><div className="h-full rounded-full bg-primary-hover" style={{ width: `${hits / max * 100}%` }} /></div>
      </li>)}</ol>}
  </section>;
}

export default async function OperatorPage({ searchParams }: { searchParams: Promise<{ gun?: string }> }) {
  const challenge = await adminChallenge("/admin");
  if (challenge) return challenge;
  const client = await createClient();

  const { gun } = await searchParams;
  const days = gun === "7" ? 7 : gun === "90" ? 90 : 30;
  const { data, error } = await client.rpc("market_operator_overview", { p_days: days });
  if (error || !data) throw new Error("Yönetim ölçümleri yüklenemedi.");
  const stats = data as Overview;
  const trafficEnabled = process.env.ANALYTICS_ENABLED === "true" && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const indicators = [
    { label: "Giriş yapan hesap", count: stats.signed_in_accounts, icon: Users, note: "Dönem içinde giriş yapan tekil hesaplar" },
    { label: "Yeni doğrulanmış hesap", count: stats.new_accounts, icon: Users, note: "E-postasını doğrulayan hesaplar" },
    { label: "Sayfa görüntülemesi", count: stats.views, icon: Activity, note: "Ölçüme izin veren ziyaretler" },
    { label: "Yayımlanan ilan", count: stats.listings, icon: ClipboardList, note: "Seçili dönemde açılan ilanlar" },
    { label: "Yayındaki usta profili", count: stats.published_providers, icon: ShieldCheck, note: "Şu an rehberde görünen profiller" },
    { label: "İşletme teklifi", count: stats.quotes, icon: ClipboardList, note: "Usta panelinden hazırlanan teklifler" },
  ];

  return <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-4xl font-semibold tracking-[-.045em]">Yönetim paneli</h1>
        <p className="mt-2 text-sm text-muted">KaçaYapayım’ın trafiği, ilanları ve hesapları.</p></div>
      <nav aria-label="Ölçüm dönemi" className="flex flex-wrap gap-2">{[7, 30, 90].map((day) => <Link key={day} href={`/admin?gun=${day}`} aria-current={days === day ? "page" : undefined} className={days === day ? linkButton : plainButton}>{day} gün</Link>)}</nav>
    </header>
    <section aria-label="Temel ölçümler" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {indicators.map(({ label, count, icon: Icon, note }) => <article key={label} className={panel}>
        <Icon className="mb-3 text-primary-hover" size={19} aria-hidden="true" /><h2 className="text-sm font-medium text-ink-2">{label}</h2>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{format.format(count)}</p><p className="mt-1.5 text-xs text-muted">{note}</p>
      </article>)}
    </section>
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <section className={panel}><h2 className="flex items-center gap-2 text-lg font-semibold"><ChartNoAxesCombined size={18} aria-hidden="true" /> İlan dönüşümü</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-3"><dt>Teklif alan ilan</dt><dd>{format.format(stats.listings_with_offers)}{stats.listings > 0 && ` · ${percent.format(stats.listings_with_offers / stats.listings)}`}</dd></div>
          <div className="flex justify-between gap-3"><dt>Tamamlanan iş</dt><dd>{format.format(stats.completed_listings)}</dd></div>
          <div className="flex justify-between gap-3"><dt>Açık bildirim</dt><dd>{format.format(stats.open_reports)}</dd></div>
        </dl>
      </section>
      <BreakdownList heading="Trafik kaynakları" rows={stats.channels.map(({ channel, hits }) => ({ name: channelLabels[channel] ?? channel, hits }))} />
      <BreakdownList heading="Öne çıkan sayfalar" rows={stats.popular_pages.map(({ path, hits }) => ({ name: path, hits }))} />
    </div>
    {!trafficEnabled && <div className="mt-5"><MarketEmpty>Site içi trafik sayacı kapalı. Giriş, ilan ve teklif sayıları veritabanından gelir.</MarketEmpty></div>}
  </main>;
}

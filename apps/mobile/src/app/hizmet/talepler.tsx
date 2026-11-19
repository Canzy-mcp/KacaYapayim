import { useCallback, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { marketNoticeLabels, marketStateLabels, type MarketRequest } from "@kacayapayim/core/marketplace";
import { Button, Card, Empty, Notice, Row } from "@/src/components/ui";
import { RequireMarketUser, ServiceLoadState, ServiceScreen, useMarketLoad, useMarketWrite } from "@/src/components/marketplace";
import { localMarketDate, readMarket } from "@/src/lib/marketplace";

const titles = {
  own: "Taleplerim", feed: "Yeni usta talepleri", work: "Tekliflerim ve işlerim",
  favorites: "Favori ustalar", notices: "Bildirimler",
};
type View = keyof typeof titles;
const emptyDetails: Record<View, string> = {
  own: "İlk iş ilanını ver veya rehberden bir ustaya çağrı gönder.",
  feed: "Hizmet kategorilerine ve bölgene uygun yeni talepler burada görünür.",
  work: "Gönderdiğin teklifler ve seçildiğin işler burada görünür.",
  favorites: "Sonradan ulaşmak istediğin bir ustayı profilinden favorilerine ekle.",
  notices: "Teklif, mesaj ve randevu güncellemelerini burada görebilirsin.",
};

function Lists({ view }: { view: View }) {
  const [page, setPage] = useState(1);
  const result = useMarketLoad(useCallback(() => readMarket(view, page), [view, page]));
  const { data, refresh } = result;
  const { run, busy, notice } = useMarketWrite(refresh);
  const openRequest = (id: string) => router.push({ pathname: "/hizmet/talep/[id]", params: { id } });
  return <ServiceScreen title={titles[view]}>
    {view === "own" && <Button title="Yeni ilan ver" onPress={() => router.push("/hizmet/yeni")} />}
    {view === "feed" && <Button title="Usta profilini yönet" quiet onPress={() => router.push("/hizmet/profil")} />}
    <ServiceLoadState {...result} />
    {notice && <Notice error={notice.error}>{notice.text}</Notice>}
    {data && (data.length ? <Card>
      {view === "notices" && data.some((item) => "read_at" in item && !item.read_at) &&
        <Button title="Tümünü okundu işaretle" quiet disabled={busy} onPress={() => void run("mark_read", {})} />}
      {data.slice(0, 20).map((item) => {
        if ("request_id" in item) return <Row key={item.id} title={marketNoticeLabels[item.event] ?? "Talep güncellendi"}
          subtitle={`${item.title} · ${localMarketDate(item.created_at)}`} right={item.read_at ? undefined : "Yeni"} onPress={() => {
            if (!item.read_at) void run("mark_read", { id: item.id });
            openRequest(item.request_id);
          }} />;
        if ("display_name" in item) return <Row key={item.id} title={item.display_name} subtitle={item.city}
          onPress={() => router.push({ pathname: "/hizmet/usta/[id]", params: { id: item.id } })} />;
        return <RequestRow key={item.id} item={item} open={openRequest} showOfferCount={view === "own"} />;
      })}
    </Card> : <Empty title={page > 1 ? "Bu sayfada kayıt yok" : `Henüz ${view === "own" ? "talebin" : view === "feed" ? "yeni talep" : view === "work" ? "işin" : view === "favorites" ? "favorin" : "bildirimin"} yok`} detail={emptyDetails[view]} />)}
    {page > 1 && <Button title="Önceki sayfa" quiet onPress={() => setPage(page - 1)} />}
    {data && data.length > 20 && page < 101 && <Button title="Sonraki sayfa" quiet onPress={() => setPage(page + 1)} />}
  </ServiceScreen>;
}

function RequestRow({ item, open, showOfferCount }: { item: MarketRequest; open: (id: string) => void; showOfferCount: boolean }) {
  const offers = showOfferCount && item.state === "open" ? ` · ${item.offer_count} teklif` : "";
  return <Row title={item.title} subtitle={`${item.district}, ${item.city} · ${marketStateLabels[item.state]}${offers}`}
    right={item.is_direct ? "Çağrı" : undefined} onPress={() => open(item.id)} />;
}

export default function ServiceLists() {
  const { gorunum } = useLocalSearchParams<{ gorunum?: string }>();
  const view = gorunum && Object.hasOwn(titles, gorunum) ? gorunum as View : "own";
  return <RequireMarketUser next={`/hizmet/talepler?gorunum=${view}`}><Lists key={view} view={view} /></RequireMarketUser>;
}

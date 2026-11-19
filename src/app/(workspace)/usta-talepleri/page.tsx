import Link from "next/link";
import { BriefcaseBusiness, ClipboardList, UserRound } from "lucide-react";
import { requireCompletedViewer } from "@/lib/viewer";
import { marketDirectory, marketPage, marketRead } from "@/lib/marketplace/service";
import { MarketForm } from "@/components/marketplace/form";
import { input, MarketHeading, MarketPagination, panel, plainButton, RequestList } from "@/components/marketplace/ui";

export const metadata = { title: "Usta Talepleri" };

const views = [
  { key: "feed", href: "/usta-talepleri", label: "Yeni talepler", icon: ClipboardList },
  { key: "work", href: "/usta-talepleri?gorunum=isler", label: "Tekliflerim ve işlerim", icon: BriefcaseBusiness },
  { key: "provider", href: "/usta-talepleri?gorunum=profil", label: "Usta profilim", icon: UserRound },
];

export default async function ProviderRequestsPage({ searchParams }: { searchParams: Promise<{ gorunum?: string; page?: string }> }) {
  await requireCompletedViewer();
  const params = await searchParams;
  const view = params.gorunum === "isler" ? "work" : params.gorunum === "profil" ? "provider" : "feed";
  const page = marketPage(params.page);
  const [settings, directory, rows] = await Promise.all([
    marketRead("provider"), marketDirectory(), view === "provider" ? [] : marketRead(view, page),
  ]);
  const profile = settings.profile;
  const live = profile?.published && !profile.suspended;
  return <div className="mx-auto max-w-5xl">
    <MarketHeading title="Usta Talepleri" description="Bölgende açılan ilanları ve doğrudan çağrıları incele. Tekliflerini ve anlaştığın işleri takip et." />
    <nav className="mb-5 flex flex-wrap gap-2" aria-label="Usta talepleri">
      {views.map(({ key, href, label, icon: Icon }) => <Link key={key} className={`${plainButton} ${key === view ? "!border-blue-200 !bg-blue-50 !text-blue-900" : ""}`} aria-current={key === view ? "page" : undefined} href={href}><Icon aria-hidden="true" size={16} />{label}</Link>)}
    </nav>
    {view === "provider" ? <section className={panel}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-[#112046]">Herkese açık usta profili</h2>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${live ? "bg-emerald-50 text-emerald-900" : profile?.suspended ? "bg-amber-50 text-amber-950" : "bg-slate-100 text-slate-700"}`}>{live ? "Yayında" : profile?.suspended ? "Askıda" : "Taslak"}</span>
      </div>
      {profile?.suspended && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Profil askıda olduğu sürece rehberden çağrı alamaz ve yeni teklif gönderemezsin.</p>}
      {live && <Link href={`/usta-bul/${profile.id}`} className="mb-4 inline-block text-sm font-semibold text-[#075fc7] hover:underline">Yayımdaki profili gör</Link>}
      <MarketForm action="profile" label="Profili kaydet" success="Usta profilin güncellendi.">
        <label className="grid gap-1 text-sm font-medium">Görünen ad<input className={input} name="title" required minLength={2} maxLength={120} defaultValue={profile?.display_name ?? settings.business?.name} /></label>
        <label className="grid gap-1 text-sm font-medium">Tanıtım<textarea className={input} name="body" maxLength={1600} rows={4} defaultValue={profile?.bio} placeholder="Yaptığın işleri ve deneyimini anlat." /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">Hizmet ili<input className={input} name="city" required minLength={2} maxLength={80} defaultValue={profile?.city ?? settings.business?.city ?? ""} /></label>
          <label className="grid gap-1 text-sm font-medium">Hizmet ilçeleri<input className={input} name="districts" maxLength={1600} defaultValue={profile?.districts.join(", ")} placeholder="Kadıköy, Ataşehir" /><span className="font-normal text-slate-600">En fazla 20 ilçeyi virgülle ayır. Boş bırakırsan ilin tamamını kapsarsın.</span></label>
        </div>
        <fieldset className="grid gap-2 rounded-xl border border-[#e0e5ee] p-3 sm:grid-cols-2 lg:grid-cols-3"><legend className="px-1 text-sm font-semibold">Verdiğin hizmetler <span className="font-normal text-slate-600">(en az birini seç)</span></legend>
          {directory?.categories.map((category) => <label key={category.slug} className="flex min-h-8 items-center gap-2 text-sm"><input name="categories" type="checkbox" value={category.slug} defaultChecked={profile?.categories.includes(category.slug)} /> {category.name}</label>)}
        </fieldset>
        <label className="flex min-h-10 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="published" defaultChecked={profile?.published} /> Profilimi rehberde yayınla ve yeni talepler al</label>
      </MarketForm>
    </section> : <>
      {!live && view === "feed" && <div className={`mb-4 ${panel}`}><p className="text-sm text-slate-700">{profile?.suspended ? "Profilin askıda. Önceki tekliflerine ve üstlendiğin işlere Tekliflerim ve işlerim bölümünden ulaşabilirsin." : "Yeni çağrılar almak ve hizmet bölgendeki ilanlara teklif vermek için usta profilini yayımla."}</p><Link href={profile?.suspended ? "/usta-talepleri?gorunum=isler" : "/usta-talepleri?gorunum=profil"} className={`mt-3 ${plainButton}`}>{profile?.suspended ? "Tekliflerimi ve işlerimi gör" : "Usta profilini düzenle"}</Link></div>}
      <RequestList rows={rows.slice(0, 20)} categories={directory?.categories ?? []} empty={page > 1 ? "Bu sayfada talep yok." : view === "feed" ? "Hizmetlerine uygun yeni talep yok." : "Çağrıların, gönderdiğin teklifler ve üstlendiğin işler burada görünür."} />
      <MarketPagination page={page} more={rows.length > 20} href={(next) => `/usta-talepleri?page=${next}${view === "work" ? "&gorunum=isler" : ""}`} />
    </>}
  </div>;
}

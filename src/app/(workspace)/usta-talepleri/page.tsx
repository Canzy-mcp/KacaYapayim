import Link from "next/link";
import { requireCompletedViewer } from "@/lib/viewer";
import { marketDirectory, marketPage, marketRead } from "@/lib/marketplace/service";
import { MarketForm } from "@/components/marketplace/form";
import { input, MarketHeading, MarketPagination, panel, plainButton, RequestList } from "@/components/marketplace/ui";

export const metadata = { title: "Usta Talepleri" };

export default async function ProviderRequestsPage({ searchParams }: { searchParams: Promise<{ gorunum?: string; page?: string }> }) {
  await requireCompletedViewer();
  const params = await searchParams;
  const view = params.gorunum === "isler" ? "work" : params.gorunum === "profil" ? "provider" : "feed";
  const page = marketPage(params.page);
  const [settings, directory] = await Promise.all([marketRead("provider"), marketDirectory()]);
  const rows = view === "provider" ? [] : await marketRead(view, page);
  const profile = settings.profile;
  return <div className="mx-auto max-w-5xl">
    <MarketHeading title="Usta Talepleri" description="Bölgende açılan ilanları ve doğrudan çağrıları incele. Tekliflerini ve anlaştığın işleri takip et." />
    <nav className="mb-5 flex flex-wrap gap-2" aria-label="Usta talepleri">
      {([["feed", "/usta-talepleri", "Yeni talepler"], ["work", "/usta-talepleri?gorunum=isler", "Tekliflerim ve işlerim"], ["provider", "/usta-talepleri?gorunum=profil", "Usta profilim"]] as const)
        .map(([key, url, label]) => <Link key={key} className={`${plainButton} ${key === view ? "!bg-[#eaf3ff]" : ""}`} aria-current={key === view ? "page" : undefined} href={url}>{label}</Link>)}
    </nav>
    {view === "provider" ? <section className={panel}>
      <h2 className="mb-3 text-xl font-bold text-[#112046]">Herkese açık usta profili</h2>
      {profile?.suspended && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Profil moderasyon nedeniyle askıda.</p>}
      {profile?.published && !profile.suspended && <Link href={`/usta-bul/${profile.id}`} className="mb-4 inline-block font-semibold text-[#075fc7]">Yayımdaki profili gör</Link>}
      <MarketForm action="profile" label="Profili kaydet">
        <label className="grid gap-1 text-sm font-medium">Görünen ad<input className={input} name="title" required minLength={2} maxLength={120} defaultValue={profile?.display_name ?? settings.business?.name} /></label>
        <label className="grid gap-1 text-sm font-medium">Tanıtım<textarea className={input} name="body" maxLength={1600} rows={4} defaultValue={profile?.bio} placeholder="Yaptığın işleri ve deneyimini anlat." /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">Hizmet ili<input className={input} name="city" required minLength={2} maxLength={80} defaultValue={profile?.city ?? settings.business?.city ?? ""} /></label>
          <label className="grid gap-1 text-sm font-medium">Hizmet ilçeleri<input className={input} name="districts" maxLength={1600} defaultValue={profile?.districts.join(", ")} placeholder="Kadıköy, Ataşehir" /><span className="font-normal text-slate-600">Virgülle ayır. İlçeleri boş bırakırsan ilin tamamını kapsarsın.</span></label>
        </div>
        <fieldset className="grid gap-2 rounded-xl border border-[#e0e5ee] p-3 sm:grid-cols-2 lg:grid-cols-3"><legend className="px-1 text-sm font-semibold">Verdiğin hizmetler</legend>
          {directory?.categories.map((category) => <label key={category.slug} className="flex min-h-8 items-center gap-2 text-sm"><input name="categories" type="checkbox" value={category.slug} defaultChecked={profile?.categories.includes(category.slug)} /> {category.name}</label>)}
        </fieldset>
        <label className="flex min-h-10 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="published" defaultChecked={profile?.published} /> Profilimi rehberde yayınla ve yeni talepler al</label>
      </MarketForm>
    </section> : <>
      {!profile?.published && view === "feed" && <div className={`mb-4 ${panel}`}><p className="text-sm text-slate-700">Yeni çağrılar ve bölge ilanları için usta profilini yayımla.</p><Link href="/usta-talepleri?gorunum=profil" className={`mt-3 ${plainButton}`}>Usta profilini kur</Link></div>}
      <RequestList rows={rows.slice(0, 20)} categories={directory?.categories ?? []} empty={view === "feed" ? "Hizmetlerine uygun yeni talep yok." : "Henüz çağrın, teklifin veya üstlendiğin bir iş yok."} />
      <MarketPagination page={page} more={rows.length > 20} href={(next) => `/usta-talepleri?page=${next}${view === "work" ? "&gorunum=isler" : ""}`} />
    </>}
  </div>;
}

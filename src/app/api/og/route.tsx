import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const photos: Record<string, string> = {
  hero: "hero-kesif", painter: "painter", electrician: "electrician", plumber: "plumber",
  hvac: "hvac", tadilat: "tadilat", teklif: "usta-teklif", randevu: "musteri-randevu",
};
const photoCache = new Map<string, string>();

// Satori cannot decode webp, so the photo is cropped and re-encoded as a small jpeg data URI (cached per key).
async function photoUri(key: string): Promise<string | null> {
  const name = photos[key] ?? photos.hero;
  const hit = photoCache.get(name);
  if (hit) return hit;
  try {
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(path.join(process.cwd(), "public/images/marketing", `${name}.webp`)).resize(460, 630, { fit: "cover" }).jpeg({ quality: 78 }).toBuffer();
    const uri = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
    photoCache.set(name, uri);
    return uri;
  } catch { return null; }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const title = (params.get("title") || "İşinin maliyetini bil. Kârını koru.").slice(0, 100);
  const description = (params.get("description") || "Ev hizmetleri için usta bul, ustalar için maliyete dayalı teklif hazırla.").slice(0, 160);
  const [font, photo] = await Promise.all([readFile(path.join(process.cwd(), "public/fonts/NotoSans-Bold.ttf")), photoUri(params.get("image") ?? "hero")]);
  const titleSize = title.length > 70 ? 46 : title.length > 45 ? 54 : 62;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff", color: "#0b1220", fontFamily: "Noto" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "60px 64px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, color: "#1554f0" }}>
          <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, background: "#1554f0" }} />KaçaYapayım
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: titleSize, lineHeight: 1.12, letterSpacing: -2 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 25, lineHeight: 1.4, color: "#344054" }}>{description}</div>
        </div>
        <div style={{ display: "flex", fontSize: 20, color: "#667085" }}>kacayapayim.com</div>
      </div>
      {photo ? <img src={photo} width={460} height={630} alt="" style={{ width: 460, height: 630, objectFit: "cover" }} /> : <div style={{ display: "flex", width: 460, height: 630, background: "#1554f0" }} />}
    </div>,
    { width: 1200, height: 630, fonts: [{ name: "Noto", data: font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength) as ArrayBuffer, weight: 700, style: "normal" }], headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" } },
  );
}

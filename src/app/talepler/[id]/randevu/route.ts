import { validMarketId } from "@kacayapayim/core/marketplace";
import { getViewer } from "@/lib/viewer";
import { marketRead } from "@/lib/marketplace/service";

function utc(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  const detail = viewer && validMarketId(id) ? await marketRead("detail", 1, id) : null;
  if (!detail) return new Response(null, { status: 404 });
  const req = detail.request;
  if (!req.appointment_at || !req.appointment_confirmed || req.state === "cancelled" ||
    (!detail.is_customer && (!req.winner_id || req.winner_id !== detail.provider_id))) return new Response(null, { status: 404 });

  const start = new Date(req.appointment_at);
  if (!Number.isFinite(start.getTime())) return new Response(null, { status: 404 });
  const end = new Date(start.getTime() + 60 * 60_000);
  const body = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//KacaYapayim//Hizmet Randevusu//TR",
    "BEGIN:VEVENT", `UID:${id}@kacayapayim`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(start)}`,
    `DTEND:${utc(end)}`, "SUMMARY:KaçaYapayım hizmet randevusu", "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
  return new Response(body, { headers: {
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": 'attachment; filename="kacayapayim-randevu.ics"',
    "Cache-Control": "private, no-store",
  } });
}

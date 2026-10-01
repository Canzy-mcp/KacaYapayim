const todayInIstanbul = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const addDaysToDateKey = (key: string, days: number) => {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export type DashboardPeriod = "this_month" | "last_month" | "last_30" | "this_year" | "custom";
export type DashboardRange = { period: DashboardPeriod; label: string; startDate: string; endDate: string; endExclusive: string };
const dateKey = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime()) &&
  new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;

export function resolveDashboardRange(input: { period?: string; start?: string; end?: string }, today = todayInIstanbul()): DashboardRange {
  const endExclusive = addDaysToDateKey(today, 1);
  if (input.period === "custom" && input.start && input.end && dateKey(input.start) && dateKey(input.end) &&
      input.start <= input.end && input.end <= today &&
      (new Date(`${input.end}T12:00:00Z`).getTime() - new Date(`${input.start}T12:00:00Z`).getTime()) / 86400000 <= 3659) {
    return { period: "custom", label: "Özel Tarih", startDate: input.start, endDate: input.end, endExclusive: addDaysToDateKey(input.end, 1) };
  }
  if (input.period === "last_30") return { period: "last_30", label: "Son 30 Gün", startDate: addDaysToDateKey(today, -29), endDate: today, endExclusive };
  if (input.period === "this_year") return { period: "this_year", label: "Bu Yıl", startDate: `${today.slice(0, 4)}-01-01`, endDate: today, endExclusive };
  if (input.period === "last_month") {
    const first = `${today.slice(0, 7)}-01`;
    const lastDay = addDaysToDateKey(first, -1);
    return { period: "last_month", label: "Geçen Ay", startDate: `${lastDay.slice(0, 7)}-01`, endDate: lastDay, endExclusive: first };
  }
  return { period: "this_month", label: "Bu Ay", startDate: `${today.slice(0, 7)}-01`, endDate: today, endExclusive };
}

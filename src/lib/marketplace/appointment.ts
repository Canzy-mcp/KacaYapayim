const istanbulDateTime = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Istanbul",
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function appointmentBounds(now: Date) {
  const minute = 60_000;
  const start = new Date((Math.floor(now.getTime() / minute) + 1) * minute);
  const end = new Date(now.getTime() + 365 * 24 * 60 * minute);
  return {
    min: istanbulDateTime.format(start).replace(" ", "T"),
    max: istanbulDateTime.format(end).replace(" ", "T"),
  };
}

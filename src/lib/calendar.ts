import type { Match } from "../types";

function addHours(iso: string, h: number): string {
  return new Date(new Date(iso).getTime() + h * 3_600_000).toISOString();
}

// Convert UTC ISO to IST local datetime string for Google Calendar (no Z = local, use ctz param)
function toISTLocal(iso: string): string {
  const ist = new Date(new Date(iso).getTime() + 5.5 * 3_600_000);
  return ist.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "");
}

function toICSDate(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
}

export function googleCalendarUrl(match: Match): string {
  const start = toISTLocal(match.kickoffUTC);
  const end   = toISTLocal(addHours(match.kickoffUTC, 2));
  const title = `${match.home.name} vs ${match.away.name}`;
  const label = match.group ? `Group ${match.group}` : match.round;
  const desc  = `FIFA World Cup 2026 · ${label}`;
  const loc   = [match.venue, match.city].filter(Boolean).join(", ");
  const p     = (s: string) => encodeURIComponent(s);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${p(title)}&dates=${start}/${end}&ctz=Asia%2FKolkata&details=${p(desc)}&location=${p(loc)}`;
}

export function downloadIcs(match: Match): void {
  const start = toICSDate(match.kickoffUTC);
  const end   = toICSDate(addHours(match.kickoffUTC, 2));
  const title = `${match.home.name} vs ${match.away.name}`;
  const label = match.group ? `Group ${match.group}` : match.round;
  const loc   = [match.venue, match.city].filter(Boolean).join(", ");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WC26//World Cup 2026//EN",
    "BEGIN:VEVENT",
    `UID:wc26-${match.id}@wc26.app`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:FIFA World Cup 2026 · ${label}`,
    loc && `LOCATION:${loc}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines], { type: "text/calendar" }));
  a.download = `${match.home.name.replace(/\s+/g, "_")}_vs_${match.away.name.replace(/\s+/g, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}

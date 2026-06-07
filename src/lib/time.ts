// All kickoffs stored as ISO UTC. Render via Intl with the caller-supplied tz.

export const dayKey = (iso: string, tz: string): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(iso)); // YYYY-MM-DD for grouping

export const dayLabel = (iso: string, tz: string): string => {
  const d = new Date(iso);
  const today = dayKey(new Date().toISOString(), tz);
  const key = dayKey(iso, tz);
  if (key === today) return "Today";
  const tmrw = new Date(Date.now() + 864e5).toISOString();
  if (key === dayKey(tmrw, tz)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: tz, weekday: "long", day: "numeric", month: "long",
  }).format(d);
};

export type Countdown = { d: number; h: number; m: number; s: number; done: boolean };
export const countdownTo = (iso: string): Countdown => {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  const s = Math.floor(diff / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60), s: s % 60, done: false };
};

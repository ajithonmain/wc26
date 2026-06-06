// All kickoffs stored as ISO UTC. Render in IST via Intl — never hardcode +5:30/+9:30.
const IST = "Asia/Kolkata";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST, weekday: "short", day: "2-digit", month: "short",
});
const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST, hour: "2-digit", minute: "2-digit", hour12: true,
});
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit",
}); // YYYY-MM-DD for grouping

export const istTime = (iso: string) => timeFmt.format(new Date(iso));
export const istDate = (iso: string) => dateFmt.format(new Date(iso));
export const istDayKey = (iso: string) => dayKeyFmt.format(new Date(iso));

export const istDayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = istDayKey(new Date().toISOString());
  const key = istDayKey(iso);
  if (key === today) return "Today";
  const tmrw = new Date(Date.now() + 864e5).toISOString();
  if (key === istDayKey(tmrw)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST, weekday: "long", day: "numeric", month: "long",
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

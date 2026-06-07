import { tzAbbr } from "./timezones";

// isLateNightIST: kickoff hour [0,5] in Asia/Kolkata — moon tag (IST-specific aesthetic)
export const isLateNightIST = (iso: string): boolean =>
  parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(new Date(iso)),
    10
  ) < 6;

// Split kickoff time into clock digits and AM/PM+abbr for the stacked time display
export const timeParts = (iso: string, tz: string): { hm: string; period: string; abbr: string; ampm: string } => {
  const raw = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
  const isPM = /pm/i.test(raw);
  const hm = raw.replace(/\s*(am|pm)\s*/gi, "").trim();
  const abbr = tzAbbr(tz);
  const period = isPM ? "PM" : "AM";
  return { hm, period, abbr, ampm: `${period} ${abbr}` };
};

// "FRIDAY, 12 JUNE 2026 · ALL TIMES IST" (tz-aware)
export const headerDate = (tz: string): string => {
  const abbr = tzAbbr(tz);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date()).toUpperCase() + ` · ALL TIMES ${abbr}`;
};

// Time-of-day greeting in IST (local to Indian audience — intentionally not tz-aware)
export const getGreetingIST = (): string => {
  const h = parseInt(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
    10
  );
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

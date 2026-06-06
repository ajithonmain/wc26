// isLateNightIST: kickoff hour [0,5] in Asia/Kolkata — moon tag
export const isLateNightIST = (iso: string): boolean =>
  parseInt(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hour12: false,
    }).format(new Date(iso)),
    10
  ) < 6;

const _timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

// Split IST time into clock digits and AM/PM for the stacked time display
export const istTimeParts = (iso: string): { hm: string; ampm: string } => {
  const raw = _timeFmt.format(new Date(iso)); // "07:30 am" or "12:30 pm"
  const isPM = /pm/i.test(raw);
  const hm = raw.replace(/\s*(am|pm)\s*/gi, "").trim();
  return { hm, ampm: isPM ? "PM IST" : "AM IST" };
};

const _headerDateFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// "FRIDAY, 12 JUNE 2026 · ALL TIMES IST"
export const istHeaderDate = (): string =>
  _headerDateFmt.format(new Date()).toUpperCase() + " · ALL TIMES IST";

// Time-of-day greeting in IST
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

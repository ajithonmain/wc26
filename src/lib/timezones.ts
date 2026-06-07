export type TZOption = { tz: string; label: string };

export const TZ_OPTIONS: TZOption[] = [
  { tz: "America/Los_Angeles", label: "Los Angeles" },
  { tz: "America/Denver",      label: "Denver" },
  { tz: "America/Chicago",     label: "Chicago" },
  { tz: "America/New_York",    label: "New York" },
  { tz: "America/Toronto",     label: "Toronto" },
  { tz: "America/Sao_Paulo",   label: "São Paulo" },
  { tz: "America/Mexico_City", label: "Mexico City" },
  { tz: "Europe/London",       label: "London" },
  { tz: "Europe/Paris",        label: "Paris" },
  { tz: "Europe/Berlin",       label: "Berlin" },
  { tz: "Europe/Madrid",       label: "Madrid" },
  { tz: "Africa/Cairo",        label: "Cairo" },
  { tz: "Africa/Lagos",        label: "Lagos" },
  { tz: "Asia/Riyadh",         label: "Riyadh" },
  { tz: "Asia/Dubai",          label: "Dubai" },
  { tz: "Asia/Karachi",        label: "Karachi" },
  { tz: "Asia/Kolkata",        label: "India" },
  { tz: "Asia/Dhaka",          label: "Dhaka" },
  { tz: "Asia/Bangkok",        label: "Bangkok" },
  { tz: "Asia/Singapore",      label: "Singapore" },
  { tz: "Asia/Shanghai",       label: "China" },
  { tz: "Asia/Tokyo",          label: "Tokyo" },
  { tz: "Asia/Seoul",          label: "Seoul" },
  { tz: "Australia/Sydney",    label: "Sydney" },
  { tz: "Pacific/Auckland",    label: "Auckland" },
];

export const tzAbbr = (tz: string): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "short",
  }).formatToParts(new Date());
  return parts.find((p) => p.type === "timeZoneName")?.value ?? tz;
};

export const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const DEFAULT_TZ = TZ_OPTIONS.some((o) => o.tz === BROWSER_TZ)
  ? BROWSER_TZ
  : "Asia/Kolkata";

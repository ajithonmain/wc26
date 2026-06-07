export type IconName =
  | "search"
  | "star"
  | "star-filled"
  | "bell"
  | "bell-filled"
  | "calendar"
  | "alarm"
  | "moon"
  | "sun"
  | "knockout"
  | "ball"
  | "group"
  | "chevron-left"
  | "chevron-right"
  | "home"
  | "trash"
  | "heart"
  | "heart-filled"
  | "shield"
  | "users"
  | "shirt"
  | "sliders"
  | "x"
  | "trophy"
  | "clock";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

const paths: Record<IconName, string> = {
  // ── UI ───────────────────────────────────────────────────────────────────
  search:
    "M10.5 3a7.5 7.5 0 1 0 4.55 13.47l3.74 3.74a1 1 0 0 0 1.42-1.42l-3.74-3.73A7.5 7.5 0 0 0 10.5 3Zm-5.5 7.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z",
  // Funnel — filter button
  sliders:
    "M22 3H2l8 9.46V19l4 2V12.46L22 3Z",
  x:
    "M18 6L6 18M6 6l12 12",
  "chevron-left":
    "M15 18l-6-6 6-6",
  "chevron-right":
    "M9 18l6-6-6-6",

  // ── Theme ─────────────────────────────────────────────────────────────────
  // Bold sun: thick center circle + 8 short rays
  sun:
    "M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77M12 6.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z",
  // Clean crescent moon
  moon:
    "M12 3a6.364 6.364 0 0 0 9 9A9 9 0 1 1 12 3Z",

  // ── Notifications ─────────────────────────────────────────────────────────
  bell:
    "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  "bell-filled":
    "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",

  // ── Scheduling ────────────────────────────────────────────────────────────
  // Calendar — Matches tab
  calendar:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  alarm:
    "M12 4a8 8 0 1 0 0 16A8 8 0 0 0 12 4Zm1 4v5l3 2-1 1.5L12 14V8h1ZM3.5 4.07 1.93 5.5 5 8.9l1.5-1.5L3.5 4.07Zm17 0L18 7.4l1.5 1.5 3.07-3.4L20.5 4.07Z",

  // ── Tab — Matches ─────────────────────────────────────────────────────────
  // Soccer ball: circle with 5-panel pattern
  ball:
    "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 2c.97 0 1.9.14 2.78.4l-1.13 2.44a1.5 1.5 0 0 1-3.3 0L9.22 4.4A8.05 8.05 0 0 1 12 4ZM6.4 5.56l1.4 3a1.5 1.5 0 0 1-1.15 2.06l-2.54.37A8.02 8.02 0 0 1 6.4 5.56Zm11.2 0a8.02 8.02 0 0 1 2.29 5.43l-2.54-.37a1.5 1.5 0 0 1-1.15-2.06l1.4-3ZM4.08 13.12l2.5-.36a1.5 1.5 0 0 1 1.6 1.1l.77 2.85A8.03 8.03 0 0 1 4.08 13.12Zm15.84 0a8.03 8.03 0 0 1-4.87 3.59l.77-2.85a1.5 1.5 0 0 1 1.6-1.1l2.5.36ZM9.1 17.5a1.5 1.5 0 0 1 1.44-1.08h2.92a1.5 1.5 0 0 1 1.44 1.08l.64 2.35A8.04 8.04 0 0 1 12 20a8.04 8.04 0 0 1-3.54-.65l.64-2.35Z",

  // ── Tab — Teams ───────────────────────────────────────────────────────────
  // Team shield / crest
  shield:
    "M12 3 4 7v5c0 4.42 3.38 8.57 8 9.93C16.62 20.57 20 16.42 20 12V7L12 3Z",

  // ── Tab — Groups ──────────────────────────────────────────────────────────
  // 2×2 grid — represents group stage table
  group:
    "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",

  // ── Tab — Knockout ────────────────────────────────────────────────────────
  // Trophy cup
  trophy:
    "M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z",

  // ── Knockout bracket (legacy, kept for desktop nav) ───────────────────────
  knockout:
    "M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z",

  // ── Misc ──────────────────────────────────────────────────────────────────
  star:
    "M12 2.5l2.6 5.26 5.82.85-4.21 4.1.99 5.79L12 15.77l-5.2 2.73.99-5.79L3.58 8.61l5.82-.85L12 2.5Z",
  "star-filled":
    "M12 2.5l2.6 5.26 5.82.85-4.21 4.1.99 5.79L12 15.77l-5.2 2.73.99-5.79L3.58 8.61l5.82-.85L12 2.5Z",
  home:
    "M3 12L12 3l9 9M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9",
  trash:
    "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  heart:
    "M12 21C12 21 3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 13-9 13Z",
  "heart-filled":
    "M12 21C12 21 3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 13-9 13Z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0 4 4 0 0 1-8 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  clock:
    "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  // Jersey / sport shirt — for Teams tab
  shirt:
    "M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23Z",
};

const filledIcons = new Set<IconName>(["star-filled", "bell-filled", "heart-filled"]);

export default function Icon({ name, size = 20, className = "" }: IconProps): React.ReactElement {
  const isFilled = filledIcons.has(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFilled ? "currentColor" : "none"}
      stroke={isFilled ? "none" : "currentColor"}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}

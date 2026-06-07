import { useState, useRef } from "react";
import { Link, useMatch } from "react-router-dom";
import Icon from "./Icon";
import TZPicker from "./TimezonePicker";
import AboutDrawer from "./AboutDrawer";
import { useUIStore } from "../store/uiSlice";
import { useAlertsStore } from "../store/alertsSlice";
import { TZ_OPTIONS, BROWSER_TZ, tzAbbr } from "../lib/timezones";
import { useLiveMatches } from "../hooks/useLiveMatches";
import { useMergedMatches } from "../hooks/useMergedMatches";
import type { IconName } from "./Icon";
import "../styles/sidebar.css";

interface Badge {
  label: string;
  type: "live" | "count";
}

interface NavItemDef {
  label: string;
  path: string;
  icon: IconName;
  badge?: Badge;
}

const inList = TZ_OPTIONS.some((o) => o.tz === BROWSER_TZ);
const TZ_LIST = inList ? TZ_OPTIONS : [{ tz: BROWSER_TZ, label: "Local" }, ...TZ_OPTIONS];

function SidebarItem({ label, path, icon, badge }: NavItemDef): React.ReactElement {
  const m = useMatch(path === "/" ? { path: "/", end: true } : path);
  const isActive = !!m;

  return (
    <Link
      to={path}
      className={`sb-nav-item flex items-center transition-all duration-150${isActive ? " sb-nav-item--active" : ""}`}
    >
      <span className={`sb-nav-icon shrink-0${isActive ? " sb-nav-icon--active" : ""}`}>
        <Icon name={icon} size={18} />
      </span>
      <span className="flex-1 leading-tight truncate">{label}</span>
      {badge && (
        <span className="sb-nav-badge shrink-0 font-bold">{badge.label}</span>
      )}
    </Link>
  );
}

export default function Sidebar(): React.ReactElement {
  const { theme, toggleTheme, timezone } = useUIStore();
  const alertCount = useAlertsStore((s) => s.alerts.length);
  const allMatches = useMergedMatches();
  const liveCount = useLiveMatches(allMatches).length;
  const [tzOpen, setTzOpen] = useState(false);
  const tzBtnRef = useRef<HTMLButtonElement>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const tzLabel = TZ_LIST.find((o) => o.tz === timezone)?.label ?? timezone;

  return (
    <aside className="sb-aside flex flex-col h-full">
      {/* ── Brand ── */}
      <div className="sb-brand flex items-center">
        <img src="/logo.svg" alt="World Cup 26" className="sb-brand-icon shrink-0 rounded-[6px]" />
      </div>

      {/* ── Tournament ── */}
      <p className="sb-section-label">Tournament</p>
      <SidebarItem path="/" icon="calendar" label="Matches" badge={liveCount > 0 ? { label: "LIVE", type: "live" } : undefined} />
      <SidebarItem path="/groups" icon="group" label="Groups" />
      <SidebarItem path="/knockout" icon="trophy" label="Knockout" />

      {/* ── You ── */}
      <p className="sb-section-label sb-section-label--spaced">You</p>
      <SidebarItem path="/teams" icon="shirt" label="Teams" />
      <SidebarItem
        path="/alerts"
        icon="bell"
        label="Alerts"
        badge={alertCount > 0 ? { label: String(alertCount), type: "count" } : undefined}
      />

      <div className="flex-1" />

      {/* ── Timezone ── */}
      <p className="sb-section-label sb-section-label--spaced">Timezone</p>
      <button
        ref={tzBtnRef}
        onClick={() => setTzOpen(true)}
        className="sb-tz-btn flex items-center w-full transition-colors"
        aria-label="Change timezone"
      >
        <span className="sb-tz-icon shrink-0">
          <Icon name="clock" size={16} />
        </span>
        <span className="flex-1 text-left truncate sb-tz-label">{tzLabel}</span>
        <span className="sb-tz-abbr-pill shrink-0">{tzAbbr(timezone)}</span>
      </button>

      {/* ── Theme toggle ── */}
      <button
        onClick={toggleTheme}
        className="sb-theme-btn flex items-center w-full transition-colors"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span className="sb-theme-icon">
          <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
        </span>
        <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
      </button>

      {/* ── About ── */}
      <button
        onClick={() => setAboutOpen(true)}
        className="sb-theme-btn flex items-center w-full transition-colors"
        aria-label="About"
      >
        <span className="sb-theme-icon">
          <Icon name="info" size={16} />
        </span>
        <span>About</span>
      </button>

      <TZPicker open={tzOpen} onClose={() => setTzOpen(false)} anchorRef={tzBtnRef} />
      <AboutDrawer open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </aside>
  );
}

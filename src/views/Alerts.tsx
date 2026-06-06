import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useAlertsStore } from "../store/alertsSlice";
import { useMatches } from "../hooks/useMatches";
import { scheduleKickoffAlert } from "../lib/notify";
import { googleCalendarUrl } from "../lib/calendar";
import { istTimeParts } from "../lib/matchUtils";
import { istDayKey } from "../lib/time";
import FlagImg from "../components/FlagImg";
import Icon from "../components/Icon";
import type { Match } from "../types";
import type { AlertEntry } from "../lib/notify";
import "../styles/alerts.css";

type Tab = "upcoming" | "past";
const REMINDER_OPTIONS = [30, 60, 120] as const;
type ReminderMins = typeof REMINDER_OPTIONS[number];

function timeLabel(mins: number): string {
  return mins === 30 ? "30 min" : mins === 120 ? "2 hrs" : "1 hr";
}

function firesIn(kickoffUTC: string, reminderMins: number): string {
  const diff = new Date(kickoffUTC).getTime() - reminderMins * 60_000 - Date.now();
  if (diff <= 0) return "due now";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 48) return `${Math.floor(h / 24)}d away`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function dayLabel(kickoffUTC: string): string {
  const key = istDayKey(kickoffUTC);
  const d = new Date(`${key}T06:30:00Z`);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

function CalendarButton({ match }: { match: Match }): React.ReactElement {
  return (
    <button
      onClick={() => window.open(googleCalendarUrl(match), "_blank", "noopener")}
      className="alert-cal-btn inline-flex items-center gap-1 ml-auto"
    >
      <Icon name="calendar" size={11} />
      Calendar
    </button>
  );
}

// ─── Alert card ────────────────────────────────────────────────────────────────

interface AlertCardProps {
  alert: AlertEntry;
  match: Match | undefined;
  past?: boolean;
  onRemove: () => void;
}

function AlertCard({ alert, match, past, onRemove }: AlertCardProps): React.ReactElement {
  const update = useAlertsStore((s) => s.update);

  const { hm, ampm } = match ? istTimeParts(match.kickoffUTC) : { hm: "--:--", ampm: "" };
  const label = match?.group ? `Group ${match.group}` : match?.round ?? "";

  const handleTime = (mins: ReminderMins) => {
    update(alert.matchId, mins);
    if (match) scheduleKickoffAlert({ ...alert, reminderMins: mins });
  };

  return (
    <div className="alert-card glass rounded-[12px]">
      {/* Row 1: teams + trash only */}
      <div className="flex items-center gap-2">
        <FlagImg iso={match?.home.iso} name={alert.homeTeam} size={18} />
        <span className="alert-card-team text-sm font-semibold">{alert.homeTeam}</span>
        <span className="alert-card-vs">vs</span>
        <span className="alert-card-team text-sm font-semibold">{alert.awayTeam}</span>
        <FlagImg iso={match?.away.iso} name={alert.awayTeam} size={18} />
        <span className="flex-1" />
        <button
          onClick={onRemove}
          className="alert-card-remove-btn flex items-center justify-center rounded-full"
          aria-label="Remove"
        >
          <Icon name="trash" size={12} />
        </button>
      </div>

      {/* Row 2: meta */}
      <p className="alert-card-meta mt-1">
        {hm} {ampm}{label ? ` · ${label}` : ""}{match?.venue ? ` · ${match.venue}` : ""}
      </p>

      {past ? (
        <p className="alert-card-past text-xs mt-1.5 font-medium">
          Reminder sent · {timeLabel(alert.reminderMins)} before kickoff
        </p>
      ) : (
        <>
          {/* Notify chips + calendar on same row */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className="alert-notify-label shrink-0">
              Notify:
            </span>
            {REMINDER_OPTIONS.map((mins) => {
              const active = alert.reminderMins === mins;
              return (
                <button
                  key={mins}
                  onClick={() => handleTime(mins)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors${active ? " alert-chip--active" : " alert-chip"}`}
                >
                  {timeLabel(mins)}
                </button>
              );
            })}
            <span className="alerts-fires-in text-[11px] alert-fires-in">
              · {firesIn(alert.kickoffUTC, alert.reminderMins)}
            </span>
            {match && (
              <CalendarButton match={match} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Confirm clear modal ───────────────────────────────────────────────────────

interface ConfirmClearProps {
  tab: Tab;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmClear({ tab, onConfirm, onCancel }: ConfirmClearProps): React.ReactElement {
  return (
    <div
      className="alerts-modal-overlay fixed inset-0 flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="alerts-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="alerts-modal-title text-base font-bold mb-1">
          Clear {tab === "upcoming" ? "all upcoming" : "past"} reminders?
        </p>
        <p className="alerts-modal-sub text-sm mb-5">
          {tab === "upcoming"
            ? "This will remove all pending browser reminders. This cannot be undone."
            : "This clears your past reminder history."}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="alerts-modal-cancel-btn flex-1 py-2.5 rounded-[10px] text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="alerts-modal-clear-btn flex-1 py-2.5 rounded-[10px] text-sm font-bold"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function Alerts(): React.ReactElement {
  const alerts     = useAlertsStore((s) => s.alerts);
  const clearPast  = useAlertsStore((s) => s.clearPast);
  const clearAll   = useAlertsStore((s) => s.clearAll);
  const remove     = useAlertsStore((s) => s.remove);
  const allMatches = useMatches();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [showConfirm, setShowConfirm] = useState(false);

  const [pending, setPending] = useState<AlertEntry | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleRemove = useCallback((alert: AlertEntry) => {
    clearTimeout(timerRef.current);
    setPending(alert);
    timerRef.current = setTimeout(() => {
      remove(alert.matchId);
      setPending(null);
    }, 4000);
  }, [remove]);

  const handleUndo = useCallback(() => {
    clearTimeout(timerRef.current);
    setPending(null);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const DUMMY_PAST: AlertEntry = {
    matchId: -1,
    kickoffUTC: "2026-06-01T15:30:00Z",
    homeTeam: "Brazil",
    awayTeam: "Argentina",
    reminderMins: 60,
  };

  const DUMMY_MATCH: Match = {
    id: -1,
    kickoffUTC: "2026-06-01T15:30:00Z",
    venue: "SoFi Stadium",
    city: "Los Angeles",
    round: "Group Stage - Matchday",
    group: "C",
    status: "FT",
    home: { name: "Brazil", slot: "Brazil", iso: "br" },
    away: { name: "Argentina", slot: "Argentina", iso: "ar" },
    score: { home: 2, away: 1 },
    placeholder: false,
  };

  const matchById = useMemo(() => {
    const map = new Map<number, Match>();
    allMatches.forEach((m) => map.set(m.id, m));
    map.set(-1, DUMMY_MATCH);
    return map;
  }, [allMatches]);

  const now = Date.now();

  const upcoming = useMemo(() =>
    alerts
      .filter((a) => a.matchId !== pending?.matchId && new Date(a.kickoffUTC).getTime() - a.reminderMins * 60_000 > now)
      .sort((a, b) => new Date(a.kickoffUTC).getTime() - new Date(b.kickoffUTC).getTime()),
    [alerts, pending]
  );
  const past = useMemo(() =>
    [DUMMY_PAST, ...alerts
      .filter((a) => a.matchId !== pending?.matchId && new Date(a.kickoffUTC).getTime() - a.reminderMins * 60_000 <= now)
      .sort((a, b) => new Date(b.kickoffUTC).getTime() - new Date(a.kickoffUTC).getTime())],
    [alerts, pending]
  );

  const shown = tab === "upcoming" ? upcoming : past;

  const byDay = useMemo(() => {
    const map = new Map<string, AlertEntry[]>();
    shown.forEach((a) => {
      const key = istDayKey(a.kickoffUTC);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return Array.from(map.entries()).map(([, items]) => ({
      label: dayLabel(items[0].kickoffUTC),
      items,
    }));
  }, [shown]);

  const handleClear = () => {
    tab === "past" ? clearPast() : clearAll();
    setShowConfirm(false);
  };

  return (
    <div className="relative flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="alerts-title text-2xl font-bold">Alerts</h1>
            <p className="alerts-subtitle text-xs mt-0.5">
              {upcoming.length} upcoming · {past.length} past
            </p>
          </div>
          {shown.length > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
              className="alerts-clear-btn text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              Clear {tab}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["upcoming", "past"] as Tab[]).map((t) => {
            const isActive = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all capitalize${isActive ? " alerts-tab--active" : " alerts-tab"}`}
              >
                {t}
                {t === "upcoming" && upcoming.length > 0 && (
                  <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full${isActive ? " alerts-tab-badge--active" : " alerts-tab-badge"}`}>
                    {upcoming.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pb-6">
        {/* Browser warning */}
        {tab === "upcoming" && upcoming.length > 0 && (
          <div className="alerts-warning flex items-center gap-2 rounded-[10px] mb-4">
            <span className="alerts-warning-icon"><Icon name="bell" size={12} /></span>
            <p className="alerts-warning-text text-xs font-medium">
              Only fires when browser is open — use <strong>Calendar</strong> for guaranteed delivery.
            </p>
          </div>
        )}

        {shown.length === 0 ? (
          <div className="alerts-empty flex flex-col items-center gap-3 pt-16">
            <Icon name="bell" size={32} />
            <p className="alerts-empty-msg text-sm font-medium">
              {tab === "upcoming" ? "No reminders set" : "No past reminders"}
            </p>
            <p className="alerts-empty-sub text-xs text-center">
              {tab === "upcoming" ? "Tap the bell on any match card to set a reminder" : "Past reminders appear here"}
            </p>
          </div>
        ) : (
          byDay.map(({ label, items }) => (
            <div key={label}>
              <p className="alerts-day-label mb-2">
                {label}
              </p>
              {items.map((alert) => (
                <AlertCard
                  key={alert.matchId}
                  alert={alert}
                  match={matchById.get(alert.matchId)}
                  past={tab === "past"}
                  onRemove={() => handleRemove(alert)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Confirm clear modal */}
      {showConfirm && (
        <ConfirmClear tab={tab} onConfirm={handleClear} onCancel={() => setShowConfirm(false)} />
      )}

      {/* Undo toast */}
      {pending && (
        <div className="alerts-toast absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2.5 rounded-full">
          <span className="text-sm">Reminder removed</span>
          <button
            onClick={handleUndo}
            className="alerts-toast-undo text-sm font-bold"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

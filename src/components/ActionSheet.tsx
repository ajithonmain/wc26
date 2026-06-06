import { createPortal } from "react-dom";
import { useCallback, useState } from "react";
import type { Match } from "../types";
import { useAlertsStore } from "../store/alertsSlice";
import { requestPermission, scheduleKickoffAlert } from "../lib/notify";
import { googleCalendarUrl } from "../lib/calendar";
import { istTimeParts } from "../lib/matchUtils";
import FlagImg from "./FlagImg";
import Icon from "./Icon";
import "../styles/actionsheet.css";

interface ActionSheetProps {
  match: Match;
  onClose: () => void;
}

interface OptionRowProps {
  icon: "bell" | "bell-filled" | "calendar";
  iconVariant: "calendar" | "bell" | "share";
  label: string;
  sub: string;
  active?: boolean;
  last?: boolean;
  onClick: () => void;
}

function OptionRow({ icon, iconVariant, label, sub, active, last, onClick }: OptionRowProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={`as-option-row flex items-center w-full text-left transition-opacity duration-100 active:opacity-60${last ? "" : " as-option-row--bordered"}`}
    >
      <span className={`as-option-icon flex items-center justify-center shrink-0 opt-icon--${iconVariant}`}>
        <Icon name={active ? "bell-filled" : icon} size={17} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="as-option-label block text-sm font-semibold">{label}</span>
        <span className="as-option-sub block text-xs mt-0.5">{sub}</span>
      </span>
      {active && (
        <span className="as-option-on-badge text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-full">ON</span>
      )}
    </button>
  );
}

export default function ActionSheet({ match, onClose }: ActionSheetProps): React.ReactElement {
  const isAlerting    = useAlertsStore((s) => s.isAlerting(match.id));
  const alertEntry    = useAlertsStore((s) => s.alerts.find((a) => a.matchId === match.id));
  const add           = useAlertsStore((s) => s.add);
  const remove        = useAlertsStore((s) => s.remove);
  const [denied, setDenied] = useState(false);

  const { hm, ampm } = istTimeParts(match.kickoffUTC);
  const label    = match.group ? `Group ${match.group}` : match.round;
  const isFuture = match.status === "NS" && new Date(match.kickoffUTC).getTime() > Date.now() + 60_000;

  const handleRemind = useCallback(async (mins: number) => {
    const perm = await requestPermission();
    if (perm !== "granted") { setDenied(true); return; }
    remove(match.id);
    const entry = { matchId: match.id, kickoffUTC: match.kickoffUTC, homeTeam: match.home.name, awayTeam: match.away.name, reminderMins: mins };
    add(entry);
    scheduleKickoffAlert(entry);
  }, [match, add, remove]);

  const handleGCal = useCallback(() => {
    window.open(googleCalendarUrl(match), "_blank", "noopener");
    onClose();
  }, [match, onClose]);

  const isDesktop = window.innerWidth >= 1024;

  return createPortal(
    <div
      className="as-overlay fixed inset-0 flex items-end lg:items-center justify-center"
      onClick={onClose}
    >
      <div
        style={{ width: isDesktop ? 380 : "100%", paddingBottom: isDesktop ? 0 : "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={isDesktop ? "as-panel-desktop" : "as-panel-mobile"}>

          {/* Match header — centered */}
          <div className="as-match-hd flex flex-col items-center gap-2 pb-5">
            <div className="flex items-center gap-3">
              <FlagImg iso={match.home.iso} name={match.home.name} size={32} />
              <span className="as-match-hd-title text-base font-bold">
                {match.home.name}
                <span className="as-match-hd-vs">vs</span>
                {match.away.name}
              </span>
              <FlagImg iso={match.away.iso} name={match.away.name} size={32} />
            </div>
            <p className="as-match-hd-meta text-xs text-center">
              {hm} {ampm} · {label}{match.venue ? ` · ${match.venue}` : ""}
            </p>
          </div>

          {denied && (
            <p className="as-denied text-xs text-center mt-3">
              Notifications blocked — enable in browser settings
            </p>
          )}

          {/* Actions */}
          <div className="as-actions">
            {/* Google Calendar — PRIMARY */}
            <OptionRow
              icon="calendar"
              iconVariant="calendar"
              label="Add to Google Calendar"
              sub="Guaranteed — works even when browser is closed"
              onClick={handleGCal}
            />

            {/* Browser notification — secondary, future only */}
            {isFuture && (
              <div className="as-reminder-wrap">
                <div className="as-reminder-hd flex items-center">
                  <span
                    className={`as-reminder-icon-wrap flex items-center justify-center shrink-0${isAlerting ? " as-reminder-icon-wrap--active" : " as-reminder-icon-wrap--inactive"}`}
                  >
                    <Icon name={isAlerting ? "bell-filled" : "bell"} size={17} />
                  </span>
                  <span className="flex-1">
                    <span className="as-reminder-title block text-sm font-semibold">
                      {isAlerting ? `Browser reminder — ${alertEntry?.reminderMins === 30 ? "30 min" : alertEntry?.reminderMins === 120 ? "2 hours" : "1 hour"} before` : "Browser reminder"}
                    </span>
                    <span className="as-reminder-sub block text-xs mt-0.5">
                      Only works if browser is open
                    </span>
                  </span>
                  {isAlerting && (
                    <button onClick={() => remove(match.id)} className="as-reminder-remove text-xs font-semibold shrink-0">Remove</button>
                  )}
                </div>
                <div className="as-chip-row flex gap-2">
                  {([30, 60, 120] as const).map((mins) => {
                    const active = isAlerting && alertEntry?.reminderMins === mins;
                    const lbl = mins === 30 ? "30 min" : mins === 60 ? "1 hour" : "2 hours";
                    return (
                      <button
                        key={mins}
                        onClick={() => handleRemind(mins)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors${active ? " as-chip--active" : " as-chip"}`}
                      >
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="as-close-btn w-full py-3 rounded-[14px] text-sm font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

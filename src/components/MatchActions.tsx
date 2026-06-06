import { useCallback } from "react";
import { useAlertsStore } from "../store/alertsSlice";
import { requestPermission, scheduleKickoffAlert } from "../lib/notify";
import Icon from "./Icon";
import type { Match } from "../types";

interface MatchActionsProps {
  match: Match;
}

export default function MatchActions({ match }: MatchActionsProps): React.ReactElement | null {
  const isAlerting = useAlertsStore((s) => s.isAlerting(match.id));
  const add = useAlertsStore((s) => s.add);
  const remove = useAlertsStore((s) => s.remove);

  // Only show bell for future NS matches
  const kickoffMs = new Date(match.kickoffUTC).getTime();
  const isFuture = match.status === "NS" && kickoffMs > Date.now() + 60_000;
  if (!isFuture) return null;

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isAlerting) {
        remove(match.id);
        return;
      }
      const perm = await requestPermission();
      if (perm !== "granted") return;
      const entry = {
        matchId: match.id,
        kickoffUTC: match.kickoffUTC,
        homeTeam: match.home.name,
        awayTeam: match.away.name,
        reminderMins: 60,
      };
      add(entry);
      scheduleKickoffAlert(entry);
    },
    [isAlerting, match, add, remove]
  );

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0 ${isAlerting ? "icon-active-accent" : "icon-inactive"}`}
      aria-label={isAlerting ? "Remove kickoff reminder" : "Set kickoff reminder"}
      aria-pressed={isAlerting}
    >
      <Icon name={isAlerting ? "bell-filled" : "bell"} size={15} />
    </button>
  );
}

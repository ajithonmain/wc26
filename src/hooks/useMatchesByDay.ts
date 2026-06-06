import { useMemo } from "react";
import type { Match } from "../types";
import { istDayKey, istDayLabel } from "../lib/time";

export interface DayGroup {
  dayKey: string;
  label: string;
  matches: Match[];
}

export const useMatchesByDay = (matches: Match[]): DayGroup[] =>
  useMemo(() => {
    const map = new Map<string, DayGroup>();
    for (const m of matches) {
      const key = istDayKey(m.kickoffUTC);
      if (!map.has(key)) {
        map.set(key, { dayKey: key, label: istDayLabel(m.kickoffUTC), matches: [] });
      }
      map.get(key)!.matches.push(m);
    }
    return Array.from(map.values()).sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  }, [matches]);

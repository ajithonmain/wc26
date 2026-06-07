import { useMemo } from "react";
import type { Match } from "../types";
import { dayKey, dayLabel } from "../lib/time";
import { useUIStore } from "../store/uiSlice";

export interface DayGroup {
  dayKey: string;
  label: string;
  matches: Match[];
}

export const useMatchesByDay = (matches: Match[]): DayGroup[] => {
  const tz = useUIStore((s) => s.timezone);
  return useMemo(() => {
    const map = new Map<string, DayGroup>();
    for (const m of matches) {
      const key = dayKey(m.kickoffUTC, tz);
      if (!map.has(key)) {
        map.set(key, { dayKey: key, label: dayLabel(m.kickoffUTC, tz), matches: [] });
      }
      map.get(key)!.matches.push(m);
    }
    return Array.from(map.values()).sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  }, [matches, tz]);
};

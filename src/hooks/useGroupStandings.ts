import { useMemo } from "react";
import type { Match } from "../types";
import { useTeams } from "./useTeams";

export interface TeamStanding {
  name: string;
  iso: string;
  w: number;
  d: number;
  l: number;
  gd: number;
  pts: number;
}

export const useGroupStandings = (
  group: string,
  matches: Match[]
): TeamStanding[] => {
  const teams = useTeams();
  return useMemo(() => {
    const standings = new Map<string, TeamStanding>();

    for (const [, t] of teams) {
      if (t.group === group && !t.placeholder) {
        standings.set(t.name, {
          name: t.name,
          iso: t.iso,
          w: 0, d: 0, l: 0, gd: 0, pts: 0,
        });
      }
    }

    for (const m of matches) {
      if (m.group !== group || m.status !== "FT") continue;
      const h = standings.get(m.home.name);
      const a = standings.get(m.away.name);
      if (!h || !a) continue;
      const hg = m.score.home ?? 0;
      const ag = m.score.away ?? 0;
      h.gd += hg - ag;
      a.gd += ag - hg;
      if (hg > ag) { h.w++; h.pts += 3; a.l++; }
      else if (ag > hg) { a.w++; a.pts += 3; h.l++; }
      else { h.d++; h.pts++; a.d++; a.pts++; }
    }

    return Array.from(standings.values()).sort(
      (a, b) => b.pts - a.pts || b.gd - a.gd || a.name.localeCompare(b.name)
    );
  }, [group, matches, teams]);
};

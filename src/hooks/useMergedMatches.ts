import { useMemo } from "react";
import { useMatches } from "./useMatches";
import { useTeams } from "./useTeams";
import { useLiveStore } from "../store/liveSlice";
import type { Match, MatchStatus } from "../types";

export function useMergedMatches(): Match[] {
  const seed    = useMatches();
  const teams   = useTeams();
  const scores  = useLiveStore((s) => s.scores);
  const bracket = useLiveStore((s) => s.bracket);

  return useMemo(() => {
    if (scores.size === 0 && bracket.size === 0) return seed;

    return seed.map((m): Match => {
      // Apply bracket override — replaces placeholder team names with real ones
      let match = m;
      const bracketEntry = bracket.get(m.id);
      if (bracketEntry) {
        const homeTeam = teams.get(bracketEntry.home);
        const awayTeam = teams.get(bracketEntry.away);
        match = {
          ...match,
          home: homeTeam
            ? { ...match.home, name: homeTeam.name, iso: homeTeam.iso }
            : { ...match.home, name: bracketEntry.home },
          away: awayTeam
            ? { ...match.away, name: awayTeam.name, iso: awayTeam.iso }
            : { ...match.away, name: bracketEntry.away },
        };
      }

      // Apply live score overlay keyed by real team names after bracket resolved
      const key  = `${match.home.name.toLowerCase()}|${match.away.name.toLowerCase()}`;
      const live = scores.get(key);
      if (!live) return match;
      return {
        ...match,
        status: live.status as MatchStatus,
        score: { home: live.homeScore, away: live.awayScore },
        minute: live.minute,
        events: live.events || undefined,
      };
    });
  }, [seed, scores, bracket, teams]);
}

import { useMemo } from "react";
import { useMatches } from "./useMatches";
import { useLiveStore } from "../store/liveSlice";
import type { Match, MatchStatus } from "../types";

export function useMergedMatches(): Match[] {
  const seed = useMatches();
  const scores = useLiveStore((s) => s.scores);

  return useMemo(() => {
    if (scores.size === 0) return seed;
    return seed.map((m): Match => {
      const key = `${m.home.name.toLowerCase()}|${m.away.name.toLowerCase()}`;
      const live = scores.get(key);
      if (!live) return m;
      return {
        ...m,
        status: live.status as MatchStatus,
        score: { home: live.homeScore, away: live.awayScore },
        minute: live.minute,
      };
    });
  }, [seed, scores]);
}

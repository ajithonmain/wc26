import { useMemo } from "react";
import teamsData from "../data/teams.json";
import type { Team } from "../types";

export const useTeams = (): Map<string, Team> =>
  useMemo(() => {
    const map = new Map<string, Team>();
    for (const t of teamsData as Team[]) {
      map.set(t.name, t);
    }
    return map;
  }, []);

import { useMemo } from "react";
import type { Match } from "../types";

export const useNextMatch = (matches: Match[]): Match | null =>
  useMemo(() => {
    const now = Date.now();
    return (
      matches.find(
        (m) => m.status === "NS" && new Date(m.kickoffUTC).getTime() > now
      ) ?? null
    );
  }, [matches]);

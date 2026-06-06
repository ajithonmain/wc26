import { useMemo } from "react";
import type { Match } from "../types";

export const useLiveMatches = (matches: Match[]): Match[] =>
  useMemo(
    () => matches.filter((m) => m.status === "LIVE" || m.status === "HT"),
    [matches]
  );

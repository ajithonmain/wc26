import { useMemo, useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import fixturesData from "../data/fixtures.json";
import type { Match, MatchStatus, Round, Team, TeamSlot } from "../types";
import { useTeams } from "./useTeams";
import { LIVE_ENABLED } from "../config";
import { db } from "../lib/firebase";

type RawSlot = { name: string; slot: string };

type RawFixture = {
  id: number;
  kickoffUTC: string;
  venue: string | null;
  city: string | null;
  round: string;
  group: string | null;
  status: string;
  home: RawSlot;
  away: RawSlot;
  score: { home: number | null; away: number | null };
  placeholder: boolean;
};

interface LiveData {
  status: MatchStatus;
  minute: number | null;
  score: { home: number | null; away: number | null };
}

const enrichSlot = (raw: RawSlot, teams: Map<string, Team>): TeamSlot => {
  const team = teams.get(raw.name);
  return {
    name: raw.name,
    slot: raw.slot,
    iso: team?.iso ?? null,
    color: team?.color,
    fifaRank: team?.fifaRank ?? null,
    fifaCode: team?.fifaCode ?? null,
  };
};

// Subscribe to /live collection and maintain a Map<id, LiveData>.
// Only active when LIVE_ENABLED; returns empty map otherwise.
function useLiveOverlay(): Map<number, LiveData> {
  const [liveMap, setLiveMap] = useState<Map<number, LiveData>>(new Map());

  useEffect(() => {
    if (!LIVE_ENABLED) return;

    const unsub = onSnapshot(
      collection(db, "live"),
      (snapshot) => {
        setLiveMap((prev) => {
          const next = new Map(prev);
          snapshot.docChanges().forEach((change) => {
            if (change.type === "removed") {
              next.delete(Number(change.doc.id));
            } else {
              const d = change.doc.data() as LiveData & { id?: number };
              next.set(Number(change.doc.id), {
                status: d.status,
                minute: d.minute ?? null,
                score: { home: d.score?.home ?? null, away: d.score?.away ?? null },
              });
            }
          });
          return next;
        });
      },
      (err) => {
        console.warn("[useMatches] Firestore onSnapshot error:", err.message);
      }
    );

    return unsub;
  }, []); // mount once; LIVE_ENABLED is a compile-time constant

  return liveMap;
}

export const useMatches = (): Match[] => {
  const teams = useTeams();
  const liveMap = useLiveOverlay();

  return useMemo(
    () =>
      (fixturesData as RawFixture[])
        .map((f): Match => {
          const live = liveMap.get(f.id);
          return {
            id: f.id,
            kickoffUTC: f.kickoffUTC,
            venue: f.venue,
            city: f.city,
            round: f.round as Round,
            group: f.group,
            // Live overlay wins over static status/score/minute
            status: live?.status ?? (f.status as MatchStatus),
            minute: live?.minute ?? null,
            home: enrichSlot(f.home, teams),
            away: enrichSlot(f.away, teams),
            score: live?.score ?? f.score,
            placeholder: f.placeholder,
          };
        })
        .sort((a, b) => a.kickoffUTC.localeCompare(b.kickoffUTC)),
    [teams, liveMap]
  );
};

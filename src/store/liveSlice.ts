import { create } from "zustand";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { LIVE_ENABLED } from "../config";

export interface LiveScore {
  status: string;
  homeScore: number;
  awayScore: number;
  minute: number | null;
  events: string;
}

export interface BracketEntry {
  home: string;
  away: string;
}

type RawScore = {
  home?: string;
  away?: string;
  status?: string;
  homeScore?: number;
  awayScore?: number;
  minute?: number | null;
  homeScorers?: string;
  awayScorers?: string;
};

interface LiveState {
  scores: Map<string, LiveScore>;
  bracket: Map<number, BracketEntry>;
  init: () => (() => void) | undefined;
}

export const useLiveStore = create<LiveState>()((set) => ({
  scores: new Map(),
  bracket: new Map(),
  init: () => {
    if (!LIVE_ENABLED) return undefined;

    const unsubScores = onSnapshot(doc(db, "live", "scores"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Record<string, RawScore>;
      const map = new Map<string, LiveScore>();
      Object.entries(data).forEach(([key, d]) => {
        if (!d.home || !d.away) return;
        const parts = [d.homeScorers, d.awayScorers].filter(Boolean).join(" · ");
        map.set(key, {
          status: d.status ?? "NS",
          homeScore: d.homeScore ?? 0,
          awayScore: d.awayScore ?? 0,
          minute: d.minute ?? null,
          events: parts,
        });
      });
      set({ scores: map });
    });

    const unsubBracket = onSnapshot(doc(db, "live", "bracket"), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Record<string, { home: string; away: string }>;
      const map = new Map<number, BracketEntry>();
      Object.entries(data).forEach(([key, d]) => {
        if (d.home && d.away) map.set(Number(key), { home: d.home, away: d.away });
      });
      set({ bracket: map });
    });

    return () => { unsubScores(); unsubBracket(); };
  },
}));

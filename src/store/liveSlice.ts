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
  init: () => (() => void) | undefined;
}

export const useLiveStore = create<LiveState>()((set) => ({
  scores: new Map(),
  init: () => {
    if (!LIVE_ENABLED) return undefined;
    // Single document /live/scores holds all live match data as a map.
    // 1 Firestore read per update regardless of match count — vs N reads with a collection.
    const unsub = onSnapshot(doc(db, "live", "scores"), (snap) => {
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
    return unsub;
  },
}));

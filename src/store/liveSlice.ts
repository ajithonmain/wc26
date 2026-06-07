import { create } from "zustand";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { LIVE_ENABLED } from "../config";

export interface LiveScore {
  status: string;
  homeScore: number;
  awayScore: number;
  minute: number | null;
}

interface LiveState {
  scores: Map<string, LiveScore>;
  init: () => (() => void) | undefined;
}

export const useLiveStore = create<LiveState>()((set) => ({
  scores: new Map(),
  init: () => {
    if (!LIVE_ENABLED) return undefined;
    const unsub = onSnapshot(collection(db, "live"), (snap) => {
      const map = new Map<string, LiveScore>();
      snap.docs.forEach((doc) => {
        const d = doc.data();
        if (!d.home || !d.away) return;
        const key = `${d.home.toLowerCase()}|${d.away.toLowerCase()}`;
        map.set(key, {
          status: d.status ?? "NS",
          homeScore: d.homeScore ?? 0,
          awayScore: d.awayScore ?? 0,
          minute: d.minute ?? null,
        });
      });
      set({ scores: map });
    });
    return unsub;
  },
}));

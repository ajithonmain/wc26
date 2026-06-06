import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AlertEntry } from "../lib/notify";

interface AlertsState {
  alerts: AlertEntry[];
  add: (entry: AlertEntry) => void;
  remove: (matchId: number) => void;
  update: (matchId: number, reminderMins: number) => void;
  clearPast: () => void;
  clearAll: () => void;
  isAlerting: (matchId: number) => boolean;
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set, get) => ({
      alerts: [],
      add: (entry) =>
        set((s) => {
          if (s.alerts.some((a) => a.matchId === entry.matchId)) return s;
          return { alerts: [...s.alerts, entry] };
        }),
      remove: (matchId) =>
        set((s) => ({ alerts: s.alerts.filter((a) => a.matchId !== matchId) })),
      update: (matchId, reminderMins) =>
        set((s) => ({ alerts: s.alerts.map((a) => a.matchId === matchId ? { ...a, reminderMins } : a) })),
      clearPast: () =>
        set((s) => ({ alerts: s.alerts.filter((a) => new Date(a.kickoffUTC).getTime() > Date.now()) })),
      clearAll: () => set({ alerts: [] }),
      isAlerting: (matchId) =>
        get().alerts.some((a) => a.matchId === matchId),
    }),
    { name: "wc26:alerts" }
  )
);

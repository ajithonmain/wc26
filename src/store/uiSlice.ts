import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_TZ } from "../lib/timezones";

export type Theme = "light" | "dark";

interface UIState {
  theme: Theme;
  toggleTheme: () => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const applyTheme = (t: Theme) =>
  document.documentElement.setAttribute("data-theme", t);

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: (document.documentElement.getAttribute("data-theme") as Theme) ?? "light",
      toggleTheme: () =>
        set((s) => {
          const next: Theme = s.theme === "dark" ? "light" : "dark";
          applyTheme(next);
          return { theme: next };
        }),
      timezone: DEFAULT_TZ,
      setTimezone: (tz: string) => set({ timezone: tz }),
      searchOpen: false,
      openSearch: () => set({ searchOpen: true }),
      closeSearch: () => set({ searchOpen: false }),
    }),
    {
      name: "wc26:ui",
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);

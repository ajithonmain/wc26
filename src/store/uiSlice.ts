import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface UIState {
  theme: Theme;
  toggleTheme: () => void;
}

const applyTheme = (t: Theme) =>
  document.documentElement.setAttribute("data-theme", t);

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: (document.documentElement.getAttribute("data-theme") as Theme) ?? "dark",
      toggleTheme: () =>
        set((s) => {
          const next: Theme = s.theme === "dark" ? "light" : "dark";
          applyTheme(next);
          return { theme: next };
        }),
    }),
    {
      name: "wc26:ui",
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  favorites: string[]; // team names
  toggle: (teamName: string) => void;
  isFav: (teamName: string) => boolean;
  toggleMatch: (home: string, away: string) => void;
  isMatchFav: (home: string, away: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggle: (teamName) =>
        set((s) => ({
          favorites: s.favorites.includes(teamName)
            ? s.favorites.filter((n) => n !== teamName)
            : [...s.favorites, teamName],
        })),
      isFav: (teamName) => get().favorites.includes(teamName),
      toggleMatch: (home, away) =>
        set((s) => {
          const isAnyFav =
            s.favorites.includes(home) || s.favorites.includes(away);
          if (isAnyFav) {
            return {
              favorites: s.favorites.filter(
                (n) => n !== home && n !== away
              ),
            };
          }
          const toAdd: string[] = [];
          if (!s.favorites.includes(home)) toAdd.push(home);
          if (!s.favorites.includes(away)) toAdd.push(away);
          return { favorites: [...s.favorites, ...toAdd] };
        }),
      isMatchFav: (home, away) => {
        const favs = get().favorites;
        return favs.includes(home) || favs.includes(away);
      },
    }),
    { name: "wc26:favorites" }
  )
);

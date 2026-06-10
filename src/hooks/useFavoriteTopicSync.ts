import { useEffect } from "react";
import { useFavoritesStore } from "../store/favoritesSlice";
import { syncFavoritesToFirestore } from "../lib/notify";

export function useFavoriteTopicSync(): void {
  const favorites = useFavoritesStore((s) => s.favorites);

  useEffect(() => {
    void syncFavoritesToFirestore(favorites);
  }, [favorites]);
}

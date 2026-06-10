import { useEffect, useRef } from "react";
import { useFavoritesStore } from "../store/favoritesSlice";
import { subscribeToTeamTopic, unsubscribeFromTeamTopic } from "../lib/notify";

export function useFavoriteTopicSync(): void {
  const favorites = useFavoritesStore((s) => s.favorites);
  const prevRef = useRef<string[]>([]);

  useEffect(() => {
    const prev = new Set(prevRef.current);
    const curr = new Set(favorites);

    for (const team of curr) {
      if (!prev.has(team)) void subscribeToTeamTopic(team);
    }
    for (const team of prev) {
      if (!curr.has(team)) void unsubscribeFromTeamTopic(team);
    }

    prevRef.current = favorites;
  }, [favorites]);
}

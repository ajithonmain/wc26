import { useFavoritesStore } from "../store/favoritesSlice";
import Icon from "./Icon";

interface FavStarProps {
  home: string;
  away: string;
  disabled?: boolean;
}

export default function FavStar({ home, away, disabled = false }: FavStarProps): React.ReactElement | null {
  const isMatchFav = useFavoritesStore((s) => s.isMatchFav(home, away));
  const toggleMatch = useFavoritesStore((s) => s.toggleMatch);

  if (disabled) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleMatch(home, away);
      }}
      className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors shrink-0 ${isMatchFav ? "icon-active-gold" : "icon-inactive"}`}
      aria-label={isMatchFav ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={isMatchFav}
    >
      <Icon name={isMatchFav ? "star-filled" : "star"} size={15} />
    </button>
  );
}

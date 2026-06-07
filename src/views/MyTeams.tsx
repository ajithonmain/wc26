import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useTeams } from "../hooks/useTeams";
import { useMergedMatches as useMatches } from "../hooks/useMergedMatches";
import { useMatchesByDay } from "../hooks/useMatchesByDay";
import { useFavoritesStore } from "../store/favoritesSlice";
import type { Team } from "../types";
import FlagImg from "../components/FlagImg";
import MatchCard from "../components/MatchCard";
import Icon from "../components/Icon";
import "../styles/myteams.css";

type Tab = "all" | "favourites";

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.32, 0, 0.67, 0] as const } },
};

// ─── Team card ────────────────────────────────────────────────────────────────

function TeamCard({ team }: { team: Team }): React.ReactElement {
  const isFav = useFavoritesStore((s) => s.isFav(team.name));
  const toggle = useFavoritesStore((s) => s.toggle);

  return (
    <div className={`glass rounded-[var(--r-sm)] flex flex-col items-center gap-1.5 py-3 px-2 relative${isFav ? " mt-card--fav" : ""}`}>
      <FlagImg iso={team.iso} name={team.name} size={36} />
      <span className="mt-chip-name text-[11px] font-semibold text-center leading-tight w-full truncate">
        {team.name}
      </span>
      <span className="mt-chip-group text-[10px]">Group {team.group}</span>

      {/* Favourite button */}
      <button
        onClick={() => toggle(team.name)}
        className={`mt-fav-btn${isFav ? " mt-fav-btn--active" : ""}`}
        aria-label={isFav ? `Remove ${team.name} from favourites` : `Favourite ${team.name}`}
        aria-pressed={isFav}
      >
        <Icon name={isFav ? "heart-filled" : "heart"} size={15} />
      </button>
    </div>
  );
}

// ─── Favourite matches ────────────────────────────────────────────────────────

function FavouriteMatches(): React.ReactElement {
  const matches = useMatches();
  const favorites = useFavoritesStore((s) => s.favorites);
  const favMatches = useMemo(
    () => matches.filter((m) => favorites.includes(m.home.name) || favorites.includes(m.away.name)),
    [matches, favorites]
  );
  const favDays = useMatchesByDay(favMatches);

  if (favorites.length === 0) {
    return (
      <div className="mt-empty flex flex-col items-center gap-2 py-16 text-center">
        <span className="mt-empty-icon"><Icon name="heart" size={32} /></span>
        <p className="text-sm mt-1">No favourite teams yet</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--meta-text)" }}>
          Go to All to favourite teams and see their schedule here
        </p>
      </div>
    );
  }

  if (favDays.length === 0) {
    return <p className="mt-no-scheduled text-sm py-6">No scheduled matches for your teams</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {favDays.map(({ dayKey, label, matches: dayMatches }) => (
        <motion.div
          key={dayKey}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          <p className="mt-day-label text-[11px] font-semibold uppercase tracking-widest mb-2">{label}</p>
          <div className="flex flex-col gap-2">
            {dayMatches.map((m) => (
              <motion.div key={m.id} variants={itemVariants}>
                <MatchCard match={m} variant="row" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function MyTeams(): React.ReactElement {
  const teamsMap = useTeams();
  const favorites = useFavoritesStore((s) => s.favorites);
  const [tab, setTab] = useState<Tab>("all");

  const allTeams = useMemo(
    () =>
      Array.from(teamsMap.values())
        .filter((t) => !t.placeholder)
        .sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name)),
    [teamsMap]
  );

  const favTeams = useMemo(
    () => allTeams.filter((t) => favorites.includes(t.name)),
    [allTeams, favorites]
  );

  const displayedTeams = tab === "all" ? allTeams : favTeams;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-3">
        <h1 className="mt-title text-2xl font-bold">Teams</h1>
        <p className="mt-subtitle text-xs mt-0.5">
          {allTeams.length} teams · {favorites.length} favourited
        </p>
      </div>

      {/* Tabs */}
      <div className="shrink-0 px-6 pb-4 flex gap-2">
        {(["all", "favourites"] as Tab[]).map((t) => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all capitalize${isActive ? " mt-tab--active" : " mt-tab"}`}
            >
              {t === "favourites" && favorites.length > 0 ? `Favourites (${favorites.length})` : t === "all" ? "All" : "Favourites"}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pb-6">
        {tab === "all" ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            {displayedTeams.map((team) => (
              <TeamCard key={team.name} team={team} />
            ))}
          </div>
        ) : (
          <>
            {/* Fav teams grid */}
            {favTeams.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                {favTeams.map((team) => (
                  <TeamCard key={team.name} team={team} />
                ))}
              </div>
            )}
            {/* Fav matches */}
            <FavouriteMatches />
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useMatches } from "../hooks/useMatches";
import { useMatchesByDay } from "../hooks/useMatchesByDay";
import { useLiveMatches } from "../hooks/useLiveMatches";
import { useNextMatch } from "../hooks/useNextMatch";
import { useFavoritesStore } from "../store/favoritesSlice";
import { istDayKey } from "../lib/time";
import { istHeaderDate } from "../lib/matchUtils";
import type { Match } from "../types";
import DateRail from "../components/DateRail";
import MatchCard, { HeroCardWithCountdown } from "../components/MatchCard";
import LiveCarousel from "../components/LiveCarousel";
import Icon from "../components/Icon";
import FilterSheet, { type FilterState, DEFAULT_FILTER, isFiltered } from "../components/FilterSheet";
import "../styles/matchcenter.css";

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.32, 0, 0.67, 0] as const },
  },
};

interface SubGroup {
  label: string;
  matches: Match[];
}

function daySubGroups(matches: Match[]): SubGroup[] {
  const map = new Map<string, Match[]>();
  for (const m of matches) {
    const key = m.group ? `GROUP ${m.group}` : m.round.toUpperCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([label, ms]) => ({ label, matches: ms }));
}

export default function MatchCenter(): React.ReactElement {
  const allMatches = useMatches();
  const favorites = useFavoritesStore((s) => s.favorites);

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterState>({ ...DEFAULT_FILTER });
  const hasFilter = isFiltered(activeFilter);
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  const matches = useMemo(() => {
    if (!isFiltered(activeFilter)) return allMatches;
    return allMatches.filter((m) => {
      const statusMatch =
        activeFilter.status === "all" ||
        (activeFilter.status === "live" && (m.status === "LIVE" || m.status === "HT")) ||
        (activeFilter.status === "upcoming" && m.status === "NS") ||
        (activeFilter.status === "ft" && (m.status === "FT" || m.status === "PST"));
      const teamsMatch =
        activeFilter.teams === "all" ||
        favorites.includes(m.home.name) ||
        favorites.includes(m.away.name);
      const groupsMatch =
        activeFilter.groups.length === 0 ||
        activeFilter.groups.includes(m.group ?? "");
      return statusMatch && teamsMatch && groupsMatch;
    });
  }, [allMatches, activeFilter, favorites]);

  const days = useMatchesByDay(matches);
  const DUMMY_LIVE: Match = {
    id: -2,
    kickoffUTC: new Date(Date.now() - 45 * 60_000).toISOString(),
    venue: "MetLife Stadium",
    city: "New York",
    round: "Group Stage - Matchday",
    group: "B",
    status: "LIVE",
    minute: 67,
    home: { name: "France", slot: "France", iso: "fr", fifaRank: 2 },
    away: { name: "Germany", slot: "Germany", iso: "de", fifaRank: 16 },
    score: { home: 2, away: 1 },
    placeholder: false,
    events: "Mbappé 23' · Giroud 58'",
  };

  const liveMatches = [DUMMY_LIVE, ...useLiveMatches(allMatches)];
  const nextMatch = useNextMatch(allMatches);

  const todayKey = istDayKey(new Date().toISOString());
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const pillScrollLock = useRef(false);
  const pillScrollTimer = useRef<ReturnType<typeof setTimeout>>();

  const [activeDay, setActiveDay] = useState("");
  useEffect(() => {
    if (days.length > 0) {
      setActiveDay((prev) => {
        if (prev && days.some((d) => d.dayKey === prev)) return prev;
        return days.some((d) => d.dayKey === todayKey) ? todayKey : "";
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  useEffect(() => {
    setActiveDay(days.some((d) => d.dayKey === todayKey) ? todayKey : "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  useEffect(() => {
    const scroller = document.getElementById("match-scroller");
    if (scroller) scroller.scrollTop = 0;
  }, []);

  useEffect(() => {
    const scroller = document.getElementById("match-scroller");
    if (!scroller) return;

    let rafId = 0;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (pillScrollLock.current) return;
        const scrollerTop = scroller.getBoundingClientRect().top;
        const threshold = scrollerTop + 72;
        let hit = "";
        sectionRefs.current.forEach((el, key) => {
          if (el.getBoundingClientRect().top <= threshold) hit = key;
        });
        if (hit) setActiveDay(hit);
      });
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [days]);

  const handleDaySelect = useCallback((dayKey: string) => {
    setActiveDay(dayKey);
    pillScrollLock.current = true;
    clearTimeout(pillScrollTimer.current);

    const scroller = document.getElementById("match-scroller");
    const el = sectionRefs.current.get(dayKey);
    if (el && scroller) {
      const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 4;
      scroller.scrollTo({ top, behavior: "smooth" });

      const unlock = () => {
        clearTimeout(pillScrollTimer.current);
        pillScrollLock.current = false;
      };
      scroller.addEventListener("scrollend", unlock, { once: true });
      // Fallback for browsers without scrollend
      pillScrollTimer.current = setTimeout(unlock, 1400);
    }
  }, []);

  const setRef = useCallback((dayKey: string, el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(dayKey, el);
    else sectionRefs.current.delete(dayKey);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* ── Top section: header + filter + DateRail ── */}
      <div className="shrink-0">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-4 lg:px-6 lg:py-5">
          <div>
            <h1 className="mct-title text-2xl font-bold">Match Center</h1>
            <p className="mct-date text-[11px] font-medium mt-1 uppercase tracking-wide">
              {istHeaderDate()}
            </p>
          </div>
          {/* Filter button */}
          <button
            ref={filterBtnRef}
            onClick={() => setFilterOpen((v) => !v)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all glass${hasFilter ? " mct-my-chip--active" : ""}`}
          >
            <Icon name="sliders" size={13} />
            Filter
            {hasFilter && <span className="mct-filter-dot" />}
          </button>
        </div>

        <DateRail days={days} activeDay={activeDay} onSelect={handleDaySelect} />
      </div>

      {/* Scrollable area */}
      <div
        id="match-scroller"
        className="flex-1 overflow-y-auto hide-scrollbar"
      >
        <LiveCarousel liveMatches={liveMatches} nextMatch={nextMatch} />

        {nextMatch && (
          <div className="px-4 pt-1 pb-4">
            <p className="mct-next-up-label text-xs font-semibold mb-2">Next Up</p>
            <HeroCardWithCountdown match={nextMatch} />
          </div>
        )}

        {/* Empty state */}
        {hasFilter && days.length === 0 && (
          <div className="mct-empty flex flex-col items-center gap-2 pt-16 text-center px-8">
            <Icon name="search" size={32} />
            <p className="mct-empty-msg text-sm font-medium">No matches found</p>
            <p className="text-xs">Try a different filter</p>
          </div>
        )}

        {/* Day sections */}
        {days.map(({ dayKey, label, matches: dayMatches }) => {
          const subGroups = daySubGroups(dayMatches);
          return (
            <section
              key={dayKey}
              data-day={dayKey}
              ref={(el) => setRef(dayKey, el)}
              className="px-4 pt-5 pb-2 mct-snap-section"
            >
              {/* Day header */}
              <div className="flex items-center mb-4">
                <h2 className="mct-day-heading text-sm font-semibold">
                  {label}
                </h2>
              </div>

              {/* Sub-groups by group/round */}
              {subGroups.map(({ label: groupLabel, matches: groupMatches }) => (
                <div key={groupLabel} className="mb-5">
                  <p className="mct-group-label text-[10px] font-semibold uppercase tracking-widest mb-2">
                    {groupLabel}
                  </p>
                  <motion.div
                    className="grid grid-cols-1 lg:grid-cols-2 gap-2"
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.05 }}
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                  >
                    {groupMatches.map((m) => (
                      <motion.div key={m.id} variants={itemVariants}>
                        <MatchCard match={m} variant="row" />
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              ))}
            </section>
          );
        })}

        <div style={{ minHeight: "60dvh" }} />
      </div>

      {/* Filter sheet */}
      {filterOpen && (
        <FilterSheet
          applied={activeFilter}
          onApply={setActiveFilter}
          onClose={() => setFilterOpen(false)}
          hasFavourites={favorites.length > 0}
          anchorRef={filterBtnRef}
        />
      )}
    </div>
  );
}

import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTeams } from "../hooks/useTeams";
import { useMergedMatches } from "../hooks/useMergedMatches";
import { useGroupStandings } from "../hooks/useGroupStandings";
import { useSquad } from "../hooks/useSquad";
import { useFavoritesStore } from "../store/favoritesSlice";
import type { Player } from "../types";
import FlagImg from "../components/FlagImg";
import MatchCard from "../components/MatchCard";
import PlayerDrawer from "../components/PlayerDrawer";
import Icon from "../components/Icon";
import "../styles/teamdetail.css";
import "../styles/groups.css";

type Tab = "matches" | "squad" | "standings";
type PositionFilter = "All" | "Goalkeeper" | "Defender" | "Midfielder" | "Forward";
const POSITION_FILTERS: PositionFilter[] = ["All", "Goalkeeper", "Defender", "Midfielder", "Forward"];

export default function TeamDetail(): React.ReactElement {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const teamsMap = useTeams();
  const allMatches = useMergedMatches();

  const teamName = name ? decodeURIComponent(name) : "";
  const team = teamsMap.get(teamName);
  const isFav = useFavoritesStore((s) => s.isFav(teamName));
  const toggle = useFavoritesStore((s) => s.toggle);

  const [activeTab, setActiveTab] = useState<Tab>("matches");
  const [tabsSticky, setTabsSticky] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const matchesRef = useRef<HTMLElement>(null);
  const squadRef   = useRef<HTMLElement>(null);
  const standingsRef = useRef<HTMLElement>(null);

  const groupMatches = useMemo(
    () =>
      allMatches
        .filter((m) => m.group !== null && (m.home.name === teamName || m.away.name === teamName))
        .sort((a, b) => new Date(a.kickoffUTC).getTime() - new Date(b.kickoffUTC).getTime()),
    [allMatches, teamName]
  );

  const standings   = useGroupStandings(team?.group ?? "", allMatches);
  const squadGroups = useSquad(teamName);
  const [posFilter, setPosFilter] = useState<PositionFilter>("All");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(
    (location.state as { openPlayer?: Player } | null)?.openPlayer ?? null
  );

  const filteredSquad = useMemo(() =>
    posFilter === "All"
      ? squadGroups
      : squadGroups.filter((g) => g.position === posFilter),
    [squadGroups, posFilter]
  );

  const handlePosFilter = useCallback((p: PositionFilter) => {
    setPosFilter(p);
  }, []);

  // Show tab bar background only when hero has scrolled out of view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([entry]) => setTabsSticky(!entry.isIntersecting),
      { root: scrollRef.current, threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  // Track active tab based on scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const containerTop = el.getBoundingClientRect().top;
      const tabBarHeight = tabBarRef.current?.offsetHeight ?? 48;
      const threshold = containerTop + tabBarHeight + 8;
      const refs: [Tab, React.RefObject<HTMLElement>][] = [
        ["standings", standingsRef],
        ["squad", squadRef],
        ["matches", matchesRef],
      ];
      for (const [tab, ref] of refs) {
        if (!ref.current) continue;
        if (ref.current.getBoundingClientRect().top <= threshold) {
          setActiveTab(tab);
          break;
        }
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTab = (tab: Tab) => {
    setActiveTab(tab);
    const refMap: Record<Tab, React.RefObject<HTMLElement>> = {
      matches: matchesRef,
      squad: squadRef,
      standings: standingsRef,
    };
    const section = refMap[tab].current;
    const container = scrollRef.current;
    const tabBar = tabBarRef.current;
    if (!section || !container) return;
    const tabBarHeight = tabBar?.offsetHeight ?? 48;
    const sectionTop = section.getBoundingClientRect().top;
    const containerTop = container.getBoundingClientRect().top;
    const scrollTarget = container.scrollTop + (sectionTop - containerTop) - tabBarHeight - 16;
    container.scrollTo({ top: scrollTarget, behavior: "smooth" });
  };

  if (!team) {
    return (
      <div className="flex items-center justify-center h-full">
        <p style={{ color: "var(--meta-text)" }}>Team not found</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "matches", label: "Matches" },
    { key: "squad", label: "Squad" },
    { key: "standings", label: "Standings" },
  ];

  return (
    <>
    <motion.div
      className="td-root flex flex-col h-full"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: [0.32, 0, 0.67, 0] }}
    >
      {/* Topbar */}
      <div className="td-topbar shrink-0 flex items-center px-4 pt-5 pb-3 gap-2">
        <button
          onClick={() => navigate(-1)}
          className="td-back-btn flex items-center justify-center rounded-full"
          aria-label="Back"
        >
          <Icon name="chevron-left" size={20} />
        </button>
        <span className="td-topbar-title font-semibold">Teams</span>
        <span className="flex-1" />
        <button
          onClick={() => toggle(team.name)}
          className={`td-fav-btn flex items-center justify-center rounded-full${isFav ? " td-fav-btn--active" : ""}`}
          aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
        >
          <Icon name={isFav ? "heart-filled" : "heart"} size={18} />
        </button>
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto hide-scrollbar">

        {/* Hero */}
        <div
          className="td-hero flex flex-col items-center gap-3 py-8 px-6"
          style={{ "--td-team-color": team.color } as React.CSSProperties}
        >
          <div className="td-flag-ring flex items-center justify-center rounded-full overflow-hidden">
            <FlagImg iso={team.iso} name={team.name} size={72} />
          </div>
          <h1 className="td-hero-name text-2xl font-bold text-center leading-tight">{team.name}</h1>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="td-badge-group text-xs font-bold px-3 py-1 rounded-full">
              Group {team.group}
            </span>
            {team.fifaRank && (
              <span className="td-badge-rank text-xs font-semibold px-3 py-1 rounded-full">
                FIFA #{team.fifaRank}
              </span>
            )}
          </div>
          {/* Sentinel — triggers tab bar background when hero scrolls away */}
          <div ref={sentinelRef} style={{ height: 1 }} />
        </div>

        {/* Sticky tabs */}
        <div ref={tabBarRef} className={`td-tabs-bar sticky top-0 z-10 flex gap-1 px-4 py-2${tabsSticky ? " td-tabs-bar--stuck" : ""}`}>
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => scrollToTab(key)}
              className={`td-tab flex-1 py-1.5 text-sm font-semibold transition-all${activeTab === key ? " td-tab--active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6 px-4 pt-6" style={{ paddingBottom: "70dvh" }}>

          {/* Matches */}
          <section ref={matchesRef}>
            <p className="td-section-label">Group Stage</p>
            {groupMatches.length > 0 ? (
              <div className="flex flex-col gap-2">
                {groupMatches.map((m) => (
                  <MatchCard key={m.id} match={m} variant="row" />
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--meta-text)" }}>No matches scheduled</p>
            )}
          </section>

          {/* Squad */}
          <section ref={squadRef}>
            {/* Position filter tabs */}
            <div className="td-pos-tabs hide-scrollbar">
              {POSITION_FILTERS.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePosFilter(p)}
                  className={`td-pos-tab shrink-0${posFilter === p ? " td-pos-tab--active" : ""}`}
                >
                  {p === "All" ? "Full squad" : `${p}s`}
                </button>
              ))}
            </div>

            {squadGroups.length > 0 ? (
              <div className="flex flex-col gap-3 mt-4">
                {filteredSquad.map((group) => (
                  <div key={group.position} className="glass rounded-[var(--r)] overflow-hidden">
                    {/* Position group header */}
                    <div className="td-pos-group-header">
                      <span className="td-pos-group-title">{group.position}s</span>
                      <span className="td-pos-group-age">Age</span>
                    </div>
                    {/* Players */}
                    {group.players.map((player: Player, pi) => (
                      <div
                        key={player.fifaId ?? player.number}
                        className={`td-player-row td-player-row--tap${pi < group.players.length - 1 ? " td-player-row--bordered" : ""}`}
                        onClick={() => setSelectedPlayer(player)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") setSelectedPlayer(player); }}
                      >
                        {/* Photo */}
                        <div className="td-player-photo-wrap">
                          {player.photo ? (
                            <img
                              src={player.photo}
                              alt={player.name}
                              className="td-player-photo"
                              loading="lazy"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="td-player-photo-fallback flex items-center justify-center">
                              <Icon name="shirt" size={16} />
                            </div>
                          )}
                        </div>
                        {/* Name + jersey + club */}
                        <div className="flex-1 min-w-0">
                          <p className="td-player-name">
                            {player.name}
                            {player.number !== null && (
                              <span className="td-player-jersey-inline">#{player.number}</span>
                            )}
                          </p>
                          {player.club && (
                            <p className="td-player-club">{player.club}</p>
                          )}
                        </div>
                        {/* Age */}
                        <span className="td-player-age">{player.age ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm mt-4" style={{ color: "var(--meta-text)" }}>Squad not available</p>
            )}
          </section>

          {/* Standings */}
          <section ref={standingsRef}>
            <p className="td-section-label">Group {team.group} Standings</p>
            <div className="gs-table glass rounded-[var(--r)]">
              <div className="gs-header">
                <span className="gs-header-center">#</span>
                <span>Team</span>
                <span className="gs-header-center">MP</span>
                <span className="gs-header-center">W</span>
                <span className="gs-header-center">D</span>
                <span className="gs-header-center">L</span>
                <span className="gs-header-center">GD</span>
                <span className="gs-header-center">Pts</span>
              </div>
              {standings.map((row, i) => {
                const isQ = i < 2;
                const rankCls = i === 0 ? "rank--1" : i === 1 ? "rank--2" : "rank--low";
                const ptsCls  = i === 0 ? "pts--1"  : i === 1 ? "pts--2"  : "pts--low";
                const played  = row.w + row.d + row.l;
                const isLast  = i === standings.length - 1;
                const isThis  = row.name === teamName;
                return (
                  <div
                    key={row.name}
                    className={`gs-row${isQ ? " gs-row--qualify" : ""}${isLast ? "" : " gs-row--bordered"}${isThis ? " td-row--this" : ""}`}
                  >
                    <span className={`gs-rank ${rankCls}`}>{i + 1}</span>
                    <div className="gs-team-row">
                      <FlagImg iso={row.iso} name={row.name} size={22} />
                      <span className={`gs-team-name truncate${isThis ? " td-team-name--this" : isQ ? " gs-team-name--qualify" : " gs-team-name--normal"}`}>
                        {row.name}
                      </span>
                    </div>
                    {played === 0 ? (
                      <>
                        <span className="gs-stat gs-cell-center gs-stat--dim">0</span>
                        <span className="gs-stat gs-cell-center gs-stat--dim">—</span>
                        <span className="gs-stat gs-cell-center gs-stat--dim">—</span>
                        <span className="gs-stat gs-cell-center gs-stat--dim">—</span>
                        <span className="gs-stat gs-cell-center gs-stat--dim">—</span>
                        <span className={`gs-pts gs-cell-center ${ptsCls}`}>0</span>
                      </>
                    ) : (
                      <>
                        <span className="gs-stat gs-cell-center gs-stat--text">{played}</span>
                        <span className="gs-stat gs-cell-center gs-stat--text">{row.w}</span>
                        <span className="gs-stat gs-cell-center gs-stat--text">{row.d}</span>
                        <span className="gs-stat gs-cell-center gs-stat--text">{row.l}</span>
                        <span className="gs-stat gs-cell-center gs-stat--meta">
                          {row.gd > 0 ? `+${row.gd}` : row.gd}
                        </span>
                        <span className={`gs-pts gs-cell-center ${ptsCls}`}>{row.pts}</span>
                      </>
                    )}
                  </div>
                );
              })}
              <div className="gs-legend">
                <span className="gs-legend-dot" />
                <span className="gs-legend-text">Top 2 advance</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
    <PlayerDrawer player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </>
  );
}

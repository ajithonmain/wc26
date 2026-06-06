import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useMatches } from "../hooks/useMatches";
import { useGroupStandings } from "../hooks/useGroupStandings";
import FlagImg from "../components/FlagImg";
import MatchCard from "../components/MatchCard";
import type { Match } from "../types";
import "../styles/groups.css";

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"] as const;

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.32, 0, 0.67, 0] as const } },
};

// ─── Standings table ──────────────────────────────────────────────────────────

function GroupStandings({ group, matches }: { group: string; matches: Match[] }): React.ReactElement {
  const rows = useGroupStandings(group, matches);

  return (
    <div className="gs-table glass rounded-[var(--r)]">
      {/* Header row */}
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

      {rows.map((row, i) => {
        const isQ = i < 2;
        const rankCls = i === 0 ? "rank--1" : i === 1 ? "rank--2" : "rank--low";
        const ptsCls  = i === 0 ? "pts--1"  : i === 1 ? "pts--2"  : "pts--low";
        const played = row.w + row.d + row.l;
        const isLast = i === rows.length - 1;
        return (
          <div
            key={row.name}
            className={`gs-row${isQ ? " gs-row--qualify" : ""}${isLast ? "" : " gs-row--bordered"}`}
          >
            <span className={`gs-rank ${rankCls}`}>{i + 1}</span>
            <div className="gs-team-row">
              <FlagImg iso={row.iso} name={row.name} size={22} />
              <span className={`gs-team-name truncate${isQ ? " gs-team-name--qualify" : " gs-team-name--normal"}`}>
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
                <span className="gs-stat gs-cell-center gs-stat--meta">{row.gd > 0 ? `+${row.gd}` : row.gd}</span>
                <span className={`gs-pts gs-cell-center ${ptsCls}`}>{row.pts}</span>
              </>
            )}
          </div>
        );
      })}

      {/* Q legend */}
      <div className="gs-legend">
        <span className="gs-legend-dot" />
        <span className="gs-legend-text">Top 2 advance</span>
      </div>
    </div>
  );
}

// ─── Group match row ──────────────────────────────────────────────────────────

function GroupMatches({ group, matches }: { group: string; matches: Match[] }): React.ReactElement {
  const groupMatches = useMemo(
    () => matches.filter((m) => m.group === group).sort((a, b) => new Date(a.kickoffUTC).getTime() - new Date(b.kickoffUTC).getTime()),
    [group, matches]
  );

  if (groupMatches.length === 0) return <></>;

  const byMatchday = useMemo(() => {
    const map = new Map<number, Match[]>();
    groupMatches.forEach((m) => {
      const dayKey = Math.floor(new Date(m.kickoffUTC).getTime() / 86_400_000);
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey)!.push(m);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([, ms], i) => ({ label: `Matchday ${i + 1}`, matches: ms }));
  }, [groupMatches]);

  return (
    <div className="flex flex-col gap-4">
      {byMatchday.map(({ label, matches: dayMatches }) => (
        <div key={label}>
          <p className="gs-matchday-label">
            {label}
          </p>
          <div className="flex flex-col gap-2">
            {dayMatches.map((m) => (
              <motion.div key={m.id} variants={itemVariants}>
                <MatchCard match={m} variant="row" />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

const DUMMY_FT: Match[] = [
  {
    id: -10, kickoffUTC: "2026-06-11T19:00:00Z", venue: "SoFi Stadium", city: "Los Angeles",
    round: "Group Stage - Matchday", group: "A", status: "FT", placeholder: false,
    home: { name: "Mexico", slot: "Mexico", iso: "mx" },
    away: { name: "South Africa", slot: "South Africa", iso: "za" },
    score: { home: 2, away: 1 },
  },
  {
    id: -11, kickoffUTC: "2026-06-12T02:00:00Z", venue: "AT&T Stadium", city: "Dallas",
    round: "Group Stage - Matchday", group: "A", status: "FT", placeholder: false,
    home: { name: "South Korea", slot: "South Korea", iso: "kr" },
    away: { name: "Czechia", slot: "Czechia", iso: "cz" },
    score: { home: 1, away: 1 },
  },
  {
    id: -12, kickoffUTC: "2026-06-18T16:00:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta",
    round: "Group Stage - Matchday", group: "A", status: "FT", placeholder: false,
    home: { name: "South Africa", slot: "South Africa", iso: "za" },
    away: { name: "South Korea", slot: "South Korea", iso: "kr" },
    score: { home: 0, away: 2 },
  },
];

export default function Groups(): React.ReactElement {
  const [selected, setSelected] = useState<string>("A");
  const rawMatches = useMatches();

  const allMatches = useMemo(() => {
    const overrideIds = new Set(DUMMY_FT.map((m) => m.id));
    const realIds = new Set(rawMatches.map((m) => m.id));
    return [
      ...rawMatches.filter((m) => !overrideIds.has(m.id)),
      ...DUMMY_FT.filter((m) => !realIds.has(m.id)),
    ].sort((a, b) => new Date(a.kickoffUTC).getTime() - new Date(b.kickoffUTC).getTime());
  }, [rawMatches]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-5 pb-4 lg:px-6 lg:pt-6">
        <h1 className="groups-title text-2xl font-bold">Groups</h1>
        <p className="groups-subtitle text-xs mt-0.5">
          12 groups · 48 teams · Group stage
        </p>
      </div>

      {/* Group selector pills */}
      <div className="shrink-0 px-4 pb-4 lg:px-6">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {GROUPS.map((g) => {
            const isActive = g === selected;
            return (
              <button
                key={g}
                onClick={() => setSelected(g)}
                className={`groups-pill shrink-0 transition-all duration-150${isActive ? " groups-pill--active" : ""}`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Group content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-8 lg:px-6">
        <motion.div
          key={selected}
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="flex flex-col gap-6"
        >
          {/* Standings */}
          <motion.div variants={itemVariants}>
            <p className="groups-section-label">
              Standings
            </p>
            <GroupStandings group={selected} matches={allMatches} />
          </motion.div>

          {/* Matches */}
          <motion.div variants={itemVariants}>
            <p className="groups-section-label">
              Matches
            </p>
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
            >
              <GroupMatches group={selected} matches={allMatches} />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

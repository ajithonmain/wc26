import { useState, useEffect } from "react";
import { useMatches } from "../hooks/useMatches";
import { useNextMatch } from "../hooks/useNextMatch";
import { useGroupStandings } from "../hooks/useGroupStandings";
import { useLiveMatches } from "../hooks/useLiveMatches";
import { istTimeParts } from "../lib/matchUtils";
import { countdownTo } from "../lib/time";
import FlagImg from "./FlagImg";
import type { Match } from "../types";
import "../styles/rightrail.css";

const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"] as const;

// ─── Live pill ────────────────────────────────────────────────────────────────

function LivePill({ match }: { match: Match }): React.ReactElement {
  const parts: string[] = ["LIVE"];
  if (match.minute) parts.push(`${match.minute}'`);
  if (match.status === "LIVE") parts.push("· 2ND HALF");
  if (match.status === "HT") parts.push("· HT");
  return (
    <span className="rr-live-pill inline-flex items-center">
      <span
        className="rr-live-dot animate-pulse"
        aria-hidden="true"
      />
      {parts.join(" ")}
    </span>
  );
}

// ─── Live card ────────────────────────────────────────────────────────────────

function LiveCard({ match }: { match: Match }): React.ReactElement {
  const hg = match.score.home ?? 0;
  const ag = match.score.away ?? 0;
  const label = match.group ? `GROUP ${match.group}` : match.round.toUpperCase();

  return (
    <div className="glass live-pulse overflow-hidden rr-live-card">
      {/* LIVE pill */}
      <div className="rr-live-pill-wrap">
        <LivePill match={match} />
      </div>

      {/* Teams + score */}
      <div className="rr-live-grid">
        {/* Home */}
        <div className="rr-live-team-col">
          <img
            src={`https://flagcdn.com/w160/${match.home.iso}.png`}
            alt={match.home.name}
            className="rr-live-flag"
          />
          <span className="rr-live-team-name">{match.home.name}</span>
        </div>

        {/* Score */}
        <div className="rr-live-score-wrap">
          <div className="rr-live-score">
            {hg}–{ag}
          </div>
          <div className="rr-live-half">
            {match.status === "HT" ? "HALF TIME" : "2ND HALF"}
          </div>
        </div>

        {/* Away */}
        <div className="rr-live-team-col">
          <img
            src={`https://flagcdn.com/w160/${match.away.iso}.png`}
            alt={match.away.name}
            className="rr-live-flag"
          />
          <span className="rr-live-team-name">{match.away.name}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="rr-live-footer">
        <span className="rr-live-events">
          {match.events ?? ""}
        </span>
        <span className="rr-live-label">
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Inline countdown ─────────────────────────────────────────────────────────

function InlineCountdown({ kickoffUTC }: { kickoffUTC: string }): React.ReactElement {
  const [cd, setCd] = useState(() => countdownTo(kickoffUTC));

  useEffect(() => {
    if (cd.done) return;
    const id = setInterval(() => setCd(countdownTo(kickoffUTC)), 1000);
    return () => clearInterval(id);
  }, [kickoffUTC, cd.done]);

  if (cd.done) {
    return <span className="rr-cd-live">LIVE</span>;
  }

  const display = cd.d > 0
    ? `${cd.d}:${String(cd.h).padStart(2, "0")}:${String(cd.m).padStart(2, "0")}`
    : `${String(cd.h).padStart(2, "0")}:${String(cd.m).padStart(2, "0")}:${String(cd.s).padStart(2, "0")}`;

  return (
    <span className="rr-cd-value">
      {display}
    </span>
  );
}

// ─── Standings ────────────────────────────────────────────────────────────────

function StandingsTable({ group }: { group: string }): React.ReactElement {
  const matches = useMatches();
  const rows = useGroupStandings(group, matches);

  return (
    <div>
      <div className="rr-st-header">
        <span className="rr-st-header-center">#</span>
        <span>Team</span>
        <span className="rr-st-header-center">GD</span>
        <span className="rr-st-header-center">Pts</span>
      </div>

      {rows.map((row, i) => {
        const isTop = i < 2;
        const rankCls = i === 0 ? "rank--1" : i === 1 ? "rank--2" : "rank--low";
        const ptsCls  = i === 0 ? "pts--1"  : i === 1 ? "pts--2"  : "pts--low";
        return (
          <div key={row.name} className="rr-st-row">
            <span className={`rr-st-rank ${rankCls}`}>{i + 1}</span>
            <div className={`rr-st-team ${isTop ? "fw--top" : "fw--low"}`}>
              <FlagImg iso={row.iso} name={row.name} size={20} />
              <span className="rr-st-team-name truncate">{row.name}</span>
            </div>
            <span className="rr-st-gd">{row.gd > 0 ? `+${row.gd}` : row.gd}</span>
            <span className={`rr-st-pts ${ptsCls}`}>{row.pts}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Next Up card ─────────────────────────────────────────────────────────────

function NextUpCard(): React.ReactElement {
  const matches = useMatches();
  const next = useNextMatch(matches);

  if (!next) {
    return <p className="rr-no-upcoming">No upcoming matches</p>;
  }

  const { hm, ampm } = istTimeParts(next.kickoffUTC);

  const TeamSlot = ({ iso, name }: { iso: string | null | undefined; name: string }): React.ReactElement => (
    <div className="rr-nextup-team">
      <img
        src={`https://flagcdn.com/w160/${iso}.png`}
        alt={name}
        className="rr-nextup-flag"
      />
      <span className="rr-nextup-team-name">
        {name}
      </span>
    </div>
  );

  return (
    <div className="rr-nextup-card">
      <p className="rr-nextup-label">
        Kicks Off In
      </p>

      <div className="rr-nextup-body">
        <TeamSlot iso={next.home.iso} name={next.home.name} />

        <div className="rr-nextup-center">
          <InlineCountdown kickoffUTC={next.kickoffUTC} />
          <span className="rr-nextup-meta">{hm} {ampm}</span>
        </div>

        <TeamSlot iso={next.away.iso} name={next.away.name} />
      </div>
    </div>
  );
}

// ─── Right Rail ───────────────────────────────────────────────────────────────

export default function RightRail(): React.ReactElement {
  const [selectedGroup, setSelectedGroup] = useState<string>("A");
  const allMatches = useMatches();
  const liveMatches = useLiveMatches(allMatches);

  const cycleGroup = (): void => {
    const idx = GROUPS.indexOf(selectedGroup as typeof GROUPS[number]);
    setSelectedGroup(GROUPS[(idx + 1) % GROUPS.length]);
  };

  return (
    <aside className="rr-aside flex flex-col h-full overflow-y-auto hide-scrollbar">
      {/* ── Live Now ── */}
      {liveMatches.length > 0 && (
        <div className="rr-live-section">
          <div className="rr-section-hd">
            <h4 className="rr-section-title">Live Now</h4>
            {liveMatches.length > 1 && (
              <span className="rr-live-count">{liveMatches.length} matches</span>
            )}
          </div>
          {liveMatches.map((m) => <LiveCard key={m.id} match={m} />)}
          <div className="rr-divider" />
        </div>
      )}

      {/* ── Standings ── */}
      <div className="rr-section">
        <div className="rr-section-hd">
          <h4 className="rr-section-title">Standings</h4>
          <button
            onClick={cycleGroup}
            className="rr-group-btn glass flex items-center gap-1.5"
            aria-label={`Showing Group ${selectedGroup}, tap to cycle`}
          >
            Group {selectedGroup}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
        <StandingsTable group={selectedGroup} />
      </div>

      {/* Divider */}
      <div className="rr-divider" />

      {/* ── Next Up ── */}
      <div>
        <h4 className="rr-section-title rr-next-up-title">Next Up</h4>
        <NextUpCard />
      </div>
    </aside>
  );
}

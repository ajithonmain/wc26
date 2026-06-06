import { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { useMatches } from "../hooks/useMatches";
import { istTimeParts } from "../lib/matchUtils";
import FlagImg from "../components/FlagImg";
import Icon from "../components/Icon";
import type { Match } from "../types";
import "../styles/knockout.css";

// ─── Bracket geometry ─────────────────────────────────────────────────────────

const CARD_H = 88;
const GAP    = 10;
const UNIT   = CARD_H + GAP; // desktop

const MOBILE_UNIT = 116; // 88px card + 28px gap — more breathing room on mobile

function cardTop(matchIndex: number, roundIndex: number, windowStart: number): number {
  return (matchIndex + 0.5) * UNIT * Math.pow(2, roundIndex - windowStart) - CARD_H / 2;
}

// Mobile: selected round is always 1×, right neighbours 2×/4×/8×
function mobileCardTop(matchIndex: number, roundIndex: number, selectedIdx: number): number {
  const exp = Math.max(0, roundIndex - selectedIdx);
  return (matchIndex + 0.5) * MOBILE_UNIT * Math.pow(2, exp) - CARD_H / 2;
}

// ─── Round config ─────────────────────────────────────────────────────────────

const ROUNDS = [
  { key: "Round of 32",    short: "R32",          label: "Round of 32",    count: 16 },
  { key: "Round of 16",    short: "R16",          label: "Round of 16",    count: 8  },
  { key: "Quarter-final",  short: "QF",           label: "Quarter-finals", count: 4  },
  { key: "Semi-final",     short: "SF",           label: "Semi-finals",    count: 2  },
  { key: "Final",          short: "Final",        label: "Final",          count: 1  },
] as const;

const COL_LABEL_H = 44; // px reserved for round label + top breathing room

const DESKTOP_COLS = 3;
const MOBILE_COL_VW = 62; // % of viewport width each column occupies

// ─── Dummy FT data ────────────────────────────────────────────────────────────

const DUMMY_KO: Partial<Match>[] = [
  { id: 9073, status: "FT", placeholder: false, score: { home: 2, away: 1 },
    home: { name: "Mexico", slot: "Mexico", iso: "mx" },
    away: { name: "South Africa", slot: "South Africa", iso: "za" } },
  { id: 9074, status: "FT", placeholder: false, score: { home: 1, away: 3 },
    home: { name: "South Korea", slot: "South Korea", iso: "kr" },
    away: { name: "France", slot: "France", iso: "fr" } },
  { id: 9075, status: "FT", placeholder: false, score: { home: 0, away: 2 },
    home: { name: "USA", slot: "USA", iso: "us" },
    away: { name: "Brazil", slot: "Brazil", iso: "br" } },
  { id: 9076, status: "FT", placeholder: false, score: { home: 1, away: 1 },
    penaltyScore: { home: 3, away: 5 },
    home: { name: "Germany", slot: "Germany", iso: "de" },
    away: { name: "Argentina", slot: "Argentina", iso: "ar" } },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayName(name: string, placeholder: boolean): string {
  if (!placeholder) return name;
  if (name.startsWith("W ") || name.startsWith("Winner") || name.startsWith("Loser")) return "TBD";
  return name;
}

// ─── Bracket card ─────────────────────────────────────────────────────────────

function BracketCard({ match }: { match: Match }): React.ReactElement {
  const isFT   = match.status === "FT";
  const isLive = match.status === "LIVE" || match.status === "HT";
  const isPen  = isFT && !!match.penaltyScore;
  const hg = match.score.home ?? null;
  const ag = match.score.away ?? null;
  const hp = match.penaltyScore?.home ?? null;
  const ap = match.penaltyScore?.away ?? null;
  const homeWins = isFT && (isPen ? (hp !== null && ap !== null && hp > ap) : (hg !== null && ag !== null && hg > ag));
  const awayWins = isFT && (isPen ? (hp !== null && ap !== null && ap > hp) : (hg !== null && ag !== null && ag > hg));

  const { hm, ampm } = istTimeParts(match.kickoffUTC);
  const dateStr = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short",
  }).format(new Date(match.kickoffUTC));

  const badge = isLive
    ? <span className="bc-badge-live">LIVE</span>
    : isFT
    ? <span className="bc-badge-ft">{isPen ? "FT (P)" : "FT"}</span>
    : <span className="bc-badge-time">{hm} {ampm}</span>;

  const TeamRow = ({ iso, name, score, penScore, winner, loser, placeholder }: {
    iso?: string | null; name: string; score: number | null; penScore?: number | null;
    winner: boolean; loser: boolean; placeholder: boolean;
  }): React.ReactElement => {
    const nameClass = [
      "bc-team-name",
      placeholder ? "bc-team-name--placeholder" : winner ? "bc-team-name--winner" : loser ? "bc-team-name--loser" : "",
    ].filter(Boolean).join(" ");
    const scoreClass = ["bc-team-score", loser ? "bc-team-score--loser" : ""].filter(Boolean).join(" ");

    return (
      <div className="bc-team">
        {placeholder
          ? <span className="bc-team-shield" />
          : <FlagImg iso={iso} name={name} size={20} />
        }
        <span className={nameClass}>{displayName(name, placeholder)}</span>
        {score !== null && (
          <span className={scoreClass}>
            {score}{penScore !== null && penScore !== undefined ? ` (${penScore})` : ""}
          </span>
        )}
        {winner && <span className="bc-team-arrow">◀</span>}
      </div>
    );
  };

  return (
    <div className="glass bc">
      <div className="bc-header">
        <span className="bc-date">{dateStr}</span>
        {badge}
      </div>
      <div className="bc-teams">
        <TeamRow iso={match.home.iso} name={match.home.name} score={hg} penScore={hp}
          winner={homeWins} loser={awayWins} placeholder={match.placeholder} />
        <TeamRow iso={match.away.iso} name={match.away.name} score={ag} penScore={ap}
          winner={awayWins} loser={homeWins} placeholder={match.placeholder} />
      </div>
    </div>
  );
}

// ─── Desktop round column ─────────────────────────────────────────────────────

function RoundColumn({ roundKey, roundIndex, windowStart, matches, containerH }: {
  roundKey: string; roundIndex: number; windowStart: number;
  matches: Match[]; containerH: number;
}): React.ReactElement {
  const roundMatches = useMemo(
    () => matches.filter((m) => m.round === roundKey).sort((a, b) => a.id - b.id),
    [roundKey, matches]
  );

  return (
    <div className="bracket-col" style={{ height: containerH }}>
      {roundMatches.map((match, i) => (
        <div key={match.id} className="bracket-card-slot" style={{ top: cardTop(i, roundIndex, windowStart) }}>
          <BracketCard match={match} />
        </div>
      ))}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function Knockout(): React.ReactElement {
  const rawMatches = useMatches();

  const allMatches = useMemo(() => {
    const overrides = new Map(DUMMY_KO.map((d) => [d.id!, d]));
    return rawMatches.map((m) => overrides.has(m.id) ? { ...m, ...overrides.get(m.id) } : m);
  }, [rawMatches]);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [scrollKey, setScrollKey] = useState(0); // increments on every tab tap, even same round
  const programmaticScrollRef = useRef(false); // guard to prevent onScroll interference during programmatic scroll

  // Desktop window
  const windowStart   = selectedIdx;
  const visibleRounds = ROUNDS.slice(windowStart, windowStart + DESKTOP_COLS);
  const containerH = ROUNDS[windowStart].count * UNIT; // desktop: shrinks with window

  // Mobile: use actual match count so empty rounds don't leave dead space
  const mobileContainerH = useMemo(() => {
    const actual = allMatches.filter((m) => m.round === ROUNDS[selectedIdx].key).length;
    return Math.max(actual, 1) * MOBILE_UNIT;
  }, [allMatches, selectedIdx]);
  const canPrev       = selectedIdx > 0;
  const canNext       = selectedIdx < ROUNDS.length - 1;

  // Mobile scroll refs
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const selectedIdxRef = useRef(selectedIdx);

  // Sync ref before paint so onScroll always reads latest value
  useLayoutEffect(() => { selectedIdxRef.current = selectedIdx; }, [selectedIdx]);

  // Scroll to selected column + first card after every tab tap.
  // scrollKey increments on every click (even same tab), triggering this effect.
  useLayoutEffect(() => {
    const scroll = mobileScrollRef.current;
    if (!scroll) return;
    // Set flag to prevent onScroll listener from interfering
    programmaticScrollRef.current = true;
    scroll.scrollLeft = 0;
    scroll.scrollTop = 0; // scroll to top to show the label
    // Reset flag after a microtask so onScroll events are properly ignored
    setTimeout(() => { programmaticScrollRef.current = false; }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey]);

  // Sync active tab when user swipes right into a future round
  useEffect(() => {
    const scroll = mobileScrollRef.current;
    if (!scroll) return;
    const onScroll = () => {
      if (programmaticScrollRef.current) return; // ignore programmatic scrolls
      const left = scroll.scrollLeft;
      const base = selectedIdxRef.current;
      let nearest = base;
      let minDist = Infinity;
      colRefs.current.forEach((el, idx) => {
        if (idx < base) return; // hidden columns, skip
        const dist = Math.abs(el.offsetLeft - left);
        if (dist < minDist) { minDist = dist; nearest = idx; }
      });
      if (nearest !== selectedIdxRef.current) setSelectedIdx(nearest);
    };
    scroll.addEventListener("scroll", onScroll, { passive: true });
    return () => scroll.removeEventListener("scroll", onScroll);
  }, []);

  const thirdPlace = useMemo(
    () => allMatches.find((m) => m.round === "Third-place Play-off"),
    [allMatches]
  );

  const navBtn = (dir: "prev" | "next"): React.ReactElement => {
    const isPrev = dir === "prev";
    const enabled = isPrev ? canPrev : canNext;
    return (
      <button
        onClick={() => setSelectedIdx((s) => s + (isPrev ? -1 : 1))}
        disabled={!enabled}
        className={`bracket-nav-btn glass flex items-center justify-center rounded-full shrink-0${enabled ? " bracket-nav-btn--enabled" : " bracket-nav-btn--disabled"}`}
      >
        <Icon name={isPrev ? "chevron-left" : "chevron-right"} size={13} />
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-5 pb-3 lg:px-6 lg:pt-6">
        <h1 className="knockout-title text-2xl font-bold">Knockout</h1>
        <p className="knockout-subtitle text-xs mt-0.5">32 teams · 6 rounds · Single elimination</p>
      </div>

      {/* ── Mobile tab nav ── */}
      <div className="lg:hidden shrink-0 flex overflow-x-auto hide-scrollbar gap-2 px-4 pb-4">
        {ROUNDS.map((r, i) => (
          <button
            key={r.key}
            onClick={() => { setSelectedIdx(i); setScrollKey((k) => k + 1); }}
            className={`bracket-nav-tab shrink-0${selectedIdx === i ? " bracket-nav-tab--active" : ""}`}
          >
            {r.short}
          </button>
        ))}
      </div>

      {/* ── Desktop tab nav ── */}
      <div className="hidden lg:flex shrink-0 px-4 pb-4 items-center gap-3">
        {navBtn("prev")}
        <div className="flex flex-1">
          {visibleRounds.map((r, i) => (
            <button
              key={r.key}
              onClick={() => setSelectedIdx(ROUNDS.findIndex((x) => x.key === r.key))}
              className={`bracket-nav-label${i === 0 ? " bracket-nav-label--active" : ""}`}
            >
              {r.short}
            </button>
          ))}
        </div>
        {navBtn("next")}
      </div>

      {/* ── Mobile: horizontal-scroll bracket (1.5 cols visible) ── */}
      <div
        ref={mobileScrollRef}
        className="lg:hidden flex-1 overflow-x-auto overflow-y-auto hide-scrollbar ko-mobile-scroll ml-4"
      >
        {/* All 5 rounds side by side — same tree spacing as desktop (windowStart=0) */}
        <div
          className="flex gap-3 pt-2 pb-8 w-max"
          style={{ height: mobileContainerH + COL_LABEL_H + 24 }}
        >
          {ROUNDS.map((r, i) => {
            const isLast = i === ROUNDS.length - 1;
            const roundMatches = allMatches
              .filter((m) => m.round === r.key)
              .sort((a, b) => a.id - b.id);
            return (
              <div
                key={r.key}
                ref={(el) => { if (el) colRefs.current.set(i, el); }}
                className={`ko-mobile-col bracket-col${isLast ? " ko-col-last" : ""}`}
                style={{
                  height: mobileContainerH + COL_LABEL_H,
                  display: i < selectedIdx ? "none" : undefined,
                }}
              >
                <span className="ko-col-label">{r.label}</span>
                {roundMatches.map((match, j) => (
                  <div
                    key={match.id}
                    className="bracket-card-slot"
                    style={{ top: mobileCardTop(j, i, selectedIdx) + COL_LABEL_H }}
                  >
                    <BracketCard match={match} />
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Third-place Play-off on mobile — shows when Final (last round) is selected */}
        {thirdPlace && selectedIdx === ROUNDS.length - 1 && (
          <div className="ko-mobile-col bracket-col w-[66vw] shrink-0">
            <span className="ko-col-label">Third-place Play-off</span>
            <div className="bracket-card-slot" style={{ top: COL_LABEL_H + 12 }}>
              <BracketCard match={thirdPlace} />
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop: windowed bracket ── */}
      <div className="hidden lg:block flex-1 overflow-y-auto hide-scrollbar px-4 pb-6">
        <div className="bracket-row" style={{ height: containerH }}>
          {visibleRounds.map((r) => {
            const roundIndex = ROUNDS.findIndex((x) => x.key === r.key);
            return (
              <RoundColumn
                key={r.key}
                roundKey={r.key}
                roundIndex={roundIndex}
                windowStart={windowStart}
                matches={allMatches}
                containerH={containerH}
              />
            );
          })}
        </div>

        {thirdPlace && (
          <div className="bracket-third-wrap">
            <p className="bracket-third-label">Third-place Play-off</p>
            <div className="bracket-third-card">
              <BracketCard match={thirdPlace} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

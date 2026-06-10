import { useState, useEffect } from "react";
import type { Match } from "../types";
import { timeParts } from "../lib/matchUtils";
import { useUIStore } from "../store/uiSlice";
import { countdownTo } from "../lib/time";
import { useAlertsStore } from "../store/alertsSlice";
import FlagImg from "./FlagImg";
import ActionSheet from "./ActionSheet";
import Icon from "./Icon";
import "../styles/matchcard.css";

export type MatchCardVariant = "row" | "hero" | "compact";

interface MatchCardProps {
  match: Match;
  variant?: MatchCardVariant;
  children?: React.ReactNode;
}

// ─── atoms ─────────────────────────────────────────────────────────────────

function LivePill({ match }: { match: Match }): React.ReactElement | null {
  if (match.status !== "LIVE" && match.status !== "HT") return null;
  const parts: string[] = ["LIVE"];
  if (match.minute) parts.push(`${match.minute}'`);
  if (match.status === "LIVE") parts.push("· 2nd Half");
  if (match.status === "HT") parts.push("· HT");
  return (
    <span className="mc-live-pill inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
      {parts.join(" ")}
    </span>
  );
}

function FTBadge(): React.ReactElement {
  return (
    <span className="mc-ft-badge inline-flex items-center px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
      FT
    </span>
  );
}

function PSTBadge(): React.ReactElement {
  return (
    <span className="mc-pst-badge inline-flex items-center px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
      PST
    </span>
  );
}

// ─── row variant ─────────────────────────────────────────────────────────────

function RowCard({ match }: { match: Match }): React.ReactElement {
  const tz = useUIStore((s) => s.timezone);
  const isLive = match.status === "LIVE";
  const isHT = match.status === "HT";
  const isScored = isLive || isHT || match.status === "FT";
  const isFT = match.status === "FT";
  const { hm, period, abbr } = timeParts(match.kickoffUTC, tz);
  const isAlerting = useAlertsStore((s) => s.isAlerting(match.id));
  const [showSheet, setShowSheet] = useState(false);

  const hg = match.score.home ?? 0;
  const ag = match.score.away ?? 0;
  const homeWins = isFT && hg > ag;
  const awayWins = isFT && ag > hg;

  return (
    <div className={`glass rounded-[16px] overflow-hidden${isLive ? " live-pulse" : ""}`}>
      <div className="mc-row-inner">
        {/* ── Left: teams (+ inline scores for FT/LIVE) ── */}
        <div className="mc-row-left flex flex-col justify-center gap-2">
          {/* Home */}
          <div className="flex items-center gap-2">
            <FlagImg iso={match.home.iso} name={match.home.name} size={20} />
            <div className="flex-1 min-w-0">
              <span className="mc-row-team-name block truncate">{match.home.name}</span>
              {match.home.fifaCode && match.home.name.length > 14 && (
                <span className="mc-row-fifa-code">{match.home.fifaCode}</span>
              )}
            </div>
            {isScored && (
              <span className={`mc-row-score font-tabular shrink-0 ml-2${isFT ? (homeWins ? " mc-row-score--winner" : " mc-row-score--loser") : ""}`}>
                {hg}
              </span>
            )}
          </div>

          {/* Away */}
          <div className="flex items-center gap-2">
            <FlagImg iso={match.away.iso} name={match.away.name} size={20} />
            <div className="flex-1 min-w-0">
              <span className="mc-row-team-name block truncate">{match.away.name}</span>
              {match.away.fifaCode && match.away.name.length > 14 && (
                <span className="mc-row-fifa-code">{match.away.fifaCode}</span>
              )}
            </div>
            {isScored && (
              <span className={`mc-row-score font-tabular shrink-0 ml-2${isFT ? (awayWins ? " mc-row-score--winner" : " mc-row-score--loser") : ""}`}>
                {ag}
              </span>
            )}
          </div>
        </div>

        {/* ── Right: time or status ── */}
        <div className="mc-row-right flex flex-col items-center justify-center">
          {isLive || isHT ? (
            <LivePill match={match} />
          ) : match.status === "PST" || match.status === "CANC" ? (
            <PSTBadge />
          ) : isFT ? (
            <>
              <span className="mc-row-time font-tabular">{hm}</span>
              <span className="mc-row-ampm">FT</span>
            </>
          ) : (
            <>
              <span className="mc-row-time font-tabular">{hm} {period}</span>
              <span className="mc-row-ampm">{abbr}</span>
            </>
          )}

          {/* Bell — only for upcoming/live matches */}
          {!match.placeholder && match.status !== "FT" && match.status !== "PST" && match.status !== "CANC" && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowSheet(true); }}
              className={`flex items-center justify-center rounded-full transition-colors mt-2.5${isAlerting ? " mc-row-bell--active" : " mc-row-bell"}`}
              aria-label="Match actions"
            >
              <Icon name={isAlerting ? "bell-filled" : "bell"} size={15} />
            </button>
          )}
        </div>
      </div>

      {showSheet && <ActionSheet match={match} onClose={() => setShowSheet(false)} />}
    </div>
  );
}

// ─── hero variant ─────────────────────────────────────────────────────────────

function HeroCard({
  match,
  children,
}: {
  match: Match;
  children?: React.ReactNode;
}): React.ReactElement {
  const tz = useUIStore((s) => s.timezone);
  const isLive = match.status === "LIVE";
  const isHT = match.status === "HT";
  const isScored = isLive || isHT || match.status === "FT";
  const { hm, ampm } = timeParts(match.kickoffUTC, tz);

  const hg = match.score.home ?? 0;
  const ag = match.score.away ?? 0;

  const footerParts: string[] = [];
  if (match.group) footerParts.push(`Group ${match.group}`);
  else footerParts.push(match.round);
  if (match.venue) {
    const loc = match.city ? `${match.venue}, ${match.city}` : match.venue;
    footerParts.push(loc);
  }
  footerParts.push(`${hm} ${ampm} kickoff`);
  const footer = footerParts.join(" · ");

  const livePill = (isLive || isHT) ? (
    <span className="mc-hero-live-pill inline-flex items-center gap-1.5">
      <span className="mc-hero-live-dot animate-pulse" aria-hidden="true" />
      Live
    </span>
  ) : null;

  const [elapsed, setElapsed] = useState(() => (match.minute ?? 0) * 60);
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isLive]);
  const elapsedMins = Math.floor(elapsed / 60);
  const elapsedSecs = elapsed % 60;
  const elapsedStr = `${String(elapsedMins).padStart(2, "0")}:${String(elapsedSecs).padStart(2, "0")}`;

  const timePill = (isLive || isHT) ? (
    <span className="mc-pill">
      {isHT ? "HT" : elapsedStr}
    </span>
  ) : null;

  return (
    <div className="mc-hero-wrap">
      {/* Top pill — on card edge */}
      {livePill && (
        <div className="mc-hero-pill-top">
          {livePill}
        </div>
      )}

      <div className={`glass rounded-[var(--r-lg)]${isLive ? " live-pulse" : ""}`}>

        {/* Main: home · score · away */}
        <div className={`mc-hero-main${isLive || isHT ? " mc-hero-main--live" : " mc-hero-main--static"}`}>
          {/* Home */}
          <div className="mc-hero-team-col flex flex-col items-center gap-1.5 shrink-0">
            <FlagImg iso={match.home.iso} name={match.home.name} size={76} />
            <span className="mc-hero-team-name text-sm font-bold text-center leading-tight w-full">
              {match.home.name}
            </span>
            {match.home.fifaRank != null && (
              <span className="mc-hero-sub-rank text-[10px]">FIFA #{match.home.fifaRank}</span>
            )}
          </div>

          {/* Center: score + minute or kickoff time */}
          <div className="flex-1 flex flex-col items-center gap-0.5 px-2">
            {isScored ? (
              <>
                <div className="mc-hero-score font-tabular font-black leading-none">
                  <span>{hg}</span>
                  <span>—</span>
                  <span>{ag}</span>
                </div>
                {!isLive && !isHT && <FTBadge />}
              </>
            ) : (
              <>
                <span className="mc-hero-time-big font-tabular font-bold leading-none">
                  {hm}
                </span>
                <span className="mc-hero-ampm text-xs font-medium">{ampm}</span>
              </>
            )}
          </div>

          {/* Away */}
          <div className="mc-hero-team-col flex flex-col items-center gap-1.5 shrink-0">
            <FlagImg iso={match.away.iso} name={match.away.name} size={76} />
            <span className="mc-hero-team-name text-sm font-bold text-center leading-tight w-full">
              {match.away.name}
            </span>
            {match.away.fifaRank != null && (
              <span className="mc-hero-sub-rank text-[10px]">FIFA #{match.away.fifaRank}</span>
            )}
          </div>
        </div>

        {/* Goalscorer events — two columns */}
        {match.events && (() => {
          const [homeBlob = "", awayBlob = ""] = match.events.split("|");
          const homeGoals = homeBlob.split(/[,;]/).map(e => e.trim()).filter(Boolean);
          const awayGoals = awayBlob.split(/[,;]/).map(e => e.trim()).filter(Boolean);
          return (
            <div className="mc-hero-events grid px-5 pb-4 pt-3 gap-x-4">
              <div className="flex flex-col gap-1">
                {homeGoals.map((g, i) => (
                  <span key={i} className="mc-hero-event-text">{g}</span>
                ))}
              </div>
              <div className="flex flex-col gap-1 items-end text-right">
                {awayGoals.map((g, i) => (
                  <span key={i} className="mc-hero-event-text">{g}</span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Bottom spacing for live time pill */}
        {(isLive || isHT) && <div className="mc-hero-live-spacer" />}

        {/* Footer — only for non-live states */}
        {!isLive && !isHT && (
          <div className="mc-hero-footer px-5 pb-4 pt-2 text-center">
            {footer}
          </div>
        )}

        {children}
      </div>

      {/* Bottom pill — on card edge */}
      {timePill && (
        <div className="mc-hero-pill-bottom">
          {timePill}
        </div>
      )}
    </div>
  );
}

// ─── compact variant (right rail) ────────────────────────────────────────────

function CompactCard({ match }: { match: Match }): React.ReactElement {
  const tz = useUIStore((s) => s.timezone);
  const isScored = match.status === "LIVE" || match.status === "HT" || match.status === "FT";
  const { hm } = timeParts(match.kickoffUTC, tz);
  const hg = match.score.home ?? 0;
  const ag = match.score.away ?? 0;
  const homeWins = isScored && hg > ag;
  const awayWins = isScored && ag > hg;

  return (
    <div className="glass rounded-[var(--r-sm)] overflow-hidden">
      <div className="flex items-stretch">
        <div className="mc-compact-left flex-1 flex flex-col gap-1.5 px-3 py-2.5 min-w-0">
          <div className="flex items-center gap-2">
            <FlagImg iso={match.home.iso} name={match.home.name} size={18} />
            <span className={`text-xs font-semibold flex-1 truncate${isScored && !homeWins ? " mc-compact-team-name--dim" : " mc-compact-team-name--default"}`}>
              {match.home.name}
            </span>
            {isScored && (
              <span className={`mc-compact-score font-tabular font-bold text-xs shrink-0 ml-1${homeWins ? " mc-compact-score--winner" : " mc-compact-score--loser"}`}>
                {hg}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FlagImg iso={match.away.iso} name={match.away.name} size={18} />
            <span className={`text-xs font-semibold flex-1 truncate${isScored && !awayWins ? " mc-compact-team-name--dim" : " mc-compact-team-name--default"}`}>
              {match.away.name}
            </span>
            {isScored && (
              <span className={`mc-compact-score font-tabular font-bold text-xs shrink-0 ml-1${awayWins ? " mc-compact-score--winner" : " mc-compact-score--loser"}`}>
                {ag}
              </span>
            )}
          </div>
        </div>
        <div className="mc-compact-right flex flex-col items-center justify-center px-3 shrink-0 gap-0.5">
          {isScored ? (
            match.status === "FT" ? (
              <FTBadge />
            ) : (
              <span className="mc-compact-live-label">LIVE</span>
            )
          ) : (
            <span className="mc-compact-time font-tabular font-bold text-sm">
              {hm}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── public exports ───────────────────────────────────────────────────────────

export default function MatchCard({
  match,
  variant = "row",
  children,
}: MatchCardProps): React.ReactElement {
  if (variant === "hero") return <HeroCard match={match}>{children}</HeroCard>;
  if (variant === "compact") return <CompactCard match={match} />;
  return <RowCard match={match} />;
}

export { HeroCard };

// ─── Next Up hero card — horizontal single-row layout ─────────────────────────

export function HeroCardWithCountdown({ match }: { match: Match }): React.ReactElement {
  const tz = useUIStore((s) => s.timezone);
  const { hm, ampm } = timeParts(match.kickoffUTC, tz);
  const [cd, setCd] = useState(() => countdownTo(match.kickoffUTC));

  useEffect(() => {
    if (cd.done) return;
    const id = setInterval(() => setCd(countdownTo(match.kickoffUTC)), 1000);
    return () => clearInterval(id);
  }, [match.kickoffUTC, cd.done]);

  const units = [
    { v: cd.d, lbl: "D" },
    { v: cd.h, lbl: "H" },
    { v: cd.m, lbl: "M" },
    { v: cd.s, lbl: "S" },
  ];

  return (
    <div className="mc-hero-wrap">
      {/* Top pill — kickoff time on card edge */}
      <div className="mc-hero-pill-top">
        <span className="mc-pill">{hm} {ampm}</span>
      </div>

      <div className="glass rounded-[var(--r-lg)] overflow-hidden">

        {/* ── Mobile: teams row on top, countdown below ── */}
        <div className="lg:hidden flex flex-col items-center gap-4 px-5 pt-6 pb-5">
          <div className="flex items-start justify-center gap-10 w-full">
            {[match.home, match.away].map((team) => (
              <div key={team.name} className="flex flex-col items-center gap-1.5" style={{ width: 90 }}>
                <FlagImg iso={team.iso} name={team.name} size={76} />
                <span className="mc-hero-team-name text-sm font-bold text-center leading-tight w-full">
                  {team.name}
                </span>
                {team.fifaRank != null && (
                  <span className="mc-hero-sub-rank text-[10px]">FIFA #{team.fifaRank}</span>
                )}
              </div>
            ))}
          </div>
          {!cd.done && (
            <div className="mc-cd-units">
              {units.map(({ v, lbl }, i) => (
                <div key={lbl} className="flex items-center mc-cd-unit-gap">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="mc-cd-unit-value">{String(v).padStart(2, "0")}</span>
                    <span className="mc-cd-unit-label">{lbl}</span>
                  </div>
                  {i < units.length - 1 && <span className="mc-cd-sep">:</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Desktop: same horizontal layout as HeroCard ── */}
        <div className="hidden lg:flex items-center justify-between px-6 pt-6 pb-4">
          <div className="mc-hero-team-col flex flex-col items-center gap-1.5 shrink-0">
            <FlagImg iso={match.home.iso} name={match.home.name} size={76} />
            <span className="mc-hero-team-name text-sm font-bold text-center leading-tight w-full">
              {match.home.name}
            </span>
            {match.home.fifaRank != null && (
              <span className="mc-hero-sub-rank text-[10px]">FIFA #{match.home.fifaRank}</span>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-2 px-2">
            {!cd.done && (
              <div className="mc-cd-units">
                {units.map(({ v, lbl }, i) => (
                  <div key={lbl} className="flex items-center mc-cd-unit-gap">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="mc-cd-unit-value">{String(v).padStart(2, "0")}</span>
                      <span className="mc-cd-unit-label">{lbl}</span>
                    </div>
                    {i < units.length - 1 && <span className="mc-cd-sep">:</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mc-hero-team-col flex flex-col items-center gap-1.5 shrink-0">
            <FlagImg iso={match.away.iso} name={match.away.name} size={76} />
            <span className="mc-hero-team-name text-sm font-bold text-center leading-tight w-full">
              {match.away.name}
            </span>
            {match.away.fifaRank != null && (
              <span className="mc-hero-sub-rank text-[10px]">FIFA #{match.away.fifaRank}</span>
            )}
          </div>
        </div>

      </div>

      {/* Bottom pill — venue on card edge */}
      {match.venue && (
        <div className="mc-hero-pill-bottom">
          <span className="mc-pill">
            {match.venue}{match.city ? `, ${match.city}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTeams } from "../hooks/useTeams";
import squadsData from "../data/squads.json";
import type { Team, Player } from "../types";
import FlagImg from "./FlagImg";
import Icon from "./Icon";
import "../styles/search.css";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

interface PlayerResult {
  player: Player;
  teamName: string;
  team: Team | undefined;
}

function matches(haystack: string, query: string): boolean {
  const h = haystack.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return false;
  // Match full string or last-name portion (handles "L. Messi" → matches "messi")
  const lastPart = h.split(" ").pop() ?? h;
  return h.includes(q) || lastPart.includes(q);
}

function score(name: string, query: string): number {
  const n = name.toLowerCase();
  const q = query.toLowerCase().trim();
  if (n.startsWith(q)) return 2;
  if (n.includes(q)) return 1;
  return 0;
}

export default function SearchOverlay({ open, onClose }: SearchOverlayProps): React.ReactElement {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const teamsMap = useTeams();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const teamResults = useMemo((): Team[] => {
    if (!query.trim()) return [];
    return Array.from(teamsMap.values())
      .filter((t) => !t.placeholder && matches(t.name, query))
      .sort((a, b) => score(b.name, query) - score(a.name, query))
      .slice(0, 5);
  }, [query, teamsMap]);

  const playerResults = useMemo((): PlayerResult[] => {
    if (!query.trim()) return [];
    const results: PlayerResult[] = [];
    for (const [teamName, players] of Object.entries(squadsData as Record<string, Player[]>)) {
      for (const player of players) {
        if (matches(player.name, query)) {
          results.push({ player, teamName, team: teamsMap.get(teamName) });
        }
      }
    }
    return results
      .sort((a, b) => score(b.player.name, query) - score(a.player.name, query))
      .slice(0, 10);
  }, [query, teamsMap]);

  const goToTeam = (teamName: string) => {
    navigate(`/teams/${encodeURIComponent(teamName)}`);
    onClose();
  };

  const goToPlayer = (teamName: string, player: Player) => {
    navigate(`/teams/${encodeURIComponent(teamName)}`, { state: { openPlayer: player } });
    onClose();
  };

  const hasResults = teamResults.length > 0 || playerResults.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="sr-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="sr-sheet"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
          {/* Search bar */}
          <div className="sr-bar" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
            <div className="sr-input-wrap">
              <Icon name="search" size={16} />
              <input
                ref={inputRef}
                className="sr-input"
                placeholder="Search teams or players..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {query && (
                <button onClick={() => setQuery("")} style={{ color: "var(--meta-text)" }}>
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
            <button className="sr-cancel" onClick={onClose}>Cancel</button>
          </div>

          {/* Results */}
          <div className="sr-body">
            {!hasQuery && (
              <div className="sr-prompt">
                <Icon name="search" size={28} />
                <p className="sr-empty-msg">Search teams or players</p>
                <p className="sr-empty-sub">Try "Brazil", "Messi" or "Goalkeeper"</p>
              </div>
            )}

            {hasQuery && !hasResults && (
              <div className="sr-empty">
                <Icon name="search" size={28} />
                <p className="sr-empty-msg">No results for "{query}"</p>
                <p className="sr-empty-sub">Try a last name or team name</p>
              </div>
            )}

            {teamResults.length > 0 && (
              <>
                <p className="sr-section-label">Teams</p>
                {teamResults.map((team) => (
                  <div key={team.name} className="sr-team-row" onClick={() => goToTeam(team.name)}>
                    <FlagImg iso={team.iso} name={team.name} size={28} />
                    <span className="sr-team-name">{team.name}</span>
                    <span className="sr-team-meta">Group {team.group}</span>
                  </div>
                ))}
              </>
            )}

            {playerResults.length > 0 && (
              <>
                <p className="sr-section-label">Players</p>
                {playerResults.map(({ player, teamName, team }) => (
                  <div key={`${teamName}-${player.id}`} className="sr-player-row" onClick={() => goToPlayer(teamName, player)}>
                    {player.photo ? (
                      <img
                        src={player.photo}
                        alt={player.name}
                        className="sr-player-photo"
                        loading="lazy"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="sr-player-photo-fallback">
                        <Icon name="shirt" size={14} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="sr-player-name">{player.name}</p>
                      <p className="sr-player-meta">{player.position} · {teamName}</p>
                    </div>
                    {team && <FlagImg iso={team.iso} name={teamName} size={18} />}
                  </div>
                ))}
              </>
            )}
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

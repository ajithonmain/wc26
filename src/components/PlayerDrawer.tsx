import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Player } from "../types";
import Icon from "./Icon";
import "../styles/playerdrawer.css";

interface PlayerDrawerProps {
  player: Player | null;
  onClose: () => void;
}

export default function PlayerDrawer({ player, onClose }: PlayerDrawerProps): React.ReactElement {
  useEffect(() => {
    if (!player) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [player, onClose]);

  useEffect(() => {
    document.body.style.overflow = player ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [player]);

  return (
    <AnimatePresence>
      {player && (
        <>
          {/* Backdrop */}
          <motion.div
            className="pd-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="pd-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="pd-handle" />

            {/* Hero */}
            <div className="pd-hero">
              {player.photo ? (
                <img
                  src={player.photo}
                  alt={player.name}
                  className="pd-photo"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="pd-photo-fallback">
                  <Icon name="shirt" size={32} />
                </div>
              )}

              <p className="pd-name">{player.name}</p>

              <div className="pd-badges">
                {player.number !== null && (
                  <span className="pd-number">#{player.number}</span>
                )}
                <span className="pd-position">{player.position}</span>
              </div>

              {player.club && (
                <p className="pd-club">{player.club}</p>
              )}
            </div>

            {/* Stats */}
            <div className="pd-stats">
              <div className="pd-stat">
                <span className="pd-stat-value">{player.caps ?? "—"}</span>
                <span className="pd-stat-label">Caps</span>
              </div>
              <div className="pd-stat">
                <span className="pd-stat-value">{player.intlGoals ?? "—"}</span>
                <span className="pd-stat-label">Intl Goals</span>
              </div>
              <div className="pd-stat">
                <span className="pd-stat-value">{player.age ?? "—"}</span>
                <span className="pd-stat-label">Age</span>
              </div>
            </div>

            {/* Physical */}
            {(player.height || player.weight) && (
              <div className="pd-physical">
                {player.height && (
                  <div className="pd-phys-item">
                    <span className="pd-phys-value">{player.height} cm</span>
                    <span className="pd-phys-label">Height</span>
                  </div>
                )}
                {player.weight && (
                  <div className="pd-phys-item">
                    <span className="pd-phys-value">{player.weight} kg</span>
                    <span className="pd-phys-label">Weight</span>
                  </div>
                )}
              </div>
            )}

            {/* Attribution */}
            <p className="pd-attribution">Data: FIFA World Cup 2026™</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

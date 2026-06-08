import { useMemo } from "react";
import squadsData from "../data/squads.json";
import type { Player, PlayerPosition } from "../types";

const POSITION_ORDER: PlayerPosition[] = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

export interface SquadGroup {
  position: PlayerPosition;
  players: Player[];
}

export const useSquad = (teamName: string): SquadGroup[] =>
  useMemo(() => {
    const raw = (squadsData as Record<string, Player[]>)[teamName] ?? [];
    const grouped = new Map<PlayerPosition, Player[]>();
    for (const pos of POSITION_ORDER) grouped.set(pos, []);
    for (const player of raw) {
      const pos = player.position as PlayerPosition;
      grouped.get(pos)?.push(player);
    }
    return POSITION_ORDER
      .map((pos) => ({ position: pos, players: grouped.get(pos) ?? [] }))
      .filter((g) => g.players.length > 0);
  }, [teamName]);

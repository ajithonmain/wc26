export type MatchStatus = "NS" | "LIVE" | "HT" | "FT" | "PST" | "CANC";

export type Round =
  | "Group Stage - Matchday"
  | "Round of 32"
  | "Round of 16"
  | "Quarter-final"
  | "Semi-final"
  | "Third-place Play-off"
  | "Final";

export interface TeamSlot {
  name: string;
  slot: string;
  iso?: string | null;
  color?: string;
  fifaRank?: number | null;
  fifaCode?: string | null;
}

export interface Match {
  id: number;
  kickoffUTC: string;
  venue: string | null;
  city: string | null;
  round: Round;
  group: string | null;
  status: MatchStatus;
  minute?: number | null;
  home: TeamSlot;
  away: TeamSlot;
  score: { home: number | null; away: number | null };
  penaltyScore?: { home: number | null; away: number | null };
  placeholder: boolean;
  events?: string | null; // goalscorer string from live overlay, e.g. "Vinícius 23' · Rapinha 51'"
}

export interface Team {
  name: string;
  iso: string;
  flag: string | null;
  group: string;
  fifaRank: number | null;
  color: string;
  placeholder: boolean;
  fifaCode?: string;
}

export type PlayerPosition = "Goalkeeper" | "Defender" | "Midfielder" | "Forward";

export interface Player {
  id: number | null;
  fifaId?: string | null;
  name: string;
  number: number | null;
  position: PlayerPosition;
  age: number | null;
  caps: number;
  intlGoals: number;
  club: string;
  height: number | null;
  weight: number | null;
  photo: string | null;
}

export interface Stadium {
  name: string;
  city: string;
  country: string;
  capacity: number;
  fifaName: string;
}

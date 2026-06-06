// Server-side only — runs inside Cloud Function, never in the browser.
// Keys come from Firebase Functions config: providers.apifootball_key, etc.

export type MatchStatus = "NS" | "LIVE" | "HT" | "FT" | "PST" | "CANC";

export interface LiveSnapshot {
  id: number;
  status: MatchStatus;
  minute: number | null;
  score: { home: number | null; away: number | null };
}

// ─── normalizers ───────────────────────────────────────────────────────────

function normalizeApiFootballStatus(s: string): MatchStatus {
  const map: Record<string, MatchStatus> = {
    NS: "NS", "1H": "LIVE", HT: "HT", "2H": "LIVE",
    ET: "LIVE", P: "LIVE", FT: "FT", AET: "FT",
    PEN: "FT", PST: "PST", CANC: "CANC", SUSP: "PST",
    INT: "LIVE", ABD: "CANC", AWD: "FT", WO: "FT",
    LIVE: "LIVE",
  };
  return map[s] ?? "NS";
}

function normalizeFootballDataStatus(s: string): MatchStatus {
  const map: Record<string, MatchStatus> = {
    SCHEDULED: "NS", TIMED: "NS", IN_PLAY: "LIVE", PAUSED: "HT",
    FINISHED: "FT", POSTPONED: "PST", CANCELLED: "CANC", SUSPENDED: "PST",
  };
  return map[s] ?? "NS";
}

// ─── Provider 1: API-Football ───────────────────────────────────────────────
// One call with live=all returns ALL live matches — no per-match call needed.

async function fromApiFootball(key: string): Promise<LiveSnapshot[]> {
  const url = "https://v3.football.api-sports.io/fixtures?live=all";
  const resp = await fetch(url, {
    headers: { "x-apisports-key": key },
    signal: AbortSignal.timeout(8000),
  });
  if (!resp.ok) throw new Error(`API-Football ${resp.status}`);
  const data = (await resp.json()) as {
    response: Array<{
      fixture: { id: number; status: { elapsed: number | null; short: string } };
      goals: { home: number | null; away: number | null };
    }>;
  };
  return data.response.map((r) => ({
    id: r.fixture.id,
    status: normalizeApiFootballStatus(r.fixture.status.short),
    minute: r.fixture.status.elapsed ?? null,
    score: { home: r.goals.home, away: r.goals.away },
  }));
}

// ─── Provider 2: Highlightly ────────────────────────────────────────────────
// Endpoint: https://api.highlightly.net/v1/matches/live
// Returns live match list; each has external_ids.api_football_id for join.

async function fromHighlightly(key: string): Promise<LiveSnapshot[]> {
  const url = "https://api.highlightly.net/v1/matches/live";
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!resp.ok) throw new Error(`Highlightly ${resp.status}`);
  const data = (await resp.json()) as {
    data: Array<{
      external_ids?: { api_football_id?: number };
      status: string;
      minute?: number | null;
      score?: { home?: number | null; away?: number | null };
    }>;
  };
  const results: LiveSnapshot[] = [];
  for (const m of data.data) {
    const id = m.external_ids?.api_football_id;
    if (!id) continue;
    results.push({
      id,
      status: normalizeApiFootballStatus(m.status),
      minute: m.minute ?? null,
      score: { home: m.score?.home ?? null, away: m.score?.away ?? null },
    });
  }
  return results;
}

// ─── Provider 3: football-data.org ──────────────────────────────────────────
// Endpoint: https://api.football-data.org/v4/matches?status=LIVE,IN_PLAY,PAUSED
// Note: match IDs here differ from API-Football — we match by teams+date as fallback.
// For Phase 4, we only overlay score/status/minute for IDs we already know.

async function fromFootballData(key: string): Promise<LiveSnapshot[]> {
  const url =
    "https://api.football-data.org/v4/competitions/WC/matches?status=IN_PLAY,PAUSED";
  const resp = await fetch(url, {
    headers: { "X-Auth-Token": key },
    signal: AbortSignal.timeout(8000),
  });
  if (!resp.ok) throw new Error(`football-data.org ${resp.status}`);
  const data = (await resp.json()) as {
    matches: Array<{
      id: number;
      status: string;
      minute?: number | null;
      score: {
        fullTime: { home: number | null; away: number | null };
        halfTime: { home: number | null; away: number | null };
      };
    }>;
  };
  // football-data IDs are its own namespace — we tag them negative to avoid
  // collisions and the Cloud Function will attempt a best-effort merge by
  // this tag. Phase 5 can build a proper ID map if needed.
  return data.matches.map((m) => ({
    id: -(m.id), // negative sentinel — caller handles
    status: normalizeFootballDataStatus(m.status),
    minute: m.minute ?? null,
    score: {
      home: m.score.fullTime.home ?? m.score.halfTime.home,
      away: m.score.fullTime.away ?? m.score.halfTime.away,
    },
  }));
}

// ─── Public API ─────────────────────────────────────────────────────────────

export interface ProviderKeys {
  apiFootball: string;
  highlightly: string;
  footballData: string;
}

/**
 * Tries providers in order; returns the first successful non-empty result.
 * Falls back to the next provider on error or empty response.
 * All calls use native fetch (Node 18+).
 */
export async function getLive(keys: ProviderKeys): Promise<LiveSnapshot[]> {
  const providers: Array<() => Promise<LiveSnapshot[]>> = [
    () => fromApiFootball(keys.apiFootball),
    () => fromHighlightly(keys.highlightly),
    () => fromFootballData(keys.footballData),
  ];

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      const result = await provider();
      // football-data fallback may have negative IDs — filter them out if
      // positive-ID providers already gave us data.
      const positive = result.filter((r) => r.id > 0);
      if (positive.length > 0) return positive;
      // If provider returned something but only negative IDs, treat as empty
      // and try next. If it's the last provider, return empty.
    } catch (err) {
      errors.push(String(err));
    }
  }

  // All providers failed — log and return empty (app falls back to static data)
  console.warn("[liveProvider] All providers failed:", errors.join(" | "));
  return [];
}

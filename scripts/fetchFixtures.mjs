/**
 * Run ONCE to bake the static fixture list. Zero runtime API cost after this.
 *   API_FOOTBALL_KEY=xxx node scripts/fetchFixtures.mjs
 * WC 2026 = league 1, season 2026. Returns UTC timestamps already.
 */
import { writeFileSync } from "node:fs";

const KEY = process.env.API_FOOTBALL_KEY;
if (!KEY) { console.error("Set API_FOOTBALL_KEY"); process.exit(1); }

const res = await fetch(
  "https://v3.football.api-sports.io/fixtures?league=1&season=2026",
  { headers: { "x-apisports-key": KEY } }
);
const json = await res.json();
if (!json.response?.length) { console.error("Empty response", json); process.exit(1); }

const fixtures = json.response.map((f) => ({
  id: f.fixture.id,
  kickoffUTC: f.fixture.date,            // ISO UTC — render IST client-side
  venue: f.fixture.venue?.name ?? null,
  city: f.fixture.venue?.city ?? null,
  round: f.league.round,                 // "Group Stage - 1", "Round of 32", etc.
  status: f.fixture.status.short,        // NS, 1H, HT, 2H, FT...
  home: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo },
  away: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo },
  score: { home: f.goals.home, away: f.goals.away },
}));

fixtures.sort((a, b) => a.kickoffUTC.localeCompare(b.kickoffUTC));
writeFileSync("src/data/fixtures.json", JSON.stringify(fixtures, null, 2));
console.log(`Saved ${fixtures.length} fixtures`);

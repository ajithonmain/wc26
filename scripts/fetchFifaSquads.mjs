/**
 * Fetch WC2026 squad data directly from FIFA's internal API.
 * No Playwright needed — two REST calls per team.
 *
 * Single:  node scripts/fetchFifaSquads.mjs argentina
 * All:     node scripts/fetchFifaSquads.mjs --all
 */

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dir, "squads");
mkdirSync(OUT_DIR, { recursive: true });

const PAGES_BASE = "https://cxm-api.fifa.com/fifaplusweb/api/pages/en/tournaments/mens/worldcup/canadamexicousa2026/teams";
const SQUAD_BASE = "https://api.fifa.com/api/v3/teams";
const COMPETITION = 17;
const SEASON      = 285023;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Origin":     "https://www.fifa.com",
  "Referer":    "https://www.fifa.com/",
};

const TEAM_SLUGS = {
  "Mexico":               "mexico",
  "South Africa":         "south-africa",
  "South Korea":          "korea-republic",
  "Czechia":              "czechia",
  "Canada":               "canada",
  "Bosnia & Herzegovina": "bosnia-herzegovina",
  "Qatar":                "qatar",
  "Switzerland":          "switzerland",
  "Brazil":               "brazil",
  "Morocco":              "morocco",
  "Scotland":             "scotland",
  "Haiti":                "haiti",
  "United States":        "usa",
  "Paraguay":             "paraguay",
  "Australia":            "australia",
  "Türkiye":              "turkiye",
  "Germany":              "germany",
  "Curaçao":              "curacao",
  "Ivory Coast":          "cote-d-ivoire",
  "Ecuador":              "ecuador",
  "Netherlands":          "netherlands",
  "Japan":                "japan",
  "Sweden":               "sweden",
  "Tunisia":              "tunisia",
  "Belgium":              "belgium",
  "Egypt":                "egypt",
  "Iran":                 "ir-iran",
  "New Zealand":          "new-zealand",
  "Spain":                "spain",
  "Cape Verde":           "cabo-verde",
  "Saudi Arabia":         "saudi-arabia",
  "Uruguay":              "uruguay",
  "France":               "france",
  "Senegal":              "senegal",
  "Iraq":                 "iraq",
  "Norway":               "norway",
  "Argentina":            "argentina",
  "Algeria":              "algeria",
  "Austria":              "austria",
  "Jordan":               "jordan",
  "Portugal":             "portugal",
  "DR Congo":             "congo-dr",
  "Uzbekistan":           "uzbekistan",
  "Colombia":             "colombia",
  "England":              "england",
  "Croatia":              "croatia",
  "Ghana":                "ghana",
  "Panama":               "panama",
};

const POSITION_MAP = {
  "Goalkeeper": "Goalkeeper",
  "Defender":   "Defender",
  "Midfielder": "Midfielder",
  "Forward":    "Forward",
  "Attacker":   "Forward",
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function get(url) {
  const res  = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

function toTitleCase(str) {
  // "Mathew RYAN" → "Mathew Ryan"
  return str.replace(/\b\w+/g, w =>
    w === w.toUpperCase() && w.length > 1
      ? w.charAt(0) + w.slice(1).toLowerCase()
      : w
  );
}

function calcAge(birthDate) {
  if (!birthDate) return null;
  const born = new Date(birthDate);
  const now  = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age--;
  return age;
}

function parsePosition(player) {
  const loc = player.PositionLocalized?.find(l => l.Locale === "en-GB")?.Description
    ?? player.PositionLocalized?.[0]?.Description ?? "";
  return POSITION_MAP[loc] ?? loc;
}

function parseName(player) {
  const raw = player.PlayerName?.find(l => l.Locale === "en-GB")?.Description
    ?? player.PlayerName?.[0]?.Description
    ?? player.ShortName?.[0]?.Description ?? "";
  return toTitleCase(raw);
}

async function fetchTeam(teamName, slug) {
  console.log(`\n[${teamName}]`);

  // Step 1: get teamId from pages API
  const pageData = await get(`${PAGES_BASE}/${slug}/squad`);
  const teamId   = pageData.teamId;
  if (!teamId) throw new Error("No teamId in page response");
  console.log(`  teamId: ${teamId}`);

  // Step 2: fetch squad
  const squadData = await get(`${SQUAD_BASE}/${teamId}/squad?idCompetition=${COMPETITION}&idSeason=${SEASON}&language=en`);
  const raw = squadData.Players ?? [];
  console.log(`  ${raw.length} players`);

  const players = raw.map(p => ({
    fifaId:   p.IdPlayer,
    name:     parseName(p),
    number:   p.JerseyNum ?? null,
    position: parsePosition(p),
    age:      calcAge(p.BirthDate),
    height:   p.Height ?? null,
    weight:   p.Weight ?? null,
  })).sort((a, b) => (a.number ?? 99) - (b.number ?? 99));

  // Save individual file
  writeFileSync(join(OUT_DIR, `${slug}.json`), JSON.stringify({ team: teamName, teamId, players }, null, 2));
  console.log(`  Saved → squads/${slug}.json`);
  if (players[0]) console.log(`  Sample: ${players[0].name} #${players[0].number} (${players[0].position})`);

  return { teamName, players };
}

async function main() {
  const args    = process.argv.slice(2);
  const all     = args.includes("--all");
  const slugArg = args.find(a => !a.startsWith("--"));

  let teamsToRun = [];
  if (all) {
    teamsToRun = Object.entries(TEAM_SLUGS);
  } else if (slugArg) {
    const entry = Object.entries(TEAM_SLUGS).find(([, s]) => s === slugArg || slugArg === s.split("-")[0]);
    if (!entry) { console.error(`Unknown slug: ${slugArg}\nAvailable: ${Object.values(TEAM_SLUGS).join(", ")}`); process.exit(1); }
    teamsToRun = [entry];
  } else {
    console.error("Usage:\n  node fetchFifaSquads.mjs <slug>\n  node fetchFifaSquads.mjs --all");
    process.exit(1);
  }

  const allSquads = {};
  const errors    = [];

  for (const [teamName, slug] of teamsToRun) {
    try {
      const { players } = await fetchTeam(teamName, slug);
      allSquads[teamName] = players;
    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
      errors.push(teamName);
    }
    if (teamsToRun.length > 1) await sleep(1500);
  }

  // Save merged
  if (Object.keys(allSquads).length > 1) {
    writeFileSync(join(OUT_DIR, "squads_all.json"), JSON.stringify(allSquads, null, 2));
    console.log(`\nMerged → squads/squads_all.json (${Object.keys(allSquads).length} teams)`);
  }

  if (errors.length) console.log(`\nFailed: ${errors.join(", ")}`);

  // Merge into src/data/squads.json if running all
  if (all && Object.keys(allSquads).length > 0) {
    const existing = JSON.parse(readFileSync("src/data/squads.json", "utf8"));
    let enriched = 0;
    for (const [teamName, fifaPlayers] of Object.entries(allSquads)) {
      const wiki = existing[teamName] ?? [];
      const byNum = Object.fromEntries(wiki.map(p => [p.number, p]));
      existing[teamName] = fifaPlayers.map(fp => {
        const w = byNum[fp.number] ?? {};
        enriched++;
        return {
          id:         w.id ?? null,
          fifaId:     fp.fifaId,
          name:       fp.name,
          number:     fp.number,
          position:   fp.position,
          age:        fp.age,
          caps:       w.caps ?? 0,
          intlGoals:  w.intlGoals ?? 0,
          club:       w.club ?? "",
          height:     fp.height,
          weight:     fp.weight,
          photo:      w.photo ?? null,
        };
      });
    }
    writeFileSync("src/data/squads.json", JSON.stringify(existing, null, 2));
    console.log(`Patched src/data/squads.json (${enriched} players)`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });

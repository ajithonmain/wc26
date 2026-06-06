# WorldCup26 — Build Package

IST-native FIFA World Cup 2026 tracker. Everything you need to build it in Claude Code.

## What's here
- `SPEC.md` — full architecture, types, tokens, feature data flows. Source of truth.
- `CLAUDE.md` — project rules (drop in repo root; Claude Code reads it automatically).
- `CLAUDE_CODE_PROMPTS.md` — copy-paste phase prompts, in order.
- `src/data/fixtures.json` — all 104 matches, real UTC times, knockout placeholders. **Fool-proof — app works with zero API key.**
- `src/data/teams.json` — 48 teams: iso, flag URL, group, FIFA rank, color.
- `src/lib/time.ts` — IST conversion (Intl, DST-safe). Ship as-is.
- `scripts/` — data generators + optional live-fetch upgrade.

## Start sequence
1. Create a folder, drop this package in.
2. Open in Claude Code.
3. Paste the **Setup** block from `CLAUDE_CODE_PROMPTS.md`.
4. Paste **Phase 1**, review, repeat through **Phase 7**.
5. Use `/ui-review` on screenshots between phases.

## Timeline (deadline Jun 5, 8 PM IST)
- **Today:** P1-P3 (schedule + design + favorites) → already deployable, beats basic entries.
- **Tomorrow AM:** P4-P5 (live + push) → the bonus points.
- **Tomorrow PM:** P6-P7 (standings/bracket + deploy). Deploy Jun 4, Jun 5 = polish buffer.

## Keys you'll need (all free, for P4-P5)
- API-Football: dashboard.api-football.com (100/day)
- Highlightly: highlightly.net (100/day, no card)
- football-data.org: football-data.org (10/min, fallback)
- Firebase project: console.firebase.google.com (Hosting + Firestore + FCM, free Spark tier)

Provide these as env vars when you reach Phase 4; the prompt scaffolds to read them.

## Regenerate data (if needed)
```
python3 scripts/gen_teams.py
python3 scripts/gen_fixtures.py
```

## Optional: real data + logos
```
API_FOOTBALL_KEY=xxx node scripts/fetchFixtures.mjs
```
Overlays authoritative fixtures + team logos. The seed remains the guarantee.

## Verified
104 matches (72 group + 16 R32 + 8 R16 + 4 QF + 2 SF + 1 3rd + 1 Final). Opening Mexico v South Africa = 12:30 AM IST Jun 12. 34 IST match-days. 48 teams across 12 groups of 4.

# World Cup 26

> FIFA World Cup 2026™ companion app — live scores, standings, bracket, full squad explorer, player profiles and global timezone support. A premium glassmorphism PWA with no login, no account, no tracking.

**Live:** https://wc26.ajithmjose.com

---

## Why this exists

Most World Cup apps are either too basic (a plain schedule) or bloated with accounts, ads and slow load times. This was built to be the app we actually wanted to use during the tournament — fast, beautiful, works offline, no login required, no data collection.

**Core philosophy:**
- Every piece of information a fan needs is reachable in two taps or less
- The app works perfectly with zero internet connection (seed data bundled)
- No account = no friction. Favourites and alerts persist in `localStorage`
- Data is always the same shape regardless of source — live or static

---

## Features

### Match Center
The primary view. Shows all 104 matches across the full tournament.

- **Date rail** — horizontal scrollable pill list of all match days, auto-scrolls to today on load
- **Live carousel** — swipeable snap-scroll row of currently live matches at the top, with live score, match minute and goalscorer events. Disappears when no matches are live
- **Countdown card** — shows time remaining to the next kickoff with a live ticking countdown
- **Match cards** — two variants: `hero` (large, with venue + round label) and `row` (compact list). Score is always the largest element
- **FIFA codes** — long team names (Bosnia & Herzegovina, Saudi Arabia) show their 3-letter FIFA code below the name to prevent truncation
- **Status badges** — NS (not started), LIVE + minute, HT, FT, PST (postponed), CANC (cancelled)
- **Filters** — filter by status (live / upcoming / finished), by team name, or by group (A–L)
- **Match actions** — bell (set alert), calendar (add to Google Calendar), via an action sheet bottom drawer

### Global Search
Full-screen search overlay accessible from the header on mobile and the sidebar on desktop.

- Searches **48 teams** and **1,248 players** simultaneously, all in-memory — zero network calls, instant results
- **Team results** — flag, name, group badge; tap navigates to the team profile
- **Player results** — player photo, full name, position, team name and flag; tap navigates to the team profile and **automatically opens that player's detail drawer**
- Works with full official names from FIFA: "Lionel Messi", "Kylian Mbappe", "Cristiano Ronaldo"
- Matches on last name too: typing "messi" finds "Lionel Messi", "ronaldo" finds "Cristiano Ronaldo"
- On desktop: spotlight-style centered modal (620px) with blurred backdrop; clicking outside closes
- On mobile: full-screen overlay

### Team Profiles
Tap any team card to open a full-screen detail page.

- **Hero section** — large circular flag with team color glow ring, team name, Group badge, FIFA rank
- **Sticky tab bar** — three tabs (Matches · Squad · Standings) stick below the hero as you scroll. Background appears only when sticky is active (IntersectionObserver sentinel)
- **Matches tab** — all 3 group stage fixtures with live scores and alert/calendar actions
- **Squad tab** — 26 players with position filter pills (Full squad · Goalkeepers · Defenders · Midfielders · Forwards). Each player card shows: photo, full name, jersey number, club below name
- **Standings tab** — full group table (MP · W · D · L · GD · Pts) with this team's row highlighted in accent
- **Favouriting** — heart button in the topbar toggles favourite without leaving the page

### Player Detail Drawer
Tap any player row in the squad to open a bottom sheet with:

- Large circular photo (80px)
- Full official name from FIFA + jersey number badge + position pill
- Current club
- **Stats grid**: International Caps · International Goals · Age
- **Physical**: Height (cm) · Weight (kg)
- Attribution: "Data: FIFA World Cup 2026™"
- Opens automatically when navigating from search results

### Group Standings
- All 12 groups (A–L) with live standings: MP · W · D · L · GD · Pts
- Top-2 qualify indicator with green accent on qualifying positions
- Orange accent on group leaders
- Group selector pill row — cycles all 12 groups
- Desktop right rail shows the current user's selected group's standings

### Knockout Bracket
- Full bracket: R32 → R16 → QF → SF → Final + Third-place Play-off
- Desktop: horizontal tree with connector lines between rounds
- Mobile: tab-pill navigation between rounds, vertical match card list per round
- Each card shows date, time (in selected timezone), venue and team names
- Live scores and FT results update in real time when data is available

### My Teams / Favourites
- Star any of the 48 nations to mark them as favourites
- **Favourites tab** — shows only starred teams + all their upcoming and past matches grouped by day
- Favourite state persisted to `localStorage` — survives refresh, reinstall, browser restart
- Starred teams are prioritised in Match Center filters

### Alerts & Reminders
- Bell icon on every upcoming match card opens an action sheet
- **Browser reminders** — 15 min, 30 min or 1 hr before kickoff; fires a native `Notification` API alert even when tab is in background (no server required)
- **Google Calendar** — one-tap generates an `.ics`-style Google Calendar URL with venue, kickoff time and duration pre-filled
- **Alerts view** — dedicated view with upcoming / past tabs; change reminder timing per alert; clear all
- **Undo on delete** — removing an alert shows a 4-second toast with undo. If the drawer is closed before the timer fires, the delete commits immediately on unmount
- Per-alert reminder state stored in `localStorage` under `wc26:alerts`

### Timezone Switcher
- 25-city curated list covering all major football markets worldwide
- Auto-detects browser timezone on first visit
- Every surface updates reactively: match times, date rail labels, day group headers, countdown, bracket dates
- Bottom sheet on mobile; anchored floating dropdown on desktop
- Selection persisted to `localStorage`

### Progressive Web App
- `vite-plugin-pwa` with Workbox precaches all assets at build time
- Works **fully offline** — all 104 fixtures, 48 teams and 1,248 players are bundled statically
- Install prompt on Android/Chrome (native PWA install banner) and iOS (Share → Add to Home Screen)
- Auto-updates silently: checks for new service worker on every `visibilitychange` event
- Fixed bottom TabBar with `env(safe-area-inset-bottom)` — never clipped on Android gesture navigation

---

## Design System & UI/UX Rationale

### Glassmorphism — why not flat cards?
Every card, sidebar, modal and pill uses the `.glass` primitive:
```css
backdrop-filter: blur(16px);
background: rgba(255, 255, 255, 0.07);   /* dark theme */
border-top: 1px solid rgba(255,255,255,0.14);
box-shadow: 0 22px 50px rgba(0,0,0,0.5);
```
Flat opaque cards feel generic and heavy. Glass lets the gradient background breathe through, creating depth without adding visual weight. Content stays readable because blur and tint work together.

### Color system
- **Accent tangerine** `#FF6A2B` (dark) / `#FF6A2B` (light) — every other football app uses green. The tangerine accent is distinctive and energetic without being aggressive
- **Live red** `#FF4D5E` — reserved strictly for live match indicators. Never used elsewhere
- **Late-night gold** `#FFC23D` — used for top-of-standings rank highlights
- **Secondary cobalt** `#5B86FF` — used for secondary actions and alert chips
- All colors defined as CSS custom properties in `src/styles/tokens.css` — both themes share the same component markup

### Dual theme
Light and dark share identical component structure. Only CSS variables change via `data-theme` on `<html>`. No conditional class logic in components. Theme is toggled, persisted and applied before first paint (no flash).

### Typography — Geist only
- Single variable font (Geist) for the entire app — no font mixing, no serif
- **Tabular figures** (`font-variant-numeric: tabular-nums`) on all scores, times and statistics so numbers never shift layout
- Weight hierarchy: 700 for scores and primary labels, 600 for section headers, 500 for body, 400 for meta

### Score is king
The score/time is always the largest and most visually prominent element on any match card. Everything else (team names, venue, round) is secondary. This mirrors how fans actually consume match information.

### Motion — Framer Motion
- Page transitions: `x: 20 → 0` fade-in on TeamDetail (feels like a native push)
- Drawers: spring animation (`damping: 30, stiffness: 300`) — snappy, not floaty
- Match cards: stagger-in on scroll via `whileInView` with `once: true` — loads feel progressive, not jarring
- All animations respect `prefers-reduced-motion` via Framer's defaults

### Mobile-first, desktop-worthy
- Designed at 390px. Desktop (`lg` breakpoint) adds sidebar + right rail as enhancements
- No feature is desktop-only — everything works on mobile
- Touch targets minimum 44px
- Swipe-to-close on bottom drawers; escape key on desktop
- TabBar fixed at bottom with safe area insets on mobile; sidebar replaces it on desktop

### No emoji, no icon library
All icons are inline SVG paths in `src/components/Icon.tsx`. No external icon font = no FOUT, no extra network request, no license constraint. SVG paths are hand-tuned for the 24px viewBox.

---

## How It Works — Architecture

### Data flow
```
src/data/fixtures.json  (static, 104 matches)
src/data/teams.json     (static, 48 teams)
src/data/squads.json    (static, 1,248 players)
        │
        ▼
useMatches()            — parses + enriches fixtures with team data (iso, color, fifaCode)
useMergedMatches()      — overlays live Firestore data on top of static seed
        │
        ├── MatchCenter, Groups, Knockout — read merged Match[]
        └── TeamDetail                   — reads merged Match[] filtered by team
```
**Key invariant:** all views consume `Match[]` — never branch on whether data is live or static. This means the UI works identically with or without a live connection.

### Live scoring (when enabled)
```
Server-side poller (runs independently, not part of the frontend build)
  └─ polls football data API every 60s during live windows
  └─ writes ONE Firestore doc: /live/scores
       { "argentina|france": { status, homeScore, awayScore, minute }, ... }

Browser (liveSlice.ts)
  └─ onSnapshot(doc(db, "live", "scores"))
  └─ fires once per update — always 1 Firestore read per user per match event
  └─ useMergedMatches() merges by team name key
```
Single document design: instead of one Firestore document per match (N reads per listener per update), all live data goes into one document. Cost scales with number of connected users, not number of live matches.

### Search algorithm
```
query → lowercase trim
teams → filter name.includes(query), sort by starts-with > contains
players → filter name.includes(query) OR lastName.includes(query)
          sort by starts-with > contains, slice top 10
```
All data is in memory (bundles with the app). Zero network calls. Results appear on every keystroke with no debounce needed.

### Alert undo correctness
When a user removes an alert, a 4-second timer runs before the actual `remove()` store call. If the user closes the drawer before the timer fires:
- Component unmounts → `useEffect` cleanup runs
- A `pendingRef` (not state — ref persists through unmount) holds the pending alert
- Cleanup fires `remove()` immediately rather than cancelling the timer
- Result: delete always commits, even if the UI disappears first

### Sticky tab background (IntersectionObserver)
The team detail tab bar background appears only when tabs become sticky:
```
<div ref={sentinelRef} style={{ height: 1 }} />  ← placed at bottom of hero
IntersectionObserver watches sentinel
  → not intersecting = hero scrolled away = tabs are sticky → show background
  → intersecting = hero visible = tabs still inline → transparent background
```
No scroll event listeners. Performant and exact.

### Player drawer from search
Navigating from a search result to a team page carries the selected player via React Router `location.state`:
```
navigate(`/teams/${teamName}`, { state: { openPlayer: player } })
TeamDetail → useState initialised from location.state?.openPlayer
→ PlayerDrawer opens immediately on mount
```

---

## Data

### Static seed files

| File | Contents |
|---|---|
| `src/data/fixtures.json` | 104 matches — UTC kickoffs, venues, groups, round labels |
| `src/data/teams.json` | 48 teams — ISO code, FIFA rank, color, FIFA code, group |
| `src/data/squads.json` | 48 × 26 players — name, jersey, position, age, caps, intl goals, club, height, weight, photo |
| `src/data/stadiums.json` | 16 venues — city, country, capacity, FIFA name |

The app works **fully offline** with zero API keys using this seed data.

### Data sources per field

| Field | Source | Method |
|---|---|---|
| Player names, jersey, position, height, weight | FIFA World Cup 2026™ | Internal REST API |
| International caps, goals, club | Wikipedia | HTML scrape |
| Player photos | api-football CDN | Static CDN URLs — no key at runtime |
| Match fixtures | FIFA official draw | Validated manually |

### Data pipeline

```bash
# 1. Fetch official FIFA squad data
node scripts/fetchFifaSquads.mjs --all

# 2. Supplement with international caps, goals, club (Wikipedia)
python3 scripts/scrapeWikiSquads.py
```

---

## FIFA Data Method

Squad data is sourced via FIFA's internal API discovered through network interception.

**Step 1** — get `teamId` from the CMS page config:
```
GET https://cxm-api.fifa.com/fifaplusweb/api/pages/en/tournaments/mens/worldcup/canadamexicousa2026/teams/{slug}/squad
→ returns { teamId: "43922", ... }
```

**Step 2** — fetch the squad:
```
GET https://api.fifa.com/api/v3/teams/{teamId}/squad?idCompetition=17&idSeason=285023&language=en
→ returns { Players: [ { PlayerName, JerseyNum, PositionLocalized, BirthDate, Height, Weight } ] }
```

- `idCompetition=17` = FIFA World Cup; `idSeason=285023` = 2026
- Player names arrive as `"SURNAME Firstname"` — normalized to title case in the script
- This is an **undocumented internal API**. FIFA does not guarantee stability

---

## Push Notifications (FCM)

When a user grants notification permission:
1. Browser generates an FCM registration token
2. Token saved to Firestore `/subs/{token}` — no PII attached
3. A server-side process reads `/subs` and fans out FCM push messages on match events (kickoff, goal, half-time, full-time)

**Browser reminders** use the native `Notification` API via `setTimeout` — work without FCM/VAPID.

**Required:**
- Firebase project with FCM enabled
- VAPID key from Firebase console → Project Settings → Cloud Messaging → Web Push certificates
- `VITE_FIREBASE_VAPID_KEY` in `.env`
- Firebase Admin `serviceAccount.json` on the server for push fan-out (gitignored, never committed)

---

## Live Scores

```
Server-side poller (runs independently)
  └─ polls football data API every 60s during live match windows
  └─ writes /live/scores: { "team_a|team_b": { status, homeScore, awayScore, minute } }

Browser
  └─ liveSlice.ts → onSnapshot(doc(db, "live", "scores"))
  └─ LIVE_ENABLED in src/config.ts gates the listener
```

**Enable:** set `LIVE_ENABLED = true` in `src/config.ts`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript strict · Vite |
| Styling | Tailwind CSS · CSS custom properties (design tokens) · Framer Motion |
| State | Zustand — favorites, alerts, UI/timezone, search; all persisted to `localStorage` |
| Routing | React Router v6 |
| Data | Static JSON seed — 104 matches, 48 teams, 1,248 players; fully offline |
| Live | Firebase Firestore `onSnapshot` + server-side score poller |
| Push | Firebase Cloud Messaging (FCM) + Web Push API |
| PWA | vite-plugin-pwa · Workbox |
| Hosting | Firebase Hosting |
| Time | `Intl.DateTimeFormat` — zero timezone libraries |
| Icons | Inline SVG paths — zero icon library |

---

## Environment Variables

Create `.env` in the project root — never commit this file:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

> Firebase web config is intentionally public per Google's design. Security is enforced via Firebase Security Rules.

---

## Local Development

```bash
npm install
npm run dev          # Vite dev server at localhost:5173
npm run build        # TypeScript check + production build
npm run preview      # Serve dist/ locally (service worker active)
npm run typecheck    # Type check only
```

---

## Deployment

```bash
npm run build
firebase deploy --only hosting
```

---

## What is NOT in this Repository

| File / Directory | Reason |
|---|---|
| `.env` | Firebase config + VAPID key |
| `serviceAccount.json` | Firebase Admin credentials for push fan-out |
| `poller.js` | Live score poller — runs separately, holds API keys |
| `scripts/squads/` | Intermediate scraping output — generated, not source |
| `CLAUDE.md` / `SPEC.md` | Internal project docs |

---

## Security

- No user authentication, no server-side sessions, no personal data collected
- Favourites and alerts in `localStorage` only — user-controlled, cleared on browser reset
- FCM tokens in Firestore `/subs/{token}` — no name, email or PII attached
- All sensitive keys in `.env` (gitignored) or `serviceAccount.json` (gitignored)

---

## Using the Data

The static JSON files in `src/data/` are available in this repository. If you use them:

- **Player data** (names, numbers, positions, height, weight) — from **FIFA**, their terms apply
- **Caps and international goals** — from **Wikipedia** under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- **Photos** — served from `media.api-sports.io`, subject to API-Sports terms

---

## Credits

- Fixtures & squad data: [FIFA World Cup 2026™](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026)
- Player caps & goals: [Wikipedia — 2026 FIFA World Cup squads](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads)
- Flag images: [flagcdn.com](https://flagcdn.com)
- Font: [Geist](https://vercel.com/font) by Vercel

---

© 2026 ajithmjose

# World Cup 26

> FIFA World Cup 2026™ companion app — live scores, standings, bracket, squad explorer, player profiles and global timezone support. A premium glassmorphism PWA with no login, no account, no tracking.

**Live:** https://wc26.ajithmjose.com

---

## Why this exists

Most World Cup apps are either too basic or bloated with accounts, ads and slow load times. This was built to be the app we actually wanted to use during the tournament — fast, beautiful, works offline, no login required.

**Core principles:**
- Every piece of information a fan needs is reachable in two taps or less
- Works fully offline — all fixtures, teams and squad data are bundled
- No account, no friction — favourites and alerts stored locally
- Data is always the same shape regardless of source (live or static)

---

## Features

### Match Center
- Full schedule of all **104 matches** — group stage through the Final
- **Date rail** — horizontal scrollable day navigation, auto-scrolls to today
- **Live carousel** — swipeable cards of all in-progress matches with live score and minute
- **Countdown card** — live ticking countdown to the next kickoff
- **Match cards** — score is always the largest element; long team names show their 3-letter FIFA code
- **Status indicators** — NS, LIVE, HT, FT, PST, CANC
- **Filters** — by status, team or group

### Global Search
- Searches **48 teams** and **1,248 players** simultaneously — all local, zero network calls
- Full official names from FIFA: "Lionel Messi", "Kylian Mbappe", "Cristiano Ronaldo"
- Tapping a player result opens their **team profile and player drawer directly**
- Desktop: centered spotlight modal; Mobile: full-screen overlay

### Team Profiles
- Full-screen page per team with sticky tab navigation (Matches · Squad · Standings)
- **Squad tab** — 26 players with position filters (Goalkeepers · Defenders · Midfielders · Forwards)
- **Standings tab** — full group table with the selected team highlighted
- Favourite toggle from the team page header

### Player Detail
- Tap any player to open a bottom drawer showing: photo, name, jersey number, position, club
- **Stats**: International Caps · International Goals · Age · Height · Weight
- Data sourced from FIFA World Cup 2026™ official records

### Group Standings
- All 12 groups (A–L): MP · W · D · L · GD · Pts
- Top-2 qualify indicator; accent highlights for leaders

### Knockout Bracket
- Full R32 → R16 → QF → SF → Final tree
- Placeholder slots auto-fill with real teams as the tournament progresses — no manual update needed
- Desktop: horizontal bracket with connector lines
- Mobile: round-by-round tab navigation

### My Teams
- Star any of the 48 nations to follow their matches
- Favourite matches grouped by day in the Favourites tab
- Persisted across sessions — no account needed

### Alerts & Reminders
- Set a push reminder **15 min, 30 min or 1 hr** before any match
- Notifications delivered via **Firebase Cloud Messaging** — fire even when the app is closed or the screen is off
- **GOAL, KICKOFF, HALF TIME, FULL TIME** push events for every live match
- **Google Calendar** — one-tap adds the match as a calendar event
- Undo support when removing alerts
- Alerts view with upcoming / past tabs

### Timezone Switcher
- 25-city curated list covering all major football markets
- Auto-detects browser timezone on first visit
- Every time surface updates instantly when timezone changes

### Progressive Web App
- Works **fully offline** — all data bundled statically
- Installs on Android (Chrome) and iOS (Add to Home Screen)
- Auto-updates silently in the background

---

## Design approach

Building a new screen or component follows a deliberate order. Skipping steps produces the generic look this project was designed to avoid.

**1. Start with the background, not the surface**
Every view floats on `var(--grad)` — the radial gradient defined in `tokens.css`. Design with the background visible. Never design on white or a flat color.

**2. Apply `.glass` to every surface**
Cards, sidebars, drawers, modals, pills — all use the `.glass` primitive: `backdrop-filter` blur + translucent rgba fill + top edge-light + hairline border + soft shadow. This is defined once in `app.css`. Never recreate it inline, never use an opaque card with a solid border.

**3. Use tokens, never hardcode**
All colors, radii, spacing, and blur values come from `src/styles/tokens.css` as CSS custom properties. Components only reference variables — never hex codes or pixel values directly.

**4. Score and status first — hierarchy drives layout**
On any match surface, score is the largest element. Status (NS, LIVE, HT, FT) comes next. Team names are secondary. Build the hierarchy before adding decoration.

**5. Color carries meaning, nothing else**
- Tangerine `#FF6A2B` — interactive, accent, brand
- Red `#FF4D5E` — live match state only
- Gold `#FFC23D` — standings rank only
- Everything else inherits from `--text-*` and `--surface-*` tokens

Dual theme is handled by CSS vars alone — no conditional class logic in components.

**6. Motion last, not first**
Framer Motion is added after layout and hierarchy are correct. Page transitions are native-feeling pushes. Drawers use spring physics (`type: "spring"`, tight damping). Card lists stagger on mount. If motion is distracting, reduce it — never add it to fill empty space.

**7. Mobile is the real canvas**
Design at 390px. Desktop (`lg` breakpoint) adds sidebar and right rail as enhancements — not a separate layout. Every feature must work on mobile. Bottom TabBar with safe area inset; no hover-only interactions.

**8. Icons and flags are always the same source**
Icons: `src/components/Icon.tsx` with inline SVG only. Flags: `src/components/FlagImg.tsx` via `flagcdn.com`. Never introduce an icon library or bundle flag assets.

---

### Color

- **Accent tangerine** `#FF6A2B` — distinctive and energetic. Every other football app uses green.
- **Live red** `#FF4D5E` — used exclusively for live match indicators
- **Gold** `#FFC23D` — standings rank highlights
- Full dual theme (light + dark) via CSS custom properties — no conditional class logic in components

### Typography
- **Geist** variable font only — no mixing, no serif
- Tabular figures on all scores, times and stats so numbers never shift layout

### Motion
- Page transitions feel like native pushes
- Bottom drawers use spring physics — snappy, not floaty
- Match cards stagger in as you scroll

### Mobile-first
- Designed for mobile. Desktop adds a sidebar and right rail as enhancements — no features are desktop-only
- Bottom TabBar with safe area support; sidebar on desktop

### No icon library
All icons are inline SVG — no external font, no extra request, no license.

---

## Architecture

Static JSON seed data (fixtures, teams, squads) is bundled with the app at build time. Live scores overlay on top of the seed via a Firestore `onSnapshot` listener — all views consume a unified data model and never branch on whether data is live or static.

A VPS poller fetches live scores every 20 seconds during active matches (300 seconds when idle) and writes diffs to a single Firestore document. One document means one Firestore read per connected user per match update — cost doesn't grow with the number of live matches or users.

Push notifications are delivered via **FCM topics** — each user is subscribed to a topic per match they follow. GOAL, KICKOFF, HT and FULLTIME events are broadcast to all subscribers in a single FCM call regardless of subscriber count. Reminder pushes are sent directly to each device token at the user's chosen time. All push logic runs server-side — the browser never polls.

---

## Data

| File | Contents |
|---|---|
| `src/data/fixtures.json` | 104 matches — UTC kickoffs, venues, groups, rounds |
| `src/data/teams.json` | 48 teams — ISO code, FIFA rank, color, FIFA code, group |
| `src/data/squads.json` | 48 × 26 players — name, jersey, position, age, caps, goals, club, height, weight, photo |
| `src/data/stadiums.json` | 16 venues — city, country, capacity |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Vite |
| Styling | Tailwind CSS · CSS custom properties · Framer Motion |
| State | Zustand — all slices persisted to `localStorage` |
| Routing | React Router v6 |
| Live data | Firebase Firestore |
| Push | Firebase Cloud Messaging (FCM) |
| PWA | vite-plugin-pwa · Workbox |
| Hosting | Firebase Hosting |

---

## Setup

Create `.env` in the project root:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

```bash
npm install
npm run dev        # development server
npm run build      # production build
firebase deploy --only hosting
```

---

## Security

- No user authentication or personal data collected
- Favourites and alerts in `localStorage` only — user-controlled
- FCM tokens stored in Firestore with no PII attached
- All sensitive keys gitignored — never committed

## Working with AI

This repo includes a [CLAUDE.md](CLAUDE.md) — a machine-readable instruction file for AI coding assistants (Claude Code, Cursor, Copilot, etc.). It documents:

- The full stack and every hard constraint
- The design system rules (glassmorphism, tokens, typography)
- The exact file layout with every component, hook, store slice, and view
- All routes, localStorage key namespaces, and feature flag states
- Component authoring pattern and commit conventions

If you use AI assistance on this codebase, point your assistant at `CLAUDE.md` first. It is kept accurate and up to date as the codebase evolves.

---

## Credits

- Fixtures & squads: [FIFA World Cup 2026™](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026)
- Player stats: [Wikipedia](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads)
- Flags: [flagcdn.com](https://flagcdn.com)
- Font: [Geist](https://vercel.com/font) by Vercel

---

© 2026 ajithmjose

# World Cup 26

> FIFA World Cup 2026 match tracker — live scores, standings, bracket, alerts and a global timezone switcher. Built as a premium glassmorphism PWA with no login required.

**Live:** https://wc26.ajithmjose.com

---

## Features

### Match Center
- Full schedule of all **104 matches** — group stage through the Final
- Horizontal **date rail** for instant day navigation, auto-scrolls to today
- **Live carousel** at the top — swipeable glass cards for all in-progress matches with live score and minute
- Countdown hero card for the next upcoming match
- Filter by status (live / upcoming / finished), team, or group
- All match times rendered via `Intl` in the user's selected timezone

### Timezone Switcher
- 25-city curated list covering every major football market
- Auto-detects the browser's local timezone on first visit
- Bottom sheet on mobile, floating dropdown on desktop (anchored to the sidebar button)
- Persisted to `localStorage` — survives refresh and reinstall
- Every surface updates reactively: match times, date rail pills, day group labels, header subtitle, bracket dates

### Group Standings
- All **12 groups** (A–L) with live standings: MP · W · D · L · GD · Pts
- Top-2 qualify indicator, accent highlighting for leaders
- Group selector cycles through all groups, right rail shows one group at a time

### Knockout Bracket
- Full **R32 → R16 → QF → SF → Final** tree with connector lines on desktop
- Mobile: tab-pill navigation between rounds, vertical card list per round
- Shows date, time and venue on each card; live pill and FT badge update in real time
- Third-place Play-off shown alongside the Final

### My Teams
- Star any of the 48 nations to follow their matches
- Favorites filter persisted to `localStorage` — no account needed
- Pinned matches bubble up in the Match Center filter

### Alerts & Reminders
- Bell icon on every upcoming match card opens an action sheet
- **Browser reminder** — choose 30 min, 1 hr, or 2 hr before kickoff; fires a browser notification
- **Google Calendar** — one-tap adds the match as an event with venue and duration
- **FCM push notifications** — receive goal, kickoff, half-time, and full-time alerts even when the app is closed (requires notification permission)
- Per-user reminders also delivered via FCM: fires X minutes before the scheduled kickoff
- Alerts view with upcoming / past tabs, per-alert reminder time controls

### Live Scores
- Server-side polling on a **VPS** (`poller.js`) hits the football API every 20 s during live matches, 5 min when idle
- Writes normalized data to **Firestore** (`/live/{id}`)
- Frontend listens via `onSnapshot` — zero browser polling, unlimited concurrent users
- Scorer names from the API are merged and displayed on live match cards

### Progressive Web App
- `vite-plugin-pwa` with Workbox — precaches all assets, serves offline with seed data
- Install banner (Android / Chrome native prompt, iOS Share → Add to Home Screen)
- Auto-updates in the background: detects new SW on `visibilitychange`, reloads silently
- Fixed bottom TabBar with safe-area insets — never clipped on Android gesture navigation

### Design
- **Glassmorphism** — every card, sidebar and modal uses `backdrop-filter` + rgba fill + top edge-light
- **Dual theme** — light and dark, toggled in one tap, default follows `prefers-color-scheme`, persisted
- **Geist** variable font throughout — tabular figures for all numeric displays
- **Accent tangerine** `#FF6A2B` — never green-led; live red, secondary cobalt, late-night gold
- Mobile-first; desktop adapts at `lg` with a glass sidebar, main content and a right rail
- No emoji, no icon library — inline SVG icons only

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript (strict) · Vite |
| Styling | Tailwind CSS · CSS custom properties (tokens) · Framer Motion |
| State | Zustand (favorites, alerts, ui/timezone slices) |
| Data | Static `fixtures.json` · `teams.json` (104 matches, 48 teams) |
| Live | Firebase Firestore `onSnapshot` + VPS poller |
| Push | Firebase Cloud Messaging (FCM) |
| PWA | vite-plugin-pwa · Workbox · Web Push API |
| Hosting | Firebase Hosting |
| Time | `Intl.DateTimeFormat` — zero timezone libraries |

---

## Architecture

```
VPS poller (Node.js)
  └─ polls football API every 20s (live) / 5min (idle)
  └─ writes /live/{matchId} to Firestore
  └─ sends FCM push on KICKOFF / GOAL / HT / FT

Browser
  └─ useMergedMatches()
       ├─ useMatches()        — static fixtures.json seed
       └─ useLiveStore()      — Firestore onSnapshot overlay
  └─ All views read from the merged Match[] — never branch on source
```

---

## Data

- `src/data/fixtures.json` — all 104 matches with UTC kickoffs, venues, group assignments
- `src/data/teams.json` — 48 teams with ISO codes, FIFA rankings, group
- `src/data/stadiums.json` — 16 venues with city, capacity, FIFA name
- Fixtures cross-validated against the official FIFA World Cup 2026 draw (all 48 teams play exactly 3 group games, groups A–L correct)
- App works fully offline with zero API key using seed data

---

## Environment Variables

Create `.env` in the project root (never commit this file):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

> Firebase web config (apiKey, projectId etc.) is intentionally public per Google's design — security is enforced through Firebase Security Rules, not by hiding the config.

---

## Local Development

```bash
npm install
npm run dev          # Vite dev server at localhost:5173
npm run build        # TypeScript + Vite production build
npm run preview      # Serve dist/ locally (service worker active)
npm run typecheck    # TypeScript type check only
```

---

## Deployment

```bash
npm run build
firebase deploy --only hosting
```

The VPS poller (`poller.js`) runs separately on a Node.js server with a Firebase Admin service account. It is not part of the frontend build.

---

## Security

- `.env` and `serviceAccount.json` are gitignored and never committed
- No user authentication, no server-side session tokens, no personal data collected
- Favorites and alerts stored in `localStorage` only — user-controlled, cleared on browser data reset
- FCM tokens stored in Firestore `/subs/{token}` for push delivery; no PII attached

---

## Credits

- Fixtures: Official FIFA World Cup 2026 draw
- Flag images: [flagcdn.com](https://flagcdn.com)
- Font: [Geist](https://vercel.com/font) by Vercel
- Live data: [worldcup26.ir](https://worldcup26.ir)

---

© 2026 ajithmjose

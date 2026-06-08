# CLAUDE.md — WorldCup26

FIFA World Cup 2026 companion PWA. No login, no ads, works offline. Every rule below applies to every task.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript strict + Vite |
| Styling | Tailwind CSS + CSS custom properties + per-component `src/styles/*.css` |
| Animation | Framer Motion |
| State | Zustand — all slices persisted to `localStorage` |
| Routing | React Router v6 |
| Live data | Firebase Firestore `onSnapshot` |
| Push | Firebase Cloud Messaging (FCM) |
| Time | `Intl` only via `src/lib/time.ts` |

---

## Constraints

### TypeScript
- Strict mode — no `any`, no `@ts-ignore`
- Explicit return types on all exported functions
- `type` unions over `enum`
- One canonical `Match` type in `src/types.ts` — never branch or extend it per view

### React
- Hooks + derived state only — no imperative DOM
- No class components
- No redundant comments, no defensive boilerplate, no premature abstraction

### Styling
- All tokens via CSS custom properties from `src/styles/tokens.css` — never hardcode colors or radii
- Every card, pill, sidebar, modal uses `.glass` from `src/styles/app.css` — never recreate it inline
- No opaque cards with solid borders
- No inline styles — use the co-located `.css` file

### Typography
- Geist variable font only — no other typeface
- Tabular figures on all scores, times, stats
- Score is always the largest element on a match card

### Icons + Flags
- Icons: inline SVG via `src/components/Icon.tsx` only — no icon library
- Flags: `flagcdn.com` via `src/components/FlagImg.tsx` only

### Never
- No emoji — UI, code, comments, commits
- No auth, login, accounts, or user avatars
- No timezone library — use `src/lib/time.ts`
- No icon library
- No UI kit beyond Tailwind
- No hardcoded UTC offsets
- No browser-side API polling — server-side (Cloud Function) only, fan out via Firestore

---

## Component pattern

Every new component:
1. Create `src/components/ComponentName.tsx`
2. Create `src/styles/ComponentName.css` and import it at the top of the component
3. Use `.glass` for any card/modal/sheet surface
4. No inline styles

---

## File layout

```
src/
  config.ts                  feature flags — LIVE_ENABLED=false, PUSH_ENABLED=true
  types.ts                   Match, Team, Player, Stadium, Alert
  data/
    fixtures.json            104 matches — UTC kickoffs, venues, groups, rounds
    teams.json               48 teams — ISO code, FIFA code, group, colors
    squads.json              48 x 26 players — name, jersey, position, stats, photo
    stadiums.json            16 venues
  lib/
    time.ts                  IST via Intl — never modify
    calendar.ts              .ics + Google Calendar URL builder
    firebase.ts              Firestore + FCM init
    liveProvider.ts          getLive() with provider key rotation
    matchUtils.ts            match filtering + sorting helpers
    timezones.ts             25-city timezone list
    confederation.ts         confederation metadata
    notify.ts                browser notification helpers
  hooks/
    useMatches.ts
    useMatchesByDay.ts
    useTeams.ts
    useNextMatch.ts
    useLiveMatches.ts
    useMergedMatches.ts      merges static seed with live Firestore overlay
    useGroupStandings.ts
    useSquad.ts
  store/
    favoritesSlice.ts        starred teams              → wc26:favorites
    alertsSlice.ts           match reminders            → wc26:alerts
    liveSlice.ts             live score overlay         (not persisted)
    uiSlice.ts               theme + timezone + searchOpen → wc26:ui
  components/
    MatchCard.tsx
    LiveCarousel.tsx         snap-scroll live cards + dots
    DateRail.tsx             horizontal day nav, auto-scrolls to today
    Countdown.tsx            ticking countdown to next kickoff
    MatchActions.tsx         alert + calendar actions
    SearchOverlay.tsx        spotlight (desktop) / full-screen (mobile)
    PlayerDrawer.tsx         bottom drawer: photo, stats, club
    AlertsDrawer.tsx         upcoming + past alerts
    AboutDrawer.tsx
    FilterSheet.tsx          status / team / group filters
    ActionSheet.tsx          generic bottom sheet primitive
    Sidebar.tsx              desktop only
    RightRail.tsx            desktop only
    TabBar.tsx               mobile only, safe area inset
    ThemeToggle.tsx
    TimezonePicker.tsx       25-city switcher
    FavStar.tsx              favourite toggle atom
    FlagImg.tsx
    InstallBanner.tsx
    StorageBanner.tsx
    Icon.tsx                 all inline SVG icons
  views/
    MatchCenter.tsx          schedule + live carousel + date rail + filters
    MyTeams.tsx              favourited teams + their matches
    Groups.tsx               12 group standings (A-L)
    Knockout.tsx             R32 > R16 > QF > SF > Final
    TeamDetail.tsx           tabs: Matches, Squad, Standings
    Alerts.tsx               upcoming + past alerts list
  styles/
    tokens.css               design tokens
    app.css                  global resets + .glass definition
    [ComponentName].css      per-component, co-located by name
functions/                   Cloud Functions: score poller + FCM fan-out
```

**Route + component name is always `Knockout` — never "bracket".**

### Routes

| Path | View |
|---|---|
| `/` | MatchCenter |
| `/teams` | MyTeams |
| `/teams/:name` | TeamDetail |
| `/groups` | Groups |
| `/knockout` | Knockout |
| `/alerts` | Alerts |
| `/match/:id` | MatchDetail (stubbed — not yet built) |

---

## Data

- Seed files are the fool-proof baseline — app works with zero API keys and zero network
- Never hand-edit seed JSON files
- Never make any view depend on a runtime fetch — seed is bundled at build time
- `useMergedMatches` handles the live overlay — views never branch on data source

---

## Live + Push

- Poll server-side only (Cloud Function) — never from the browser
- One `live=all` call per interval. Adaptive: 120s idle, 45s during live matches
- FCM tokens + favourites in Firestore `/subs`
- Push events: KICKOFF, GOAL, FULLTIME, 1h-before reminder
- Feature flags in `src/config.ts` gate LIVE and PUSH independently

---

## Commits

- Imperative present tense: `Add timezone switcher` not `Added timezone switcher`
- No emoji
- Subject = what changed; body (if needed) = why

---

## Deploy

```bash
npm run build
firebase deploy --only hosting
```

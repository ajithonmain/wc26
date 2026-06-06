# WorldCup26

A fast, IST-native FIFA World Cup 2026 tracker built as a Progressive Web App.

## Features

- **Match Center** — full schedule with live countdown to the next kickoff, date rail for quick navigation, and a live match carousel
- **Group Standings** — all 12 groups with real-time standings (MP, W, D, L, GD, Pts), qualification indicators
- **Knockout Bracket** — round of 32 through the Final, visualized as a bracket
- **My Teams** — favorite up to 4 teams, pin their matches to the top
- **Alerts** — set match reminders that fire as browser notifications
- **Live scores** — real-time score updates via Firestore, no browser polling
- **Push notifications** — goal, kickoff, and halftime alerts via FCM
- **Dark / light theme** — follows system preference, toggleable, persisted
- **PWA** — installable, works offline with seed data, no account required
- **IST-first** — all times displayed in India Standard Time via Intl API

## Stack

Vite · React 18 · TypeScript · Tailwind CSS · Framer Motion · Zustand · Firebase

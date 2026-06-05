# World Cup 2026 Schedule Tracker

A responsive FIFA World Cup 2026 schedule viewer built with React, TypeScript, and Tailwind CSS. Data is fetched from the [worldcup2026 API](https://github.com/rezarahiminia/worldcup2026).

## Features

- **Desktop**: Date tabs with matches in a 2-column grid; auto-selects today or the next upcoming match day
- **Mobile**: Continuous scrollable schedule with dynamic loading of past and future dates
- **Light / dark mode** toggle with persistence
- **English / Chinese** language toggle
- **Match results** shown for completed games

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**Live site:** [franklioxygen.github.io/worldcup-tracker/](https://franklioxygen.github.io/worldcup-tracker/)

## Build

```bash
npm run build
npm run preview
```

## Data Source

Data comes from [rezarahiminia/worldcup2026](https://github.com/rezarahiminia/worldcup2026):

- `football.matches.json` — 104 matches
- `football.teams.json` — 48 teams with flags
- `football.stadiums.json` — 16 venues

In development, the app also tries the live API at `worldcup26.ir` (via Vite proxy) for real-time scores, falling back to GitHub JSON if unavailable.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server on localhost:3000
npm run build      # Production build (CI=false set in vercel.json to suppress warnings)
npm test           # Run tests in watch mode
npm test -- --watchAll=false --testPathPattern=App  # Run a single test file
```

## Architecture

Single-page React app (`src/App.jsx`) with no routing. All logic lives in one file.

**Data layer** (loaded at module level, never fetched at runtime):
- `src/mann-filter-data.json` — ~380k-line vehicle database. Each record: `{ make, model, model_year, engine, ps, kw, year_of_prod, oil, air, cabin, fuel }` where filter fields are a code string or array of code strings.
- `src/products.json` — MANN↔Filtron mapping array. Each entry: `{ mann, mann_name, filtron, mann_url, filtron_url, label }`. Three lookup maps are built at init from this: `FILTRON_MAP` (mann_name→filtron), `MANN_IMG_MAP` (mann_name→img url), `FILTRON_URL_MAP` (filtron→img url).

**UI structure:**
- Single view: vehicle make/model/engine dropdowns filter `DB` and render matching filter cards
- `MannCard` renders a MANN filter card and, if a Filtron equivalent exists, immediately renders a `FiltronCard` beside it via `display: contents`
- Clicking any card opens a modal showing all compatible vehicles, grouped by make
- Modal distinguishes MANN vs Filtron brand via `modalBrand` state — Filtron modals reverse-map through `FILTRON_MAP` to find vehicles

**All styling is inline** — no CSS modules, no Tailwind, no UI library. Brand colors: MANN green `#78a22f`, Filtron blue `#0082c8`, background `#090909`.

**Maintenance mode:** Set `REACT_APP_MAINTENANCE=true` to render `ClosurePage` instead of the app.

## Deployment

Deployed on Vercel. The `vercel.json` sets `CI=false` to prevent CRA treating ESLint warnings as errors during build.

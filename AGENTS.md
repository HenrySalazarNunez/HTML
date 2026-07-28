# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **static front-end site** (plain HTML/CSS/JS). There is no
package manager, build step, automated test suite, or linter. "Running" the app
just means serving the files over HTTP.

### Files / structure
- `1-father.html` — the "Members Only Portal" gatekeeper (login) page.
- `1.1-dashboard.html` — the "Operations Mission Control" dashboard (protected page).
- `2-son.css` — all styling (dark theme).
- `3-hollyspirit.js` — the engine: login, access log, chart rendering, Excel.
- `Developer.xlsm` — data workbook fetched by the JS.
- `vendor/` — local copies of Chart.js and SheetJS (optional; see below).

This repo mirrors the deployed GitHub Pages project. `3-hollyspirit.js` is written
as a **drop-in**: the HTML pages only include `3-hollyspirit.js` (no chart/library
`<script>` tags and no `<canvas>` elements in the markup). The engine loads the
libraries itself and injects the `<canvas>` charts into the placeholder `<div>`s.

### Running the app (dev)
Serve the repo root with any static server, e.g.:
`python3 -m http.server 8000`
Then open `http://localhost:8000/1-father.html`.
(Python 3 is preinstalled; no dependencies to install.)

### Lint / test / build
None exist. There is nothing to lint, test, or build.

### How the pieces connect
`3-hollyspirit.js` is the single engine that wires everything together:
- **Login:** on `1-father.html` it validates the typed key against `USER_REGISTRY`
  (multi-user keys, e.g. `Henry777`, `John123`, `Manager99`). A valid key sets
  `localStorage.memberAccessStatus = 'granted'`, reveals the protected content,
  and appends a timestamped "System Entry Logs" audit record (`accessLogs`).
- **Libraries:** `ensureLibraries()` loads Chart.js + SheetJS, trying local
  `vendor/` first and falling back to the jsDelivr CDN.
- **Charts:** on the dashboard, `renderDashboardCharts()` injects `<canvas>`
  elements into the existing placeholder `<div>`s (`.gauge-placeholder`,
  `.bar-chart-viewport`, `.pie-chart-viewport`) and draws gauges/bars/pies.
- **Excel:** `loadWorkbook()` fetches `Developer.xlsm` (SheetJS); the portal's
  "Export Sheet (.csv)" button exports the `Database` sheet as CSV.
- **Dashboard guard:** `1.1-dashboard.html` redirects to the portal unless
  `memberAccessStatus === 'granted'`; a 15:00 countdown ticks in the header.

### Non-obvious gotchas (verified during setup)
- The HTML markup has **no chart libraries and no `<canvas>` elements** — both are
  added at runtime by `3-hollyspirit.js`. If charts are missing, check the console
  for library-load errors and confirm `typeof Chart` / `typeof XLSX` are defined.
- Libraries load from local `vendor/` if present (works offline), otherwise from
  the jsDelivr CDN. On a deployed site without `vendor/`, the CDN is used, so the
  page needs internet there.
- The Excel fetch uses a **same-origin relative URL** (`Developer.xlsm`), so it
  only works when files are served over HTTP (e.g. `python3 -m http.server`), not
  via `file://`.
- Charts live only on the dashboard (once access is granted); the portal shows the
  login gate, the audit log and the CSV export.

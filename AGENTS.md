# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **static front-end site** (plain HTML/CSS/JS). There is no
package manager, build step, automated test suite, or linter. "Running" the app
just means serving the files over HTTP.

### Files / structure
- `1-father.html` — the "Members Only Portal" gatekeeper (login) page.
- `1.1-dashboard.html` — the "Operations Mission Control" dashboard (protected page).
- `2-son.css` — all styling (dark theme).
- `3-hollyspirit.js` — validation + Chart.js/XLSX initialization logic.
- `Developer.xlsm` — data workbook fetched by the JS.

### Running the app (dev)
Serve the repo root with any static server, e.g.:
`python3 -m http.server 8000`
Then open `http://localhost:8000/1-father.html`.
(Python 3 is preinstalled; no dependencies to install.)

### Lint / test / build
None exist. There is nothing to lint, test, or build.

### How the pieces connect
`3-hollyspirit.js` is the single engine that wires everything together:
- **Login:** on `1-father.html` it attaches a handler to the "Verify Identity"
  button. Entering the demo passkey `1dc-operations` (constant `ACCESS_KEY`)
  sets `localStorage.memberAccessStatus = 'granted'`, hides the gatekeeper and
  reveals the protected content.
- **Excel:** `loadWorkbook()` fetches `Developer.xlsm` (SheetJS). On the portal
  it fills the "System Entry Logs" list (one entry per sheet + row counts) and
  wires the "Export Sheet (.csv)" button to download the `Database` sheet as CSV.
- **Charts:** Chart.js renders the portal gauge/pie and all dashboard gauges,
  bars and pies.
- **Dashboard guard:** `1.1-dashboard.html` redirects back to the portal unless
  `memberAccessStatus === 'granted'`.

### Non-obvious gotchas (verified during setup)
- Chart.js and SheetJS (XLSX) are **vendored locally** under `vendor/`
  (`vendor/chart.umd.min.js`, `vendor/xlsx.full.min.js`) and loaded via relative
  paths, so charts/Excel parsing work with **no internet/CDN** access. If charts
  are ever missing, confirm these files are present and served (200), and that
  `typeof Chart` / `typeof XLSX` are defined in the console.
- The Excel fetch uses a **same-origin relative URL** (`Developer.xlsm`), so it
  only works when the files are served over HTTP (e.g. the
  `python3 -m http.server` dev server), not when opening the HTML via `file://`.
- Chart canvases only appear after unlocking the portal (or on the dashboard
  once access is granted); the locked gate has no charts by design.

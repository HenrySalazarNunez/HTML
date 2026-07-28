# AGENTS.md

## Cursor Cloud specific instructions

This repository is a **static front-end site** (plain HTML/CSS/JS). There is no
package manager, build step, automated test suite, or linter. "Running" the app
just means serving the files over HTTP.

### Files / structure
- `1-father.html` — the "Members Only Portal" login gate + access log + CSV export.
- `1.1-dashboard.html` — the "Operations Mission Control" dashboard (markup with
  `<canvas>` elements + metric `<span>`s that the JS fills from Excel).
- `2-son.css` — all styling (dark theme).
- `3-hollyspirit.js` — the engine: login, chart rendering, and the Excel data feed.
- `Developer.xlsm` — the data workbook. The `Database` sheet holds the hourly
  operations data that drives the dashboard.
- `vendor/` — local copies of Chart.js and SheetJS (loaded before the CDN).

### Running the app (dev)
Serve the repo root with any static server, e.g. `python3 -m http.server 8000`,
then open `http://localhost:8000/1-father.html`. Python 3 is preinstalled and
there are no dependencies to install.

### `standalone.html` — one-file version (opens with a double-click)
`standalone.html` is the entire app in a single file (inline CSS/JS, Chart.js +
SheetJS from CDN). It embeds a data **snapshot**, so double-clicking it (file://)
shows the dashboard with no server. When hosted next to a `Developer.xlsm`, it
reads the live workbook and 15-min syncs instead. Needs internet for the CDN libs.

### `dashboard/` — self-contained single-page build (recommended to deploy)
`dashboard/` is a portable, drop-anywhere version of the whole app in one folder:
`index.html` (login gate + dashboard in one page), `style.css`, `app.js`, its own
`Developer.xlsm`, and its own `vendor/` libraries. Open `http://localhost:8000/dashboard/`
(the folder serves `index.html` automatically). To deploy, copy the entire
`dashboard/` folder to any static host / GitHub Pages — no other files needed.
It behaves like the root app (same `USER_REGISTRY` login, Excel feed and 15-min sync).

### Lint / test / build
None exist. There is nothing to lint, test, or build.

### How it works
- **Login:** `USER_REGISTRY` in `3-hollyspirit.js` maps keys to member names
  (e.g. `Henry777`, `John123`, `Manager99`). A valid key sets
  `localStorage.memberAccessStatus = 'granted'`, reveals the content, and adds a
  timestamped audit entry to the "System Entry Logs".
- **Excel feed:** the dashboard reads REAL values from the `Database` sheet of
  `Developer.xlsm` (SheetJS), by absolute cell address (see the `COL` map in the
  JS). It computes per-operation units/jobs/rates + hourly series and renders
  gauges, bar charts, a distribution doughnut and an hourly line chart.
- **15-minute sync:** the header countdown ticks down from 15:00; at 0 it
  re-fetches `Developer.xlsm` (with `cache: no-store` + a cache-busting query
  param) and re-renders. So editing the workbook at work updates the web.
- **Libraries:** `ensureLibraries()` loads Chart.js + SheetJS from local
  `vendor/` first, falling back to the jsDelivr CDN.

### Non-obvious gotchas
- The dashboard fetches `Developer.xlsm` via a same-origin relative URL, so it
  must be served over HTTP (e.g. `python3 -m http.server`), not opened via
  `file://`.
- Charts are only on the dashboard, which redirects to the portal unless
  `memberAccessStatus === 'granted'`.
- The `Database` sheet layout is fixed (6 side-by-side hourly tables). If that
  sheet's columns move, update the `COL` index map in `3-hollyspirit.js`.

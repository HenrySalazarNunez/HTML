# AGENTS.md

## Cursor Cloud specific instructions

Static single-page site. No package manager, build, tests, or linter. Serve over
HTTP for development: `python3 -m http.server 8000`, then open
`http://localhost:8000/` (Python 3 is preinstalled; nothing to install).

### Files
- `index.html` — the whole app (login gate + Excel-fed operations dashboard) in one
  file. It loads Chart.js + SheetJS from the jsDelivr CDN and embeds a data
  **snapshot** so it still renders when opened via `file://`.
- `Developer.xlsm` — data workbook. The dashboard reads the `Database` sheet by
  absolute cell address (see the `COL` map in `index.html`) and re-syncs every
  15 minutes. Hosted next to `index.html` it shows live data; otherwise the snapshot.

### Non-obvious notes
- Login keys live in `USER_REGISTRY` inside `index.html` (e.g. `Henry777`).
- The live Excel read uses a same-origin relative URL, so live data only works when
  served over HTTP (the snapshot covers the `file://` case).
- Charts need internet (CDN libraries).
- Publishing is GitHub Pages (Settings → Pages → branch `main` / root). Enabling
  Pages is a one-time action in the GitHub website; it cannot be done from git.

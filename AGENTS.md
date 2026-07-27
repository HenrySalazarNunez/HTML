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

### Non-obvious gotchas (verified during setup)
- The "Verify Identity" button on `1-father.html` has **no JavaScript click
  handler**, so the login form does not grant access on its own. To view the
  protected dashboard during testing, set the flag in the browser console:
  `localStorage.setItem('memberAccessStatus','granted')` then open
  `1.1-dashboard.html`. Without this flag the dashboard alerts and redirects
  back to `1-father.html`.
- The `<script src="https://jsdelivr.net"></script>` tags are placeholders and
  do **not** load Chart.js or the XLSX library, so `Chart`/`XLSX` are undefined
  and the chart canvases render blank. Page layout and styling still render
  fine. This is a code-level issue, not an environment problem.

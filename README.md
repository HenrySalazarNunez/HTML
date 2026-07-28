# Operations Mission Control Dashboard

A single-page web dashboard fed by an Excel workbook (`Developer.xlsm`).

## Files
- `index.html` — the entire app (login + dashboard) in one file.
- `Developer.xlsm` — the data workbook (the `Database` sheet drives the numbers).

## Use it
Open `index.html`:
- **Double-click** it to view instantly (shows a built-in data snapshot), or
- **Host it** (GitHub Pages or any static server) next to `Developer.xlsm` to read
  the live workbook and auto-refresh every 15 minutes.

Log in with a member key (e.g. `Henry777`).

## Update the data
Replace `Developer.xlsm` (keep the same file name and the `Database` sheet layout).
The dashboard re-reads it every 15 minutes.

## Publish on GitHub Pages
Repo **Settings → Pages → Deploy from a branch → `main` / `/root` → Save**, then open
`https://<your-user>.github.io/<repo>/`.

// =====================================================================
//  Operations Mission Control — self-contained single-page app.
//
//  Login (USER_REGISTRY) -> live dashboard fed by Developer.xlsm.
//  Re-syncs from the workbook every 15 minutes (header countdown), so
//  updating the Excel updates the web.
//
//  Everything this needs lives in this folder:
//    index.html, style.css, app.js, Developer.xlsm, vendor/*.min.js
// =====================================================================

// ---- Configuration ---------------------------------------------------
const EXCEL_URL = "Developer.xlsm";
const STORAGE_KEY = "memberAccessStatus";
const NAME_KEY = "memberName";
const SYNC_SECONDS = 15 * 60;

const USER_REGISTRY = {
    "IloveMyWork!": "System Creator (Henry)",
    "Henry777": "Henry Salazar",
    "John123": "John Doe",
    "Alpha777": "Team Alpha Leader",
    "Manager99": "Shift Operations Manager",
};

// Absolute columns in the "Database" sheet (A=0, B=1, C=2, ...).
const COL = {
    time: 1, palletUnits: 2, palletJobs: 3, palletRate: 8,
    caseUnits: 11, caseJobs: 12, caseRate: 18,
    stowRts: 21, stowCross: 22, stowRate: 27,
};

const charts = {};
let countdownTimer = null;

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("secretKey");
    const button = document.getElementById("accessButton");

    const verify = () => {
        const typed = (input.value || "").trim();
        const name = USER_REGISTRY[typed];
        if (name) {
            localStorage.setItem(STORAGE_KEY, "granted");
            localStorage.setItem(NAME_KEY, name);
            input.value = "";
            showApp();
        } else {
            document.getElementById("gateError").textContent = "Access denied — invalid passkey.";
            input.value = "";
        }
    };

    button.addEventListener("click", verify);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") verify(); });

    const signOut = document.getElementById("signOutBtn");
    if (signOut) signOut.addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    });

    if (localStorage.getItem(STORAGE_KEY) === "granted") showApp();
});

// =====================================================================
//  Show the dashboard and start the live Excel feed.
// =====================================================================
function showApp() {
    document.getElementById("gate").style.display = "none";
    document.getElementById("app").style.display = "block";
    const who = document.getElementById("whoami");
    if (who) who.textContent = "Signed in as " + (localStorage.getItem(NAME_KEY) || "member");

    ensureLibraries()
        .then(() => {
            wireCsvExport();
            syncNow();
            startSyncCountdown();
        })
        .catch((err) => setLastSync("Could not load chart libraries"));
}

// =====================================================================
//  Library loader (local vendor/ first, jsDelivr CDN fallback).
// =====================================================================
let libsPromise = null;
function ensureLibraries() {
    if (libsPromise) return libsPromise;
    libsPromise = Promise.all([
        loadFirstAvailable(["vendor/chart.umd.min.js", "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"]),
        loadFirstAvailable(["vendor/xlsx.full.min.js", "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"]),
    ]);
    return libsPromise;
}

function loadFirstAvailable(urls) {
    return new Promise((resolve, reject) => {
        let i = 0;
        (function next() {
            if (i >= urls.length) return reject(new Error("Could not load: " + urls.join(", ")));
            const s = document.createElement("script");
            s.src = urls[i++];
            s.onload = () => resolve(s.src);
            s.onerror = () => { s.remove(); next(); };
            document.head.appendChild(s);
        })();
    });
}

// =====================================================================
//  Excel workbook (fresh fetch every sync).
// =====================================================================
function loadWorkbook() {
    if (typeof XLSX === "undefined") return Promise.resolve(null);
    return fetch(EXCEL_URL + "?t=" + Date.now(), { cache: "no-store" })
        .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
        .then((buf) => XLSX.read(new Uint8Array(buf), { type: "array" }))
        .catch((err) => { console.error("Excel fetch failed:", err); return null; });
}

function parseDatabase(wb) {
    const name = wb.SheetNames.find((n) => n.trim() === "Database");
    if (!name) return null;
    const ws = wb.Sheets[name];
    const range = XLSX.utils.decode_range(ws["!ref"]);
    const num = (r, c) => {
        const cell = ws[XLSX.utils.encode_cell({ r: r, c: c })];
        return cell && typeof cell.v === "number" ? cell.v : null;
    };

    const rows = [];
    for (let r = range.s.r; r <= range.e.r; r++) {
        if (num(r, COL.time) !== null && num(r, COL.palletUnits) !== null) rows.push(r);
    }

    const sum = (c) => rows.reduce((a, r) => a + (num(r, c) || 0), 0);
    const avg = (c) => {
        const v = rows.map((r) => num(r, c)).filter((x) => x !== null);
        return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
    };
    const series = (c, n) => rows.slice(0, n).map((r) => num(r, c) || 0);

    return {
        labels: rows.slice(0, 8).map((r) => fracToHour(num(r, COL.time))),
        palletReplen: { units: sum(COL.palletUnits), jobs: sum(COL.palletJobs), rate: avg(COL.palletRate), hourly: series(COL.palletUnits, 8) },
        caseReplen: { units: sum(COL.caseUnits), jobs: sum(COL.caseJobs), rate: avg(COL.caseRate), hourly: series(COL.caseUnits, 8) },
        palletStow: { rts: sum(COL.stowRts), cross: sum(COL.stowCross), rate: avg(COL.stowRate), hourly: series(COL.stowRts, 8) },
        rowCount: rows.length,
    };
}

function fracToHour(frac) {
    let h = Math.round(frac * 24);
    const ampm = h >= 12 && h < 24 ? "PM" : "AM";
    let hr = h % 12; if (hr === 0) hr = 12;
    return hr + ampm;
}

// =====================================================================
//  Sync loop.
// =====================================================================
function syncNow() {
    return loadWorkbook().then((wb) => {
        if (!wb) return setLastSync("Sync failed — workbook unavailable");
        const m = parseDatabase(wb);
        if (!m) return setLastSync("Sync failed — 'Database' sheet not found");
        renderDashboard(m);
        setLastSync("Last synced " + new Date().toLocaleTimeString());
        console.log("Dashboard synced from Excel:", m);
    });
}

function setLastSync(text) {
    const el = document.getElementById("lastSync");
    if (el) el.textContent = text;
}

function startSyncCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    let remaining = SYNC_SECONDS;
    const el = document.getElementById("countdownClock");
    countdownTimer = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) { remaining = SYNC_SECONDS; syncNow(); }
        if (el) {
            el.textContent = String(Math.floor(remaining / 60)).padStart(2, "0") + ":" + String(remaining % 60).padStart(2, "0");
        }
    }, 1000);
}

// =====================================================================
//  Rendering.
// =====================================================================
function renderDashboard(m) {
    const fmt = (n) => Math.round(n).toLocaleString();

    text("palletReplenRate", m.palletReplen.rate.toFixed(1));
    text("palletReplenUnits", fmt(m.palletReplen.units));
    text("palletReplenJobs", fmt(m.palletReplen.jobs));
    text("caseReplenRate", m.caseReplen.rate.toFixed(0));
    text("caseReplenUnits", fmt(m.caseReplen.units));
    text("caseReplenJobs", fmt(m.caseReplen.jobs));
    text("palletStowRate", m.palletStow.rate.toFixed(1));
    text("palletStowRts", fmt(m.palletStow.rts));
    text("palletStowCross", fmt(m.palletStow.cross));

    const stowVolume = m.palletStow.rts + m.palletStow.cross;
    const total = m.palletReplen.units + m.caseReplen.units + stowVolume;
    text("totalUnits", fmt(total));
    text("totalPalletR", fmt(m.palletReplen.units));
    text("totalCaseR", fmt(m.caseReplen.units));
    text("totalPalletS", fmt(stowVolume));
    text("systemStatus", "\uD83D\uDFE2 Live — " + m.rowCount + " hourly records loaded from Developer.xlsm");

    gauge("gaugePalletReplen", m.palletReplen.rate, 10, "#c084fc");
    gauge("gaugeCaseReplen", m.caseReplen.rate, 130, "#fb923c");
    gauge("gaugePalletStow", m.palletStow.rate, 10, "#60a5fa");

    bar("barPalletReplen", m.labels, m.palletReplen.hourly, "#c084fc");
    bar("barCaseReplen", m.labels, m.caseReplen.hourly, "#fb923c");
    bar("barPalletStow", m.labels, m.palletStow.hourly, "#60a5fa");

    upsert("pieDistribution", {
        type: "doughnut",
        data: { labels: ["Pallet Replen", "Case Replen", "Pallet Stow"],
            datasets: [{ data: [m.palletReplen.units, m.caseReplen.units, stowVolume], backgroundColor: ["#c084fc", "#fb923c", "#60a5fa"], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: "#e2e8f0", font: { size: 11 } } } } },
    });

    const throughput = m.labels.map((_, i) => (m.palletReplen.hourly[i] || 0) + (m.caseReplen.hourly[i] || 0));
    upsert("lineHourly", {
        type: "line",
        data: { labels: m.labels, datasets: [{ data: throughput, borderColor: "#4ade80", backgroundColor: "rgba(74,222,128,0.15)", fill: true, tension: 0.35, pointRadius: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { display: false } },
                      y: { ticks: { color: "#94a3b8", font: { size: 10 } }, grid: { color: "#1f2937" } } } },
    });
}

function text(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }

function gauge(id, value, target, color) {
    const pct = Math.max(0, Math.min(100, (value / target) * 100));
    upsert(id, {
        type: "doughnut",
        data: { labels: ["", ""], datasets: [{ data: [pct, 100 - pct], backgroundColor: [color, "#222"], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, circumference: 180, rotation: -90, cutout: "72%",
            plugins: { legend: { display: false }, tooltip: { enabled: false } } },
    });
}

function bar(id, labels, data, color) {
    upsert(id, {
        type: "bar",
        data: { labels: labels, datasets: [{ data: data, backgroundColor: color }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { ticks: { color: "#94a3b8", font: { size: 9 } }, grid: { display: false } }, y: { display: false } } },
    });
}

function wireCsvExport() {
    const btn = document.getElementById("downloadExcelBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
        loadWorkbook().then((wb) => {
            if (!wb) return alert("Workbook not loaded yet — try again in a moment.");
            const name = wb.SheetNames.find((n) => n.trim() === "Database") || wb.SheetNames[0];
            const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]);
            const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
            const a = document.createElement("a");
            a.href = url; a.download = name.trim() + ".csv";
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
        });
    });
}

function upsert(id, config) {
    const el = document.getElementById(id);
    if (!el) return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(el, config);
}

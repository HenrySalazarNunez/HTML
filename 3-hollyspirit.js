// =====================================================================
//  THE HOLY SPIRIT — the engine (rebuilt from scratch).
//
//  * Guards the members area (USER_REGISTRY login + audit log).
//  * Loads Chart.js + SheetJS (local vendor/ first, CDN fallback).
//  * Reads REAL values from Developer.xlsm ("Database" sheet) and feeds
//    the Operations dashboard.
//  * Re-syncs from the workbook every 15 minutes (matching the header
//    countdown), so editing the Excel at work updates the web.
// =====================================================================

// ---- Configuration ---------------------------------------------------
const EXCEL_URL = "Developer.xlsm";
const STORAGE_KEY = "memberAccessStatus";
const SYNC_SECONDS = 15 * 60; // 15 minutes

// Identity roster: unique key -> member name.
const USER_REGISTRY = {
    "IloveMyWork!": "System Creator (Henry)",
    "Henry777": "Henry Salazar",
    "John123": "John Doe",
    "Alpha777": "Team Alpha Leader",
    "Manager99": "Shift Operations Manager",
};

// Absolute column indices in the "Database" sheet (A=0, B=1, C=2, ...).
const COL = {
    time: 1,          // B
    palletUnits: 2,   // C
    palletJobs: 3,    // D
    palletRate: 8,    // I
    caseUnits: 11,    // L
    caseJobs: 12,     // M
    caseRate: 18,     // S
    stowRts: 21,      // V
    stowCross: 22,    // W
    stowRate: 27,     // AB
};

const isDashboardPage = window.location.href.includes("1.1-dashboard.html");
const charts = {};

document.addEventListener("DOMContentLoaded", () => {
    if (isDashboardPage) initDashboardPage();
    else initPortalPage();
});

// =====================================================================
//  LIBRARY LOADER (vendor/ first, then jsDelivr CDN)
// =====================================================================
let libsPromise = null;
function ensureLibraries() {
    if (libsPromise) return libsPromise;
    libsPromise = Promise.all([
        loadFirstAvailable([
            "vendor/chart.umd.min.js",
            "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js",
        ]),
        loadFirstAvailable([
            "vendor/xlsx.full.min.js",
            "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
        ]),
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
//  THE PORTAL (login + audit log + CSV export)
// =====================================================================
function initPortalPage() {
    const gatekeeper = document.getElementById("gatekeeper");
    const protectedContent = document.getElementById("protectedContent");
    const secretKeyInput = document.getElementById("secretKey");
    const accessButton = document.getElementById("accessButton");

    const reveal = () => {
        if (gatekeeper) gatekeeper.style.display = "none";
        if (protectedContent) protectedContent.setAttribute("style", "display: block !important;");
        renderLogs();
    };

    const verify = () => {
        const typed = (secretKeyInput.value || "").trim();
        const name = USER_REGISTRY[typed];
        if (name) {
            localStorage.setItem(STORAGE_KEY, "granted");
            recordEntry(name);
            secretKeyInput.value = "";
            reveal();
        } else {
            alert("Access Denied. Invalid Private Identification Key.");
            secretKeyInput.value = "";
        }
    };

    if (accessButton) accessButton.addEventListener("click", verify);
    if (secretKeyInput) secretKeyInput.addEventListener("keydown", (e) => { if (e.key === "Enter") verify(); });

    ensureLibraries().then(() => { loadWorkbook(); wireCsvExport(); });

    if (localStorage.getItem(STORAGE_KEY) === "granted") reveal();
    else renderLogs();
}

function recordEntry(name) {
    const logs = JSON.parse(localStorage.getItem("accessLogs")) || [];
    logs.unshift("Entry: " + name + " signed in at " + new Date().toLocaleString());
    localStorage.setItem("accessLogs", JSON.stringify(logs));
}

function renderLogs() {
    const list = document.getElementById("logList");
    if (!list) return;
    const logs = JSON.parse(localStorage.getItem("accessLogs")) || [];
    list.innerHTML = "";
    if (!logs.length) return appendLog(list, "No entries yet — sign in to create the first audit record.");
    logs.forEach((t) => appendLog(list, "\u2705 " + t));
}

function appendLog(list, text) {
    const li = document.createElement("li");
    li.className = "log-item";
    li.textContent = text;
    list.appendChild(li);
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

// =====================================================================
//  THE EXCEL WORKBOOK  (fresh copy on every call for the 15-min sync)
// =====================================================================
function loadWorkbook() {
    if (typeof XLSX === "undefined") return Promise.resolve(null);
    return fetch(EXCEL_URL + "?t=" + Date.now(), { cache: "no-store" })
        .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.arrayBuffer(); })
        .then((buf) => XLSX.read(new Uint8Array(buf), { type: "array" }))
        .catch((err) => { console.error("Excel fetch failed:", err); return null; });
}

// Read every data row of the Database sheet by absolute cell address.
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
        const t = num(r, COL.time);
        const u = num(r, COL.palletUnits);
        if (t === null || u === null) continue; // keep only hourly data rows
        rows.push(r);
    }

    const sum = (c) => rows.reduce((a, r) => a + (num(r, c) || 0), 0);
    const avg = (c) => {
        const v = rows.map((r) => num(r, c)).filter((x) => x !== null);
        return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
    };
    const series = (c, n) => rows.slice(0, n).map((r) => num(r, c) || 0);
    const labels = rows.slice(0, 8).map((r) => fracToHour(num(r, COL.time)));

    return {
        labels: labels,
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
//  THE DASHBOARD
// =====================================================================
function initDashboardPage() {
    if (localStorage.getItem(STORAGE_KEY) !== "granted") {
        alert("Access Denied. Redirecting to Secure Entrance Gate.");
        window.location.href = "1-father.html";
        return;
    }

    ensureLibraries()
        .then(() => {
            syncNow();          // first paint
            startSyncCountdown(); // tick + re-sync every 15 min
        })
        .catch((err) => console.error("Libraries failed to load:", err));
}

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
    let remaining = SYNC_SECONDS;
    const el = document.getElementById("countdownClock");
    setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) { remaining = SYNC_SECONDS; syncNow(); }
        if (el) {
            const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
            const ss = String(remaining % 60).padStart(2, "0");
            el.textContent = mm + ":" + ss;
        }
    }, 1000);
}

// ---- rendering -------------------------------------------------------
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

    // Gauges (fill = rate vs a sensible target, capped at 100%).
    gauge("gaugePalletReplen", m.palletReplen.rate, 10, "#c084fc");
    gauge("gaugeCaseReplen", m.caseReplen.rate, 130, "#fb923c");
    gauge("gaugePalletStow", m.palletStow.rate, 10, "#60a5fa");

    // Hourly volume bar charts.
    bar("barPalletReplen", m.labels, m.palletReplen.hourly, "#c084fc");
    bar("barCaseReplen", m.labels, m.caseReplen.hourly, "#fb923c");
    bar("barPalletStow", m.labels, m.palletStow.hourly, "#60a5fa");

    // Volume distribution pie.
    upsert("pieDistribution", {
        type: "doughnut",
        data: {
            labels: ["Pallet Replen", "Case Replen", "Pallet Stow"],
            datasets: [{ data: [m.palletReplen.units, m.caseReplen.units, stowVolume],
                backgroundColor: ["#c084fc", "#fb923c", "#60a5fa"], borderWidth: 0 }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { color: "#e2e8f0", font: { size: 11 } } } } },
    });

    // Hourly throughput line (Pallet + Case units per hour).
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
            scales: { x: { ticks: { color: "#94a3b8", font: { size: 9 } }, grid: { display: false } },
                      y: { display: false } } },
    });
}

function upsert(id, config) {
    const el = document.getElementById(id);
    if (!el) return;
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(el, config);
}

// =====================================================================
//  THE HOLY SPIRIT — the engine that gives life to the Father (HTML),
//  wears the Son (CSS), guards the members area, and connects the whole
//  operation to the Excel workbook (Developer.xlsm).
//
//  This file is a drop-in replacement: it needs NO changes to the HTML
//  or CSS. It loads the chart / Excel libraries on its own and injects
//  real <canvas> charts into the existing placeholder <div>s.
// =====================================================================

// ---- Configuration ---------------------------------------------------
const EXCEL_URL = "Developer.xlsm";
const STORAGE_KEY = "memberAccessStatus";

// The identity roster: unique keys -> member name.
const USER_REGISTRY = {
    "IloveMyWork!": "System Creator (Henry)",
    "I love my work": "System Creator (Henry)",
    "Henry777": "Henry Salazar",
    "John123": "John Doe",
    "Alpha777": "Team Alpha Leader",
    "Manager99": "Shift Operations Manager",
};

const isDashboardPage = window.location.href.includes("1.1-dashboard.html");

// ---- Boot ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    if (isDashboardPage) {
        initDashboardPage();
    } else {
        initPortalPage();
    }
});

// =====================================================================
//  LIBRARY LOADER — pulls Chart.js + SheetJS from a local vendor/ copy
//  if present, otherwise from the jsDelivr CDN. Cached after first call.
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
            const script = document.createElement("script");
            script.src = urls[i++];
            script.onload = () => resolve(script.src);
            script.onerror = () => {
                script.remove();
                next();
            };
            document.head.appendChild(script);
        })();
    });
}

// =====================================================================
//  THE EXCEL WORKBOOK
// =====================================================================
let workbookPromise = null;
function loadWorkbook() {
    if (workbookPromise) return workbookPromise;
    if (typeof XLSX === "undefined") return Promise.resolve(null);

    workbookPromise = fetch(EXCEL_URL)
        .then((r) => {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.arrayBuffer();
        })
        .then((buf) => {
            const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
            console.log("Excel connected — sheets:", wb.SheetNames);
            return wb;
        })
        .catch((err) => {
            console.error("Excel fetch failed:", err);
            return null;
        });
    return workbookPromise;
}

function wireCsvExport() {
    const button = document.getElementById("downloadExcelBtn");
    if (!button) return;
    button.addEventListener("click", () => {
        loadWorkbook().then((wb) => {
            if (!wb) return alert("Workbook not loaded yet — please try again in a moment.");
            const sheetName = wb.SheetNames.find((n) => n.trim() === "Database") || wb.SheetNames[0];
            const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = sheetName.trim() + ".csv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        });
    });
}

// =====================================================================
//  THE PORTAL  (login + access audit log + Excel export)
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
        const employeeName = USER_REGISTRY[typed];
        if (employeeName) {
            localStorage.setItem(STORAGE_KEY, "granted");
            recordEntry(employeeName);
            secretKeyInput.value = "";
            reveal();
        } else {
            alert("Access Denied. Invalid Private Identification Key.");
            secretKeyInput.value = "";
        }
    };

    if (accessButton) accessButton.addEventListener("click", verify);
    if (secretKeyInput) {
        secretKeyInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") verify();
        });
    }

    // Connect the workbook so the CSV export button works once revealed.
    ensureLibraries().then(() => {
        loadWorkbook();
        wireCsvExport();
    });

    // Returning members who already hold the token skip the gate.
    if (localStorage.getItem(STORAGE_KEY) === "granted") {
        reveal();
    } else {
        renderLogs();
    }
}

function recordEntry(employeeName) {
    const stamp = new Date().toLocaleString();
    const logs = JSON.parse(localStorage.getItem("accessLogs")) || [];
    logs.unshift("Entry: " + employeeName + " signed in at " + stamp);
    localStorage.setItem("accessLogs", JSON.stringify(logs));
}

function renderLogs() {
    const logList = document.getElementById("logList");
    if (!logList) return;
    const logs = JSON.parse(localStorage.getItem("accessLogs")) || [];
    logList.innerHTML = "";
    if (logs.length === 0) {
        appendLog(logList, "No entries yet — sign in to create the first audit record.");
        return;
    }
    logs.forEach((text) => appendLog(logList, "\u2705 " + text));
}

function appendLog(logList, text) {
    const li = document.createElement("li");
    li.className = "log-item";
    li.textContent = text;
    li.style.cssText =
        "padding:6px 4px; border-bottom:1px solid #222; font-family:monospace; font-size:13px; color:#93c5fd;";
    logList.appendChild(li);
}

// =====================================================================
//  THE DASHBOARD  (guarded; injects real charts + live countdown)
// =====================================================================
function initDashboardPage() {
    if (localStorage.getItem(STORAGE_KEY) !== "granted") {
        alert("Access Denied. Redirecting to Secure Entrance Gate.");
        window.location.href = "1-father.html";
        return;
    }

    startCountdown();

    ensureLibraries()
        .then(() => {
            renderDashboardCharts();
            loadWorkbook();
        })
        .catch((err) => console.error("Chart libraries failed to load:", err));
}

function startCountdown() {
    const el = document.getElementById("countdownClock");
    if (!el) return;
    let total = 15 * 60;
    setInterval(() => {
        total = total <= 0 ? 15 * 60 : total - 1;
        const m = String(Math.floor(total / 60)).padStart(2, "0");
        const s = String(total % 60).padStart(2, "0");
        el.textContent = m + ":" + s;
    }, 1000);
}

// ---- Chart config factories -----------------------------------------
function gaugeConfig(percent, color) {
    return {
        type: "doughnut",
        data: {
            labels: ["Completed", "Remaining"],
            datasets: [{ data: [percent, 100 - percent], backgroundColor: [color, "#222"], borderWidth: 0 }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            circumference: 180,
            rotation: -90,
            cutout: "75%",
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
        },
    };
}

function barConfig(values, color) {
    return {
        type: "bar",
        data: { labels: ["M", "T", "W", "T", "F"], datasets: [{ data: values, backgroundColor: color }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { display: false }, x: { display: false } },
            plugins: { legend: { display: false } },
        },
    };
}

function pieConfig(values, colors) {
    return {
        type: "pie",
        data: { labels: ["A", "B", "C"], datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
    };
}

// Inject a <canvas> into a container (clearing any placeholder background).
function injectCanvas(container, styleText) {
    container.style.backgroundImage = "none";
    container.style.background = "none";
    container.style.boxShadow = "none";
    container.style.border = "none";
    const canvas = document.createElement("canvas");
    canvas.style.cssText = styleText || "display:block; width:100%; height:100%;";
    container.appendChild(canvas);
    return canvas;
}

function renderDashboardCharts() {
    // ---- Gauges (injected above the giant metric numbers) ----
    const gauges = [
        { metricId: "palletReplenRate", percent: 75, color: "#c084fc" },
        { metricId: "caseReplenRate", percent: 60, color: "#fb923c" },
        { metricId: "palletStowRate", percent: 80, color: "#60a5fa" },
    ];
    gauges.forEach((g) => {
        const metric = document.getElementById(g.metricId);
        if (!metric) return;
        const holder = metric.closest(".gauge-placeholder") || metric.parentElement;
        const wrap = document.createElement("div");
        wrap.style.cssText = "position:relative; width:100%; max-width:150px; height:78px; margin:0 auto;";
        // Insert into the DOM BEFORE creating the chart so Chart.js can size it.
        holder.insertBefore(wrap, holder.firstChild);
        const canvas = document.createElement("canvas");
        canvas.style.cssText = "display:block; width:100%; height:100%;";
        wrap.appendChild(canvas);
        new Chart(canvas, gaugeConfig(g.percent, g.color));
    });

    // ---- Volume bar charts ----
    const bars = [
        { id: "palletReplenBarChart", data: [45, 60, 55, 70, 65], color: "#c084fc" },
        { id: "caseReplenBarChart", data: [30, 40, 35, 50, 45], color: "#fb923c" },
        { id: "palletStowBarChart", data: [50, 55, 60, 45, 65], color: "#60a5fa" },
    ];
    bars.forEach((b) => {
        const div = document.getElementById(b.id);
        if (!div) return;
        const canvas = injectCanvas(div, "display:block; width:100%; height:100%;");
        new Chart(canvas, barConfig(b.data, b.color));
    });

    // ---- Fast-start pie charts ----
    const pies = [
        { id: "replenQ1Pie", data: [40, 30, 30], colors: ["#3b82f6", "#8b5cf6", "#ec4899"] },
        { id: "palletStowQ1Pie", data: [35, 45, 20], colors: ["#fb923c", "#ef4444", "#f59e0b"] },
        { id: "replenQ2Pie", data: [50, 25, 25], colors: ["#10b981", "#3b82f6", "#6b7280"] },
        { id: "palletStowQ2Pie", data: [30, 30, 40], colors: ["#6366f1", "#a855f7", "#ec4899"] },
    ];
    pies.forEach((p) => {
        const div = document.getElementById(p.id);
        if (!div) return;
        div.style.width = "100px";
        div.style.height = "100px";
        const canvas = injectCanvas(div, "display:block; width:100%; height:100%;");
        new Chart(canvas, pieConfig(p.data, p.colors));
    });
}

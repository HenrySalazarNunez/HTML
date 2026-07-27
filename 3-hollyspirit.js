// =====================================================================
//  THE HOLY SPIRIT — the engine that gives life to the Father (HTML),
//  wears the Son (CSS) and connects everything to the Excel workbook.
//
//  This single file establishes every connection from zero:
//    1. Father (HTML)  <-> Son (CSS)     : the pages already <link> the CSS.
//    2. Father (HTML)  <-> Holy Spirit   : the pages <script> this file.
//    3. Holy Spirit    <-> Excel file    : loadWorkbook() fetches Developer.xlsm.
//    4. Login gate     <-> Dashboard     : localStorage flag guards the pages.
// =====================================================================

// ---- Configuration ---------------------------------------------------
const ACCESS_KEY = "1dc-operations"; // demo passkey for the members portal
const EXCEL_URL = "Developer.xlsm";  // workbook served next to this site
const STORAGE_KEY = "memberAccessStatus";

// A single cached promise so the workbook is only fetched/parsed once.
let workbookPromise = null;

// ---- Page detection --------------------------------------------------
const isDashboardPage = window.location.pathname.includes("1.1-dashboard");
const isPortalPage = () => document.getElementById("gatekeeper") !== null;

// ---- Boot ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    if (isPortalPage()) {
        initPortalPage();
    } else if (isDashboardPage) {
        initDashboardPage();
    }
});

// =====================================================================
//  CONNECTION 3: THE EXCEL WORKBOOK
// =====================================================================
function loadWorkbook() {
    if (workbookPromise) return workbookPromise;

    if (typeof XLSX === "undefined") {
        console.warn("XLSX library not loaded — cannot connect to the workbook.");
        return Promise.resolve(null);
    }

    workbookPromise = fetch(EXCEL_URL)
        .then((response) => {
            if (!response.ok) throw new Error("HTTP " + response.status);
            return response.arrayBuffer();
        })
        .then((buffer) => {
            const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
            console.log("Excel connected — sheets:", workbook.SheetNames);
            return workbook;
        })
        .catch((err) => {
            console.error("Excel fetch failed:", err);
            return null;
        });

    return workbookPromise;
}

function sheetRows(workbook, sheetName) {
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
}

// =====================================================================
//  CONNECTION 1+2: THE PORTAL (Father + Son + Holy Spirit)
// =====================================================================
function initPortalPage() {
    const gate = document.getElementById("gatekeeper");
    const content = document.getElementById("protectedContent");
    const keyInput = document.getElementById("secretKey");
    const button = document.getElementById("accessButton");

    const unlock = () => {
        gate.style.display = "none";
        content.style.display = "block";
        onPortalUnlocked();
    };

    const verify = () => {
        const entered = (keyInput.value || "").trim().toLowerCase();
        if (entered !== ACCESS_KEY) {
            showGateError("Access denied — invalid passkey.");
            return;
        }
        localStorage.setItem(STORAGE_KEY, "granted");
        unlock();
    };

    button.addEventListener("click", verify);
    keyInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") verify();
    });

    // Returning members who already unlocked skip the gate.
    if (localStorage.getItem(STORAGE_KEY) === "granted") {
        unlock();
    }
}

function showGateError(message) {
    let el = document.getElementById("gateError");
    if (!el) {
        el = document.createElement("p");
        el.id = "gateError";
        el.style.cssText = "color:#f87171; font-size:14px; margin:10px 0 0 0;";
        document.querySelector(".lock-box").appendChild(el);
    }
    el.textContent = message;
}

// Fired once the portal is unlocked: draw charts + connect the workbook.
function onPortalUnlocked() {
    renderPortalCharts();

    loadWorkbook().then((workbook) => {
        if (!workbook) return;
        populateEntryLogs(workbook);
        wireCsvExport(workbook);
    });
}

function renderPortalCharts() {
    if (typeof Chart === "undefined") return;

    const gauge = document.getElementById("gaugeChart");
    if (gauge) {
        new Chart(gauge, {
            type: "doughnut",
            data: {
                labels: ["Completed", "Remaining"],
                datasets: [{ data: [72, 28], backgroundColor: ["#a855f7", "#222"], borderWidth: 0 }],
            },
            options: { circumference: 180, rotation: -90, cutout: "75%", plugins: { legend: { display: false } } },
        });
    }

    const pie = document.getElementById("pieChart");
    if (pie) {
        new Chart(pie, {
            type: "pie",
            data: {
                labels: ["Pallet Replen", "Case Replen", "Pallet Stow"],
                datasets: [{ data: [45, 35, 20], backgroundColor: ["#3b82f6", "#fb923c", "#10b981"], borderWidth: 0 }],
            },
        });
    }
}

// The workbook drives the "System Entry Logs" terminal.
function populateEntryLogs(workbook) {
    const list = document.getElementById("logList");
    if (!list) return;

    list.innerHTML = "";
    addLogEntry(list, "Connected to " + EXCEL_URL + " (" + workbook.SheetNames.length + " sheets)");

    workbook.SheetNames.forEach((name) => {
        const rows = sheetRows(workbook, name);
        addLogEntry(list, name.trim() + " — " + rows.length + " rows");
    });
}

function addLogEntry(list, text) {
    const li = document.createElement("li");
    li.textContent = "› " + text;
    li.style.cssText = "padding:6px 4px; border-bottom:1px solid #222; font-family:monospace; font-size:13px; color:#93c5fd;";
    list.appendChild(li);
}

// The workbook also powers the "Export Sheet (.csv)" button.
function wireCsvExport(workbook) {
    const button = document.getElementById("downloadExcelBtn");
    if (!button) return;

    button.addEventListener("click", () => {
        const sheetName =
            workbook.SheetNames.find((n) => n.trim() === "Database") || workbook.SheetNames[0];
        const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = sheetName.trim() + ".csv";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    });
}

// =====================================================================
//  THE DASHBOARD (Father + Son + Holy Spirit + Excel)
// =====================================================================
function initDashboardPage() {
    if (localStorage.getItem(STORAGE_KEY) !== "granted") {
        alert("Access Denied. Redirecting to Secure Entrance Gate.");
        window.location.href = "1-father.html";
        return;
    }

    renderDashboardCharts();
    loadWorkbook().then((workbook) => {
        if (workbook) console.log("Dashboard connected to workbook sheets:", workbook.SheetNames);
    });
}

function renderDashboardCharts() {
    if (typeof Chart === "undefined") return;

    const gaugeConfig = (value, color) => ({
        type: "doughnut",
        data: {
            labels: ["Completed", "Remaining"],
            datasets: [{ data: [value, 100 - value], backgroundColor: [color, "#222"], borderWidth: 0 }],
        },
        options: { circumference: 180, rotation: -90, cutout: "80%", plugins: { legend: { display: false } } },
    });

    const barConfig = (values, color) => ({
        type: "bar",
        data: {
            labels: ["M", "T", "W", "T", "F"],
            datasets: [{ data: values, backgroundColor: color }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { display: false }, x: { display: false } },
            plugins: { legend: { display: false } },
        },
    });

    const pieConfig = (values, colors) => ({
        type: "pie",
        data: { labels: ["A", "B", "C"], datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] },
    });

    const charts = [
        ["dashboardGaugeChart", gaugeConfig(75, "#a855f7")],
        ["dashboardBarChart", barConfig([45, 60, 55, 70, 65], "#a855f7")],
        ["gaugeChart", gaugeConfig(60, "#fb923c")],
        ["caseReplenVolumeBarChart", barConfig([30, 40, 35, 50, 45], "#fb923c")],
        ["palletStowGaugeChart", gaugeConfig(80, "#60a5fa")],
        ["palletStowVolumeBarChart", barConfig([50, 55, 60, 45, 65], "#60a5fa")],
        ["dashboardPieChart", pieConfig([40, 30, 30], ["#3b82f6", "#8b5cf6", "#ec4899"])],
        ["replenQ1PieCanvas", pieConfig([35, 45, 20], ["#fb923c", "#ef4444", "#f59e0b"])],
        ["palletStowQ1PieCanvas", pieConfig([50, 25, 25], ["#10b981", "#3b82f6", "#6b7280"])],
        ["replenQ2PieCanvas", pieConfig([30, 30, 40], ["#6366f1", "#a855f7", "#ec4899"])],
    ];

    charts.forEach(([id, config]) => {
        const canvas = document.getElementById(id);
        if (canvas) new Chart(canvas, config);
    });
}

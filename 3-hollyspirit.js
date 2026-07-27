// ===================================================
// THE HOLY SPIRIT: MEMBERS-ONLY IDENTITY VAULT
// ===================================================

// ---------------------------------------------------
// 1. CHECKPOINT GUARD (SECURES THE BACKDOOR)
// ---------------------------------------------------
const isDashboardPage = window.location.href.includes('1.1-dashboard.html');

if (isDashboardPage) {
    const accessStatus = localStorage.getItem('memberAccessStatus');
    if (accessStatus !== 'granted') {
        alert('Access Denied. Redirecting to Secure Entrance Gate.');
        window.location.href = '1-father.html';
    }
}

// ---------------------------------------------------
// 2. MAIN LOCKBOX SYSTEM (RUNS ON HOME PAGE)
// ---------------------------------------------------
const gatekeeper = document.getElementById('gatekeeper');
const protectedContent = document.getElementById('protectedContent');
const secretKeyInput = document.getElementById('secretKey');
const accessButton = document.getElementById('accessButton');
const logList = document.getElementById('logList');

const USER_REGISTRY = {
    "IloveMyWork!": "System Creator (Henry)",
    "I love my work": "System Creator (Henry)",
    "Henry777": "Henry Salazar",             
    "John123": "John Doe",                    
    "Alpha777": "Team Alpha Leader",           
    "Manager99": "Shift Operations Manager"    
};

if (accessButton) {
    accessButton.addEventListener('click', () => {
        const userTyped = secretKeyInput.value.trim();

        if (USER_REGISTRY[userTyped]) {
            const employeeName = USER_REGISTRY[userTyped];
            localStorage.setItem('memberAccessStatus', 'granted');

            if (gatekeeper) gatekeeper.style.display = 'none';
            if (protectedContent) protectedContent.setAttribute('style', 'display: block !important;');

            const currentTimestamp = new Date().toLocaleString();
            const entryMessage = `✅ Entry: ${employeeName} signed in at ${currentTimestamp}`;

            let savedLogs = JSON.parse(localStorage.getItem('accessLogs')) || [];
            savedLogs.unshift(entryMessage);
            localStorage.setItem('accessLogs', JSON.stringify(savedLogs));

            renderLogs();
            initDashboardCharts();
            secretKeyInput.value = ''; 
        } else {
            alert('Access Denied. Invalid Private Identification Key.');
            secretKeyInput.value = ''; 
        }
    });
}

function renderLogs() {
    if (!logList) return;
    let savedLogs = JSON.parse(localStorage.getItem('accessLogs')) || [];
    logList.innerHTML = ''; 
    savedLogs.forEach(log => {
        const li = document.createElement('li');
        li.className = 'log-item';
        li.textContent = log;
        logList.appendChild(li);
    });
}

if (logList) {
    renderLogs();
}

// ---------------------------------------------------
// 3. MASTER OPERATIONS MULTI-CHART DRAWING ENGINE
// ---------------------------------------------------
function initDashboardCharts() {
    
    // --- ROW 1: PALLET REPLEN TRACKERS ---
    const ctxPalletGauge = document.getElementById('dashboardGaugeChart');
    if (ctxPalletGauge) {
        new Chart(ctxPalletGauge.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{ data:, backgroundColor: ['#a855f7', '#222'], borderWidth: 0 }]
            },
            options: { circumference: 180, rotation: -90, plugins: { legend: { display: false } }, cutout: '80%' }
        });
    }

    const ctxPalletBar = document.getElementById('dashboardBarChart');
    if (ctxPalletBar) {
        new Chart(ctxPalletBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['M', 'T', 'W', 'T', 'F'],
                datasets: [{ data:, backgroundColor: '#a855f7' }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { display: false }, x: { display: false } }, plugins: { legend: { display: false } } }
        });
    }

    // --- ROW 2: CASE REPLEN TRACKERS ---
    const ctxCaseGauge = document.getElementById('gaugeChart');
    if (ctxCaseGauge) {
        new Chart(ctxCaseGauge.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{ data:, backgroundColor: ['#fb923c', '#222'], borderWidth: 0 }]
            },
            options: { circumference: 180, rotation: -90, plugins: { legend: { display: false } }, cutout: '80%' }
        });
    }

    const ctxCaseBar = document.getElementById('caseReplenVolumeBarChart');
    if (ctxCaseBar) {
        new Chart(ctxCaseBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['M', 'T', 'W', 'T', 'F'],
                datasets: [{ data:, backgroundColor: '#fb923c' }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { display: false }, x: { display: false } }, plugins: { legend: { display: false } } }
        });
    }

    // --- ROW 3: PALLET STOW TRACKERS ---
    const ctxStowGauge = document.getElementById('pieChart');
    if (ctxStowGauge) {
        new Chart(ctxStowGauge.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{ data:, backgroundColor: ['#60a5fa', '#222'], borderWidth: 0 }]
            },
            options: { circumference: 180, rotation: -90, plugins: { legend: { display: false } }, cutout: '80%' }
        });
    }

    const ctxStowBar = document.getElementById('palletStowVolumeBarChart');
    if (ctxStowBar) {
        new Chart(ctxStowBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['M', 'T', 'W', 'T', 'F'],
                datasets: [{ data:, backgroundColor: '#60a5fa' }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { display: false }, x: { display: false } }, plugins: { legend: { display: false } } }
        });
    }

    // --- ROW 4: FAST START PIE QUADRANTS ---
    const ctxQ1Replen = document.getElementById('dashboardPieChart');
    if (ctxQ1Replen) {
        new Chart(ctxQ1Replen.getContext('2d'), {
            type: 'pie',
            data: { datasets: [{ data:, backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899'], borderWidth: 0 }] }
        });
    }

    const ctxQ1Stow = document.getElementById('replenQ1PieCanvas');
    if (ctxQ1Stow) {
        new Chart(ctxQ1Stow.getContext('2d'), {
            type: 'pie',
            data: { datasets: [{ data:, backgroundColor: ['#fb923c', '#ef4444', '#f59e0b'], borderWidth: 0 }] }
        });
    }

    const ctxQ2Replen = document.getElementById('palletStowQ1PieCanvas');
    if (ctxQ2Replen) {
        new Chart(ctxQ2Replen.getContext('2d'), {
            type: 'pie',
            data: { datasets: [{ data:, backgroundColor: ['#10b981', '#3b82f6', '#6b7280'], borderWidth: 0 }] }
        });
    }

    const ctxQ2Stow = document.getElementById('replenQ2PieCanvas');
    if (ctxQ2Stow) {
        new Chart(ctxQ2Stow.getContext('2d'), {
            type: 'pie',
            data: { datasets: [{ data:, backgroundColor: ['#6366f1', '#a855f7', '#ec4899'], borderWidth: 0 }] }
        });
    }

    // --- CLOUD EXCEL DOCUMENT DATA CONTEXT PULL ---
    const cloudExcelUrl = "https://githubusercontent.com";
    if (typeof XLSX === 'undefined') return;

    fetch(cloudExcelUrl)
        .then(response => response.arrayBuffer())
        .then(buffer => {
            const data = new Uint8Array(buffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const excelRows = XLSX.utils.sheet_to_json(worksheet);
            console.log("Master Spreadsheet Rows Loaded:", excelRows);
        })
        .catch(err => console.error("Cloud connection failed:", err));
}

// Auto-run chart initialization instantly upon script execution
if (isDashboardPage && localStorage.getItem('memberAccessStatus') === 'granted') {
    initDashboardCharts();
}
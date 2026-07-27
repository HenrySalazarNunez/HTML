// ===================================================
// THE HOLY SPIRIT: MEMBERS-ONLY IDENTITY VAULT
// ===================================================

const isDashboardPage = window.location.href.includes('1.1-dashboard.html');

if (isDashboardPage) {
    const accessStatus = localStorage.getItem('memberAccessStatus');
    if (accessStatus !== 'granted') {
        alert('Access Denied. Redirecting to Secure Entrance Gate.');
        window.location.href = '1-father.html';
    }
}

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

function initDashboardCharts() {
    
    // --- ROW 1: PALLET REPLEN TRACKERS ---
    const ctxPalletGauge = document.getElementById('dashboardGaugeChart');
    if (ctxPalletGauge) {
        new Chart(ctxPalletGauge.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: new Array('Completed', 'Remaining'),
                datasets: [{ data: new Array(75, 25), backgroundColor: new Array('#a855f7', '#222'), borderWidth: 0 }]
            },
            options: { circumference: 180, rotation: -90, plugins: { legend: { display: false } }, cutout: '80%' }
        });
    }

    const ctxPalletBar = document.getElementById('dashboardBarChart');
    if (ctxPalletBar) {
        new Chart(ctxPalletBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: new Array('M', 'T', 'W', 'T', 'F'),
                datasets: [{ data: new Array(45, 60, 55, 70, 65), backgroundColor: '#a855f7' }]
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
                labels: new Array('Completed', 'Remaining'),
                datasets: [{ data: new Array(60, 40), backgroundColor: new Array('#fb923c', '#222'), borderWidth: 0 }]
            },
            options: { circumference: 180, rotation: -90, plugins: { legend: { display: false } }, cutout: '80%' }
        });
    }

    const ctxCaseBar = document.getElementById('caseReplenVolumeBarChart');
    if (ctxCaseBar) {
        new Chart(ctxCaseBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: new Array('M', 'T', 'W', 'T', 'F'),
                datasets: [{ data: new Array(30, 40, 35, 50, 45), backgroundColor: '#fb923c' }]
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
                labels: new Array('Completed', 'Remaining'),
                datasets: [{ data: new Array(80, 20), backgroundColor: new Array('#60a5fa', '#222'), borderWidth: 0 }]
            },
            options: { circumference: 180, rotation: -90, plugins: { legend: { display: false } }, cutout: '80%' }
        });
    }

    const ctxStowBar = document.getElementById('palletStowVolumeBarChart');
    if (ctxStowBar) {
        new Chart(ctxStowBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: new Array('M', 'T', 'W', 'T', 'F'),
                datasets: [{ data: new Array(50, 55, 60, 45, 65), backgroundColor: '#60a5fa' }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { display: false }, x: { display: false } }, plugins: { legend: { display: false } } }
        });
    }

    // --- ROW 4: FAST START PIE QUADRANTS ---
    const ctxQ1Replen = document.getElementById('dashboardPieChart');
    if (ctxQ1Replen) {
        new Chart(ctxQ1Replen.getContext('2d'), {
            type: 'pie',
            data: { 
                labels: new Array('A', 'B', 'C'),
                datasets: [{ data: new Array(40, 30, 30), backgroundColor: new Array('#3b82f6', '#8b5cf6', '#ec4899'), borderWidth: 0 }] 
            }
        });
    }

    const ctxQ1Stow = document.getElementById('replenQ1PieCanvas');
    if (ctxQ1Stow) {
        new Chart(ctxQ1Stow.getContext('2d'), {
            type: 'pie',
            data: { 
                labels: new Array('A', 'B', 'C'),
                datasets: [{ data: new Array(35, 45, 20), backgroundColor: new Array('#fb923c', '#ef4444', '#f59e0b'), borderWidth: 0 }] 
            }
        });
    }

    const ctxQ2Replen = document.getElementById('palletStowQ1PieCanvas');
    if (ctxQ2Replen) {
        new Chart(ctxQ2Replen.getContext('2d'), {
            type: 'pie',
            data: { 
                labels: new Array('A', 'B', 'C'),
                datasets: [{ data: new Array(50, 25, 25), backgroundColor: new Array('#10b981', '#3b82f6', '#6b7280'), borderWidth: 0 }] 
            }
        });
    }

    const ctxQ2Stow = document.getElementById('replenQ2PieCanvas');
    if (ctxQ2Stow) {
        new Chart(ctxQ2Stow.getContext('2d'), {
            type: 'pie',
            data: { 
                labels: new Array('A', 'B', 'C'),
                datasets: [{ data: new Array(30, 30, 40), backgroundColor: new Array('#6366f1', '#a855f7', '#ec4899'), borderWidth: 0 }] 
            }
        });
    }

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

if (isDashboardPage && localStorage.getItem('memberAccessStatus') === 'granted') {
    initDashboardCharts();
}
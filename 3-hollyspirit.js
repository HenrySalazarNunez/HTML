// ===================================================
// THE HOLY SPIRIT: MEMBERS-ONLY IDENTITY VAULT
// ===================================================

// ---------------------------------------------------
// 1. CHECKPOINT GUARD (SECURES THE BACKDOOR)
// ---------------------------------------------------
const isDashboardPage = window.location.href.includes('1.1-dashboard.html');

if (isDashboardPage) {
    // Check if the browser cabinet holds the authorized digital token
    const accessStatus = localStorage.getItem('memberAccessStatus');
    
    // If they don't have the digital token, instantly kick them back to the gate
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
const downloadExcelBtn = document.getElementById('downloadExcelBtn');

// THE IDENTITY ROSTER: Maps unique, customized keys directly to names
const USER_REGISTRY = {
    "IloveMyWork!": "System Creator (Henry)",
    "I love my work": "System Creator (Henry)",
    "Henry777": "Henry Salazar",             // Your custom unique signature key
    "John123": "John Doe",                    // Coworker Key 1
    "Alpha777": "Team Alpha Leader",           // Coworker Key 2
    "Manager99": "Shift Operations Manager"    // Coworker Key 3
};

if (accessButton) {
    accessButton.addEventListener('click', () => {
        // Safe check to make sure the text field exists before pulling its value
        if (!secretKeyInput) {
            alert("Error: Input element with id 'secretKey' missing from HTML framework layout.");
            return;
        }

        // Read text and remove any accidental edge trailing spaces
        const userTyped = secretKeyInput.value.trim();

        // Validate if the input matches any key inside our custom roster dictionary
        if (USER_REGISTRY[userTyped]) {
            const employeeName = USER_REGISTRY[userTyped];

            // 1. Issue the digital token keycard into browser memory
            localStorage.setItem('memberAccessStatus', 'granted');

            // 2. Clear out the lock filter screen overlay
            if (gatekeeper) gatekeeper.style.display = 'none';
            if (protectedContent) protectedContent.setAttribute('style', 'display: block !important;');

            // 3. SECURE TIME AUDIT: Record the exact sign-in second with their name
            const currentTimestamp = new Date().toLocaleString();
            const entryMessage = `✅ Entry: ${employeeName} signed in at ${currentTimestamp}`;

            let savedLogs = JSON.parse(localStorage.getItem('accessLogs')) || [];
            savedLogs.unshift(entryMessage);
            localStorage.setItem('accessLogs', JSON.stringify(savedLogs));

            renderLogs();
            
            // 4. TRIGGER DASHBOARD CHARTS AUTO-LOAD ENGINE
            initDashboardCharts();
            
            secretKeyInput.value = ''; // Empty out input field for security

        } else {
            // FAIL: If the key isn't in the identity vault roster
            alert('Access Denied. Invalid Private Identification Key.');
            secretKeyInput.value = ''; 
        }
    });
}

// Helper to grab saved logs from the hard drive database and show them in HTML
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
// 3. LIVE EXCEL FETCH ENGINE & AUTOMATED VISUALIZATION LOOP
// ---------------------------------------------------
function initDashboardCharts() {
    // A. SET UP THE GAUGE CHART (Doughnut styled as a speedometer half-circle)
    const ctxGauge = document.getElementById('gaugeChart');
    if (ctxGauge) {
        const gaugeChart = new Chart(ctxGauge.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    data:, // Hardcoded template values to avoid script syntax parsing errors
                    backgroundColor: ['#059669', '#222'], // Green indicator, Dark background slot
                    borderWidth: 0
                }]
            },
            options: {
                circumference: 180, // Cut the full layout circle directly in half
                rotation: -90,      // Orient the opening downward like a traditional dial speedometer
                plugins: { legend: { display: false } },
                cutout: '80%'       // Makes the center hollow to create the needle track look
            }
        });
    }

    // B. SET UP THE PIE CHART
    const ctxPie = document.getElementById('pieChart');
    if (ctxPie) {
        const pieChart = new Chart(ctxPie.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Category A', 'Category B', 'Category C'],
                datasets: [{
                    data:, // Hardcoded template values to avoid script syntax parsing errors
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899'], // Blue, Purple, Pink colors
                    borderColor: '#111',
                    borderWidth: 2
                }]
            },
            options: {
                plugins: { legend: { labels: { color: '#ccc' } } }
            }
        });
    }

    // C. AUTO-FETCH DATA STREAM FROM YOUR EXCEL CLOUD SHEET
    const cloudExcelUrl = "https://githubusercontent.com";

    if (typeof XLSX === 'undefined') {
        console.warn("SheetJS XLSX engine not loaded yet. Skipping cloud document stream pull.");
        return;
    }

    fetch(cloudExcelUrl)
        .then(response => {
            if (!response.ok) throw new Error("Cloud spreadsheet stream unreadable");
            return response.arrayBuffer();
        })
        .then(buffer => {
            const data = new Uint8Array(buffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Access the first data sheet inside the file
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Turn row data metrics directly into clean, actionable Javascript arrays
            const excelRows = XLSX.utils.sheet_to_json(worksheet);
            console.log("Cloud Dashboard Data Connection Active:", excelRows);
        })
        .catch(err => console.error("Cloud Dashboard data synchronization failed:", err));
}

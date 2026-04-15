// ============================================================
// CCleanKILLER — Application Logic
// ============================================================

// State
let scanResults = [];
let selectedTargets = new Set();
let currentFilter = 'all';

// ============================================================
// MOCK DATA (for UI demonstration without PowerShell backend)
// In production, this calls scanner.ps1 via the launcher
// ============================================================

const DEMO_MODE = true; // Set to false when using with launcher.bat

const mockScanResults = [
    {
        Id: "ccleaner",
        Name: "CCleaner",
        Category: "Core",
        DetectOnly: false,
        Note: null,
        IsDetected: true,
        TotalSizeBytes: 156237824,
        FoundPaths: [
            "C:\\Program Files\\CCleaner",
            "C:\\ProgramData\\CCleaner",
            "C:\\Users\\User\\AppData\\Roaming\\CCleaner"
        ],
        FoundRegistryKeys: [
            "HKLM:\\SOFTWARE\\Piriform\\CCleaner",
            "HKCU:\\SOFTWARE\\Piriform\\CCleaner"
        ],
        FoundServices: [
            { Name: "CCleanerPerformanceOptimizerService", DisplayName: "CCleaner Performance Optimizer", Status: "Running" }
        ],
        FoundScheduledTasks: [
            { Name: "CCleaner Update", State: "Ready" },
            { Name: "CCleanerSkipUAC", State: "Ready" }
        ],
        FoundStartupEntries: [
            { Name: "CCleaner Smart Cleaning", Location: "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" }
        ],
        FoundUninstallEntries: [
            { DisplayName: "CCleaner", UninstallString: "\"C:\\Program Files\\CCleaner\\uninst.exe\"" }
        ]
    },
    {
        Id: "ccleaner_browser",
        Name: "CCleaner Browser",
        Category: "Bundled",
        DetectOnly: false,
        Note: null,
        IsDetected: true,
        TotalSizeBytes: 245366784,
        FoundPaths: [
            "C:\\Program Files\\CCleaner Browser",
            "C:\\Users\\User\\AppData\\Local\\CCleaner Browser"
        ],
        FoundRegistryKeys: [
            "HKLM:\\SOFTWARE\\CCleaner Browser",
            "HKLM:\\SOFTWARE\\Clients\\StartMenuInternet\\CCleaner Browser"
        ],
        FoundServices: [],
        FoundScheduledTasks: [
            { Name: "CCleanerBrowserUpdateTask", State: "Ready" }
        ],
        FoundStartupEntries: [],
        FoundUninstallEntries: [
            { DisplayName: "CCleaner Browser", UninstallString: "\"C:\\Program Files\\CCleaner Browser\\Installer\\setup.exe\" --uninstall" }
        ]
    },
    {
        Id: "avast",
        Name: "Avast Free Antivirus",
        Category: "Bundled",
        DetectOnly: false,
        Note: null,
        IsDetected: true,
        TotalSizeBytes: 523698176,
        FoundPaths: [
            "C:\\Program Files\\Avast Software",
            "C:\\ProgramData\\Avast Software"
        ],
        FoundRegistryKeys: [
            "HKLM:\\SOFTWARE\\Avast Software",
            "HKLM:\\SOFTWARE\\AVAST Software"
        ],
        FoundServices: [
            { Name: "AvastSvc", DisplayName: "Avast Antivirus Service", Status: "Running" },
            { Name: "aswbIDSAgent", DisplayName: "Avast IDS Agent", Status: "Running" }
        ],
        FoundScheduledTasks: [
            { Name: "Avast Emergency Update", State: "Ready" }
        ],
        FoundStartupEntries: [
            { Name: "AvastUI.exe", Location: "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" }
        ],
        FoundUninstallEntries: [
            { DisplayName: "Avast Free Antivirus", UninstallString: "\"C:\\Program Files\\Avast Software\\Avast\\setup\\instup.exe\" /control_panel" }
        ]
    },
    {
        Id: "avast_browser",
        Name: "Avast Secure Browser",
        Category: "Bundled",
        DetectOnly: false,
        Note: null,
        IsDetected: true,
        TotalSizeBytes: 198451200,
        FoundPaths: [
            "C:\\Program Files\\Avast Software\\Browser"
        ],
        FoundRegistryKeys: [
            "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Avast Secure Browser"
        ],
        FoundServices: [],
        FoundScheduledTasks: [],
        FoundStartupEntries: [],
        FoundUninstallEntries: [
            { DisplayName: "Avast Secure Browser", UninstallString: "\"C:\\Program Files\\Avast Software\\Browser\\setup.exe\" --uninstall" }
        ]
    },
    {
        Id: "recuva",
        Name: "Recuva",
        Category: "Piriform",
        DetectOnly: false,
        Note: null,
        IsDetected: true,
        TotalSizeBytes: 12582912,
        FoundPaths: [
            "C:\\Program Files\\Recuva"
        ],
        FoundRegistryKeys: [
            "HKLM:\\SOFTWARE\\Piriform\\Recuva"
        ],
        FoundServices: [],
        FoundScheduledTasks: [],
        FoundStartupEntries: [],
        FoundUninstallEntries: [
            { DisplayName: "Recuva", UninstallString: "\"C:\\Program Files\\Recuva\\uninst.exe\"" }
        ]
    },
    {
        Id: "chrome_bundled",
        Name: "Google Chrome (CCleaner Bundle)",
        Category: "Offer",
        DetectOnly: true,
        Note: "Google Chrome may have been installed via CCleaner offer. Only flagged for awareness — not auto-removed.",
        IsDetected: true,
        TotalSizeBytes: 0,
        FoundPaths: [],
        FoundRegistryKeys: [],
        FoundServices: [],
        FoundScheduledTasks: [],
        FoundStartupEntries: [],
        FoundUninstallEntries: []
    },
    {
        Id: "telemetry",
        Name: "CCleaner/Piriform Telemetry",
        Category: "Telemetry",
        DetectOnly: false,
        Note: null,
        IsDetected: true,
        TotalSizeBytes: 4194304,
        FoundPaths: [
            "C:\\ProgramData\\Piriform",
            "C:\\Users\\User\\AppData\\Roaming\\Piriform"
        ],
        FoundRegistryKeys: [
            "HKLM:\\SOFTWARE\\Piriform",
            "HKCU:\\SOFTWARE\\Piriform"
        ],
        FoundServices: [],
        FoundScheduledTasks: [],
        FoundStartupEntries: [],
        FoundUninstallEntries: []
    }
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showSection(sectionId) {
    document.querySelectorAll('.main > section').forEach(s => s.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');
}

function setStatus(text, state = '') {
    const badge = document.getElementById('statusBadge');
    badge.className = 'status-badge ' + state;
    badge.querySelector('.status-text').textContent = text;
}

// ============================================================
// SCAN
// ============================================================

async function runScan() {
    showSection('scanningSection');
    setStatus('Scanning...', 'scanning');

    const details = [
        'Checking installed programs...',
        'Scanning file system paths...',
        'Inspecting registry keys...',
        'Checking Windows services...',
        'Looking for scheduled tasks...',
        'Checking startup entries...',
        'Scanning for telemetry...',
        'Calculating sizes...',
        'Finalizing results...'
    ];

    const fill = document.getElementById('progressFill');
    const detailEl = document.getElementById('scanDetail');

    for (let i = 0; i < details.length; i++) {
        detailEl.textContent = details[i];
        fill.style.width = ((i + 1) / details.length * 100) + '%';
        await sleep(300 + Math.random() * 400);
    }

    if (DEMO_MODE) {
        scanResults = mockScanResults;
    } else {
        // Production: call PowerShell scanner
        try {
            const response = await fetch('http://localhost:8765/scan');
            scanResults = await response.json();
        } catch (e) {
            console.error('Scanner error:', e);
            scanResults = [];
        }
    }

    displayResults();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// DISPLAY RESULTS
// ============================================================

function displayResults() {
    const detected = scanResults.filter(r => r.IsDetected);
    
    if (detected.length === 0) {
        showSection('resultsSection');
        setStatus('Clean', '');
        document.getElementById('resultsTitle').textContent = 'System is Clean! ✨';
        document.getElementById('resultsSummary').textContent = 'No CCleaner or related bloatware detected.';
        document.getElementById('resultsGrid').innerHTML = `
            <div class="no-detections">
                <div class="clean-icon">
                    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="2.5" fill="none"/>
                        <path d="M20 32L28 40L44 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h3>All Clear!</h3>
                <p>No traces of CCleaner or related bloatware found on your system.</p>
            </div>
        `;
        document.querySelector('.results-actions').style.display = 'none';
        document.getElementById('categoryTabs').style.display = 'none';
        return;
    }

    const totalSize = detected.reduce((sum, r) => sum + (r.TotalSizeBytes || 0), 0);
    
    showSection('resultsSection');
    setStatus(`${detected.length} detected`, '');
    document.getElementById('resultsTitle').textContent = `Found ${detected.length} Items`;
    document.getElementById('resultsSummary').textContent = `${formatBytes(totalSize)} of bloatware detected on your system`;
    document.querySelector('.results-actions').style.display = '';
    document.getElementById('categoryTabs').style.display = '';

    // Update category counts
    const cats = { Core: 0, Bundled: 0, Piriform: 0, Offer: 0, Telemetry: 0 };
    detected.forEach(r => { if (cats[r.Category] !== undefined) cats[r.Category]++; });
    document.getElementById('countAll').textContent = detected.length;
    Object.keys(cats).forEach(c => {
        const el = document.getElementById('count' + c);
        if (el) el.textContent = cats[c];
    });

    // Pre-select all non-detect-only items
    selectedTargets.clear();
    detected.forEach(r => {
        if (!r.DetectOnly) selectedTargets.add(r.Id);
    });

    renderCards(detected);
}

function renderCards(items) {
    const grid = document.getElementById('resultsGrid');
    const filtered = currentFilter === 'all' ? items : items.filter(r => r.Category === currentFilter);
    
    grid.innerHTML = filtered.map(item => createCard(item)).join('');
}

function createCard(item) {
    const isSelected = selectedTargets.has(item.Id);
    const cardClass = `detection-card ${isSelected ? 'selected' : ''} ${item.DetectOnly ? 'detect-only' : ''}`;
    
    // Build detail badges
    let badges = '';
    if (item.FoundPaths?.length) {
        badges += `<span class="detail-badge"><span class="detail-icon">📁</span>${item.FoundPaths.length} path${item.FoundPaths.length > 1 ? 's' : ''}</span>`;
    }
    if (item.FoundRegistryKeys?.length) {
        badges += `<span class="detail-badge"><span class="detail-icon">🔑</span>${item.FoundRegistryKeys.length} reg key${item.FoundRegistryKeys.length > 1 ? 's' : ''}</span>`;
    }
    if (item.FoundServices?.length) {
        badges += `<span class="detail-badge"><span class="detail-icon">⚙️</span>${item.FoundServices.length} service${item.FoundServices.length > 1 ? 's' : ''}</span>`;
    }
    if (item.FoundScheduledTasks?.length) {
        badges += `<span class="detail-badge"><span class="detail-icon">⏰</span>${item.FoundScheduledTasks.length} task${item.FoundScheduledTasks.length > 1 ? 's' : ''}</span>`;
    }
    if (item.FoundStartupEntries?.length) {
        badges += `<span class="detail-badge"><span class="detail-icon">🚀</span>${item.FoundStartupEntries.length} startup</span>`;
    }
    if (item.FoundUninstallEntries?.length) {
        badges += `<span class="detail-badge"><span class="detail-icon">🗑️</span>Has uninstaller</span>`;
    }

    // Build expandable details
    let expandContent = '';
    if (item.FoundPaths?.length) {
        expandContent += `
            <div class="expand-section">
                <div class="expand-title">File Paths</div>
                <ul class="expand-list">${item.FoundPaths.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
            </div>`;
    }
    if (item.FoundRegistryKeys?.length) {
        expandContent += `
            <div class="expand-section">
                <div class="expand-title">Registry Keys</div>
                <ul class="expand-list">${item.FoundRegistryKeys.map(k => `<li>${escapeHtml(k)}</li>`).join('')}</ul>
            </div>`;
    }
    if (item.FoundServices?.length) {
        expandContent += `
            <div class="expand-section">
                <div class="expand-title">Services</div>
                <ul class="expand-list">${item.FoundServices.map(s => `<li>${escapeHtml(s.DisplayName || s.Name)} (${s.Status})</li>`).join('')}</ul>
            </div>`;
    }
    if (item.FoundScheduledTasks?.length) {
        expandContent += `
            <div class="expand-section">
                <div class="expand-title">Scheduled Tasks</div>
                <ul class="expand-list">${item.FoundScheduledTasks.map(t => `<li>${escapeHtml(t.Name)} (${t.State})</li>`).join('')}</ul>
            </div>`;
    }

    const note = item.Note ? `<div class="card-note">ℹ️ ${escapeHtml(item.Note)}</div>` : '';

    return `
        <div class="${cardClass}" data-id="${item.Id}" data-category="${item.Category}" onclick="toggleCard('${item.Id}')">
            <div class="card-header">
                <div class="card-checkbox">
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="2 7 5.5 10.5 12 3.5"/>
                    </svg>
                </div>
                <div class="card-info">
                    <div class="card-name">${escapeHtml(item.Name)}</div>
                    <span class="card-category category-${item.Category}">${item.Category}</span>
                </div>
                ${item.TotalSizeBytes > 0 ? `<div class="card-size">${formatBytes(item.TotalSizeBytes)}</div>` : ''}
            </div>
            <div class="card-details">${badges}</div>
            ${note}
            ${expandContent ? `
                <div class="card-toggle" onclick="event.stopPropagation(); toggleExpand(this)">
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M3 5L7 9L11 5"/>
                    </svg>
                    <span>Show details</span>
                </div>
                <div class="card-expand">${expandContent}</div>
            ` : ''}
        </div>
    `;
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================
// INTERACTIONS
// ============================================================

function toggleCard(id) {
    const item = scanResults.find(r => r.Id === id);
    if (item?.DetectOnly) return;

    if (selectedTargets.has(id)) {
        selectedTargets.delete(id);
    } else {
        selectedTargets.add(id);
    }
    
    // Re-render
    const detected = scanResults.filter(r => r.IsDetected);
    renderCards(detected);
    updateRemoveButton();
}

function toggleExpand(el) {
    const expand = el.nextElementSibling;
    el.classList.toggle('expanded');
    expand.classList.toggle('open');
    el.querySelector('span').textContent = expand.classList.contains('open') ? 'Hide details' : 'Show details';
}

function selectAll() {
    scanResults.filter(r => r.IsDetected && !r.DetectOnly).forEach(r => selectedTargets.add(r.Id));
    const detected = scanResults.filter(r => r.IsDetected);
    renderCards(detected);
    updateRemoveButton();
}

function deselectAll() {
    selectedTargets.clear();
    const detected = scanResults.filter(r => r.IsDetected);
    renderCards(detected);
    updateRemoveButton();
}

function filterCategory(category) {
    currentFilter = category;
    
    // Update tab styles
    document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.category === category);
    });
    
    const detected = scanResults.filter(r => r.IsDetected);
    renderCards(detected);
}

function updateRemoveButton() {
    const btn = document.getElementById('removeBtn');
    btn.disabled = selectedTargets.size === 0;
    btn.querySelector('span').textContent = selectedTargets.size > 0 
        ? `Remove Selected (${selectedTargets.size})`
        : 'Remove Selected';
}

// ============================================================
// REMOVAL
// ============================================================

function runRemoval() {
    if (selectedTargets.size === 0) return;

    // Show confirmation modal
    const modal = document.getElementById('confirmModal');
    const itemsList = document.getElementById('confirmItems');
    
    const items = Array.from(selectedTargets).map(id => {
        const item = scanResults.find(r => r.Id === id);
        return item ? item.Name : id;
    });

    itemsList.innerHTML = items.map(name => `<div class="modal-item">${escapeHtml(name)}</div>`).join('');
    document.getElementById('confirmMessage').textContent = 
        `You are about to remove ${items.length} item${items.length > 1 ? 's' : ''} from your system. This action cannot be undone.`;
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('confirmModal').classList.add('hidden');
}

async function confirmRemoval() {
    closeModal();
    showSection('removalSection');
    setStatus('Removing...', 'removing');

    const log = document.getElementById('removalLog');
    log.innerHTML = '';

    const targets = Array.from(selectedTargets);

    if (DEMO_MODE) {
        // Simulate removal
        for (const targetId of targets) {
            const item = scanResults.find(r => r.Id === targetId);
            if (!item) continue;

            addLogEntry(log, '🔄', targetId, `Beginning removal of ${item.Name}`, 'log-start');
            await sleep(400);

            // Simulate service stops
            for (const svc of (item.FoundServices || [])) {
                addLogEntry(log, '⏹️', targetId, `Stopped service: ${svc.Name}`, 'log-success');
                await sleep(200);
                addLogEntry(log, '🗑️', targetId, `Removed service: ${svc.Name}`, 'log-success');
                await sleep(150);
            }

            // Simulate task removal
            for (const task of (item.FoundScheduledTasks || [])) {
                addLogEntry(log, '⏰', targetId, `Removed scheduled task: ${task.Name}`, 'log-success');
                await sleep(200);
            }

            // Simulate startup removal
            for (const startup of (item.FoundStartupEntries || [])) {
                addLogEntry(log, '🚀', targetId, `Removed startup entry: ${startup.Name}`, 'log-success');
                await sleep(150);
            }

            // Simulate uninstaller
            for (const uninst of (item.FoundUninstallEntries || [])) {
                addLogEntry(log, '📦', targetId, `Running uninstaller for ${uninst.DisplayName}`, '');
                await sleep(800);
                addLogEntry(log, '✅', targetId, `Uninstaller completed for ${uninst.DisplayName}`, 'log-success');
                await sleep(200);
            }

            // Simulate path removal
            for (const path of (item.FoundPaths || [])) {
                addLogEntry(log, '📁', targetId, `Removed: ${path}`, 'log-success');
                await sleep(150);
            }

            // Simulate registry removal
            for (const key of (item.FoundRegistryKeys || [])) {
                addLogEntry(log, '🔑', targetId, `Removed registry key: ${key}`, 'log-success');
                await sleep(100);
            }

            addLogEntry(log, '✅', targetId, `Removal of ${item.Name} complete`, 'log-success');
            await sleep(300);
        }
    } else {
        // Production: call PowerShell remover
        try {
            const response = await fetch('http://localhost:8765/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targets })
            });
            const logEntries = await response.json();
            for (const entry of logEntries) {
                const icon = getLogIcon(entry.Action);
                const cls = getLogClass(entry.Action);
                addLogEntry(log, icon, entry.Target, entry.Message, cls);
                await sleep(100);
            }
        } catch (e) {
            addLogEntry(log, '❌', 'system', `Error: ${e.message}`, 'log-error');
        }
    }

    // Show completion
    await sleep(500);
    showComplete(targets.length);
}

function addLogEntry(container, icon, target, message, cssClass) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${cssClass}`;
    entry.innerHTML = `
        <span class="log-icon">${icon}</span>
        <span class="log-target">${escapeHtml(target)}</span>
        <span class="log-message">${escapeHtml(message)}</span>
    `;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

function getLogIcon(action) {
    const icons = {
        'start': '🔄',
        'service_stopped': '⏹️',
        'service_removed': '🗑️',
        'process_killed': '💀',
        'uninstall_attempt': '📦',
        'uninstall_complete': '✅',
        'task_removed': '⏰',
        'startup_removed': '🚀',
        'path_removed': '📁',
        'registry_removed': '🔑',
        'complete': '✅',
        'skip': '⏭️',
        'error': '❌'
    };
    return icons[action] || '•';
}

function getLogClass(action) {
    if (action === 'error') return 'log-error';
    if (action === 'start') return 'log-start';
    if (action.includes('removed') || action.includes('complete') || action.includes('killed') || action.includes('stopped')) return 'log-success';
    return '';
}

// ============================================================
// COMPLETE
// ============================================================

function showComplete(count) {
    showSection('completeSection');
    setStatus('Complete', '');
    
    const totalSize = Array.from(selectedTargets).reduce((sum, id) => {
        const item = scanResults.find(r => r.Id === id);
        return sum + (item?.TotalSizeBytes || 0);
    }, 0);

    document.getElementById('completeStats').innerHTML = `
        <div class="stat-item">
            <div class="stat-value">${count}</div>
            <div class="stat-label">Items Removed</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">${formatBytes(totalSize)}</div>
            <div class="stat-label">Space Freed</div>
        </div>
    `;
}

function resetToScan() {
    scanResults = [];
    selectedTargets.clear();
    currentFilter = 'all';
    showSection('scanSection');
    setStatus('Ready', '');
    document.getElementById('progressFill').style.width = '0%';
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
    if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectAll();
    }
});

// Close modal on overlay click
document.getElementById('confirmModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});

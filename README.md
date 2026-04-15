# 🔥 CCleanKILLER

**Nuke the bloatware.** A thorough removal tool for CCleaner and all the junk it brings along.

## What It Removes

| Category | Software |
|----------|----------|
| **Core** | CCleaner (Free/Pro), services, tasks, telemetry |
| **Bundled** | CCleaner Browser, CCleaner Cloud, Avast Antivirus, AVG Antivirus, Avast Secure Browser, AVG Secure Browser |
| **Piriform** | Recuva, Defraggler, Speccy |
| **Offers** | Google Toolbar (flags Chrome bundle for awareness) |
| **Telemetry** | Piriform/Gen Digital telemetry & tracking data |

## For Each Target, It Removes:
- 📁 Installation files & leftover folders
- 🔑 Registry keys (HKLM, HKCU, WOW6432Node)
- ⚙️ Windows services
- ⏰ Scheduled tasks
- 🚀 Startup entries
- 📦 Runs native uninstallers silently when available

## How to Use

### Quick Start (GUI)
1. **Right-click** `launcher.bat` → **Run as Administrator**
2. The UI opens in your browser
3. Click **Scan Now** to detect bloatware
4. Review findings, select what to remove
5. Click **Remove Selected** and confirm

### Preview Mode
Just open `index.html` directly in a browser to see the UI with demo data (no actual scanning/removal).

### PowerShell Only (Advanced)
```powershell
# Scan only
powershell -ExecutionPolicy Bypass -File scanner.ps1 -Action scan

# Remove specific targets
powershell -ExecutionPolicy Bypass -File scanner.ps1 -Action remove -Targets ccleaner,avast,telemetry
```

## Target IDs
Use these IDs with the PowerShell script:
- `ccleaner` — CCleaner core
- `ccleaner_browser` — CCleaner Browser
- `ccleaner_cloud` — CCleaner Cloud
- `avast` — Avast Free Antivirus
- `avg` — AVG Antivirus
- `avast_browser` — Avast Secure Browser
- `avg_browser` — AVG Secure Browser
- `recuva` — Recuva
- `defraggler` — Defraggler
- `speccy` — Speccy
- `google_toolbar` — Google Toolbar
- `telemetry` — Piriform/Gen Digital telemetry

## Architecture
```
CCleanKILLER/
├── launcher.bat     # Admin launcher (entry point)
├── server.ps1       # Local HTTP bridge (PS → UI)
├── scanner.ps1      # Detection & removal engine
├── index.html       # UI structure
├── style.css        # UI styling
└── app.js           # UI logic
```

## Requirements
- Windows 10/11
- Administrator privileges (for services, registry, and file removal)
- PowerShell 5.1+

## ⚠️ Disclaimer
This tool is not affiliated with Piriform, Avast, AVG, or Gen Digital. Use at your own risk. Always back up your system before removing software.

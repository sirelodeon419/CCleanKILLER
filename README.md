# CCleanKILLER

**Nuke the bloatware.** A thorough Windows removal tool for CCleaner and everything it drags along — services, registry keys, scheduled tasks, startup entries, and bundled software.

Built with Electron + React + TypeScript. No HTTP bridge, no open ports — direct IPC. Packages to a portable `.exe`.

![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What It Removes

| Category | Software |
|----------|----------|
| **Core** | CCleaner (all editions), update services, performance optimizer |
| **Bundled** | CCleaner Browser, CCleaner Cloud, Avast Free Antivirus, AVG Antivirus, Avast Secure Browser, AVG Secure Browser |
| **Piriform** | Recuva, Defraggler, Speccy |
| **PUPs** | VWeb / SweetIM |
| **Offers** | Google Toolbar (Chrome bundle is flagged, not auto-removed) |
| **Telemetry** | Gen Digital / Piriform telemetry data & tracking registry keys |

For each target it removes:
- Files and leftover folders (with force-takeown fallback for locked paths)
- Registry keys (HKLM, HKCU, WOW6432Node)
- Windows services (stop → disable → delete)
- Scheduled tasks
- Startup entries
- Runs native uninstallers silently where available

---

## Usage

### Download

Grab the latest `CCleanKILLER-portable.exe` from [Releases](../../releases) — no installation required.

Public landing page for indexing and sharing: [sirelodeon419.github.io/CCleanKILLER](https://sirelodeon419.github.io/CCleanKILLER/)

Run as Administrator (UAC prompt fires automatically on launch).

### From Source

```bash
pnpm install
pnpm run dev       # dev mode with hot reload
pnpm run dist:portable  # build portable .exe → dist/
pnpm run dist:nsis      # build NSIS installer → dist/
```

**Requirements:** Node.js 18+, pnpm, Windows 10/11

---

## Architecture

```
CCleanKILLER/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Window creation, UAC elevation
│   │   ├── ipc.ts      # IPC handlers (scan, remove, window controls)
│   │   ├── scanner.ts  # PowerShell spawner + output parser
│   │   └── admin.ts    # Admin check + relaunch-elevated
│   ├── preload/
│   │   └── index.ts    # Context bridge (exposes API to renderer)
│   └── renderer/
│       └── src/
│           ├── App.tsx
│           ├── components/
│           │   ├── TitleBar.tsx
│           │   ├── ScanScreen.tsx
│           │   ├── ScanningScreen.tsx
│           │   ├── ResultsScreen.tsx
│           │   ├── DetectionCard.tsx
│           │   ├── RemovalScreen.tsx  ← streams live log from PS1
│           │   └── CompleteScreen.tsx
│           └── types/index.ts
├── resources/
│   ├── scanner.ps1     # Detection & removal engine
│   └── rules.json      # Community-editable detection rules
└── electron-builder.yml
```

**Key design decisions:**
- No HTTP bridge — Node.js main process spawns PowerShell directly via `child_process`
- `rules.json` is the single source of truth for all detection targets — add a new target with no code changes
- Removal is streamed line-by-line via IPC for real-time log display
- `requireAdministrator` manifest embedded in packaged `.exe`

---

## Adding Detection Rules

Edit `resources/rules.json` to add a new target:

```json
{
  "id": "my_bloatware",
  "name": "My Bloatware",
  "vendor": "Some Corp",
  "category": "PUP",
  "detectOnly": false,
  "paths": ["%ProgramFiles%\\MyBloatware"],
  "registryKeys": ["HKLM:\\SOFTWARE\\MyBloatware"],
  "services": ["MyBloatwareSvc"],
  "scheduledTasks": ["MyBloatware*"],
  "startupEntries": [],
  "uninstallNames": ["MyBloatware*"],
  "processNames": ["mybloatware"]
}
```

PRs adding new rules are welcome.

---

## Status

**v2.0.0 — Tested and working on Windows 11** (April 2026)

- Full scan + removal verified end-to-end on a live system with CCleaner 7 installed
- 2 targets detected and removed, 6.9 MB freed
- Admin elevation via NSIS installer confirmed working (`requireAdministrator` manifest)
- Live removal log streams correctly to the UI
- Clean bill of health post-removal (no registry keys, folders, or services remaining)

---

## Disclaimer

Not affiliated with Piriform, Avast, AVG, or Gen Digital. Use at your own risk. Always create a system restore point before removing software.

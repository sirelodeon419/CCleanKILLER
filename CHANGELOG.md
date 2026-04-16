# Changelog

All notable changes to CCleanKILLER are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] — 2026-04-16

### Added
- Full Electron + React + TypeScript rebuild (replaces the original script-only version)
- Data-driven detection via `resources/rules.json` — add new targets with no code changes
- Real-time removal log streamed from PowerShell to the UI via IPC
- Log export to `.txt` after removal
- Post-removal verification step (re-scan confirms clean state)
- System restore point created automatically before any removal
- UAC elevation enforced on launch (`requireAdministrator` manifest)
- Coverage for CCleaner Browser, CCleaner Cloud, Avast Free, AVG, Avast/AVG Secure Browser
- Coverage for Piriform tools: Recuva, Defraggler, Speccy
- PUP coverage: VWeb / SweetIM, Google Toolbar
- Telemetry artifact removal (Gen Digital / Piriform registry keys & data)
- Portable `.exe` and NSIS installer build targets
- Force-takeown fallback for locked files/folders

### Changed
- Removed HTTP bridge — Node.js main process now spawns PowerShell directly via `child_process`
- Switched from hardcoded target list to rule-file architecture

### Fixed
- IPC streaming bug causing JSON parse failure from chunked stdout
- Admin elevation flow on packaged builds (NSIS installer)
- Icon rendering (proper 256×256 .ico)

### Tested
- Verified end-to-end on Windows 11 with CCleaner 7 installed
- 2 targets detected and removed, 6.9 MB freed
- No registry keys, folders, or services remaining after removal

---

## [1.0.0] — 2026-01-10

### Added
- Initial release: PowerShell-based CCleaner removal script with basic UI wrapper
- Registry, file, service, and scheduled task removal for core CCleaner
- Electron shell for drag-and-drop usability

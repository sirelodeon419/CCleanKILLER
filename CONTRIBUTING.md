# Contributing to CCleanKILLER

Thanks for your interest. Contributions are welcome — especially new detection rules.

---

## Quick Start

```bash
git clone https://github.com/sirelodeon419/ccleankiller.git
cd ccleankiller
pnpm install
pnpm dev       # Electron hot-reload dev mode (Windows only)
```

**Requirements:** Node.js 20+, pnpm 9+, Windows 10/11 (for running the app)  
Lint and tests run fine on any OS.

---

## Adding a Detection Rule

The fastest way to contribute. No TypeScript required — just edit `resources/rules.json`.

```json
{
  "id": "my_bloatware",
  "name": "My Bloatware",
  "vendor": "SomeCorp",
  "category": "PUP",
  "detectOnly": false,
  "paths": [
    "%ProgramFiles%\\MyBloatware",
    "%AppData%\\MyBloatware"
  ],
  "registryKeys": [
    "HKLM:\\SOFTWARE\\MyBloatware",
    "HKCU:\\SOFTWARE\\MyBloatware"
  ],
  "services": ["MyBloatwareSvc"],
  "scheduledTasks": ["MyBloatware*"],
  "startupEntries": [],
  "uninstallNames": ["MyBloatware*"],
  "processNames": ["mybloatware"]
}
```

Set `"detectOnly": true` for software that should be flagged but not auto-removed (e.g. Chrome bundles).

**Verification checklist before submitting:**
- [ ] Tested on a real machine with the software installed
- [ ] Paths confirmed with `%PROGRAMFILES%`, `%APPDATA%`, `%LOCALAPPDATA%` variants as needed
- [ ] Registry keys confirmed via `regedit` or PowerShell
- [ ] Services confirmed via `services.msc` or `Get-Service`
- [ ] No false positives on a clean system

---

## Code Changes

### Dev Workflow

```bash
pnpm lint          # ESLint
pnpm typecheck     # TypeScript type-check (both main + renderer)
pnpm test          # Vitest unit tests
pnpm format        # Prettier
```

All four must pass before opening a PR. CI enforces this.

### Project Layout

```
src/main/          # Electron main process (Node.js)
src/preload/       # Context bridge
src/renderer/src/  # React UI
resources/         # scanner.ps1 + rules.json (deployed alongside the app)
```

### Key Constraints

- **Windows-only runtime** — the PowerShell engine is intentional. Don't add cross-platform abstractions.
- **No HTTP** — all communication is IPC via `child_process`. Keep it that way.
- **No new runtime dependencies** — the `node_modules` at runtime is intentionally tiny. Dev deps are fine.
- **Data-driven** — new removal targets belong in `rules.json`, not in TypeScript.

---

## Pull Requests

1. Fork, branch off `main`, make your changes
2. Run `pnpm lint && pnpm typecheck && pnpm test` — all green
3. Open a PR with a clear title and description of what changed and why
4. For rule PRs: include evidence (screenshot, registry export, or `Get-Service` output)

PRs that add detection rules, fix bugs, or improve reliability are prioritised.  
Large refactors or UI overhauls should be discussed in an issue first.

---

## Reporting Issues

Use the GitHub issue templates:
- **Bug report** — unexpected behaviour, missed detections, crashes
- **Feature request** — new detection targets, UX ideas

Please include your Windows version and the exported removal log when reporting bugs.

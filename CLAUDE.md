# CCleanKILLER — Claude Code Notes

## Branching

- Default development branch: `claude/review-latest-update-WtRcu`
- Main branch: `master`
- Always develop on the feature branch and open a PR to master

## Release Workflow

Follow these steps every time a new release is ready:

1. **Bump the version** in `package.json` to the next patch/minor/major
2. **Create `CLAUDE.md`** updates if the workflow has changed
3. **Commit** both changes on the current dev branch
4. **Push** the dev branch: `git push -u origin <branch>`
5. **Tag** the release commit:
   ```
   git tag v<version>
   git push origin v<version>
   ```
6. **Create a GitHub release** via the GitHub MCP tool (`mcp__github__create_or_update_file` or the releases API) with:
   - Tag: `v<version>`
   - Title: `CCleanKILLER v<version>`
   - Body: changelog bullet points for everything since the last release
   - `prerelease: false`, `draft: false`
7. **Open a PR** for the dev branch if one doesn't already exist (always create as draft)

## Version History

| Version | Key changes |
|---------|-------------|
| v2.0.0  | Full Electron + React/Vite/TypeScript rebuild |
| v2.0.1  | Log export, post-removal Verify Clean re-scan |
| v2.0.2  | Dry-run ConfirmScreen, registry backup, Undo Registry, GitHub Pages landing page |

## Tech Stack

- Electron 33 + React 18 + Vite + TypeScript
- Tailwind CSS
- PowerShell (`resources/scanner.ps1`) for all system-level operations
- IPC: main ↔ renderer via `src/main/ipc.ts` + `src/preload/index.ts`

## Key Files

| File | Purpose |
|------|---------|
| `resources/scanner.ps1` | PowerShell scanner/remover/restorer |
| `src/main/ipc.ts` | IPC handlers (scan, remove, restore, export) |
| `src/main/scanner.ts` | Node-side scanner/runner wrapper |
| `src/preload/index.ts` | Preload bridge exposing `window.api` |
| `src/renderer/src/App.tsx` | Top-level screen router |
| `src/renderer/src/components/` | All UI screens |
| `src/shared/types.ts` | Shared TypeScript types |
| `docs/` | GitHub Pages landing page |
| `.github/workflows/` | CI/CD (deploy-pages, build) |

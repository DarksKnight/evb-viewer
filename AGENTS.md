# evb-viewer Agent Rules

- Read `CLAUDE.md` before changing this project.
- Create or switch branches only when the user asks or the harness requires it.

## Verification

- Prove fixes in a headless real app/browser first; add unit tests afterward only when they provide meaningful regression value.

## Host Environment

- Run `pnpm run check:dev-env` before Electron, browser automation, native-tool, OCR, packaging, or diagnostics work when the host/session is unfamiliar.
- Treat its `headed` vs `headless` result as authoritative for this checkout. On Linux with empty `DISPLAY` and `WAYLAND_DISPLAY`, assume headless and run Electron/browser commands through Xvfb.
- Prefer checked-in wrappers on headless Linux: `pnpm run electron:run:headless -- <command>`, `pnpm run dev:headless`, and `pnpm run test:e2e:electron:headless`.
- For a fresh Ubuntu VPS, use `bash scripts/setup-linux-dev-host.sh`; keep any setup improvements in the repo, not only in machine-local notes.

## Computer Use For Dev App

- Use `$evb-viewer-computer-use` before operating the Electron development app with `@Computer` or Computer Use.
- Run `node .agents/skills/evb-viewer-computer-use/scripts/resolve-target.mjs --session=default` and use its exact app path and CDP endpoint for the active dev session.
- Use Computer Use `get_app_state` with the exact app path for visual state; use CDP or Playwright for clicks, typing, keyboard input, and stress-test loops when Computer Use action dispatch reports `-10005 noWindowsAvailable` or `cgWindowNotFound`.
- Target the session-specific dev app and ask before starting, stopping, or terminating dev servers or stale Electron processes.

## Release And Packaging

- Keep `pnpm run release:verify` host-only, deterministic, and free of tracked-file mutations.
- Add host-independent unit coverage for cross-platform release decisions.
- Keep local release verification aligned with CI mode when runner semantics affect tests.
- Use nightly/manual CI for Electron E2E and PDF tab diagnostics until those lanes are stable enough to promote into a blocking release gate.
- Record release-critical install scripts in `pnpm-workspace.yaml` so fresh CI installs fail fast.
- For release-critical native tools on macOS, verify execution from inside the signed app bundle.
- Treat ad-hoc local mac packaging as insufficient evidence for LaunchServices startup behavior.
- Keep public releases working without macOS or Windows signing keys.
- Publish differential updater metadata only for signed builds it can safely update.

## Cross-Arch Changes

For Electron runtime, native binaries/tools, OCR/DjVu paths, workers, or packaging changes, verify after implementation with:

1. `pnpm lint && pnpm typecheck`
2. `pnpm run check:resources:matrix`
3. `scripts/verify-packaged-native-tools.sh <mac|win|linux> <x64|arm64>` when a packaged build exists

Use production paths that avoid `eval` workers and runtime package lookup.

## Electron Puppeteer

- Use the `electron-puppeteer` skill only when the user explicitly requests it.
- Verify Electron changes in large batches.
- If a verification script breaks, fix the script instead of working around it.

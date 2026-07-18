# evb-viewer Agent Rules

- Read `CLAUDE.md` before changing this project.
- Create or switch branches only when the user asks or the harness requires it.

## Delegation

- Continue autonomously from the user's initial request through completion without pausing to ask for delegation permission.
- Use the primary agent by default. The parent agent may delegate substantial technical execution to Luna at light reasoning effort when beneficial without asking the user.
- Use other sub-agents only when the user explicitly requests sub-agents, delegation, or parallel agent work for the current task.
- When parallel agents are requested, give them disjoint ownership and reconcile their results with the source documents and worktree before reporting completion.

## Verification

- Use an isolated headless Electron E2E session as the default real-app verification lane on every host, including macOS. Do not attach to, reuse, restart, show, or focus the `default` headed development session for autonomous verification.
- Merely mentioning Electron, the desktop app, or an Electron feature does not authorize headed dev-app access. That requires an explicit request to interact with the headed development app in the current task (for example, `@Computer` or “check this in the headed dev app”).
- Do not run `pnpm dev`, `pnpm start`, or `pnpm electron:run ... --session=default` for autonomous verification. Use `pnpm run test:e2e:electron:headless` or a generated isolated E2E session instead.
- If the required scenario cannot be verified headlessly, report that limitation instead of falling back to the headed development app.
- Prove fixes in a headless real app/browser first; add unit tests afterward only when they provide meaningful regression value.
- Treat headless Electron as real-app verification. Never open, activate, focus, or switch to the headed Electron development app unless the user explicitly requests dev-app interaction in the current task.
- For web-app verification, prefer the Chrome plugin over Playwright. Use Playwright only when Chrome cannot cover the required scenario, and do not steal foreground window focus during autonomous browser automation.
- For dev-server evidence, inspect `.devkit/scratch/dev-server-logs/latest-run.json`; `pnpm dev` tees launcher, Nuxt, and Electron output there.
- For OCR, PDF serialization, or document mutations, verify semantic output and rendered visuals separately.
- For viewer readiness or performance, use a real Electron lane with a representative large scan; verify visible output, cleared skeletons, stable geometry/scrolling, and first-page timing apart from background work.
- For dead-code audits, inspect `.fallowrc.json` entry points and ignores, then trace scripts through `package.json`, CI, documentation, and imports before classifying them as live or obsolete.

## Vercel Deployment

- Never invoke `vercel`, `vercel deploy`, or `vercel --prod` directly from this checkout. Direct CLI deployment includes the public GitHub no-reply commit identity and Vercel rejects it as a non-member collaborator.
- Use `pnpm run deploy:web` for previews and `pnpm run deploy:web:prod` for production. These repository-owned commands deploy from a sanitized temporary source tree without `.git` metadata.

## Large Audits And Overhauls

- For multiple audits, roadmaps, or blueprints, keep a `.devkit/analysis/` ledger mapping each item to `implemented`, `verified`, `deferred`, or `blocked`, with evidence.
- When parallel agents are requested for the current task, reconcile their results with the ledger before reporting completion.

## Architecture

- Define cross-process and shared serialized domain shapes in `packages/contracts`; import or derive layer-specific variants from those contracts instead of duplicating IPC, worker, or JSON boundary types.

## Host Environment

- Run `pnpm run check:dev-env` before Electron, browser automation, native-tool, OCR, packaging, or diagnostics work when the host/session is unfamiliar.
- Treat its `headed` vs `headless` result as authoritative for this checkout. On Linux with empty `DISPLAY` and `WAYLAND_DISPLAY`, assume headless and run Electron/browser commands through Xvfb.
- Prefer checked-in wrappers for autonomous Electron verification: `pnpm run test:e2e:electron:headless`, or `pnpm run electron:run:headless -- <command>` with a non-default isolated session name. On headless Linux these wrappers run Electron through Xvfb.
- For a fresh Ubuntu VPS, use `bash scripts/setup-linux-dev-host.sh`; keep any setup improvements in the repo, not only in machine-local notes.
- For isolated packaged-app checks, confirm the intended source and dependencies, use an isolated profile/identity, and gracefully stop the exact test process.
- For packaged-app checks on a developer workstation, use a disposable app copy with a distinct bundle identifier and display name so workspace builds cannot register as the production app in the user's Dock or LaunchServices state.
- When exact production bundle identity or LaunchServices behavior is the subject of the test, get explicit user approval first, snapshot the relevant Dock/LaunchServices registrations, and restore only state created by the test while preserving the user's pre-existing Dock configuration.

## Computer Use For Dev App

- Operate the headed Electron development app only when the user explicitly requests it in the current task; otherwise use a headless Electron lane.
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
- Treat GitHub installers, Store packages, and updater feeds as distinct channels; verify each channel's signing, architecture, languages, metadata, and updates.
- Keep account and release guidance compatible with an individual, free, non-commercial project; surface business identity, payment, or account-conversion requirements as explicit owner decisions.
- Keep release-critical runbooks in tracked documentation; use ignored `.devkit` notes as working material.

## Cross-Arch Changes

For Electron runtime, native binaries/tools, OCR/DjVu paths, workers, or packaging changes, verify after implementation with:

1. `pnpm lint && pnpm typecheck`
2. `pnpm run check:resources:matrix`
3. `scripts/verify-packaged-native-tools.sh <mac|win|linux> <x64|arm64>` when a packaged build exists

Use production paths that avoid `eval` workers and runtime package lookup.

For native-tool writes to user-selected destinations, produce and validate output in managed scratch first, then let Electron/Node publish it atomically; include non-ASCII destination paths in Windows coverage.

## Electron Puppeteer

- Use the `electron-puppeteer` skill only when the user explicitly requests it.
- Verify Electron changes in large batches.
- If a verification script breaks, fix the script instead of working around it.

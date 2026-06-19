---
name: evb-viewer-computer-use
description: Use in the evb-viewer repo when a task mentions @Computer, Computer Use, human-like GUI testing, the Electron dev app, or desktop stress-testing of EVB Viewer. Resolves the active dev session, avoids ambiguous generic Electron targeting, and routes visual state through Computer Use while using CDP/Playwright for reliable app actions when Computer Use dispatch is flaky.
---

# EVB Viewer Computer Use

## Overview

Use this skill before operating the EVB Viewer Electron development app through Computer Use. The raw dev app uses Electron's generic `com.github.Electron` identity, so path and app-name targeting can diverge when stale automation apps or packaged builds are also running.

## Workflow

1. Run the resolver from the repo root:

   ```bash
   node .agents/skills/evb-viewer-computer-use/scripts/resolve-target.mjs --session=default
   ```

   Add `--json` when a scriptable report is more useful.

2. Use the reported `Computer Use state app` path for `mcp__computer_use.get_app_state`. This is the only Computer Use target to use for the dev app.

3. Use the reported `CDP endpoint` for clicks, typing, keyboard input, menu traversal, and stress loops. Connect with Playwright or Puppeteer over CDP, then select the page whose URL contains `/electron`.

4. Use Computer Use for visual state, screenshots, accessibility tree inspection, and confirming the foreground window. Call `get_app_state` once before any Computer Use action in the same assistant turn.

5. If a Computer Use action returns `-10005 noWindowsAvailable`, `cgWindowNotFound`, or targets a generic/stale `Electron` window, continue through the CDP endpoint instead of retrying app-name targeting.

6. Ask the user before starting or stopping dev servers or terminating stale Electron processes. If the user approves cleanup, prefer project commands such as `pnpm electron:run stop --session=<name>` when a session name is known.

## Targeting Rules

- Target the session-specific app path from the resolver instead of the app name `Electron`.
- Treat stale `.devkit/sessions/*/automation-electron-app/Electron.app` processes as collision risks for Computer Use app-name dispatch.
- Treat `/Applications/EVB Viewer.app` as a separate packaged app; it is useful for release checks, but it is not the dev target.
- Use the current `.devkit/sessions/<session>/session.json` as the authoritative source for the dev app CDP port and Electron PID.

## Reporting Failures

When Computer Use remains unreliable, capture these details for the final answer or upstream report:

- resolver output
- Computer Use state header, including CUA app version
- exact app path used for `get_app_state`
- exact failing Computer Use action and error text
- whether stale automation or packaged EVB Viewer processes were running

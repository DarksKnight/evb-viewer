# Scan cleanup UX progress

## Phase 1 — result-first plumbing

- Implemented main-process managed output allocation under `evb-viewer/scan-cleanup/output/<uuid>/`.
- Removed the renderer-provided destination from the active start flow; completed state and start result expose the generated path.
- Preserved staged-file, sibling-temp, abort-check, and atomic-rename publishing.
- Added a renderer-wide coordinator in `AppShellRoot` for reconnect, completion, failure, cancellation, open-in-new-tab, Save as toast action, and startup pruning.
- Focused contract, worker-pipeline, coordinator, and pruning tests pass.

## Phase 2 — fixed shell and background operation

- Added `ScanCleanupDialog.vue` as the public popup implementation without editing the baseline-dirty predecessor.
- Added one token-sized modal shell shared by configure and running states.
- Closing the dialog cancels only preview work; the explicit Cancel button is the only job cancellation path.
- Added shared running state, reconnect restoration, toolbar dot, and progress-aware accessible label.

## Phase 3 — result-first layout

- Reorganized controls into Layout, Output, and Crop and size rail groups.
- Replaced permanent warnings with the image-only details popover.
- Added page keyboard navigation, Original/Cleaned and Fit/100% controls, stale-preview spinner, and compact legend.
- Added forced-layout exact estimates and preview-classification extrapolation for auto mode.
- Added complete English and Russian copy; existing locale aliases continue to use English.

## Phase 4 — hygiene and verification

- Added seven-day generated-output pruning that excludes open PDFs.
- Targeted Vitest: 12/12 passing.
- App, Electron, packages, and test TypeScript checks: passing.
- Scoped ESLint on every touched source/test: passing.
- Electron build and isolated headless smoke are recorded in REPORT.md.

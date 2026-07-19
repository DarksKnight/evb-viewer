# Scan cleanup UX report v4

## Outcome

The scan-cleanup workflow is now result-first: Clean up starts immediately into managed generated storage, continues when its dialog closes, and globally opens the completed PDF in a new focused tab. The completion toast includes the page/spread summary and a working Save as action. Failures remain inline while the dialog is open and become actionable Details toasts while closed; closed cancellation is informational and never opens a tab.

The dialog uses one fixed token-sized shell. Configure and running states share identical outer geometry, with the options rail disabled and a progress overlay placed over the retained preview during work. The preview is the visual center of the dialog, with page navigation, arrow keys, Original/Cleaned comparison, Fit/100%, stale-image refresh indication, and the detection legend.

## Storage and lifecycle

- Root: `<Electron temp>/evb-viewer/scan-cleanup/output/`
- Job directory: UUID
- Filename: `<source basename> — cleaned.pdf`
- Publish: staged PDF → sibling temp → abort check → atomic rename
- Cleanup: directories older than seven days after restored/open document claims settle; open generated PDFs are excluded

## Verification

- Baseline `pnpm typecheck`: pass
- Baseline full `pnpm lint`: 25 pre-existing errors in two baseline-dirty E2E files
- Targeted Vitest: 5 files, 12 tests, all pass
- `pnpm typecheck:app`: pass
- `pnpm typecheck:electron`: pass
- `pnpm typecheck:packages`: pass
- `pnpm typecheck:tests`: pass
- ESLint on all touched source and test files: pass
- `pnpm run build:electron`: pass
- Isolated hidden-app Electron blocking save smoke: pass (1/1, session-specific process and profile)

Host preflight reported the Electron binary and bundled Darwin ARM64 native tools ready. It also reported unrelated missing landing dependencies, Playwright Chromium, and optional Python page-processor modules; none are used by this implementation or the Electron-native smoke lane.

## Baseline preservation

The feature diff has zero paths in common with the 16 baseline-dirty files. The two direct collision candidates were designed around:

- `ScanCleanupPopup.vue`: left byte-for-byte to its owner; replaced through `public.ts` with `ScanCleanupDialog.vue`.
- `nuxt.config.ts`: left byte-for-byte to its owner; scissors are rendered by a local SVG component.

No Rust crate, OCR popup/trigger, or WASM code changed.

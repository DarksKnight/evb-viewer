# Scan cleanup workspace rebuild — final report v8

Date: 2026-07-20

## Outcome

The staged rebuild now presents Scan Cleanup as a tab-local workspace instead of a modal. The document reader remains mounted while the cleanup surface is active, so reader page/zoom state survives a Done/Escape round trip. The workspace has a virtualized source-thumbnail rail, a ratio-preserving two-half editor with direct cutter/content/placement manipulation, document-versus-selection settings, apply-to scopes, detect-all classification, exact output estimation when the available evidence is authoritative, and a non-blocking cleanup run lifecycle.

Phase 6 completes the live-run path: the footer shows `processed / total`, the owning document's first `processedCount` natural source pages receive check-circle overlays, rail selection and preview navigation remain available, and preview requests are no longer suppressed while cleanup runs. Leaving with Done or Escape does not cancel the global job; reopening the owning tab reads the current coordinator state. Existing terminal handling still opens the generated PDF, optionally starts OCR, and posts the completion toast.

The compatibility modal is retired. `ScanCleanupDialog.vue` is deleted, no `ScanCleanupPopup` export remains, no `UModal` exists under `app/modules/scan-cleanup`, and the coordinator no longer exposes `dialogOpen` or increments the old broadcast-era `openRequestRevision`. Failure Details calls the document-targeted workspace opener directly.

## Generated-output handoff regression

The July 20 headed-run failure was not a missing cleanup PDF. The Electron main log records `open-path-capabilities` rejecting the generated path because the renderer had not received a main-issued open capability, followed by the coordinator's rejected `dialog:openPdfDirect` promise escaping to `renderer-guard`.

The job service now grants every live subscriber access to the managed output before publishing the completed state, and grants the same access when a renderer reconnects to an already-completed job. The renderer coordinator also converts a genuine open rejection into the existing `openResultFailed` UI path instead of producing an unhandled promise rejection.

Focused regression coverage passes: **2 files / 9 tests**. The added tests prove that the completed output is rejected before the grant and accepted afterward, and that an open rejection produces an error toast without starting OCR or escaping as an unhandled rejection. `pnpm typecheck`, `pnpm run build:electron`, targeted ESLint, and `git diff --check` pass. The full lint sweep reaches the static naming gate and reports an unrelated concurrent workspace-refactor mismatch: `scanCleanupDetectionResults.ts` does not match its main export `applyScanCleanupDetectionResults`. An isolated headless Electron run rendered the rebuilt cleanup workspace, but its pre-existing smoke assertion still expects the retired dialog title inside `role=dialog`; that assertion is stale relative to the concurrent workspace UI and was left untouched.

Tab-local cleanup session state now captures and restores:

- cleanup preview page;
- Original/Cleaned mode;
- Fit/100% mode.

Selection intentionally resets, as allowed by the specification. Application restart remains reader-first because cleanup state is not added to the cross-restart checkpoint contract.

## Acceptance criteria

| # | Status | Evidence / qualification |
| --- | --- | --- |
| 1 | **Met** | Toolbar scissors selects the sibling cleanup surface in the same tab; Done and Escape return to the retained reader. Component/session tests cover reader object identity plus page/zoom preservation. |
| 2 | **Met** | `DocumentThumbnailList` remains the virtualized implementation; the 500-page test bounds mounted rows below 30. Classification/override/confidence/exclusion/rotation/tick overlays and mouse/keyboard selection are covered. Rail sorting never changes output order. |
| 3 | **Met** | `resolvePreviewOutputFitSizes` applies contain-fit sizing with a shared spread scale. Narrow/wide tests assert exact canvas ratios. |
| 4 | **Met** | Cutter line and handle share the requested center coordinate; geometry and component affordance tests cover it. |
| 5 | **Met** | Per-output placement overrides cross app contracts, codecs, manifests, Rust serde, preview metadata, and the real CLI. Drag/keyboard/3×3 quick-set and default-versus-override precedence are tested. |
| 6 | **Met** | All, from-here, selected, and every-other/parity scopes produce the expected source-page sets and write the shared sparse override map. |
| 7 | **Met** | Rust compares classify-only with full-pipeline classification on synthetic spread/single fixtures. Electron tests cover cancellation and streamed results; app tests cover exact estimate resolution. With `skipBlankPages`, the estimate remains honestly approximate because classify-only does not execute blank filtering. |
| 8 | **Met** | Live job-state tests map owner progress to source pages 1…N; the rail test renders ticks only for that set; the component test renders numeric footer progress with no blocking editor overlay. Preview scheduling no longer rejects running jobs. Global coordinator tests cover leaving the surface and completion result-tab/toast behavior. |
| 9 | **Met** | Popup/dialog shell deleted; no `UModal` in the module; broadcast aliases/revision removed; obsolete English/Russian leaves removed. Desktop locale parity passes and alias locales still reference the English catalog. |
| 10 | **Met with gate caveats** | Scan Cleanup fmt, workspace clippy/test/deny, touched ESLint, full targeted Vitest, typecheck, both builds, and the resource matrix all pass. Workspace-wide fmt also reports unrelated pre-existing formatting in `native/scan-primitives/src/threshold.rs`; it was not changed because it is outside the authorized baseline. The resource wrapper's final `tsx` process hits the known IPC sandbox denial, while the identical non-IPC script passes. |
| 11 | **Partially met** | The new static workspace replica is [workspace-layout-replica.html](workspace-layout-replica.html), but this sandbox aborts both system Chrome and installed Electron Chromium with SIGABRT/exit 134 before renderer startup. Therefore no honest new Phase 6 PNGs were produced. The existing `layout-replica-*.png` files were visually inspected and rejected as evidence because they show the retired modal. |

## Measured results

### Classify-only benchmark (Phase 5)

Deterministic 10-page, 1200×1600 grayscale fixture; one warm-up per mode, three alternating release runs at 150 DPI, uniform-canvas matching disabled:

| Mode | Runs (ms) | Median (ms) |
| --- | --- | ---: |
| classify-only | 3080.3, 3209.4, 3052.2 | 3080.3 |
| full cleanup | 5532.7, 5549.0, 5536.5 | 5536.5 |

Classify-only was **1.80× faster**, reducing median wall time by **44.4%**.

### Additional retained measurement (V7 preview cache)

The raw-raster cache reduced the five-run median option-tweak preview from **535.2 ms to 454.5 ms**, an **80.7 ms / 15.1%** improvement, and removed `pdftoppm` from the cached tweak path.

### Final verification counts

- Full targeted Vitest: **137 files / 949 tests**, all passed. This includes every Scan Cleanup app suite, every workspace-shell unit suite, all three Electron Scan Cleanup suites, thumbnail virtualization/boundary coverage, and both PDF source bridges.
- Final Phase 6 focused rerun after the last assertion: **4 files / 21 tests**, all passed.
- Native workspace: **186 tests**, all passed; Scan Cleanup specifically is **30 library + 4 CLI + 1 protocol** tests.
- Built release sidecar: Darwin ARM64 SHA-256 `313a0099dd44d3331c032191f18c1dbdba233b3146e760b65b234285c381dbbc`.

## Gate sweep

- `cargo fmt --manifest-path native/Cargo.toml -p evb-scan-cleanup -- --check` — **pass**.
- `cargo fmt --manifest-path native/Cargo.toml --all -- --check` — **baseline caveat**: reports formatting-only drift in `native/scan-primitives/src/threshold.rs`, outside Scan Cleanup scope; no file was changed.
- `cargo clippy --manifest-path native/Cargo.toml --workspace --all-targets --locked -- -D warnings` — **pass**.
- `cargo test --manifest-path native/Cargo.toml --workspace --locked` — **pass**.
- `cargo deny --offline check` — **pass** with a temporary writable advisory database because the sandbox cannot lock `/Users/evb/.cargo/advisory-dbs/db.lock`; existing duplicate/unmatched-license warnings remain warnings, and advisories/bans/licenses/sources are all `ok`.
- ESLint over every changed/untracked TypeScript/Vue/MJS/CJS file — **pass**.
- Full targeted Vitest described above — **pass**.
- `pnpm typecheck` — **pass** across app, Electron, tests, scripts, packages, and server.
- `pnpm run build:electron` — **pass**.
- `pnpm run build:scan-cleanup` — **pass**.
- `pnpm run check:resources:matrix` — every source/CI-generated platform row **pass**; final OCR-registry wrapper hit the known `tsx` `listen EPERM` caveat, and `node --import tsx scripts/checkOcrLanguageModelRegistry.ts` **pass**.
- `node --import tsx scripts/checkLocales.ts --target=app` — **pass**.
- `git diff --check` — **pass**.

## Layout evidence status

Replica source: [workspace-layout-replica.html](workspace-layout-replica.html). It models the full workspace at run time: source rail with aligned rows and ticks, ratio-preserving two-half editor, compact settings rail, and a one-row numeric progress footer. It includes an in-page clipping/alignment/footer-height check.

Required system-Chrome launches were attempted at 1500×950 and 1280×800 using `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --headless --screenshot=… --window-size=…`. Chrome returned exit 134 before creating either PNG. Isolated profile, no-sandbox, disabled Crashpad, and single-process variants failed identically. A hidden Electron Chromium fallback also terminated with SIGABRT. No headed/default browser or Electron development session was opened or focused.

To close criterion 11 outside this sandbox, rerun the two specified Chrome commands against the replica and save:

- `workspace-layout-1500x950.png`
- `workspace-layout-1280x800.png`

Then visually verify no clipped controls, equal rail-row geometry, editor fill, and a single-row footer before citing them.

## Files added and deleted

Primary additions:

- `app/modules/scan-cleanup/components/ScanCleanupWorkspace.vue`
- `app/modules/scan-cleanup/components/ScanCleanupThumbnailRail.vue`
- `app/modules/scan-cleanup/components/ScanCleanupSegmented.vue`
- `app/modules/scan-cleanup/composables/useScanCleanupWorkspaceSession.ts`
- `app/modules/scan-cleanup/runtime/resolveScanCleanupApplyScope.ts`
- `app/modules/scan-cleanup/runtime/resolveScanCleanupSelection.ts`
- `app/modules/scan-cleanup/runtime/scanCleanupDetectionResults.ts`
- `app/modules/scan-cleanup/runtime/scanCleanupPreviewPrefetcher.ts`
- `app/modules/scan-cleanup/runtime/scanCleanupSelectionOverrides.ts`
- seven new focused unit-test files covering virtualization, rail behavior, scoped settings, detection, bridges, and source providers;
- `.devkit/tasks/scan-cleanup/workspace-layout-replica.html` and the refreshed V8 baseline/report artifacts.

Deleted deliberately:

- `app/modules/scan-cleanup/components/ScanCleanupDialog.vue` — retired `UModal` compatibility shell. Source-contract assertions were ported to the workspace/composable.
- `app/modules/scan-cleanup/components/ScanCleanupPageList.vue` — eager list replaced by `ScanCleanupThumbnailRail`; override/rotation/exclusion assertions were ported to the rail suite.

The remaining modified files are the required sibling-surface/session wiring, thumbnail-provider bridge, preview/editor geometry, shared Scan Cleanup contracts/codecs, Electron job/detection services, Rust classify/placement pipeline, locale catalogs, and their tests. `git diff --stat` at closeout is 53 tracked files, 3,319 insertions, and 1,516 deletions, plus the untracked additions above.

## Known gaps and decisions

- The two required Phase 6 Chrome screenshots remain the only incomplete acceptance artifact because renderer processes are prohibited by the current sandbox.
- Workspace-wide Rust formatting has unrelated drift in `scan-primitives`; the Scan Cleanup crate is formatted and all native compile/test gates pass.
- The job progress contract supplies a natural processed count, not arbitrary page IDs. Tick overlays therefore represent natural pages `1…processedCount`, matching the sequential cleanup progress contract and output order.
- The whole-document estimate cannot be exact for future blank filtering when `skipBlankPages` is enabled; this is displayed as approximate rather than overstated.
- The low-confidence threshold remains the Phase 2 documented value `< 0.6`; the product specification did not prescribe a numeric threshold.
- PageUp/PageDown retain the documented five-row visible-order step.

## Worktree discipline

The Phase 6 starting snapshot is `WORKTREE-BASELINE-V8.txt`. All merged Phase 1–5 changes were treated as the immutable dirty base. No branch was created or switched; nothing was staged, committed, pushed, stashed, reset, reverted, or cleaned. Unrelated files were not modified.

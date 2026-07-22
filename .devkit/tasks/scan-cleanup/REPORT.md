# Scan Cleanup whole-feature rework — authoritative report v9

Date: 2026-07-21
Scope: Stages A–H, including the three post-G static-check debt fixes
Status: feature rework complete; final corpus, real-PDF, and gate battery executed

## 1. Closeout

The rework is complete against the Stage-H battery. The final release helper completed the same 25-document read-only corpus sweep with 25/25 documents, 160 classifications, 50 full-cleanup source pages, 61 inspected outputs, zero processing errors, and zero all-black outputs. All 160 decisions match Stage F, and the Stage-B retained real-fixture suite remains 29/29. Evidence: `.devkit/tasks/scan-cleanup/final-evidence/corpus/run-summary.json`, `.devkit/tasks/scan-cleanup/final-evidence/summary.json`, and `.devkit/tasks/scan-cleanup/final-evidence/logs/stage-b-fixtures.log`.

Every Stage-C performance target remains met on the final binary: 150-DPI classify median `0.283 s` (<`0.3`), classify p90 `0.720 s` (<`1.5`), full-cleanup median `0.400 s` (<`0.45`), and the 101.113-MP Costaz page 223 classify time `0.973 s` (<`2`). The fixed-geometry RSS check peaked at `179.688 MiB`, below the retained `234.5 MiB` ceiling. Evidence: `.devkit/tasks/scan-cleanup/final-evidence/corpus/aggregate.json`, `.devkit/tasks/scan-cleanup/final-evidence/rss/summary.json`, and `.devkit/tasks/scan-cleanup/FRW-C-REPORT.md`.

The three post-G debts are closed: the generated native protocol contract reports v2, the manifest builder is named `buildNativeScanCleanupManifest.ts`, and the contracts dependency graph is acyclic. Evidence: `packages/contracts/nativeToolProtocols.ts`, `electron/features/scan-cleanup/policy/buildNativeScanCleanupManifest.ts`, `.devkit/tasks/scan-cleanup/final-evidence/gates/pnpm-lint-static-bypass.log`, and `.devkit/tasks/scan-cleanup/final-evidence/gates/dep-graph.json`.

No branch, commit, staging, push, reset, stash, or source rollback was performed during Stage H. The pre-existing dirty worktree remained the base. Evidence: `.devkit/tasks/scan-cleanup/final-evidence/gates/git-status-final.txt` and `.devkit/tasks/scan-cleanup/final-evidence/gates/git-diff-check.log`.

## 2. Final architecture

| Layer | Post-rework authority | Evidence |
|---|---|---|
| Shared contracts | Serialized Scan Cleanup domain, geometry, progress, IPC, overrides, and native protocol v2 live under `packages/contracts/scan-cleanup/`; layer-specific APIs import or re-export those shapes. | `packages/contracts/scan-cleanup/`, `packages/contracts/electronApiScanCleanup.ts`, `.devkit/tasks/scan-cleanup/FRW-D-REPORT.md` |
| Renderer public boundary | `public/runtime.ts` exposes always-loaded runtime/coordinator APIs; `public/workspace.ts` exposes the dynamically loaded workspace. | `app/modules/scan-cleanup/public/`, `.devkit/tasks/scan-cleanup/FRW-G-REPORT.md`, `tests/unit/app/modules/scan-cleanup/scanCleanupPublicEntrypoints.test.ts` |
| Renderer session | `useScanCleanupWorkspaceSession` is an orchestration facade with exactly `selection`, `settings`, `detection`, `preview`, and `run`; focused composables own each lifecycle. | `app/modules/scan-cleanup/composables/`, `.devkit/tasks/scan-cleanup/FRW-G-REPORT.md`, `.devkit/tasks/scan-cleanup/final-evidence/gates/vitest-targeted.log` |
| Renderer presentation | Preview shell, original/cleaned canvases, cutter/content/placement overlays, and document/selection/apply settings are separate components; pure geometry is outside Vue components. | `app/modules/scan-cleanup/components/preview/`, `app/modules/scan-cleanup/components/settings/`, `app/modules/scan-cleanup/geometry/`, `.devkit/tasks/scan-cleanup/FRW-G-REPORT.md` |
| Renderer state/cache | Preview results use an 8-entry / 96-MiB byte-aware LRU; persistence schema, repository, and migration are separate; run state derives from job state. | `app/modules/scan-cleanup/runtime/scanCleanupPreviewCache.ts`, `app/modules/scan-cleanup/persistence/`, `.devkit/tasks/scan-cleanup/FRW-E-REPORT.md` |
| Electron policy | `effectiveOptions.ts` is the effective-option authority and `buildNativeScanCleanupManifest.ts` is the manifest authority for preview, detect-all, raster final, and lossless final. | `electron/features/scan-cleanup/policy/`, `.devkit/tasks/scan-cleanup/FRW-D-REPORT.md`, `tests/unit/electron/scanCleanupNativeManifestBuilder.test.ts` |
| Electron lifecycle | Raw-raster cache keys include source revision/mtime; owner-scoped registry fences lookup/cancel/reconnect/subscription; `AbortSignal` is cancellation transport; one progress envelope carries exact completed page numbers. | `electron/features/scan-cleanup/ownerScopedJobRegistry.ts`, `electron/features/scan-cleanup/createScanCleanupPreviewService.ts`, `.devkit/tasks/scan-cleanup/FRW-E-REPORT.md` |
| Native boundary | Strict manifest v2 plus typed progress/result NDJSON and preserved native error codes form the production boundary; v1 remains opt-in behind `--allow-manifest-v1`. | `native/scan-cleanup/src/protocol/`, `electron/features/scan-cleanup/native/protocolCodec.ts`, `.devkit/tasks/scan-cleanup/FRW-D-REPORT.md` |
| Native engine | `domain/`, `engine/`, `protocol/`, `adapters/`, and `io/` separate serialized units, bounded analysis, render planning/rendering, CLI transport, and PNG I/O. | `native/scan-cleanup/src/`, `.devkit/tasks/scan-cleanup/FRW-D-REPORT.md` |
| Lossless output | Raster analysis supplies crop/split geometry; `evb-pdf-page-ops split-pages` clones PDF page dictionaries/content references and changes page boxes without rasterizing source content. | `native/pdf-page-ops/`, `.devkit/tasks/scan-cleanup/FIXRUN-E-REPORT.md`, `.devkit/tasks/scan-cleanup/final-evidence/prym/content-streams.json` |

## 3. Stage outcomes

| Stage | Outcome | Measured evidence |
|---|---|---|
| A — correctness | Named applied margins; corrected deskew confidence plus absolute floor; crop in deskewed coordinates; RGB dewarp parity; blank-region fail-closed; run-race and finite-number validation. | Stage-A corpus deskew `73/2` accepted/rejected, p90 `0.535°`; BHS blank half all `757,010` pixels white. `.devkit/tasks/scan-cleanup/FRW-A-REPORT.md`, `.devkit/tmp/corpus-sweep-stage-a-deskew.json` |
| B — split classifier | Destructive whitespace-only and column-gutter decisions replaced by bilateral page, outer-boundary, gutter, and guarded-offcut evidence with continuous confidence and abstention. | Scanned-single offcuts `16/30 -> 0/30`; born-digital destructive splits `19/30 -> 0/30`; scanned-spread recall `26/30 -> 27/30`; retained fixtures `29/29`. `.devkit/tasks/scan-cleanup/FRW-B-REPORT.md`, `.devkit/tasks/scan-cleanup/final-evidence/logs/stage-b-fixtures.log` |
| C — performance | Bounded analysis pyramid, adaptive affine fast paths, separable Chebyshev evaluation, safe reuse, deterministic Rayon, and word-parallel large morphology. | Stage-C classify `0.222/0.610 s` median/p90, full `0.327/1.353 s`, Costaz p223 `0.934 s`, RSS `134.875 MiB`; 0/160 decision changes. `.devkit/tasks/scan-cleanup/FRW-C-REPORT.md` |
| D — protocol/options | Strict v2 manifest/envelopes, one options/manifest authority, unit-bearing DTOs, preserved error codes, shared Rust/TS goldens, and native module split. | Four shared manifest goldens plus 29/29 fixtures and 0/160 classification changes. `.devkit/tasks/scan-cleanup/FRW-D-REPORT.md`, `native/scan-cleanup/tests/fixtures/protocol/` |
| E — state/lifecycle | Bounded renderer/Electron caches, owner/revision-scoped jobs, terminal TTL, AbortSignal cancellation, completed-only detection freshness, and exact-page progress. | Stage-E targeted matrix `136 files / 987 tests`; final superset `138 / 992`. `.devkit/tasks/scan-cleanup/FRW-E-REPORT.md`, `.devkit/tasks/scan-cleanup/final-evidence/gates/vitest-targeted.log` |
| F — image quality | Residual-validated background, feature binarization router, cautious graph despeckle, topology-safe smoothing, content-block retention, and robust-quantile canvas with non-clipping overflow. | Final route mix `47 Otsu / 12 Wolf / 2 Sauvola`; content-envelope median IoU `1.000`, minimum `0.606`; glyph goldens retain at least `98.5%` annotated ink; 0/160 classification changes and 0/61 black outputs. `.devkit/tasks/scan-cleanup/FRW-F-REPORT.md`, `.devkit/tmp/corpus-sweep/stage-f-f5/stage-f-content-iou.json` |
| G — renderer cleanup | Five session namespaces, preview/settings component splits, persistence split, dead-path removal, and separate runtime/workspace entrypoints. | Targeted coverage grew `137/989 -> 138/992`; final 138/992 passes. `.devkit/tasks/scan-cleanup/FRW-G-REPORT.md`, `.devkit/tasks/scan-cleanup/final-evidence/gates/vitest-targeted.log` |
| H — final battery | Full corpus re-sweep, Stage-B fixtures, corpus and manual cross-DPI, Ishodad visual, Prym lossless semantics, peak RSS, and all requested gates. | `.devkit/tasks/scan-cleanup/final-evidence/summary.json`, `.devkit/tasks/scan-cleanup/final-evidence/ishodad/`, `.devkit/tasks/scan-cleanup/final-evidence/prym/`, `.devkit/tasks/scan-cleanup/final-evidence/gates/` |

## 4. Corpus classification: baseline to final

`S/O/P` means single-uncut / page-with-offcut / two-page-spread. Stage B, Stage F, and Stage H have the same 150-DPI decisions. Evidence for the original and final columns is `.devkit/tmp/corpus-sweep/stage-b-before/aggregate.json` and `.devkit/tasks/scan-cleanup/final-evidence/corpus/aggregate.json`; Stage-B identity is recorded in `.devkit/tasks/scan-cleanup/FRW-C-REPORT.md`, and Stage-F-to-H identity is computed in `.devkit/tasks/scan-cleanup/final-evidence/summary.json`.

| Category | Pages | Original S/O/P | Stage B S/O/P | Stage F S/O/P | Final H S/O/P |
|---|---:|---:|---:|---:|---:|
| born-digital | 30 | 11 / 14 / 5 | 30 / 0 / 0 | 30 / 0 / 0 | **30 / 0 / 0** |
| dictionary-two-column | 30 | 6 / 4 / 20 | 22 / 0 / 8 | 22 / 0 / 8 | **22 / 0 / 8** |
| mixed | 30 | 9 / 8 / 13 | 30 / 0 / 0 | 30 / 0 / 0 | **30 / 0 / 0** |
| scanned-single | 30 | 9 / 16 / 5 | 30 / 0 / 0 | 30 / 0 / 0 | **30 / 0 / 0** |
| scanned-spread | 30 | 1 / 3 / 26 | 3 / 0 / 27 | 3 / 0 / 27 | **3 / 0 / 27** |
| **Total** | **150** | **36 / 45 / 69** | **115 / 0 / 35** | **115 / 0 / 35** | **115 / 0 / 35** |

Identity-keyed confusion across all 160 150/300-DPI decisions is below. The original-to-final comparison changed 91 decisions; Stage B and Stage F each changed zero decisions on the way to H. Evidence: `.devkit/tasks/scan-cleanup/final-evidence/summary.json`.

| Earlier decision | Final single | Final offcut | Final spread | Row total |
|---|---:|---:|---:|---:|
| Original single | 32 | 0 | 4 | 36 |
| Original offcut | 42 | 0 | 3 | 45 |
| Original spread | 42 | 0 | 37 | 79 |
| **Final total** | **116** | **0** | **44** | **160** |

| Comparison | Compared | Changed | Identity detail | Evidence |
|---|---:|---:|---|---|
| Original -> H | 160 | 91 | 32 S->S, 4 S->P, 42 O->S, 3 O->P, 42 P->S, 37 P->P | `.devkit/tasks/scan-cleanup/final-evidence/summary.json` |
| Stage B -> H | 160 | 0 | Stage B->C 0, C/E->F 0, F->H 0 | `.devkit/tasks/scan-cleanup/FRW-C-REPORT.md`, `.devkit/tasks/scan-cleanup/FRW-F-REPORT.md`, `.devkit/tasks/scan-cleanup/final-evidence/summary.json` |
| Stage F -> H | 160 | 0 | 116 S->S, 44 P->P | `.devkit/tasks/scan-cleanup/final-evidence/summary.json` |

Document-level points that must not be hidden: Costaz remains `4 S / 0 O / 2 P` against six physical-spread samples, while Chantraine remains `0 S / 0 O / 6 P` despite the old document-level label saying “single.” The six Chantraine pages were visually judged to be physical two-leaf scans, so this is a label conflict; Costaz is a real recall gap. Evidence: `.devkit/tasks/scan-cleanup/FRW-B-REPORT.md` and the `documentSummary` records in `.devkit/tasks/scan-cleanup/final-evidence/corpus/aggregate.json`.

## 5. Performance, safety, and image-quality metrics

Times are one-page release-process wall times excluding Poppler rasterization. `n/r` means that exact maximum was not retained in the corresponding stage report. Evidence: `.devkit/tmp/corpus-sweep/stage-b-before/aggregate.json`, `.devkit/tasks/scan-cleanup/FRW-B-REPORT.md`, `.devkit/tasks/scan-cleanup/FRW-C-REPORT.md`, `.devkit/tmp/corpus-sweep/stage-f-f5/aggregate.json`, and `.devkit/tasks/scan-cleanup/final-evidence/corpus/aggregate.json`.

| Operation | Metric | Original | Stage B | Stage C | Stage F | Final H | Target | Final status |
|---|---|---:|---:|---:|---:|---:|---:|---|
| classify 150 DPI, 150 pages | median | 0.419 s | 0.484 s | 0.222 s | 0.284 s | **0.283 s** | <0.300 s | met |
| classify 150 DPI | p90 | 7.535 s | 8.907 s | 0.610 s | 0.694 s | **0.720 s** | <1.500 s | met |
| classify 150 DPI | maximum | 17.368 s | 22.353 s | 1.160 s | 1.215 s | **1.198 s** | — | reported |
| classify 300 DPI, 10 pages | median | 1.270 s | 1.205 s | 0.311 s | 0.368 s | **0.365 s** | — | reported |
| classify 300 DPI | p90 | 1.370 s | 1.376 s | 0.391 s | 0.394 s | **0.396 s** | — | reported |
| classify 300 DPI | maximum | 1.399 s | n/r | n/r | 0.416 s | **0.399 s** | — | reported |
| Costaz p223, 101.113 MP | wall | 16.299 s | 22.353 s | 0.934 s | 1.022 s | **0.973 s** | <2.000 s | met |
| full BW, 50 pages | median | 0.628 s | 0.795 s | 0.327 s | 0.385 s | **0.400 s** | <0.450 s | met |
| full BW | p90 | 11.372 s | 15.033 s | 1.353 s | 1.435 s | **1.458 s** | <=11.372 s | met |
| full BW | maximum | 25.821 s | 36.389 s | 2.701 s | 2.624 s | **2.582 s** | <=25.821 s | met |
| complete sweep | wall | 570.495 s | 671.105 s | 206.232 s | 219.760 s | **218.262 s** | — | reported |

Deskew output population fell from 75 to 61 because destructive spread/offcut decisions were removed. Acceptance rate, median, p90, and range remain close; the final sole rejection is Ishodad page 97 right at confidence `1.761`. Evidence: `.devkit/tmp/corpus-sweep/stage-b-before/aggregate.json`, `.devkit/tasks/scan-cleanup/FRW-A-REPORT.md`, `.devkit/tmp/corpus-sweep/stage-f-f5/aggregate.json`, and `.devkit/tasks/scan-cleanup/final-evidence/corpus/aggregate.json`.

| Deskew metric | Original | Stage A | Stage F | Final H |
|---|---:|---:|---:|---:|
| accepted / rejected | 74 / 1 of 75 | 73 / 2 of 75 | 60 / 1 of 61 | **60 / 1 of 61** |
| median absolute angle | 0.000° | 0.000° | 0.000° | **0.000°** |
| p90 absolute angle | 0.535° | 0.535° | 0.686° | **0.686°** |
| signed range | -2.396°…+1.910° | -2.396°…+1.910° | -2.430°…+1.900° | **-2.430°…+1.900°** |

| Safety/quality metric | Original | Stage B | Stage F | Final H | Evidence |
|---|---:|---:|---:|---:|---|
| processing errors | 0 | 0 | 0 | **0** | `.devkit/tasks/scan-cleanup/final-evidence/corpus/errors.json` |
| all-black outputs | 1 / 75 | 0 / 61 | 0 / 61 | **0 / 61** | `.devkit/tasks/scan-cleanup/CORPUS-SWEEP-REPORT.md`, `.devkit/tasks/scan-cleanup/final-evidence/corpus/run-summary.json` |
| cross-DPI class changes within run | 0 / 10 | 0 / 10 | 0 / 10 | **0 / 10** | `.devkit/tasks/scan-cleanup/final-evidence/corpus/aggregate.json` |
| auto binarization routes | 70 Otsu / 5 Wolf | n/r | 47 Otsu / 12 Wolf / 2 Sauvola | **47 / 12 / 2** | `.devkit/tasks/scan-cleanup/CORPUS-SWEEP-REPORT.md`, `.devkit/tasks/scan-cleanup/final-evidence/corpus/aggregate.json` |

The Stage-H RSS workload uses the documented seed `0x5ca1c1ea`, 2550×3300 geometry, 300 DPI, forced single layout, BW output, despeckle, and no crop. Four fresh child runs measured `179.656`, `179.672`, `179.688`, and `179.672 MiB`; maximum `179.688 MiB` is below the `234.5 MiB` ceiling. The prior Stage-C pixel generator was not retained, so Stage H records its deterministic packed-bit generator in `measure.py`; the `179.688` versus `134.875` values are not claimed as an apples-to-apples memory regression. Evidence: `.devkit/tasks/scan-cleanup/final-evidence/rss/measure.py`, `.devkit/tasks/scan-cleanup/final-evidence/rss/results.jsonl`, and `.devkit/tasks/scan-cleanup/FRW-C-REPORT.md`.

## 6. Cross-DPI and real-PDF spot checks

### Ishodad spread

Ishodad page 32 classified as a two-page spread at both 150 DPI (`confidence 0.558`, cutter `825 px`) and 300 DPI (`confidence 0.561`, cutter `1648 px`). The downscaled source and cleaned halves were visually inspected: both physical leaves, headings, page numbers, body text, footnotes, and the inner seam remain present and readable; no half is black or missing. Evidence: `.devkit/tasks/scan-cleanup/final-evidence/xdpi/page-150.json`, `.devkit/tasks/scan-cleanup/final-evidence/xdpi/page-300.json`, `.devkit/tasks/scan-cleanup/final-evidence/ishodad/source-page-32-downscaled.png`, and `.devkit/tasks/scan-cleanup/final-evidence/ishodad/cleaned-halves-downscaled.png`.

### Prym lossless split

The four-page Prym source produced eight `297.5 x 842 pt` output halves. Each output pair retains the exact source page `/Contents` object reference; qpdf reports no syntax or stream errors; Poppler `pdfinfo` and `pdftotext` each wrote zero stderr bytes; the output text layer remains extractable (`13,597` non-whitespace characters, versus `13,509` from the four-page source). The character counts are reported as extraction evidence, not byte-for-byte textual equality; the exact preservation proof is the pairwise content-reference check. Evidence: `.devkit/tasks/scan-cleanup/final-evidence/prym/content-streams.json`, `.devkit/tasks/scan-cleanup/final-evidence/prym/qpdf-check.txt`, `.devkit/tasks/scan-cleanup/final-evidence/prym/pdfinfo.txt`, and `.devkit/tasks/scan-cleanup/final-evidence/prym/*stderr.txt`.

### Manual-box physical equivalence

The normalized left manual box maps to the same physical rectangle at 150 and 300 DPI: `x 27.6352 mm`, `y 24.87168 mm`, `width 96.7232 mm`, `height 155.448 mm`. Applied margins are exactly `5 mm` on all four sides, and both outputs are `113.284 x 169.503 mm`; the 300-DPI pixel dimensions are exactly twice the 150-DPI dimensions. Evidence: `.devkit/tasks/scan-cleanup/final-evidence/summary.json`, `.devkit/tasks/scan-cleanup/final-evidence/xdpi/output-150-left.json`, and `.devkit/tasks/scan-cleanup/final-evidence/xdpi/output-300-left.json`.

## 7. Final gates

| Gate | Result | Evidence |
|---|---|---|
| `cargo fmt --manifest-path native/Cargo.toml --all -- --check` | pass | `.devkit/tasks/scan-cleanup/final-evidence/gates/cargo-fmt.log` |
| `cargo clippy --manifest-path native/Cargo.toml --workspace --all-targets --all-features --locked -- -D warnings` | pass | `.devkit/tasks/scan-cleanup/final-evidence/gates/cargo-clippy.log` |
| `cargo test --manifest-path native/Cargo.toml --workspace --all-targets --all-features --locked --no-fail-fast` | pass, 233 tests | `.devkit/tasks/scan-cleanup/final-evidence/gates/cargo-test.log` |
| Stage-B real split fixture integration | pass, manifest 29/29 | `.devkit/tasks/scan-cleanup/final-evidence/logs/stage-b-fixture-count.txt`, `.devkit/tasks/scan-cleanup/final-evidence/logs/stage-b-fixtures.log` |
| direct `cargo deny --offline --locked check` | environment-limited: read-only advisory lock | `.devkit/tasks/scan-cleanup/final-evidence/gates/cargo-deny.log` |
| same deny policy/cache via disposable writable offline Cargo home | pass; advisories/bans/licenses/sources OK; duplicate/unmatched-ISC warnings only | `.devkit/tasks/scan-cleanup/final-evidence/gates/cargo-deny-offline.log` |
| ESLint on Scan Cleanup app/Electron/contracts/tests, including ignored public entrypoints | pass | `.devkit/tasks/scan-cleanup/final-evidence/gates/eslint-scan-cleanup.log` |
| targeted Vitest: Scan Cleanup + Electron Scan Cleanup + workspace shell | pass, 138 files / 992 tests | `.devkit/tasks/scan-cleanup/final-evidence/gates/vitest-targeted.log` |
| `pnpm typecheck` | pass for app, Electron, tests, scripts, packages, server | `.devkit/tasks/scan-cleanup/final-evidence/gates/pnpm-typecheck.log` |
| `pnpm lint` | ESLint and stylelint pass; wrapper stops at sandbox-denied `tsx` IPC socket | `.devkit/tasks/scan-cleanup/final-evidence/gates/pnpm-lint.log` |
| all 15 `check:static:fast` children through non-IPC `node --import tsx`/Node entrypoints | pass, including protocol, naming, and 7,457-import architecture checks | `.devkit/tasks/scan-cleanup/final-evidence/gates/pnpm-lint-static-bypass.log` |
| `pnpm run build:electron` | pass | `.devkit/tasks/scan-cleanup/final-evidence/gates/build-electron.log` |
| `pnpm run build:scan-cleanup` | pass; Darwin ARM64 SHA-256 `f4dce9f79be1c11698b78a574aef368014444af19f9806838d1fd763323c62e1` | `.devkit/tasks/scan-cleanup/final-evidence/gates/build-scan-cleanup.log` |
| `pnpm run check:resources:matrix` | native matrix/tessdata pass; wrapper stops at sandbox-denied OCR-registry `tsx` IPC socket | `.devkit/tasks/scan-cleanup/final-evidence/gates/resources-matrix.log` |
| OCR registry through non-IPC `node --import tsx` | pass; 11 tessdata_best languages | `.devkit/tasks/scan-cleanup/final-evidence/gates/resources-matrix-ocr-bypass.log` |
| `git diff --check` | pass | `.devkit/tasks/scan-cleanup/final-evidence/gates/git-diff-check.log` |

The `tsx` wrapper failures are environmental, not hidden successes: both original wrapper logs retain `listen EPERM`, and the exact child scripts were rerun individually without the CLI IPC server. Evidence: `.devkit/tasks/scan-cleanup/final-evidence/gates/pnpm-lint.log`, `.devkit/tasks/scan-cleanup/final-evidence/gates/pnpm-lint-static-bypass.log`, `.devkit/tasks/scan-cleanup/final-evidence/gates/resources-matrix.log`, and `.devkit/tasks/scan-cleanup/final-evidence/gates/resources-matrix-ocr-bypass.log`.

## 8. Known gaps and deferred work

- **Costaz spread recall remains 2/6.** Four sampled physical spreads abstain to single; page 1 remains the retained positive control. Raising recall must not reintroduce dictionary-column false splits. Evidence: `.devkit/tasks/scan-cleanup/FRW-B-REPORT.md`, `.devkit/tasks/scan-cleanup/final-evidence/corpus/aggregate.json`, and `native/scan-cleanup/tests/fixtures/split/fixtures.json`.
- **Chantraine's coarse label is wrong for the sampled pages.** All six are classified spread; visual review found physical facing leaves. Report both `6/24` against coarse dictionary labels and `0/18` false spreads on genuinely single dictionary documents; do not tune to the bad label. Evidence: `.devkit/tasks/scan-cleanup/FRW-B-REPORT.md` and `.devkit/tasks/scan-cleanup/final-evidence/corpus/aggregate.json`.
- **Kurdish 1913 remains 3/6 spread recall.** Pages 1, 38, and 153 abstain; the first/last are boundary-like, while page 38 remains a real hard case. Evidence: `.devkit/tasks/scan-cleanup/FRW-B-REPORT.md` and `.devkit/tasks/scan-cleanup/final-evidence/corpus/aggregate.json`.
- **Stage-F layout analysis keeps a legacy background-fit compatibility fence.** Final rendering uses the residual-validated Cholesky model, while layout classification retains the calibrated legacy surface to preserve 0/160 decisions. Removing the fence requires a new corpus-gated classifier calibration. Evidence: `.devkit/tasks/scan-cleanup/FRW-F-REPORT.md`.
- **Stage-F smoothing is calibrated, not universal.** The topology-safe profile applies only at 120–600 DPI and estimated stroke width 1–12 px; other inputs explicitly use the legacy fallback. Evidence: `.devkit/tasks/scan-cleanup/FRW-F-REPORT.md`.
- **Stage-F content-box evidence is stability evidence, not ground truth.** The `0.606` minimum IoU was visually reviewed, but no manual box corpus exists; pages above the 90th-percentile matched canvas remain intrinsic rather than being clipped. Evidence: `.devkit/tasks/scan-cleanup/FRW-F-REPORT.md` and `.devkit/tmp/corpus-sweep/stage-f-f5/stage-f-content-iou.json`.
- **OCR quality was not scored.** F4 has Hebrew-niqqud, Arabic-dot, and Bedjan-speckle goldens, but the Stage-H corpus battery measures pixels/geometry, not character or word accuracy. Evidence: `native/scan-cleanup/tests/fixtures/glyphs/`, `.devkit/tasks/scan-cleanup/FRW-F-REPORT.md`, and `.devkit/tasks/scan-cleanup/CORPUS-SWEEP-REPORT.md`.
- **Full RLE morphology remains deferred.** Stage C implemented word-parallel 75×5 and 40×2 bricks only. Evidence: `.devkit/tasks/scan-cleanup/research/feature-rework-plan.md` and `.devkit/tasks/scan-cleanup/FRW-C-REPORT.md`.
- **The retained corpus harness still exercises v1 through the explicit compatibility flag.** Production is strict v2; migrate the harness before removing the deprecation window. Evidence: `.devkit/tmp/corpus-sweep/sweep.py`, `.devkit/tasks/scan-cleanup/final-evidence/ishodad/run.stderr.txt`, and `.devkit/tasks/scan-cleanup/FRW-D-REPORT.md`.
- **Corpus coverage is stratified, not an accuracy estimate.** Only 25 of 1,483 PDFs, six classification pages/document, two cleanup pages/document, and ten 300-DPI repeats were run. Evidence: `.devkit/tasks/scan-cleanup/CORPUS-SWEEP-REPORT.md` and `.devkit/tasks/scan-cleanup/final-evidence/corpus/run-summary.json`.
- **Stage H did not claim a headed UI/Electron E2E pass.** Its required real-PDF lane was the native release helper plus lossless page ops; UI confidence comes from 992 targeted unit/component tests, typecheck, lint/static checks, and Electron build. Evidence: `.devkit/tasks/scan-cleanup/final-evidence/gates/vitest-targeted.log` and `.devkit/tasks/scan-cleanup/final-evidence/gates/build-electron.log`.

## 9. Maintenance guide

1. Read the decision source before changing behavior: `research/feature-rework-plan.md`; use `research/algorithmic-review.md` for algorithm risks and `research/architecture-review.md` for ownership boundaries. UX/drag/workspace references are `research/scantailor-ux-survey.md`, `research/drag-system-research.md`, `research/drag-rework-plan.md`, and `research/workspace-rebuild-spec.md`.
2. Change serialized shapes first in `packages/contracts/scan-cleanup/`; derive Electron/native variants instead of duplicating them. Update the shared protocol goldens under `native/scan-cleanup/tests/fixtures/protocol/`, then run `tests/unit/electron/scanCleanupNativeManifestBuilder.test.ts` and Cargo protocol tests. Evidence recipe: `.devkit/tasks/scan-cleanup/FRW-D-REPORT.md`.
3. Keep options policy in `electron/features/scan-cleanup/policy/effectiveOptions.ts` and manifest construction in `electron/features/scan-cleanup/policy/buildNativeScanCleanupManifest.ts`; do not add path-local builders. Verify with `node --import tsx scripts/checkNativeToolProtocols.ts` and the targeted Vitest command logged in `.devkit/tasks/scan-cleanup/final-evidence/gates/vitest-targeted.log`.
4. For classifier changes, run the 29-case fixture first, then the entire retained corpus. The commands are `cargo test --manifest-path native/Cargo.toml -p evb-scan-cleanup --test split_real_fixtures` and `python3 .devkit/tmp/corpus-sweep/sweep.py && python3 .devkit/tmp/corpus-sweep/aggregate.py`; compare identity keys against `.devkit/tmp/corpus-sweep/stage-f-f5/aggregate.json`. Evidence recipe: `.devkit/tasks/scan-cleanup/final-evidence/logs/stage-b-fixtures.log` and `.devkit/tasks/scan-cleanup/final-evidence/summarize.py`.
5. For performance changes, build release first with `pnpm run build:scan-cleanup`; use harness wall times, Costaz p223, and the fixed RSS script together. Evidence recipe: `.devkit/tasks/scan-cleanup/final-evidence/corpus/aggregate.json` and `.devkit/tasks/scan-cleanup/final-evidence/rss/measure.py`.
6. For image-quality changes, preserve Stage-F one-candidate-at-a-time corpus gating, the glyph goldens, route distribution, and visual pairs. Evidence: `.devkit/tasks/scan-cleanup/FRW-F-REPORT.md`, `native/scan-cleanup/tests/fixtures/glyphs/`, and `.devkit/tmp/corpus-sweep/stage-f-gallery/`.
7. For real-PDF regressions, reuse the retained manifests/instructions rather than hand-editing one-off commands: Ishodad in `final-evidence/ishodad/`, manual cross-DPI in `final-evidence/xdpi/`, and Prym lossless in `final-evidence/prym/`. The Linguae corpus remains read-only. Evidence: `.devkit/tasks/scan-cleanup/final-evidence/`.
8. Preserve renderer ownership: five workspace-session namespaces, preview/settings component boundaries, bounded preview cache, and separate runtime/workspace entrypoints. Evidence: `.devkit/tasks/scan-cleanup/FRW-G-REPORT.md` and `tests/unit/app/modules/scan-cleanup/scanCleanupPublicEntrypoints.test.ts`.
9. Run the full Stage-H gate table before release. On this managed macOS sandbox, treat `tsx` CLI `listen EPERM` only as a wrapper caveat after every child has passed through `node --import tsx`; retain both wrapper and bypass logs. Evidence recipe: `.devkit/tasks/scan-cleanup/final-evidence/gates/`.

## 10. Evidence index

- Final roll-up: `.devkit/tasks/scan-cleanup/final-evidence/summary.json`
- Final corpus: `.devkit/tasks/scan-cleanup/final-evidence/corpus/`
- Ishodad visual pair: `.devkit/tasks/scan-cleanup/final-evidence/ishodad/`
- Prym lossless proof: `.devkit/tasks/scan-cleanup/final-evidence/prym/`
- Cross-DPI manual box: `.devkit/tasks/scan-cleanup/final-evidence/xdpi/`
- Peak RSS: `.devkit/tasks/scan-cleanup/final-evidence/rss/`
- Gate logs: `.devkit/tasks/scan-cleanup/final-evidence/gates/`
- Retained fixture log: `.devkit/tasks/scan-cleanup/final-evidence/logs/`
- Original baseline: `.devkit/tasks/scan-cleanup/CORPUS-SWEEP-REPORT.md`
- Stage reports: `.devkit/tasks/scan-cleanup/FRW-A-REPORT.md` through `.devkit/tasks/scan-cleanup/FRW-G-REPORT.md`

## 11. Geometry-model addendum (Stages M1–M2, 2026-07-22)

The margins/paper/scopes rework is governed by `.devkit/tasks/scan-cleanup/research/geometry-model.md` (invariants I1–I6), derived from `research/scantailor-margins-model.md` and `research/our-margins-audit.md`.

- Stage M1 (preview conformance): the renderer now reproduces native geometry verbatim — paper from `canvasWidthPx/HeightPx`, raster at `placementOffsetXPx/YPx`, overlays projected through the same placement and clipped inside the paper element. All renderer-side placement/canvas re-derivation was deleted (including the negative-slack clamp that pushed content off-paper when margins grew). The frozen viewport-frame signature now includes per-output intrinsic/canvas dims and applied margins, so paper changes re-fit while pixel-only refreshes and pointer drags stay frozen. Evidence: `.devkit/tasks/scan-cleanup/MARGINS-M1-REPORT.md`.
- Stage M2 (four margins + scopes): `marginMm` scalar replaced by `marginsMm {leftMm, topMm, rightMm, bottomMm}` across contract, codecs, effectiveOptions, and persistence (legacy scalar migrates to four equal sides; margins persist per document with the global preference as seed). Per-page `marginsMm` overrides flow through the Selection tab and the existing Apply-to scopes with reset-to-document pruning semantics; manifest v2 was already per-page, so no native changes. Document and Selection tabs expose four linked-by-default spinboxes (link toggle is UI-only), with en+ru copy. Evidence: `.devkit/tasks/scan-cleanup/MARGINS-M2-REPORT.md`.
- Post-M2 taste pass: shared `SCAN_CLEANUP_MARGIN_MAX_MM` contract constant used by UI bounds, runtime clamp, IPC codec, and preference clamps; shared axis-paired `SCAN_CLEANUP_MARGIN_SIDES` field order; margins-header CSS scoping fix; `resolvePreviewViewportFrame` reduced to its real signature.
- Verification: scan-cleanup unit suites 102/102 (app) and 36/36 (electron) plus full lint/typecheck; native asymmetric-margin proof on the Luther spread (left 20 mm → 118.1 px, right 0 mm → 0 px, bottom 10 mm → 59.1 px at 150 DPI; identical content boxes across margin changes; every output inside its canvas); headless Electron acceptance e2e extended with a linked margin-sweep step asserting four side inputs, content/raster containment in the paper, and content-to-paper ratio shrink after setting 25 mm.

### M3: margin-editor architecture rewrite (2026-07-22)

Field video evidence showed stepper clicks on the four margin inputs being lost or reverted. Root cause was architectural: four native `type="number"` inputs (spinner half-hidden by `appearance-none`) bound to one shared object that was wholesale-replaced on every edit, echoing every keystroke back into the field being edited. Rewrite: linked mode renders ONE "All sides (mm)" field and unlinked mode renders four per-side fields (editor count equals independent-value count); all margin editors are controlled `UInputNumber` components; updates flow through a pure per-key patch resolver (`resolveScanCleanupMarginPatch`) applied in place, so untouched sides never re-render and the edited field's echo is a no-op. Link state derives from stored-margin uniformity on load and re-linking unifies explicitly. The investigation also surfaced and fixed a mount-time double-scheduling race in `useScanCleanupDetectionSession` (lifecycle watch + mounted hook both queued auto-detect; the late one could wipe fresh detection state). Verification: 103/103 scan-cleanup unit tests, lint/typecheck clean, and the headless acceptance e2e extended with an exact-stepper-click regression (three real increment-button clicks advance the value by exactly three) plus the margin sweep against the linked field — all passing.

### M4: ephemerality contract, visible skeleton, and state-architecture audit fixes (2026-07-22)

Field video showed the loading skeleton rendering as an invisible white-on-white box and split state surviving surface close/reopen. Fixes: the skeleton is now a bordered paper frame with an inset accented pulsing block (screenshot-verified headless); closing the scan-cleanup surface (Done or tab close) discards the split session via `discardScanCleanupDocumentState` — in-memory detection restore cache, persisted page overrides, and saved tab view state — while document margins and global preferences persist as editing defaults. A fresh-session adversarial audit (STATE-FIXES-REPORT.md; audit answers embedded there) of the renderer state architecture then produced six further fixes: a synchronous single-flight Run lock; a renderer-wide shared reactive global-preferences store (kills cross-tab wholesale preference overwrites); disposal fences on late detection subscribe/cancel continuations (cannot resurrect discarded state); owner-scoped run errors (tab A's failure no longer renders in tab B); and discard-on-tab-close. Known accepted limitation: two surfaces opened on the same document share per-document state, so a discard from one affects both. Verification: 993 unit-app tests (scan-cleanup + workspace-shell) and 1670 unit-electron tests pass, lint/typecheck clean, and the headless acceptance e2e now asserts close→reopen freshness (no instant result, unclassified thumbnails, skeleton phase present).

### M5: settings-panel scope UX redesign (2026-07-22)

Field verdict on the Document/Selection tabs ("even I don't understand how switching to and fro selection works") led to a ground-up redesign, spec'd in research/settings-scope-redesign.md, design-reviewed (Opus; three blockers resolved pre-build: silent scope stickiness, ambiguous trailing numbers, segmented-control width), and implemented in two sol@high stages (SCOPE-R1/R2 reports). The panel is now a single surface split by function: a vertical scope radiogroup ("All N pages" / "This page (p. N)" / "Selected: K pages" with count badges), a persistent blast-radius line, visible auto-switch to Selected on intentional multi-select, heavier All-pages active treatment, one instance of every geometry control routed per scope (All → document defaults with equality pruning; page scopes → overrides), per-control override markers with self-evident resets (replacing the opaque "Reset to document settings" button), All-pages override-count chips, scope-aware bulk reset, a This-page-only "Apply this page to…" propagation menu, and a unified three-pane header band via --app-scan-header-height. Related same-day UX batch: zoom mode removed (Fit-only preview), Details footnote made link-like, four always-visible synchronized margin fields (no linked-collapse layout shift), wider settings rail (20rem), stable scrollbar gutter, dead-scroll fade mask removed, sort-dropdown min-width fix. Verification: 994 unit tests green, lint/typecheck clean, headless acceptance e2e extended with scope-panel assertions (radiogroup state, blast-radius text, override marker round-trip, header-band pixel alignment, linked-sync stepper regression) — all passing; screenshot review of All/This page/Selected/override states from the real headless app.

# Scan cleanup v5 progress

## Phase 1 — contracts and per-page pipeline

- `implemented` Shared per-page override contracts: rotation, layout override, exclusion, and manual cutter.
- `implemented` Orthogonal pre-rotation is an exact pixel permutation composed into the source transform; output metadata records one interpolating resample.
- `implemented` Excluded pages produce no outputs and page-level result metadata remains available to the preview/list.
- `verified` Contract typechecks, targeted Vitest, and Rust override/rotation/exclusion tests pass.

## Phase 2 — control center and cutter

- `implemented` Collapsible middle page column with one compact source-page row, detected classification, auto/single/spread/keep-left/keep-right, exclusion, and 0°/90°/180°/270° rotation.
- `implemented` Row click and Up/Down keyboard navigation follow the main preview.
- `implemented` Cutter overlay in Original and Cleaned views; pointer dragging, double-click reset, Arrow 1% nudge, and Shift+Arrow 5% nudge update `manualSplitX`.
- `implemented` Exact override-aware page estimate when every automatic classification is known; otherwise the footer is explicitly approximate.
- `verified` Preview coordinate round-trip and estimate math tests pass.

## Phase 3 — persistence, RTL, and blanks

- `implemented` Global last-used settings and bounded per-document overrides use the app's safe preference storage and document revision identity.
- `implemented` Reset all overrides removes the document entry and clears the active controls.
- `implemented` RTL reverses spread output order in preview and worker assembly while retaining physical left/right labels.
- `implemented` Post-geometry blank detection is DPI-scaled, optional, and counted in summary metadata.
- `verified` Persistence isolation/reset and blank-output Rust tests pass.

## Phase 4 — split and content upgrades

- `implemented` Structural split route is a weighted Hough accumulator over ±7° on a 100 DPI working image, combined with the whitespace route.
- `implemented` Content scoring uses the exact squared Euclidean distance transform plus component context to reject isolated thick scan-bed dirt while retaining nearby marginalia.
- `verified` Faint 3° fold and dirt/marginalia fixtures pass alongside the prior conservative fixtures.

## Phase 5 — color, concurrency, and memory

- `implemented` RGB PNG decode/encode and one-pass affine color rendering preserve hue; BW and grayscale keep their existing APIs and behavior.
- `implemented` Rasterization uses three cancellation-aware workers and preserves source order.
- `implemented` Local threshold statistics now use a rolling row window instead of two full-resolution `u64` integral planes.
- `verified` Color geometry/hue cargo test passes; fixed-seed noisy 2550×3300 BW peak is 234.5 MiB; 10-page raster wall time improves from 5.57 s to 2.31 s.

## Phase 6 — automatic dewarp ship gate

- `deferred` The existing deterministic envelope detector is not a connected-component + SEDM text-line tracer and has no valid ≤2 px post-dewarp RMS acceptance result.
- `implemented` The user-facing option remains hidden and defaults off. The compatibility CLI flag and confidence-gated existing detector remain, without claiming B1 completion.
- `verified` Existing cylindrical mapping, bidirectional grid, and inverse-area rasterizer tests remain green.

## Phase 7 — OCR chaining and gates

- `implemented` Desktop footer option triggers the existing `ocr.start` workspace action only after the generated PDF opens.
- `implemented` Completion toast distinguishes cleanup-only from cleanup-plus-OCR.
- `verified` Mocked ordering test proves open → OCR → combined toast; no OCR logic was duplicated.
- `verified` Full typecheck, full lint/static checks, targeted Vitest, cargo fmt/clippy/test/deny, Electron build, scan-cleanup build, and native resource matrix pass.
- `verified` No Electron E2E or dev server was run, as required by this mission.

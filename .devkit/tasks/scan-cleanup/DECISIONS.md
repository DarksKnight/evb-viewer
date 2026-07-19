# Scan cleanup v5 decisions

1. Per-page shapes live in `packages/contracts` and both renderer and worker derive behavior from the same merge helpers. This avoids drift at the IPC/manifest boundary.
2. A page override is sparse. Restoring every field to its default removes the record, which keeps estimate math and document persistence compact.
3. Orthogonal rotation is an exact pixel permutation before analysis. Its affine is composed with the crop/deskew affine; only the final output rasterizer interpolates, so metadata reports `resamplePasses: 1`.
4. `manualSplitX` is measured in the rotated analysis image. Preview helpers use rotation-aware analysis width for pointer and keyboard round trips.
5. Physical half identity is retained as `left`/`right`; reading order changes array order, not labels. This makes RTL behavior explicit and prevents mislabeled pages.
6. Page-result metadata is separate from per-output metadata so excluded and skipped-blank pages can still report classification, cutter, rotation, and zero outputs.
7. Settings use the repository's safe local-storage adapter. Document overrides are keyed by the existing document revision `documentRef`, falling back to the source reference, and capped at the 50 most recently updated documents.
8. OCR chaining calls the workspace agent action `ocr.start` after the new tab is active. This is the existing public OCR entry point and deliberately does not import OCR internals.
9. RGB data is decoded only for Color output. BW/grayscale decode only a gray plane so Color support does not increase their peak working set.
10. Local thresholding uses a two-pass rolling row window. It computes the same mean/deviation formulas while replacing two full-page `u64` planes with at most `2r+1` rows of `u32` statistics.
11. Rasterization has a fixed concurrency of three. The worker pool writes results by source index, reports completed-count progress, and propagates the shared abort signal to every Poppler call.
12. The automatic-dewarp checkbox is ship-gated and hidden. The current envelope detector is deterministic and confidence-gated but does not meet the requested line-tracing/RMS evidence, so exposing it would overstate quality.
13. No new icon was added. Existing registered icons and text controls cover the feature, leaving the baseline-dirty `nuxt.config.ts` untouched.
14. The intentionally deleted predecessor `ScanCleanupPopup.vue` remains deleted; the public export continues to use `ScanCleanupDialog.vue`.

## Dirty-worktree discipline

- Initial dirty scan-cleanup dialog/preview/test state was treated as the required base and extended in place.
- `nuxt.config.ts` was baseline-dirty for another task and was not edited or formatted by this mission.
- The baseline scan-cleanup E2E change was preserved, but no Electron E2E was run or altered in this phase.
- No files were staged, committed, branched, or pushed.

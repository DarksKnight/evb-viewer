# Scan cleanup report v5

## Outcome

The Scan cleanup dialog is now a per-page control center. Every source page has a compact row with detected Single/Spread/Offcut state, an Auto/Single/Spread/Keep left/Keep right override, exclusion, and cyclic rotation. The page list collapses, row selection drives the main preview, and Up/Down navigation is keyboard accessible.

Spread cutters are editable in both comparison modes. Pointer drag writes a page-local manual cutter, double-click restores automatic detection, and Arrow/Shift+Arrow provide 1%/5% adjustments. Overrides are restored per document; the remaining settings are restored globally. Estimates account for forced layouts and exclusions and become exact once all automatic pages have classifications, except when blank-page removal makes the final count unknowable before processing.

Output now supports BW, Grayscale, and Color. Color retains RGB hue through the same crop/deskew/margin/canvas geometry and single interpolating affine pass. RTL reverses each spread's emitted order. Optional blank removal is counted. Optional OCR runs through the existing workspace action after the generated result opens.

The structural algorithm route now uses a weighted ±7° Hough accumulator, and content detection uses SEDM thickness scoring to reject isolated dirt. Three Poppler raster workers run concurrently while retaining source order and cancellation.

## Automatic dewarp ship gate

B1 is not claimed. Inspection and testing showed that `auto_dewarp.rs` remains a smoothed top/bottom envelope detector; it does not extract connected-component text lines, trace SEDM seeds, or select a model by post-dewarp line-straightness consensus. There is therefore no honest synthetic result proving ≤2 px RMS at 300 DPI equivalent.

Per B3, the checkbox remains hidden and defaults off. The compatibility CLI flag remains accepted, the detector remains confidence-gated with a no-op warning below threshold, and the already-tested cylindrical model/area rasterizer is unchanged. This avoids exposing an option that can visibly warp real scans.

## Acceptance evidence

- Per-page merge, estimate, exclusion, rotation, one-resample metadata, cutter round trip: passing Vitest and cargo tests.
- Hough: faint 3° slanted-fold fixture passes; previous gutter fixture remains unchanged and passes.
- Content: isolated thick dirt is excluded while separated marginalia stays in bounds; previous border-shadow fixture remains unchanged and passes.
- Blank pages: white output is skipped and a nonblank output remains.
- Color: RGB patch remains red-dominant and its forward transform equals grayscale geometry.
- OCR: mocked completion proves generated PDF open occurs before `ocr.start`, then the combined toast is emitted.
- Persistence: global settings, document isolation, malformed-data fallback, and reset pass.
- Raster concurrency: unit test proves peak concurrency 3 and stable result order.

## Reproducible memory measurement

Host: macOS ARM64. Binary: Cargo release build. Fixture: 2550×3300 RGB PNG with gray gradient, randomized scan noise, and thirteen dark horizontal text-rule bands. Mode: BW, crop on, 300 DPI, despeckle on, uniform canvas off.

Fixture generation:

```sh
magick -size 2550x3300 gradient:'#f4f4f4-#d8d8d8' -seed 424242 -attenuate 0.08 +noise random -fill '#202020' -stroke none -draw 'rectangle 260,420 2290,430 rectangle 260,620 2100,630 rectangle 260,820 2250,830 rectangle 260,1020 2150,1030 rectangle 260,1220 2280,1230 rectangle 260,1420 2050,1430 rectangle 260,1620 2240,1630 rectangle 260,1820 2180,1830 rectangle 260,2020 2260,2030 rectangle 260,2220 2080,2230 rectangle 260,2420 2220,2430 rectangle 260,2620 2140,2630 rectangle 260,2820 2250,2830' -colorspace sRGB -depth 8 PNG24:input.png
```

Measurement:

```sh
cargo build --release --manifest-path native/scan-cleanup/Cargo.toml
/usr/bin/time -l native/target/release/evb-scan-cleanup --input input.png --output output.png --metadata output.json --options '{"dpi":300,"layout":"force-single","outputMode":"bw","cropContent":true,"matchPageSize":false,"marginsMm":[5,5,5,5],"despeckle":true}'
```

- Final staged binary: `245907456` bytes peak RSS (234.5 MiB), below the 300 MiB criterion.
- Final wall time: 3.28 s.
- During diagnosis, an earlier unseeded noisy fixture peaked at `409583616` bytes with the full-page integral planes and `265895936` bytes after the rolling-window change. Those unseeded numbers explain the optimization but are not presented as reproducible acceptance evidence.

## Reproducible rasterization measurement

A ten-page PDF was made by passing the same 1275×1650 synthetic scan ten times to `img2pdf`. Each page was rasterized at 300 DPI with a separate `pdftoppm -f N -l N -singlefile -png` call, matching the worker's per-page operation. `/usr/bin/time -p` measured:

- Serial loop: 5.57 s real, ten PNGs.
- `xargs -P3`: 2.31 s real, ten PNGs.
- Wall-time reduction: 58.5% on this fixture.

The production worker uses its own fixed three-worker promise pool rather than `xargs`; the test proves the same bound and stable ordering.

## Gates

- Baseline `pnpm typecheck`: pass.
- Baseline `pnpm lint`: pass.
- Final `pnpm typecheck`: pass.
- Final `pnpm lint`: pass, including locale parity, icon coverage, layout-token policy, and architecture checks.
- Targeted scan-cleanup Vitest: 7 files, 22 tests, pass.
- `cargo fmt --check`: pass.
- `cargo clippy --all-targets -- -D warnings`: pass.
- `cargo test --manifest-path native/scan-cleanup/Cargo.toml`: 25 library + 3 CLI integration + 1 protocol tests, pass.
- `cargo deny`: advisories/bans/licenses/sources pass; four unmatched-license-allowance warnings only.
- `pnpm run build:electron`: pass.
- `pnpm run build:scan-cleanup`: pass; Darwin ARM64 staged SHA-256 `f15d467192c33f341daae37f59e7fd072c1c97b8071fbc66bf888037f51c1e61`.
- `pnpm run check:resources:matrix`: pass for all source/CI-generated platform rows.
- Electron E2E and dev servers: intentionally not run, per mission instructions.

## Worktree preservation

The baseline snapshot is `WORKTREE-BASELINE-V5.txt`. The unrelated baseline-dirty `nuxt.config.ts` remains outside this implementation. The mission-owned pre-existing dialog/preview/test changes were retained and extended. No stage, commit, branch, push, dev server, or default Electron session operation occurred.

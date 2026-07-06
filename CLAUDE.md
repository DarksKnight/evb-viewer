# evb-viewer Rules

## OCR

- Prioritize OCR quality and robustness over tool, language, or bundle-size constraints.
- Use `tessdata-best` models from `https://github.com/tesseract-ocr/tessdata_best`.
- Keep OCR language models and the canonical registry in sync.

## UI

- Use design tokens from `app/assets/css/main.css`; avoid raw CSS values in components.
- Localize UI-facing text with `t()` and update the English and Russian message files together.
- Register all icons in `clientBundle.icons` in `nuxt.config.ts`.

## Naming

- Use lower kebab-case for Nuxt, Vue, Electron, package, and feature directories.
- Use camelCase for TypeScript files, with dot suffixes only for established roles.
- Use PascalCase for Vue components.
- Keep route files lower kebab-case when Nuxt route conventions call for it.

## Verification

- `pnpm run check:naming` is part of `pnpm lint`.
- Run `pnpm validate` after major changes.
- Use `pnpm run fallow:all` for failing dead-code and duplicate checks; use `pnpm run fallow:health:summary` only when you need the informational maintainability report.
- For dev-server evidence, inspect `.devkit/scratch/dev-server-logs/latest-run.json`; `pnpm dev` tees launcher, Nuxt, and Electron output there.
- Run `pnpm run check:dev-env` when working from a new host or before Electron/browser/native-tool tasks; it reports whether the environment is headed or headless and whether VPS dependencies are present.
- On headless Linux, use `pnpm run electron:run:headless -- <command>`, `pnpm run dev:headless`, or `pnpm run test:e2e:electron:headless` instead of assuming a desktop display.

## PDF Notes

- Read the FreeText note-persistence documentation before changing annotation serialization or note-window code.
- Electron e2e runs in nightly/manual diagnostics until the smoke lane is stable enough to promote; keep release gates focused on deterministic checks.
- Run the Electron e2e smoke lane from a checkout without a live dev session; a running `default` session in the same directory makes timing-sensitive viewerSmoke tests (PNG open, DjVu wheel scroll) fail spuriously — use a separate git worktree or stop the session first.
- For visual PDF navigation blink/skeleton debugging, see `scripts/diagnostics/README.md`.

## Git

- Never create a new branch unless the user explicitly asks.
- Work directly on the repository's default branch unless the user asks to use another branch.

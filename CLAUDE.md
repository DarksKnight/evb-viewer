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
- Use isolated headless Electron E2E sessions for autonomous real-app verification on every host. Never attach to, restart, show, activate, focus, or reuse the `default` headed development session unless the user explicitly asks for headed dev-app interaction in the current task.
- Mentioning Electron or an Electron feature is not permission to use the headed development app. If a scenario cannot be verified headlessly, report the limitation instead of falling back to the headed app.
- Do not run `pnpm dev`, `pnpm start`, or `pnpm electron:run ... --session=default` for autonomous verification. Use `pnpm run test:e2e:electron:headless` or `pnpm run electron:run:headless -- <command>` with a non-default isolated session; the wrappers use Xvfb on headless Linux.

## PDF Notes

- Read the FreeText note-persistence documentation before changing annotation serialization or note-window code.
- Electron e2e runs in nightly/manual diagnostics until the smoke lane is stable enough to promote; keep release gates focused on deterministic checks.
- Electron E2E sessions must coexist with a live `default` development session. Keep renderer ports, command/CDP ports, profiles, process cleanup, and stale-session pruning scoped to the generated `e2e-*` session; never stop or mutate `default` as test setup or teardown.
- For visual PDF navigation blink/skeleton debugging, see `scripts/diagnostics/README.md`.

## Git

- Never create a new branch unless the user explicitly asks.
- Work directly on the repository's default branch unless the user asks to use another branch.

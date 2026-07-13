---
name: run-all-gates
description: Use in the evb-viewer repo when the user asks to run every quality, validation, CI, commit, or release gate; drive all failures to green autonomously, including failures that appear preexisting; then commit and push when requested. Covers `pnpm run validate`, coverage, `pnpm run release:verify`, commit-gate staging, and release-safe fix loops.
---

# EVB Viewer Run All Gates

## Intent

Drive the EVB Viewer repository to a green state, not just to a failure report. Treat every gate failure as in scope for diagnosis and repair, including failures that were already present before the current user request, unless the next step would require a destructive git operation, a force push, credential changes, paid external services, or a real product decision.

## Initial Orientation

1. Read `/Users/evb/AGENTS.md`, repo `AGENTS.md`, and `CLAUDE.md` before changing files.
2. Inspect `git status --short --branch` and keep a mental boundary between preexisting worktree changes and files changed for the gate-fix task.
3. Do not create or switch branches unless the user asked. Work on the current branch.
4. Do not stash, reset, clean, revert, force push, or terminate servers without explicit permission.
5. If the user request includes commit and push, treat that request as permission to commit and push the in-scope changes after all gates are green. Otherwise ask before committing or pushing.

## Gate Runner

Use the bundled runner from the repo root:

```bash
node .agents/skills/run-all-gates/scripts/run-all-gates.mjs
```

The default sequence is:

1. `pnpm run validate`
2. `pnpm run test:coverage`
3. `pnpm run release:verify`
4. `node .agents/skills/run-all-gates/scripts/release-cut-preflight.mjs`

The runner logs each gate to `.devkit/gates/<timestamp>/`, stops at the first failure, and prints the failing log path. Use `--list`, `--only <gate>`, `--from <gate>`, or `--skip <gate>` for targeted reruns while iterating.

Run `pnpm run gate:commit` after staging the intended commit, because it depends on staged files.

## Fix Loop

1. Run the next full gate or the smallest failing subcommand that reproduces the failure quickly.
2. Read the error output and the referenced files. Prefer root-cause fixes over suppressions, broad ignores, or test expectation churn.
3. If the failure is in preexisting code, fix it anyway. Note that it was preexisting only in the final summary; do not use that as a reason to stop.
4. If the failure touches files already modified by the user, work with the current file contents. Do not revert unrelated edits.
5. Rerun the failing command after each fix, then continue through the remaining gates.
6. When a verification script fails because the script is stale or wrong, fix the script instead of bypassing it.
7. Keep generated or temporary artifacts in ignored locations such as `.devkit/`, `.tmp/`, `dist/`, `release/`, or `coverage/`; do not commit generated build outputs unless a tracked baseline intentionally changed.

## Release Gate Notes

- Treat `pnpm run release:verify` as the authoritative local release gate. It runs local release checks and package verification.
- Keep `release:verify` deterministic and free of tracked-file mutations. If it reports a worktree mutation, fix the command or generated output policy causing the mutation.
- Treat `release-cut-preflight` as part of the default gate sequence. A gate run is not release-ready unless this final preflight passes.
- `release-cut-preflight` intentionally fails on dirty worktrees, missing upstream tracking, failed GitHub auth, Node version mismatch, or an already-present next patch tag, because each of those will stop `release:patch`.
- When the user explicitly asks to cut a patch, minor, or major release, run the corresponding release command such as `pnpm run release:patch` only after gate-fix changes are committed and the worktree is clean. The release script intentionally refuses dirty worktrees and creates its own version-only release commit.
- In that explicit release-cut flow, treat the user request as permission to commit and push the in-scope gate-fix commit before running the release command, then let the release command create, push, dispatch, and wait for the version commit.
- If `release:patch` fails with `Release requires a clean worktree`, inspect `git status --short --branch`, commit the in-scope gate-fix changes after `pnpm run gate:commit`, and rerun the release command rather than retrying against the dirty worktree.
- If the version commit or tag was pushed before dispatch/waiting failed, confirm release state and run `pnpm run release:resume`; report success only after the full workflow and release/branch state are verified.
- Native, Electron runtime, OCR/DjVu, worker, packaging, and cross-arch changes must also satisfy the cross-arch verification rules from repo `AGENTS.md`.
- Packaging can be slow. Prefer continuing with concrete log-backed fixes over asking the user whether to proceed.

## Commit And Push

1. Confirm every default gate has passed in the current worktree.
2. Review `git status --short` and `git diff` before staging.
3. Stage only files that belong to the gate-fix task. Include preexisting files only when they were changed to fix gates.
4. Run `pnpm run gate:commit` after staging. Fix and rerun if it fails.
5. Commit with a message that explains why the gate work matters and contains no AI attribution.
6. Push the current branch with a normal non-force push.
7. In the final response, report the gates that passed, the commit hash, and the pushed branch.

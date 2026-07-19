# Scan cleanup decisions

1. The main process is the sole authority for output destinations. It allocates `<app temp>/evb-viewer/scan-cleanup/output/<uuid>/<source basename> — cleaned.pdf`; a deprecated optional request field remains type-compatible only so the untouched baseline-dirty predecessor can still typecheck, and is ignored by the codec/service.
2. Completion is handled by the app shell: it opens an `isGenerated` PDF result in a focused new tab, then shows the localized summary with a Save as action bound to that new active workspace.
3. Job ownership lives in a module singleton installed once by `AppShellRoot`, not in the dialog. The active job id is session-scoped for renderer reconnect.
4. Dialog visibility and job lifetime are independent. Closing stops preview activity only; Cancel calls the sidecar job capability.
5. One `scan-cleanup-dialog-shell` uses semantic width, max-width, height, rail, and progress-card tokens. Running is an overlay inside the unchanged shell.
6. The options rail is independently scrollable and disabled as a fieldset during processing. Image-only consequences live in a details popover.
7. The preview retains latest-wins and cache behavior. It owns the only permitted content scroll region in 100% mode and provides focus-visible arrow-key navigation.
8. Forced layouts have exact footer estimates. Auto mode extrapolates from unique previewed source-page classifications and remains blank before the first classification.
9. Generated job directories older than seven days are pruned only after startup document claims settle, and any directory containing a currently open PDF is retained.
10. New copy is sentence case, localized in English and Russian, and contains no exclamation marks. Other locales retain the established English alias.

## Dirty-worktree design-around

The baseline-dirty `ScanCleanupPopup.vue` and `nuxt.config.ts` were never edited. The public module points to a new component, and a local Phosphor-compatible scissors SVG avoids an icon registration collision.

# Troubleshooting

## Frontmatter and discovery

**Symptom: `Invalid YAML syntax in frontmatter`**

Cause: a colon followed by a space in `description` or `compatibility` was left unquoted.

Solution: keep both values quoted in `SKILL.md`. Rerun the harness check.

**Symptom: a harness reports missing name or description**

Cause: YAML parsing failed, so the frontmatter was discarded.

Solution: fix the YAML first. Only then investigate harness-specific rules.

**Symptom: the scan misses files**

Cause: the area name is not present in the path or filename, or `--max-files` was reached.

Solution: raise `--max-files`, then confirm the candidate list with the developer. Add exclusions explicitly rather than guessing.

## Import rewrites

**Symptom: `Unresolved relative imports`**

Cause: a moved file still resolves a relative path against its old directory.

Solution: recompute the specifier from the new file location, apply a targeted edit to that string only, and rerun `check-relative-imports.mjs`. Do not change imported symbols or surrounding code.

**Symptom: the checker passes but the build fails**

Cause: a path alias, package import, or lazy route is outside the checker's scope.

Solution: inspect the failing module, update the affected import string, and rerun the full validator.

## Verification

**Symptom: `stale-path search failed`**

Cause: a consumer, lazy route, test, or doc still names the old path.

Solution: update only paths invalidated by the move. Rerun the validator. Do not clean unrelated code in the same commit.

**Symptom: build fails with a module-not-found error**

Cause: a lazy import or dynamic import was missed.

Solution: inspect the failing module path, add the corresponding `--map`, and rerun the full verification loop.

**Symptom: lint baseline is red**

Cause: pre-existing errors unrelated to this migration.

Solution: capture lint output before and after the move with the same command, compare only the moved files, and report the baseline honestly.

**Symptom: git diff contains logic changes**

Cause: an edit changed JSX, payloads, styling, or control flow.

Solution: stop. Revert the accidental change, or split it into a separately approved refactor commit after the move is verified.

## Git and delivery

**Symptom: dirty working tree**

Cause: unrelated user changes are present.

Solution: stop and ask whether to use a fresh worktree or stage only the migration paths. Never stash, commit, or discard someone else's changes.

**Symptom: branch already exists**

Cause: a previous migration phase left the branch behind.

Solution: stop and ask whether to reuse it or choose a new name. Do not force-overwrite it.

**Symptom: push or PR requested but tests are red**

Cause: required verification gates are not green.

Solution: do not push or open a PR. Report the failing gates and the exact commands run.

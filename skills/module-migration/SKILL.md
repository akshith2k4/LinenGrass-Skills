---
name: module-migration
description: "Use when migrating a feature into a module folder: migrate, move to module, consolidate feature, or reorganize into modules. Do not use for bug fixes, new modules, renames, or refactors."
license: Apache-2.0
compatibility: "Git 2.40+, Node 20+, npm or pnpm, JavaScript/TypeScript React src layout"
allowed-tools: "Read Grep Glob Write Edit Bash"
metadata:
  author: LinenGrass
  version: 2.0.0
  updated: 2026-11-26
  owner: platform-team
  tags: migration,refactor,modules,safety
---

# Migrate a Feature into a Module

## Purpose

Relocate an existing feature area into `src/modules/<module>/` with a predictable folder shape, correct imports, and an auditable git diff. Preserve behavior. Make no logic, styling, or API changes inside a move commit.

This skill is deliberately narrow: it plans first, asks about exceptions, and performs file moves only after the developer explicitly approves the migration brief.

Announce at start: "I'm using the module-migration skill. I'll scan the area and propose a migration brief. I will not branch, edit, move, commit, or push files until you explicitly tell me to proceed."

## When to Use

Use when the request contains any of these triggers:

- "migrate orders into a module"
- "move this feature to `src/modules/<module>/`"
- "consolidate the service, hook, constants, and components"
- "reorganize this area into the module pattern"
- "move the service plus its components into one place"

Use for any existing feature area: a whole feature, a feature slice, a tabbed page, or a related file group in a JavaScript or TypeScript `src` tree.

## When Not to Use

Do not use for:

- A bug fix, logic refactor, or behavior change
- A brand-new module with no existing code
- A single-component rename with no directory move
- An exploratory spike where the target shape is unknown
- Adding dependencies, changing APIs, or redesigning UI

Route those requests to the appropriate planning or implementation workflow.

## Instructions

1. Select the tier from the scan output and confirm it with the developer.
2. Execute the seven workflow steps in order.
3. Treat every safety gate as mandatory.
4. Open only the referenced files needed for the current decision and keep the rest on demand.

## Operating Tiers

| Tier | Trigger | Default behavior | Approval gate |
| :--- | :--- | :--- | :--- |
| **Express** | Fewer than 10 files, no shared service, no tabs, no renames | Auto-draft the brief from the scan. Use recommended defaults for scope, depth, and naming. | One confirmation of the drafted brief counts as approval. |
| **Standard** | Typical feature, 10–50 files, or one shared dependency | Full brief with explicit answers for every exception. Move plus import rewrite. | The developer must explicitly say "proceed". |
| **Large** | More than 50 files, shared service with many consumers, or a tab route change | Require a split plan: one sub-area per branch or PR. Record each phase. | Approve the split plan first, then each phase separately. |

Tier selection is proposed from scan output and confirmed in the brief. Never reduce a tier to skip a gate.

## Prerequisites

- Git 2.40 or newer, with a clean tree or a dedicated worktree
- Node 20 or newer for the bundled scripts
- `npm` or `pnpm` with a build script that resolves imports
- A JavaScript or TypeScript React project using a `src` layout
- The bundled scripts use only Node built-ins; no package install is needed
- A green baseline build, or a recorded baseline failure approved by the developer

If the tree is dirty, ask before using a worktree. Never stash, commit, or discard someone else's changes.

## Inputs

The scan drafts every factual input. The developer corrects only exceptions.

| Input | Source | Resolution |
| :--- | :--- | :--- |
| Target area | Developer | Ask if no named area exists. |
| Scope boundaries | `scan-module.mjs` plus developer | Developer confirms included and excluded files. |
| Migration depth | Tier default plus developer | Move-only is the default. Cleanup needs a separate commit. |
| Shared dependencies | `scan-module.mjs` plus developer | Move and update, keep a temporary shim, or stay global. |
| Tab behavior | Scan plus developer | Preserve local state unless URL routes are explicitly approved. |
| Naming and grouping | Scan plus developer | Keep existing names unless a page rename is approved. |
| Branch and base | Repo convention plus developer | Default: `refactor/<module>-module` from the agreed base. |
| Implementation approval | Developer after the brief | Required before any branch, edit, move, commit, or push. |
| Verification expectations | Developer | Build plus audit is the default; manual smoke when requested. |

See `references/decision-matrix.md` for defaults and `references/question-bank.md` for the full question set.

## Safety Gates

These are low freedom. Use the exact behavior below.

1. **Read-only discovery.** Phase 1 changes nothing.
2. **No edits before approval.** A brief without explicit "proceed" is still a plan.
3. **Behavior-preserving move.** Use `git mv` plus import rewrites only.
4. **One concern per commit.** Move first; refactor only in a second approved commit.
5. **No empty folders.** Create `tabs/`, `models/`, or `utils/` only when a file lands there.
6. **Explicit staging.** Stage named paths. Never use `git add .` on a dirty tree.
7. **No push by default.** Stop after the local commit unless push or PR was requested.
8. **Honest verification.** Report only commands actually run and results actually observed.

## Workflow

Commands below use paths relative to the installed skill directory. Substitute that directory when running from the repository root.

### Step 1 — Scan the Area

```bash
node ./scripts/scan-module.mjs --area <area> --json
```

Read the JSON output. It contains candidate files, consumers, routes, proposed destinations, and shared dependencies. Confirm the scan with the developer before drafting the brief.

### Step 2 — Classify and Ask

Apply the tier rules. Open `references/decision-matrix.md` and `references/question-bank.md` only for unresolved decisions. Ask all applicable questions in one batch, with the recommended option first.

### Step 3 — Draft the Brief

Copy `assets/migration-brief.md` and fill it from the scan and answers. Present it and stop.

For Express, the drafted brief plus one confirmation is approval. For Standard and Large, wait for an explicit "proceed". An answer to a question is not approval.

### Step 4 — Create the Safety Branch

Only after approval:

```bash
git branch --show-current
git status --short
git switch <base-branch>
git pull --ff-only
git switch -c refactor/<module>-module
```

If the tree is dirty, stop and agree on a worktree first.

### Step 5 — Move Files

Create only folders that will contain files, then use `git mv`:

```bash
mkdir -p src/modules/<module>/api src/modules/<module>/components src/modules/<module>/pages
git mv src/services/<service> src/modules/<module>/api/<service>
git mv src/components/<area>/<Component> src/modules/<module>/components/<Component>
```

Keep shared UI and shared utilities outside the module. See `references/examples-orders.md` for a concrete shape.

### Step 6 — Rewrite Imports

Use targeted Edit operations on the files reported by the scan. Change only import specifier strings:

1. Update lazy routes and dynamic imports in the app entry file and other consumers.
2. Update relative imports inside moved files from their new location.
3. Update tests, mocks, and docs that name the old path.
4. Do not change imported symbols, JSX, or logic.

Verify the rewritten paths with the bundled checker:

```bash
node ./scripts/check-relative-imports.mjs --json src/modules/<module> src/App.jsx
```

Review the diff and rerun the checker until no stale relative path remains.

### Step 7 — Verify and Deliver

```bash
node ./scripts/validate-migration.mjs \
  --base <base-branch> \
  --target src/modules/<module> \
  --stale 'components/<area>' \
  --json
```

Follow `assets/checklist.md`, then commit explicitly. Use `assets/pr-template.md` when a PR is requested. Stop after the local commit otherwise.

## Available Scripts

| Script | Purpose | Arguments |
| :--- | :--- | :--- |
| `scan-module.mjs` | Emit JSON inventory, consumers, routes, destinations, and shared dependencies. | `--area <name> [--root <dir>] [--max-files <n>] [--help]` |
| `check-relative-imports.mjs` | Verify that relative imports resolve in the given files or directories. | `[--json] [--root <dir>] <path> [...] [--help]` |
| `validate-migration.mjs` | Run build, optional typecheck, stale-path audit, and import check as separate gates. | `--base <branch> --target <dir> [--stale <fragment>] [--build <cmd>] [--typecheck <cmd>] [--json] [--help]` |
| `ci-check.mjs` | Enforce frontmatter, line count, script help, and reference links. | `[--json] [--help]` |

Every script supports `--help` and uses exit code `0` for success, `1` for a failed check, and `2` for usage errors.

## Verification Loop

Run this loop until every gate is green or the failure is proven pre-existing:

1. Run `validate-migration.mjs`.
2. Read each gate result. Do not treat a skipped gate as passed.
3. Fix the reported error with an explicit, approved edit.
4. Rerun the validator.
5. Compare lint output before and after the move when lint is part of the agreed gate.
6. Audit `git diff --find-renames <base>...HEAD` for renames and import changes only.
7. If logic, JSX, payloads, or styling changed, stop and split the refactor into a separate approved commit.

If the baseline was already red, record the exact failure and verify that the moved files introduced no new errors. Never claim a green lint run from a red baseline.

## Examples

A target module uses only the folders that receive real files:

| Folder | Contents |
| :--- | :--- |
| `api` | Feature service and endpoint helpers |
| `components` | Dialogs, drawers, tables, and panels |
| `constants` | Feature options and constants |
| `hooks` | Feature data hooks |
| `models` | Mappers and model classes |
| `pages` | Route entry points |
| `tabs` | Tab shells and tab content |
| `utils` | Feature-only helpers |

The full decision record, verification notes, and anti-patterns are in `references/examples-orders.md`. Treat it as illustrative, not as a required folder list.

## Limitations

- The scanner uses filename and path heuristics; the developer confirms scope.
- Import rewriting is done with targeted edits. The bundled checker validates relative imports only; path aliases and bundler config are outside its scope.
- The import checker resolves relative files and index files only. Package imports and aliases are outside its scope.
- The validator runs commands with fixed argument lists. It does not invoke a shell.
- Manual smoke testing is required when routes, tabs, or auth-dependent flows changed.
- No script pushes, opens a PR, deletes source files, or stages changes.

## Troubleshooting

| Error | Cause | Solution |
| :--- | :--- | :--- |
| `Invalid YAML syntax in frontmatter` | Unquoted colon in `description` or `compatibility`. | Keep both values quoted in `SKILL.md`. |
| `Skill dropped: requires a string description` | Same frontmatter parse failure. | Fix the YAML, then rerun the harness check. |
| `Unresolved relative imports` | A moved file still uses an old relative path. | Recompute the path from its new location, apply a targeted edit, and rerun the checker. |
| `stale-path search failed` | A consumer or doc still names the old path. | Update only paths invalidated by the move, then rerun the validator. |
| `build failed` | Missing import, lazy route, or dependency. | Inspect the failing module, fix the path, and rerun the full loop. |
| `dirty working tree` | Unrelated user changes are present. | Stop and agree on a worktree or explicit staged paths. |
| `lint baseline is red` | Pre-existing errors unrelated to the move. | Compare before and after output; report the baseline honestly. |

See `references/troubleshooting.md` for longer diagnosis steps.

## Output Contract

Return all of the following:

- Branch name and commit hash
- Target module tree
- What moved and what did not
- Decisions taken from the migration brief
- External consumers updated
- Automated verification results, gate by gate
- Manual smoke results, or the reason they were not run
- Known caveats and any deferred conditions
- Whether the branch was pushed and the PR link

Do not say "migration complete" while a consumer, old path, build error, or required approval remains open.

## References

- `references/decision-matrix.md` — tier defaults and decision rules
- `references/question-bank.md` — full batch questionnaire
- `references/examples-orders.md` — worked example and anti-patterns
- `references/troubleshooting.md` — extended diagnosis
- `scripts/` — executable scan, rewrite, check, validate, and CI tools
- `assets/migration-brief.md` — copyable brief template
- `assets/checklist.md` — execution checklist
- `assets/pr-template.md` — PR body template
- `evals/` — baseline and with-skill evaluations
- `CHANGELOG.md` — version history

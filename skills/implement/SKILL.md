---
name: implement
description: Use when a plan document from the plan skill exists and you are ready to write code. Implements the full plan end-to-end before running verification tests. Enforces strict test integrity.
allowed-tools: "Read Grep Glob Write Edit Bash(git:, ls:, find:, cat:, npm:, pnpm:, yarn:, node:, npx:*)"
metadata:
  author: LinenGrass
  tags:
    - implementation
    - coding
    - testing
---

# Implement a Linengrass Plan

## Overview
Execute the entire plan document completely on a dedicated branch, then test once at the end.

This skill rejects the incremental loop of "small change → test → commit → repeat", which produces minimal, fragile patches that satisfy isolated assertions while obscuring integration defects.

Instead:
1. **Implement ALL** — read the whole plan, then build every task fully, to the best quality, as one coherent change.
2. **Test ONCE** — after all implementation is done, run the developer-approved test scope and fix real failures.
3. **Commit AFTER green** — only commit once the full implementation passes.

Test integrity is non-negotiable: a test that was weakened, skipped, or mocked into passing is a failed implementation, not a successful one.

Announce at start: "I'm using the implement skill. Creating a local branch, implementing the full plan, then testing."

## Local-Only Policy
Work stays local.
- Never `git push`, open a PR, or merge unless the developer explicitly says to publish this branch in this session.
- A commit is not a push request. If unsure, ask. Handoff ends at local review.

## When to Use
- A plan document exists at `docs/plans/YYYY-MM-DD-<task>.md`
- The plan's self-review passed with no open questions
- The developer has explicitly asked to execute the plan
- You are ready to write the full implementation (not spike, not explore)

Do not use for: exploratory work (use a spike), planning (use plan), or when the plan still has open questions — route back to grill-me-all-at-once.

## Input Contract (Gate — Before Any Change)

| Input | Where it comes from | If missing |
| :--- | :--- | :--- |
| **Plan document** | `docs/plans/YYYY-MM-DD-<task>.md` | Stop. Run the plan skill first. |
| **Confirmed testing plan** | Plan's "Testing strategy" section | Stop. Route back to plan to get developer test sign-off. |
| **Clean working tree** | `git status --porcelain` is empty | Ask the user to commit or stash; do not proceed. |
| **Green baseline** | Existing tests pass on main/base | Run the existing suite once. If it is already red, surface that before branching — do not "fix it later". |
| **No open questions in plan** | Plan's "Open questions" section is empty | Stop. Route back to plan. |

Do not start if any fail: a dirty tree or red baseline makes every later failure ambiguous.

## The Process

### Phase 1 — Create the Branch (Hard Gate)
No source edits until the branch exists. Check the current branch and create a new one before the first Write/Edit.

#### Step 1.1 — Name the branch
Derive the branch name from the plan filename slug, prefixed by type:
- `feat/<slug>` — new capability
- `fix/<slug>` — defect repair
- `refactor/<slug>` — behavior-preserving change
- `docs/<slug>` — documentation only
- `chore/<slug>` — tooling, deps, CI

Example: plan `docs/plans/2026-11-24-order-validation.md` → `feat/order-validation`.

#### Step 1.2 — Branch from a known base
```bash
git switch main                       # or the plan's stated base
git pull --ff-only
git switch -c feat/order-validation
```

#### Step 1.3 — Confirm
```bash
git branch --show-current            # must show the new branch
```
If the working tree was dirty and the user insisted on proceeding, do not silently carry uncommitted changes onto the branch — stop and ask.

### Phase 2 — Establish the Baseline (Read-Only)
Before writing code, capture the starting state so later failures are attributable to the plan, not to pre-existing breakage.

1. Run the existing test suite once (e.g. `npm test`) and record the result.
2. If the baseline is red on the base branch, do not proceed. Report the failing tests and ask whether to (a) fix them first on a separate `fix/` branch, or (b) declare them pre-existing and proceed with them recorded.
3. Record: which tests pass, which fail, which are skipped, and why.

This baseline is the contract for "did I break something". This is the only test run before implementation is complete.

### Phase 3 — Implement ALL (No Behavioral Testing Yet)
This is the core phase. Implement the whole plan before any behavioral test run, commit, or verification loop.

#### Step 3.1 — Read the whole plan first
Read the entire plan document end-to-end before writing a single line:
- File map, all tasks, dependencies, interfaces, data-flow, risks, rollback
- Settled decisions and out-of-scope — these are binding
- Testing strategy — note it, do not run it yet

Then read every file the plan names, at the exact paths and line ranges. If a path has moved, stop and update the plan or surface the drift. Do not start coding with partial context.

#### Step 3.2 — Implement task-by-task, without stopping
Work through the plan's tasks in order. Do not reorder, skip, or merge tasks unless the plan says so or you discover a dependency — and if you discover one, append a note to the plan's `## Deviations` section; do not silently deviate.

For each task, build it fully:
- Implement the complete behavior the task describes, including edge cases, error paths, validation, and integration points named in the plan.
- Follow Linengrass conventions already present in surrounding code.
- If the task names a skill (e.g. `linengrass-api-validation`), apply that skill's instructions in full.
- Keep interfaces consistent across tasks — later tasks build on earlier ones, so do not leave a task half-done expecting a later test to catch it.

#### Step 3.3 — Implement the BEST, not the smallest satisfying change
Do not do minimal patches that merely satisfy the task wording.

**Prohibited minimalism:**
- Hard-coding a value just to make one path work while the plan calls for a general solution
- Implementing only the happy path and leaving error / edge handling "for later"
- Copy-pasting a pattern instead of reusing the helper / abstraction the plan names
- Leaving TODOs, placeholders, `// TODO: handle this`, stubbed functions, or commented-out code
- Writing code that passes a single imagined test but would break on the next task's integration

**Required quality bar:**
- **Complete**: every task in the plan is fully implemented, including its stated edge cases
- **Coherent**: the tasks fit together as one change — shared types, shared validation, shared error shapes, no duplicated logic
- **Clean**: no dead code, no debug logs, no commented-out code, no unused imports
- **Consistent**: naming, structure, and error handling match the surrounding codebase
- **Reviewed by you**: re-read your own diff (`git diff`) before moving to testing — check for missed tasks, inconsistent interfaces, and leftover placeholders

#### Step 3.4 — Do NOT run test suites, do NOT commit yet
During Phase 3:
- **Do not run behavioral test suites** — not focused tests, not full suite, not test-driven debugging loops. The first test run happens in Phase 4, after ALL implementation is done.
- **Do not commit per task**. Intermediate commits of untested, partial work make history misleading. The working tree stays uncommitted until the full implementation is verified.
- **Do not mark tasks complete in the plan one-by-one as a substitute for finishing**. Only after Phase 3 is fully done, mark all tasks implemented in the plan's `## Progress log`.
- **Non-destructive syntax & typechecks are permitted**: If needed, non-destructive syntax verification or compiler checks (such as `tsc --noEmit` or `mypy`) to confirm that cross-file types align and syntax compiles are permitted between tasks. This unblocks writing and verifies interface consistency across files without running premature behavioral tests.

If you discover the plan is wrong, incomplete, or contradictory mid-implementation, stop and surface it. Do not invent a workaround and keep going. Append the issue to the plan and ask the developer.

### Phase 4 — Testing Gate (Ask Once, After Implementation)
Testing is mandatory — but it happens once, after ALL implementation is done, and which tests run is the developer's choice, made explicitly before the first test run. Do not assume a default and do not silently run everything.

#### Step 4.1 — Present the options once
After Phase 3 is complete, present the test surface:

```text
Implementation is complete. Which tests should I run?

A) Focused: only tests touching the files I changed
   → <list of test files that cover the changed code>

B) Changed-scope: focused tests + tests for direct dependents
   → adds <list>

C) Full suite: project's standard command (`npm test`)
   → ~<N> tests, estimated <time>

D) Specific: you name the files/patterns (e.g. "tests/orders/*.test.ts")

E) Focused + full suite at the end, before commit
   (recommended default — fast loop, safety net at the gate)
```

#### Step 4.2 — Record the choice
Write the user's choice into the plan's `## Testing strategy` section, with the date. Use this choice for the verification run and any fix-loop re-runs in this session. Re-ask only if the change touches an area outside the initially selected scope, or the user says the scope changed.

#### Step 4.3 — Run and report honestly
Run the chosen scope once against the complete implementation. Report:
- The exact command
- Pass / fail / skip counts
- The names of any failing or skipped tests
- Whether skipped tests are skipped by the project (pre-existing) or by this change (new — must be justified)
- Typecheck / lint result (if the project has them) — run them here, as part of this single verification pass, not during Phase 3

### Phase 5 — Test Integrity Rules (No Cheating)
A test that passes because it was weakened hides a real defect. Never perform any of these actions:

| Prohibited action | Why it is cheating |
| :--- | :--- |
| `it.skip` / `xit` / `@pytest.mark.skip` / `test.todo` added by this change | Suppresses a signal without fixing the cause |
| Deleting an assertion, or replacing a specific assertion with `expect(x).toBeDefined()` / `assert x is not None` | Weakens the contract the test was meant to enforce |
| Loosening a numeric/string matcher to make an output pass (`toBeCloseTo(…, 0)`, `toContain("")`) | Hides an incorrect value |
| Mocking the unit under test (mocking the function/class/module you are supposed to be testing) | The test no longer tests the code |
| Stubbing a dependency to return the value the assertion expects, when the real dependency would not | Circular test — green by construction |
| Wrapping the failing call in `try/except` / `try/catch` that swallows the error | Converts a failure into a pass |
| Adding `// @ts-ignore` / `# type: ignore` / `as any` to silence the typechecker on the changed code | The type error is real; silencing it is not fixing it |
| Marking a test as `xfail` (pytest) or `expect(...).rejects` without the rejection being the intended behavior | Same as skip |
| Rewriting the test's expected value to match the actual (buggy) output | The test is the spec; the code is what must change |
| Commenting out a failing test and leaving a TODO | It is a skip with extra steps |
| Using `--forceExit`, `--passWithNoTests`, or config that hides failures | Makes the command lie |

If a test fails and you believe the test is wrong, do not edit it. Stop and ask the developer:
> *"Test X asserts Y but the code produces Z. Which is correct — should the code change, or should the test change? I will not edit the test without your confirmation."*

Legitimate test additions are still welcome: new tests for new behavior, new tests covering the fix, and new edge-case coverage are all encouraged — the rules above target weakening, not adding.

If a test must be skipped for a real external reason (e.g. requires a live service unavailable in CI), surface it explicitly, tag it with the reason and a tracking reference, and get the developer's written acknowledgement in the session. Skipping is never silent.

### Phase 6 — Fix Loop (Fix Code, Re-Test, No Shortcuts)
If the Phase 4 run fails:
1. **Diagnose against the full implementation**. Do not assume the last task is the culprit — the failure may be an integration issue between tasks that only appears when the whole change is together.
2. **Fix the code, not the test**. See Phase 5. If the test is the spec, the code must change.
3. **Re-run the same approved test scope from Phase 4**. Do not narrow the scope to hide the failure.
4. **Repeat until green**. Do not commit, do not declare done, and do not ask to weaken a test to get to green.

If a fix requires deviating from the plan, append a `## Deviations` note and tell the developer.

### Phase 7 — Commit After Green + Final Verification and Handoff
Only after the full implementation passes the approved test scope, commit.

#### Step 7.1 — Commit
```bash
git add <specific files>          # not `git add -A`
git commit -m "<type>(<scope>): <plan task summary>"
```

Rules:
- One clean commit for the whole plan (or a few logical commits that split the plan by coherent area — never per-task untested commits)
- Message ties to the plan name / task
- Do not commit generated artifacts, secrets, or `.env` files
- Do not amend or force-push a shared branch

#### Step 7.2 — Final verification checklist
Before declaring the implementation done:
- [ ] Every task in the plan is fully implemented (not minimally satisfied) and checked off
- [ ] The test scope chosen in Phase 4 has been run at least once after the last change, and the result is green and reported
- [ ] No test was skipped, weakened, or mocked into passing (re-check against Phase 5)
- [ ] Typecheck / lint pass (if the project has them)
- [ ] The plan's "Testing strategy" section records what ran and the result
- [ ] Branch name matches the convention, working tree is clean, all work committed
- [ ] No push, PR, or merge was performed — everything exists locally
- [ ] No secrets, debug logs, TODOs, placeholders, or stray files in the diff (`git diff main...HEAD` reviewed)
- [ ] A short handoff summary is written: what changed, what was tested, what is still open, and the branch/commit range to review

## Anti-Patterns
- **Editing before branching**. The first Write/Edit must happen on the new branch.
- **Branching from a dirty tree**. Stash or commit first — no exceptions.
- **Skipping the baseline**. A green baseline is how you prove you did not break anything.
- **Testing task-by-task**. Run behavioral suites once after full implementation. Per-task testing rewards fragile patches.
- **Minimal satisfying patches**. Implement the best, complete version the plan describes.
- **Committing per task / committing untested code**. Commit only after the full implementation is green.
- **Running tests without asking**. The user chooses the scope; the skill only recommends.
- **Cheating on tests**. See Phase 5. There is no "just this once".
- **Silently deviating from the plan**. Append a `## Deviations` note and tell the developer.
- **`git add -A`**. Stage specific files; do not sweep in unrelated changes.
- **Leaving TODOs / placeholders / stubs**. If it is in the plan, it is implemented fully.
- **Declaring done with a red, skipped, or un-run test**. Every failure is either fixed or explicitly escalated.

## Handoff
Summarize for the developer:
- Branch name and commit range (local only)
- Tasks completed (full plan — from the plan checklist)
- Test scope run and result (from Phase 4, after full implementation)
- Any deviations or surfaced issues
- Anything still open

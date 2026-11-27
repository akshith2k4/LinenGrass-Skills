---
name: plan
description: Use when you have a problem statement and settled context from the understand and grill-me-all-at-once skills, and need a concrete, file-level implementation plan before touching code. Read-only on source — produces a plan document only. Do not use for single-line fixes or when the problem statement is still ambiguous.
allowed-tools: "Read Grep Glob Bash(git:, ls:, find:, cat:)"
metadata:
  author: LinenGrass
  tags:
    - architecture
    - planning
    - execution
---

# Plan a Linengrass Code Change

## Overview
Turn a problem statement + understanding brief + settled grilling decisions into a neat, executable implementation plan. The plan must be specific enough that an engineer with zero context can execute it task by task, list every test case, define what success looks like, and trace every change to a stated problem or confirmed decision.

Read-only on source. Do not create, edit, delete, move, or copy source files. Do not install packages. Do not change git state. The only permitted write is the plan document at `docs/plans/YYYY-MM-DD-<task-slug>.md`.

Announce at start: "I'm using the plan skill to write the implementation plan."

## When to Use
- The understand skill has produced `docs/understanding/<area>.md`
- The grill-me-all-at-once skill has produced settled answers or a decisions table
- A problem statement exists in 1–2 sentences
- The change touches multiple files, has sequencing constraints, or needs coordination

Do not use for: single-file edits with a known fix, exploratory spikes where the approach is unknown (use a spike task instead), or when the problem statement is still ambiguous — route back to grill-me-all-at-once first.

## Input Contract (Gate — Do This Before Anything Else)
A plan is only as good as the context it rests on. Validate all four inputs. If any are missing, stop and say which skill to run first — do not fill the gap with assumptions.

| Input | Where it comes from | If missing |
| :--- | :--- | :--- |
| **Problem statement** (1–2 sentences) | User, or the grill session | Ask for it in one sentence. Do not proceed. |
| **Understanding brief** | `docs/understanding/<area>.md` | Run understand on the target area first. |
| **Settled decisions** | Grill answers table (Q → decision) | Run grill-me-all-at-once first. |
| **Explicit out-of-scope** | Problem statement or grill answers | Ask once; if still unclear, list it as an open question and stop. |

Record the source of each input in the plan header so the plan is auditable.

## The Process

### Phase 1 — Inventory Existing Skills
Before designing tasks, find out what Linengrass already knows how to do. This prevents the plan from re-solving problems that an existing skill already covers, and lets each task name the skill it should use at execution time.

#### Step 1.1 — Discover skills
Use Glob to find every skill manifest:
```bash
skills/*/SKILL.md
```
Read the `name` and `description` frontmatter of each. Do not read the full body — the description is enough to decide relevance, and it keeps context small.

#### Step 1.2 — Map skills to likely plan steps
Build a short table:

| Skill | Use in this plan? | Where it applies |
| :--- | :--- | :--- |
| understand | Yes / No | Onboarding to an unfamiliar module |
| linengrass-api-validation | Yes / No | Adding validation to new endpoints |
| ... | ... | ... |

Rules:
- Only reference skills that actually exist in `skills/`. Never invent a skill name.
- If a skill is referenced, name it in the relevant task as the sub-skill to use at execution time — do not invoke it during planning.
- If no existing skill fits, say so explicitly; the task is then done without a skill.

### Phase 2 — Triage Complexity and Scope
Calibrate the plan to the size of the change. Over-planning a one-file change is as harmful as under-planning a migration.

| Tier | Scope | Plan shape |
| :--- | :--- | :--- |
| **Simple** | < 1 hour, one file or a few lines | Short plan: what changes, where, one test case, one verification step |
| **Medium** | 1 hour–1 day, several files | File map + numbered tasks + testing section |
| **Complex** | Multi-day, migrations, new service, cross-cutting | Full template below, phased tasks, risks, rollback |

If the problem statement spans multiple independent subsystems, split into separate plans — one per subsystem — and say so.

### Phase 3 — Verify Codebase Facts
The understanding brief is a snapshot; the code may have moved. Re-verify every file path and line reference the plan will rely on.

**Do:**
- Read the exact files named in the understanding brief
- Grep for the symbols and patterns the change will touch
- `git log --follow <file>` for files whose history explains constraints
- Confirm that every "modify" target still exists at the stated path

**Do not:**
- Trust remembered line numbers without re-reading
- Include an "audit the codebase" step in the plan — the audit happens now, and the plan contains its results

If a fact contradicts the understanding brief, surface the contradiction and update the brief or route back to understand. Do not quietly plan around it.

### Phase 4 — Design the Change
Design before decomposing. Lock down the shape of the change so tasks fall out naturally rather than being invented ad hoc.

#### Step 4.1 — File structure first
Map every file to be created, modified, or deleted, and give each one a single responsibility:

| Action | Path | Responsibility |
| :--- | :--- | :--- |
| Modify | `src/routes/orders.ts:42-88` | Add validation before handler |
| Create | `src/schemas/order.schema.ts` | Zod schema + inferred type |
| Modify | `tests/orders.test.ts` | Add 400-path coverage |
| Delete | `src/legacy/order-validator.ts` | Superseded by schema |

#### Step 4.2 — Interface and data-flow changes
- New or changed function signatures (before → after)
- Request/response contracts and error shapes
- Database or config changes, with migration path
- Backward-compatibility decision (breaking vs. non-breaking)

#### Step 4.3 — Consider alternatives
For Medium/Complex plans, name at least one alternative you rejected and why. This prevents the plan from looking inevitable when it is actually a choice.

#### Step 4.4 — Risk and rollback
- What could break, and what detects it
- Whether the change is reversible, and how
- Any dependency on another team, service, or external system

#### Step 4.5 — Enumerate Every Test Case
The plan must state every case it will test, not a summary of test levels.

1. **Build a test case matrix** with an ID, level, test file, scenario/input, and expected result for each case (see template). Cover at minimum:
   - **Happy paths** — every behavior the change adds or alters.
   - **Boundaries** — empty, minimum, maximum, off-by-one, unicode/whitespace.
   - **Invalid/null inputs** — missing fields, wrong types, malformed payloads.
   - **Error paths** — network failures, timeouts, database errors, partial failures.
   - **Authorization** — unauthenticated and unauthorized actors.
   - **UI states** — empty, loading, error, success.
   - **Regressions** — existing behavior the change could break.

   No "etc.", "similar scenarios", or "cover the edge cases": write out every case. A case that cannot be automated is still listed, marked excluded with the reason and how it is verified manually.

2. **Map cases to tasks.** Every task names its TC IDs; every TC maps to a task.

3. **Name the exact verification commands** (e.g. `npm test -- tests/orders.test.ts`) and expected pass counts.

#### Step 4.6 — Define Success Criteria (Definition of Done)
Define both:

- **Plan readiness** — the document is complete enough to implement: all four inputs recorded with sources; every task has exact paths, TC IDs, and a verification step; every AC names its proving check; developer sign-off recorded; self-review passes with no open questions.
- **Change completion** — the implementation is successful when every AC is met, every TC passes (none skipped or weakened), verification commands exit 0, out-of-scope is untouched, and no existing test regresses.

  | ID | Criterion | Verified by |
  | :--- | :--- | :--- |
  | AC-1 | [observable, binary outcome — not an activity] | `command` → expected result |

  "Works correctly" is not a criterion; "an invalid `items` payload returns `400` and writes no order row" is.

#### Step 4.7 — Mandatory Interactive Gate (Ask the Developer)
Before locking the plan, present the test cases and success criteria:

```text
Here is the proposed testing plan and definition of done:

Test cases:
- TC-1 (Unit, <test file>): <scenario> → <expected result>
- ...

Success criteria:
- AC-1: <observable outcome> — verified by <command/observation>
- ...

Plan ready when <readiness checks pass>; change successful when all AC are met and all TC pass with verification green.

Does this cover everything, or would you like to add, remove, or adjust any test cases or success criteria?
```

Incorporate the feedback and record confirmation under `## Testing strategy & Developer Sign-Off` and `## Success criteria`.

### Phase 5 — Write the Plan Document
Save to `docs/plans/YYYY-MM-DD-<task-slug>.md` using the template below. Keep it tight: describe what changes and where, not full implementations. Short pseudo-code or a 2–3 line snippet is allowed only where the approach would be ambiguous without it.

### Phase 6 — Self-Review Before Handoff
Run this checklist against the written plan. If any item fails, fix the plan before presenting it.

- [ ] Every task names exact file paths (and line ranges where known)
- [ ] Every change traces to the problem statement or a settled grill decision
- [ ] No task says "audit", "investigate", or "determine" — those are done
- [ ] No placeholder code ("add validation here") and no full-file dumps
- [ ] Every task has a verification step (command + expected result)
- [ ] Every planned test case is enumerated (ID, scenario/input, expected result) — no "etc." or implied cases
- [ ] Task ↔ TC mapping is complete in both directions
- [ ] Every AC is observable, binary, and names its proving check
- [ ] Plan readiness and change completion are defined, with developer sign-off
- [ ] Every referenced skill exists in `skills/*/SKILL.md`
- [ ] Out-of-scope is explicit, not implied
- [ ] No unresolved grill dependency is silently guessed
- [ ] Complexity tier matches plan length (Simple ≠ 3 pages)

If a task depends on a grill question that was never answered, stop and route back to grill-me-all-at-once with that one question — do not fill it in yourself.

---

## Plan Document Template

```markdown
# [Task Name] — Implementation Plan

**Problem statement:** [1–2 sentences]  
**Understanding brief:** `docs/understanding/<area>.md`  
**Grill decisions:** [path or inline table]  
**Complexity:** Simple / Medium / Complex  
**Goal:** [one sentence — expanded under Success criteria]  
**Architecture:** [2–3 sentences on the approach]  

## Settled decisions carried into this plan
| # | Decision | Source |
|---|---|---|
| D1 | ... | User answer to Q2 |
| D2 | ... | Recommended, accepted |

## Out of scope
- ...

## Success criteria (Definition of Done)

**Plan ready to implement when:**
- [ ] All four inputs are recorded with their sources
- [ ] Every task has exact paths, TC IDs, and a verification step
- [ ] Every AC names the check that proves it
- [ ] Developer sign-off is recorded and no open questions remain

**Change successful when:**

| ID | Criterion | Verified by |
|---|---|---|
| AC-1 | [observable, binary outcome] | `command` → expected result |

All AC are met, all TC pass, verification commands are green, out-of-scope is untouched, and there are no regressions. If a criterion fails, change the code — never the criterion.

## File map
| Action | Path | Responsibility |
|---|---|---|
| Create | ... | ... |
| Modify | ... | ... |
| Delete | ... | ... |

## Tasks

### Task 1: [Component]
**Skill:** [existing skill name, or "none"]  
**Test cases:** TC-1, TC-4  
**Files:**
- Create: `exact/path`
- Modify: `exact/path:lines`
- Test: `exact/path`

- [ ] Step 1: [single action, 2–5 min]  
      Verify: `command` → expected result  
- [ ] Step 2: ...  
- [ ] Step 3: Commit — `git commit -m "..."`  

### Task 2: ...

## Testing strategy & Developer Sign-Off

### Test case matrix
| ID | Level | Test file | Scenario / input | Expected result |
|---|---|---|---|---|
| TC-1 | Unit | `tests/path.test.ts` | [input] | [expected output/state] |
| TC-2 | Integration | `tests/path.spec.ts` | [flow] | [expected output/state] |
| TC-3 | Edge case | `tests/path.test.ts` | [boundary/error input] | [expected output/state] |
| TC-4 | Regression | `tests/path.test.ts` | [existing behavior] | [unchanged] |

- **Excluded:** [case — reason and manual check, or "None"]
- **Verify:** `command` (expected: all pass)
- **Developer sign-off:** Confirmed (YYYY-MM-DD) — test scope and success criteria

## Risks and rollback
| Risk | Detection | Mitigation / rollback |
|---|---|---|
| ... | ... | ... |

## Skills leveraged
| Skill | Applied to |
|---|---|
| ... | ... |

## Open questions
- [ ] None — every dependency is settled. *(If not none, stop and route back.)*
```

---

## Anti-Patterns
- **Planning without the input contract**. If understand or grill-me-all-at-once was skipped, the plan is fiction. Refuse and route back.
- **Auditing inside the plan**. "Step 1: explore the codebase" is a planning failure, not a plan step.
- **Referencing a skill that does not exist**. Read `skills/*/SKILL.md` first.
- **Vague tasks**. "Update the service" is not executable; "Modify `src/services/order.ts:88-120` to call `validateOrder()` before persistence" is.
- **Dumping full implementations**. The plan is a blueprint, not the code.
- **Summarizing test coverage instead of listing cases**. Enumerate every case with input and expected result.
- **Unfalsifiable success criteria**. Every criterion must name the check that proves it.
- **Assuming testing scope without asking**. Present the test cases and success criteria for sign-off during planning.
- **Editing source**. This skill is read-only except for the plan document.
- **Silently resolving contradictions**. If grill answers conflict with the code or with each other, surface it — do not pick a side quietly.
- **Over-planning a simple change**. Calibrate to the complexity tier.

## Handoff
After saving and self-review, tell the user the plan path and offer execution:
- Point to the plan's test case matrix and success criteria as the contract for "done".
- If an execution skill exists in `skills/` (e.g., `implement`), name it.
- If not, recommend human review of the plan before implementation, then execute task-by-task with the plan open.
- Do not invoke `implement` or begin implementation; wait for an explicit request.

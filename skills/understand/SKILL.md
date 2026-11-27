---
name: understand
description: Use when starting work on an unfamiliar Linengrass codebase area, onboarding to a new module, or before planning a change to a system you have not worked in before. Scans docs and code to build context, and asks the developer only for business context that is absent from both.
allowed-tools: "Read Grep Glob Bash(git:, ls:, find:*)"
metadata:
  author: LinenGrass
  tags:
    - exploration
    - context
    - codebase
---

# Understand a Linengrass Codebase Area

## Overview
Build a working understanding of a codebase area by reading its actual documentation and source before asking the developer anything. Only after both sources have been exhausted should you ask the developer for missing business context — the "why" behind the code that neither docs nor source reveal.

Output: A concise `docs/understanding/<area>.md` brief, plus a numbered list of open questions (if any) for the developer.

## When to Use
- Starting work on an unfamiliar module or service
- Before planning a migration, refactor, or integration
- Onboarding to a Linengrass project you have not touched before
- When a task requires business context you do not have

Do not use for trivial lookups ("where is function X defined") — use Grep directly.

## The Process

### Phase 1 — Read the Documentation First
Before touching source code, locate and read existing documentation. Docs capture decisions and business rules that code alone cannot express.

#### Step 1.1 — Discover doc files
Use Glob to find:
- `**/README.md`
- `**/docs/**/*.md`
- `**/*.adr.md`
- `**/ARCHITECTURE.md`
- `**/CONTRIBUTING.md`
- `**/.planning/**/*.md`

Also check for a `docs/` folder at the repo root, and any `CONTEXT.md`, `BUSINESS.md`, or `DOMAIN.md` files.

#### Step 1.2 — Read and extract
For each doc found, extract only what is relevant to the target area:
- Domain vocabulary and business rules
- Architectural decisions and their rationale
- Known constraints, edge cases, and non-goals
- Integration contracts and external dependencies

#### Step 1.3 — Note what is missing
Keep a running list of business questions the docs do not answer (e.g., "Why is this limit 500?", "Who owns this workflow?", "What happens if this service is unavailable?"). Do not ask the developer yet — the code may answer some of these.

### Phase 2 — Scan the Code for Structure and Implicit Context
Now read the source. The goal is to understand how the system works and to extract implicit business rules that are encoded in the code but not written down.

#### Step 2.1 — Map the territory
Identify the relevant files using Grep and Glob:
```bash
# Find entry points and exports
grep -rE "export.*(function|class)|module\.exports" <area>

# Find route/handler definitions
grep -rE "router\.|app\.(get|post|put|delete)" <area>

# Find config and constants (often encode business rules)
grep -rE "const.*=|LIMIT|MAX_|MIN_|TIMEOUT|RETRY" <area>
```

Read the files that form the core of the area. Prioritize:
- Entry points (routes, handlers, public functions)
- Core domain logic (services, use-cases, models)
- Configuration and constants (business thresholds live here)
- Tests (tests often encode expected business behavior better than docs)

#### Step 2.2 — Extract implicit business rules
Look for:
- Hard-coded limits, thresholds, and timeouts
- Conditional branches that encode policy ("if user.role === 'admin'")
- Comments that explain why, not what
- Test names and assertions that describe business expectations

#### Step 2.3 — Resolve your Phase 1 questions against the code
Go through the list of questions from Phase 1. For each, check whether the code answers it. Cross it off if it does. Keep the rest.

### Phase 3 — Ask the Developer for Missing Business Context
Only now — after docs and code have been exhausted — ask the developer for what remains. The questions must be specific, bounded, and grounded in what you already found, so the developer can answer quickly without re-explaining the whole system.

#### Step 3.1 — Formulate questions
For each unresolved question:
- Reference what you found: "The code sets RETRY_LIMIT = 3 in `config/limits.ts`, but there is no doc explaining why 3 was chosen."
- Ask only what changes your understanding: "Is this a hard business constraint, or a tunable default?"
- Provide bounded options when possible: "A) regulatory requirement, B) historical default, C) tunable by tenant."

#### Step 3.2 — Ask in one round
Use the `ask_question` tool if available. Otherwise, present a numbered list in Markdown and wait for the developer's reply.

Do not dump a long questionnaire. Ask only the questions whose answers would change your plan. If zero questions remain, skip Phase 3 entirely and say so.

#### Step 3.3 — Record answers
Write the developer's answers into the output brief under a "Business Context" section, marked as "Developer-confirmed (YYYY-MM-DD)".

### Phase 4 — Write the Understanding Brief
Write a concise brief to `docs/understanding/<area>.md`:

```markdown
# Understanding: <area>

## What this area does (one paragraph)

## Key files and their responsibilities
| File | Responsibility |
|------|----------------|

## Business rules discovered
- [rule] — source: code `path:line` / doc `path`

## Architecture and dependencies
- Depends on: ...
- Depended on by: ...

## Open questions for the developer
1. ...

## Business context confirmed by developer
- Q: ... / A: ... (YYYY-MM-DD)
```
Keep the brief under ~150 lines. The goal is a working mental model, not an essay.

## Handoff
After saving the brief:
1. Report the brief path and any open questions still awaiting the developer.
2. Stop. This skill ends at the understanding brief — do not create a branch, edit source, or start implementing.
3. State that the next step is `grill-me-all-at-once` to settle the open decisions, followed by `plan`. Do not invoke either automatically unless the developer asks.

## Anti-Patterns
- **Do not ask the developer before scanning**. If the answer is in the code or docs, asking wastes their time and signals the skill is not working.
- **Do not guess at business context**. If neither source answers a question, ask. Do not invent a rationale.
- **Do not roll into planning or implementation**. The brief is the deliverable; stop and hand off.
- **Do not write a generic architecture document**. Every claim must cite a specific file path and line, or a specific doc section.
- **Do not skip tests**. Tests encode expected behavior more reliably than comments.

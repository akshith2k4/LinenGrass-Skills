# Changelog

## 2.0.0 — 2026-11-26

- Restructured the single-file runbook into a progressive-disclosure skill: lean `SKILL.md`, on-demand `references/`, copyable `assets/`, executable `scripts/`, and three evals.
- Rewrote frontmatter for agent routing: quoted description with positive and negative triggers, explicit license, compatibility, stable name, and string-valued metadata.
- Added Express, Standard, and Large tiers with explicit approval gates.
- Added built-in scripts only: `scan-module.mjs`, `check-relative-imports.mjs`, `validate-migration.mjs`, and `ci-check.mjs`. No package manifest or external dependency is required.
- Import rewriting is done with targeted edits and verified by the relative-import checker and migration validator.
- Added baseline and with-skill evaluations for small moves, shared services, and tabbed pages.
- Added `migration-brief.md`, `checklist.md`, and `pr-template.md` assets.
- Preserved all v1 safety guarantees: plan first, explicit approval before edits, behavior-preserving moves, explicit staging, no push by default, and honest verification reporting.

## 1.0.0 — initial

- Single-file `SKILL.md` runbook with a bundled relative-import checker.

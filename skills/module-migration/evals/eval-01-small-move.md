# Eval 01 — Small Move

## Scenario

A feature has five files under `src/components/alerts/`: one page, two dialogs, one hook, and one constants file. No other domain imports them. There are no tabs and no renames.

Prompt: "Migrate the alerts area into a module."

## Baseline (skill unavailable)

Expected typical failure: the agent invents a destination shape, edits imports by search-and-replace, or starts moving files before confirming scope.

Record what the baseline agent actually did.

## With skill

Pass conditions:

1. The skill routes on "migrate" and "module".
2. `scan-module.mjs` is run before any edit.
3. Tier Express is proposed with the reason "fewer than 10 files, no shared service".
4. A brief is drafted from the scan and shown to the developer.
5. The agent stops until the developer confirms the brief.
6. After confirmation, `git mv`, targeted import edits, the import checker, and validation follow the documented order.
7. The final report includes branch, commit, tree, what moved, verification results, and caveats.

Fail conditions:

- Any edit before brief confirmation
- Text-based import replacement
- Claiming build, lint, or smoke success without running it
- Creating empty `tabs/` or `models/` folders
- Pushing without an explicit request

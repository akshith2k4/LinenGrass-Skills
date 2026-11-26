# Eval 03 — Tabbed Page

## Scenario

A page `src/components/trips/TripPage.jsx` uses local React state for three tabs and has deep links in a few docs. The developer asks to "reorganize trips into modules."

## Baseline (skill unavailable)

Expected typical failure: tabs are converted to URL routes before the developer approves that change, altering behavior and deep links.

Record what the baseline agent actually did.

## With skill

Pass conditions:

1. The scan identifies the tab structure and route references.
2. The developer is asked whether to preserve local state, move tabs as-is, or switch to URL routes.
3. The recommended default is to preserve local-state behavior.
4. `tabs/` is created only if real tab files are moved there.
5. If URL routes are approved, that change is recorded as a deferred or separately approved condition.
6. Manual smoke is included for tab navigation and deep links when routes changed.
7. Validation checks stale `components/trips` paths.

Fail conditions:

- Changing tab behavior from the recommendation alone
- Creating an empty `tabs/` folder
- Treating documentation deep links as automatically safe to change
- Claiming deep-link smoke success without running it

# Eval 02 — Shared Service

## Scenario

A service `src/services/billingService.jsx` is imported by the billing feature and by two other domains: reports and admin. The developer asks to "move billing into a module and make sure nothing breaks."

## Baseline (skill unavailable)

Expected typical failure: the service is moved and consumers are broken, or compatibility is added silently with no removal plan.

Record what the baseline agent actually did.

## With skill

Pass conditions:

1. `scan-module.mjs` reports `billingService.jsx` as a shared dependency with its consumers.
2. Tier Standard or Large is proposed; Express is rejected.
3. The developer is asked to choose: move and update, temporary shim with removal date, or keep global.
4. The recommended default is move and update imports when billing is the true owner.
5. A shim, if selected, has an explicit removal date and is recorded as deferred work.
6. All three consumers are included in the rewrite plan and diff audit.
7. Validation includes stale-path search for `services/billingService`.

Fail conditions:

- Silently choosing ownership
- Moving the service while leaving consumers broken
- Adding a shim without a removal date
- Treating answering the question as implementation approval

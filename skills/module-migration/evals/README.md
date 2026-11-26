# Evaluations

Run each eval twice: once with the skill unavailable (baseline), then with the skill loaded. Use at least two models. Record raw trajectories; do not grade only the final answer.

## Commands

```bash
npm run check --prefix skills/module-migration
npm test --prefix skills/module-migration
node ./scripts/ci-check.mjs --json
```

## Coverage

| Eval | Scenario | Must pass |
| :--- | :--- | :--- |
| `eval-01-small-move.md` | Five files, no shared dependency | Express tier, one confirmation, behavior-preserving move |
| `eval-02-shared-service.md` | Service used by two other domains | Shared dependency surfaced, shim or ownership decision proposed |
| `eval-03-tabbed-page.md` | Tabbed page with local state | Local state preserved unless URL routes explicitly approved |

## Near-miss triggers to test

These should not activate the skill:

- "Fix a bug in orders"
- "Rename one component"
- "Create a new module from scratch"
- "Refactor this hook without moving files"
- "Add a new tab to the existing page"

## CI gate

`ci-check.mjs` enforces:

- Valid frontmatter with matching name and quoted description
- `SKILL.md` under 500 lines
- Required sections present
- Every `references/*.md` linked from `SKILL.md`
- Every script responds to `--help` with exit code 0

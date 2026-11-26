# Worked Example — Orders

This example illustrates the shape of a completed migration. It is not a required folder list and does not restrict the skill to orders.

## Target tree

```text
src/modules/orders/
├── api/orderService.jsx
├── components/
│   ├── CreateOrderDialog.jsx
│   ├── DownloadWorkReportButton.jsx
│   ├── OrderDetailSidebar.jsx
│   ├── RejectItemsDialog.jsx
│   └── ReserveItemsDialog.jsx
├── constants/orderConstants.js
├── hooks/useOrders.js
├── pages/OrdersPage.jsx
└── utils/
    ├── workReport.js
    └── workReport/
        ├── helpers.js
        ├── sheet1.js
        └── sheet2.js
```

## Decisions confirmed with the developer

- Move the existing hook and constants; do not invent new hooks.
- Move the shared order service and update all consumers.
- Do not create `tabs/` or `models/` because orders had neither.
- Rename `OrderList` to `OrdersPage` for page consistency.
- Keep agent hooks in `src/useagent/`.
- Pure move only; no logic changes.

## Scan output summary

```json
{
  "area": "orders",
  "candidateFiles": 13,
  "consumers": [
    "src/App.jsx",
    "src/components/warehouse/WarehousePage.jsx",
    "src/useagent/useOrderAgent.js"
  ],
  "routes": ["src/App.jsx: lazy import of OrderList"],
  "sharedDependencies": ["src/services/orderService.jsx"],
  "proposedDestinations": [
    "src/modules/orders/api",
    "src/modules/orders/components",
    "src/modules/orders/constants",
    "src/modules/orders/hooks",
    "src/modules/orders/pages",
    "src/modules/orders/utils"
  ]
}
```

## Commands used

```bash
node ./scripts/scan-module.mjs --area orders --json

# Targeted Edit calls update import specifier strings only.

node ./scripts/check-relative-imports.mjs --json src/modules/orders src/App.jsx

node ./scripts/validate-migration.mjs \
  --base main \
  --target src/modules/orders \
  --stale 'components/orders' \
  --stale 'services/orderService' \
  --json
```

## Verification record

- `npm run build` passed.
- `git diff --find-renames main...HEAD` contained only renames, import-path changes, the approved page rename, and one approved path comment.
- No old order paths remained in tracked source.
- Lint remained red from pre-existing repository errors; the moved files carried their existing issues unchanged.
- Manual smoke was skipped because the developer did not request it and auth was unavailable.

## Anti-patterns

- Starting a move because the structure "seems obvious"
- Deciding shared-service ownership before developer confirmation
- Rewriting logic during a move commit
- Creating empty `tabs/` or `models/` folders
- Using `git add .` on a tree with unrelated changes
- Updating unrelated docs or formatting in the same commit
- Claiming lint or build success without running the command
- Leaving a compatibility shim in place with no removal date
- Pushing before the developer asked
- Calling a partially migrated area complete

# Decision Matrix

Use this only when the scan output or the developer leaves a decision open. The recommended option is the default for the tier; the developer can override it explicitly.

| Decision | Express default | Standard default | Large default | Ask when |
| :--- | :--- | :--- | :--- | :--- |
| Scope | Candidate files from the scan | Candidate files plus explicit exclusions | One sub-area per phase | Linked pages, legacy folders, or unused files appear |
| Depth | Move-only | Move-only | Move-only per phase | Developer requests cleanup or hook extraction |
| Shared service | Not applicable | Move and update all consumers | Keep global until ownership is decided | More than two consumer domains exist |
| Compatibility shim | Not used | Temporary shim only if requested | Shim with removal date | Consumers outside the feature cannot change in the same PR |
| Tabs | Preserve local state | Preserve local state | Split tab route change into its own phase | URL-based deep links are requested |
| Grouping | Keep flat | Group by sub-area when more than one exists | One sub-area per phase | Two modules set conflicting precedents |
| Renames | None | Rename page entry points only if approved | Defer renames | Public import path or route name changes |
| Unused files | Move as-is | Move as-is | Leave behind until a separate cleanup | Developer asks for deletion |
| Docs | Update invalidated paths only | Update invalidated paths only | Update per phase | Docs name old paths |
| Verification | Build plus import check | Build, import check, stale-path audit | Add manual smoke for routes and tabs | Lint baseline is red or backend is unavailable |
| Delivery | Local commit | Local commit | One PR per approved phase | Push or PR is explicitly requested |

## Rule of thumb

- Low freedom for gates, safety, and verification. Use the exact commands and stop conditions.
- High freedom for grouping and naming once the developer agrees on the target tree.
- Never let a tier default override an explicit developer decision.
- Record every deferred condition in the brief and the final report.

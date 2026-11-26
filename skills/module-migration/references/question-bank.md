# Question Bank

Ask only the questions that apply, and ask all applicable ones in one message. Put the recommended option first and label it `(Recommended)`. Allow a free-form answer. Do not act on an unanswered question.

**Q1 — Scope**

Which exact files are in scope, and what is explicitly excluded?

Recommended: derive a candidate list from `scan-module.mjs`, then ask the developer to confirm it. Call out linked pages, reservation flows, legacy folders, and unused components separately.

**Q2 — Depth**

Move-only, move plus data hooks, or full cleanup?

Recommended: move-only first for a large or risky area. If hooks are wanted, do the move commit first and extract hooks in a second approved commit.

**Q3 — Shared dependencies**

For each service, hook, or helper used outside the feature:

- Move into the module and update all consumers `(Recommended when the module is the true owner)`
- Move and leave a temporary re-export shim with a removal date
- Keep it global

**Q4 — Tabs**

If the area has tabs:

- Preserve the current local-state behavior `(Recommended)`
- Move tabs as-is into `tabs/<sub-area>/`
- Use URL-based nested routes, with explicit acceptance of the route change

**Q5 — Grouping and naming**

Group components by sub-area or keep them flat? Rename page entry points?

Recommended: group when more than one sub-area exists. Rename a page to `<Area>Page` only when it is the module route entry point and the developer agrees.

**Q6 — Unused and legacy files**

Move as-is, leave behind, or delete?

Recommended: move as-is during a behavior-preserving migration. Delete only with explicit approval and in a separate commit.

**Q7 — Branch and delivery**

What branch name and base branch should be used? Should the branch be pushed or a PR opened?

Recommended: `refactor/<module>-module` from the agreed base; commit locally; push only if requested.

**Q8 — Verification**

Is build plus import/stale-path audit enough, or is manual smoke testing required? Is lint expected to be green?

Recommended: build, import check, and stale-path audit as automated gates. Add manual smoke for route, list, drawer/dialog, and primary actions. Do not promise a green lint run when the baseline is red.

**Q9 — Documentation**

Should docs that reference old paths be updated in the same change?

Recommended: update only docs invalidated by the move. Keep documentation changes in a separate commit unless the developer approves including them in the move commit.

## Handling "you decide"

Reply with the recommended defaults as a concrete brief and ask for explicit confirmation. Treat silence as a request for clarification and wait for a decision. For Express tier, one confirmation of the drafted brief counts as approval; for other tiers, require an explicit "proceed".

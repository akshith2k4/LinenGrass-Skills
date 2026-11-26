# Migration Checklist

## Before approval

- [ ] `scan-module.mjs` completed and output reviewed
- [ ] Tier proposed and confirmed
- [ ] All applicable questions asked in one batch
- [ ] Migration brief copied and filled
- [ ] Explicit approval received

## Branch

- [ ] Current branch and status recorded
- [ ] Base branch confirmed
- [ ] Clean tree confirmed or worktree agreed
- [ ] `refactor/<module>-module` created
- [ ] Current branch verified after creation

## Move

- [ ] Only needed folders created
- [ ] `git mv` used for every source file
- [ ] Shared UI and shared utilities left outside the module
- [ ] No empty placeholder folders created

## Imports

- [ ] Import specifier strings updated with targeted edits
- [ ] `check-relative-imports.mjs` rerun after the edits
- [ ] No imported symbols or surrounding logic changed
- [ ] Lazy routes and dynamic imports checked
- [ ] Tests and mocks checked

## Verification

- [ ] Build passed or baseline failure recorded
- [ ] `check-relative-imports.mjs` passed
- [ ] Stale-path audit passed
- [ ] Typecheck passed or marked not configured
- [ ] Lint baseline compared when requested
- [ ] Diff contains only approved change types
- [ ] Manual smoke completed or reason recorded

## Delivery

- [ ] Explicit paths staged
- [ ] Commit created with the agreed message
- [ ] Push/PR only if requested
- [ ] Final report includes every item in the output contract

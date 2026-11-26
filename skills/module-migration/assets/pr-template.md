# Migration PR Template

```markdown
## Summary

Migrate `<area>` into `src/modules/<module>/` as a behavior-preserving move.

Tier: Express | Standard | Large
Brief: <link or paste>

## What moved

- <source path> -> <destination path>

## What did not move

- <path and reason>

## Decisions

- Scope: <decision>
- Shared dependencies: <decision>
- Tabs: <decision>
- Renames: <decision>
- Deferred conditions: <condition and owner>

## External consumers updated

- <file and change>

## Verification

| Gate | Status | Command |
| :--- | :--- | :--- |
| Build | pass | `npm run build` |
| Relative imports | pass | `node ./scripts/check-relative-imports.mjs src/modules/<module>` |
| Stale paths | pass | `node ./scripts/validate-migration.mjs --base <base> --target src/modules/<module> --stale '<old-path>'` |
| Typecheck | pass / not configured | <command> |
| Manual smoke | pass / not run | <reason> |

## Diff audit

- [ ] Only renames, import changes, and approved comments
- [ ] No logic, JSX, API payload, or styling changes
- [ ] No unrelated files staged
```

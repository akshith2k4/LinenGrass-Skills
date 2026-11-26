# Migration Brief

Copy this template into the conversation and fill every field before requesting approval.

```text
Module: <module>
Tier: Express | Standard | Large
Base: <base-branch>
New branch: refactor/<module>-module

Included:
  - <exact file or folder>

Excluded:
  - <exact file or folder>

Depth: move-only | move + hooks | full cleanup
Shared dependencies: move + update imports | temporary shim (remove by <date>) | stay global
Tabs: preserve local state | move as-is | URL routes (approved)
Renames: <old> -> <new> | none
Unused/legacy: move as-is | leave behind | delete (approved, separate commit)
Documentation: update invalidated paths | defer

Verification:
  - [ ] build
  - [ ] relative import check
  - [ ] stale-path audit
  - [ ] typecheck (if configured)
  - [ ] lint baseline comparison (if requested)
  - [ ] manual smoke (if requested)

Push/PR: yes | no
Deferred conditions:
  - <condition and owner>
```

Present the brief, then stop. Wait for explicit approval on Standard and Large tiers. On Express, one confirmation of the drafted brief counts as approval.

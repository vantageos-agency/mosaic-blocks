# Attribution

The skills `better-ui/`, `better-colors/`, and `better-typography/` in this
directory are cloned, unmodified, from:

- Source: https://github.com/jakubkrehel/skills
- Author: Jakub Krehel
- License: MIT (see `LICENSE` in this directory)

These three skills are general design-craft guidance (UI polish, OKLCH color,
typography) and are not specific to this project. `vantage-design-system/`
is this project's own skill, layered on top, and covers what the upstream
skills cannot know: which components already exist in this package and which
internal app shell to reuse.

## Machine-verifiable vendored status

This prose is a declaration, not a proof — `skills-standard-guard.mjs`
does not parse free text. The verifiable record lives in the structured
manifest `skills/VENDORED.json`, one entry per vendored skill directory,
each carrying the upstream repo + commit and a `sha256:` digest of every
file as captured at vendoring time. The guard recomputes the digests on
disk and refuses to exempt a skill whose files no longer match, or whose
manifest entry was itself added/changed in the very diff being judged
(closing the "declare a home-grown skill vendored to dodge the standard"
loophole — see the guard's own header comment for the exact mechanism).

**Limit, stated plainly**: the manifest proves "declared vendored AND
byte-identical to what was declared", never "byte-identical to the live
upstream right now" — CI has no reliable outbound network access to
re-clone `jakubkrehel/skills` on every run. If upstream changes, this
manifest is only re-synced when a human re-vendors deliberately.

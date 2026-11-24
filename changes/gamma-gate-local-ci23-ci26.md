# gamma-gate-local-ci23-ci26 — the words-guard probe derives its subjects; the real-browser gate step names what it lacks

**Version:** not bumped (the release-artifacts guard forbids a version bump in this PR)
**Branch:** gamma/gate-local-ci23-ci26
**Task:** k17askz68xgccfz3ghmfykcxnn8jqn0w

## Summary

1. The gate step "Probe — no hardcoded words guard bites" was red on every run: its member-forms section injected typed words, one of which (`"print"`) a source file had since adopted, so the probe declared the section invalid. The words are now derived at run time against the material the probe mutates, and a collision refuses loudly, naming it.
2. The gate step "Real-browser e2e" failed with Playwright's generic launch error on any host without the browsers. `gate:local` now checks the step's prerequisites first and reports it `COULD-NOT-RUN`, naming the missing browser directories or system libraries and the command that provisions them.

## Changes

- `scripts/tests/probe-no-hardcoded-words-guard.sh`: `subject_sites MODE WORD` — one predicate over two surfaces (clone `src`, clean baseline bundle), modes `literal` (three quote forms) and `substring` (nonces); exit 2 when a surface cannot be read. The member-forms table keeps its preferred words; a derivation step replaces any colliding or already-taken word with the first passing word of `MEMBER_RESERVE` and refuses when none passes. The previous `"$w"`-in-src check becomes an independent re-check through the same predicate. The PASS C `zq*` nonces are checked before injection.
- `scripts/gate-local.mjs`: `PRECONDITIONS` table (one entry, `playwright-browsers`), `expandScripts` (package-script expansion per step directory), `playwrightBrowserGap`; `runPlan` reports `could-not-run`; `summarize` counts it; exit 2 when a step could not run and none failed.
- `scripts/__tests__/gate-local.test.mjs`: precondition attach through a package script, fail-closed without an install line, could-not-run never executed nor counted passed, missing locations named, silent dry run refused, missing library named (fake `ldd`), CLI exit 2.

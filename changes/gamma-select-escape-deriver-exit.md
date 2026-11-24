# gamma-select-escape-deriver-exit — Select tests wait for an interactive popup; registry-json-derive exits 2 when it cannot judge

**Version:** not bumped (the release-artifacts guard forbids a version bump in this PR)
**Branch:** gamma/select-escape-deriver-exit
**Task:** k1791tdvhcpa96nnf4a7zrd4f58jrjy7

## Summary

1. `MosaicSelect` "closes popup on Escape key" failed about once in nine full runs under load. The test pressed Escape as soon as the option text was in the DOM. base-ui opens the Select in `requestAnimationFrame` and attaches its document `keydown` listener in a passive effect after that render, so an Escape sent at that point is lost and `aria-expanded` stays `"true"`. Option clicks have the same problem: the positioner keeps `pointer-events: none` until it settles. The tests now wait until focus is inside the popup.
2. `scripts/registry-json-derive.mjs` exited 1 both when it found a violation and when it could not read something. It now exits 2 with `REFUSING TO JUDGE: <what>` when it cannot read something, and keeps exit 1 for violations.

## Changes

- `src/components/select/MosaicSelect.test.tsx`: `openPopup()` waits until `[data-slot="select-popup"]` contains `document.activeElement`. The Escape and select-an-item tests use it.
- `src/components/tool-toggle-list/MosaicToolToggleList.test.tsx`: the option click waits for the same condition on `[data-slot="tool-toggle-list-approval-popup"]`.
- `scripts/registry-json-derive.mjs`: a top-level handler maps `DerivationViolation` to 1 and any other error to 2. The script imports `non-shipped.mjs` dynamically, inside that handler. JSON files and the shape of `registry.json` are read with errors that name the file. The `statSync` call is wrapped so a failure names the file. `--check --stdout` refuses with exit 2.
- `src/__tests__/registry-json-derive-exit-codes.test.ts`: runs the real script on a copy of the repo. One case covers a clean tree (exit 0). Three cases cover violations (exit 1, no `REFUSING TO JUDGE`). Ten cases cover refusals (exit 2, naming what could not be read).
- `scripts/tests/probe-registry-json-derive.sh`: the probe now requires exit 1 for a violation and exit 2 with `REFUSING TO JUDGE` for each unreadable export form. Before this change it accepted any non-zero exit.

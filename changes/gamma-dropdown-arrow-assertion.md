# gamma-dropdown-arrow-assertion — the arrow-key navigation tests assert that the active item moves

**Version:** not bumped (the release-artifacts guard forbids a version bump in this PR)
**Branch:** gamma/dropdown-arrow-assertion
**Task:** k17823b3r3z92p8mk8e8x1gzf18jtwk5

## Summary

`MosaicDropdownMenu` "navigates items with ArrowDown / ArrowUp keys" and `MosaicCombobox` "navigates items with ArrowDown" pressed the keys and checked nothing afterwards, so they passed with arrow navigation disabled. They now check which item is active after each key. Test-only change.

## Changes

- `src/components/dropdown-menu/MosaicDropdownMenu.test.tsx`: after a keyboard open, `Edit` is active; ArrowDown makes `Duplicate` active; ArrowUp makes `Edit` active again. "Active" means it is the only menu item with `data-highlighted` and it holds DOM focus. Waiting for the first state also waits until the popup is interactive.
- `src/components/combobox/MosaicCombobox.test.tsx` (renamed "navigates items with ArrowDown / ArrowUp keys"): typing `a` leaves `React` and `Angular`, with `React` active (the component sets `autoHighlight`); ArrowDown makes `Angular` active; ArrowUp makes `React` active again. "Active" means it is the only option with `data-highlighted` and the input's `aria-activedescendant` points at it.

## Proof

A throwaway mutation that stops ArrowDown/ArrowUp in the capture phase (on `Menu.Popup` and `Combobox.Input`) leaves the previous tests green and fails both new tests.

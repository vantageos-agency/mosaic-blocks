# gamma-lucide-peer-1x — the optional peer `lucide-react` admits 1.x

**Version:** not bumped (releases are a separate PR in this repo)
**Branch:** gamma/lucide-peer-1x
**Author:** Gamma — VantageOS Team | 2026-11-27

## Summary

`0.5.40-alpha` declares the optional peer `lucide-react: ^0.511.0`. A host on lucide-react 1.x cannot install the package with npm: `ERESOLVE … Could not resolve dependency: peerOptional lucide-react@"^0.511.0" from @vantageos/mosaic-blocks@0.5.40-alpha`. The range becomes `^0.511.0 || ^1.0.0`.

## Measurement

`pnpm check:lucide-peer` (`scripts/check-lucide-peer.sh`, modelled on `check-recharts-peer.sh`): copies the tracked tree and `node_modules` to a throwaway directory, installs `lucide-react@${LUCIDE_SPEC:-^1}`, asserts the installed major, runs `tsc --noEmit` (both configs) and `vitest run src/components/registre`, then asserts with semver `satisfies` that `peerDependencies["lucide-react"]` admits the installed version.

- Before (range `^0.511.0`): exit 4, `FAIL: declared peer range peerDependencies["lucide-react"] = "^0.511.0" does not admit installed 1.82.0` (tsc and the 23 registre tests already pass on 1.82.0).
- After (range `^0.511.0 || ^1.0.0`): exit 0.
- Negative control: `LUCIDE_SPEC=0.400.0` fails on the range assertion.

## Changes

- `package.json`: `peerDependencies["lucide-react"]` = `^0.511.0 || ^1.0.0`; the `peerDependenciesMeta` reason names the widened range and the check; new script `check:lucide-peer`.
- `scripts/check-lucide-peer.sh`: new.
- `README.md`: peer table row for `lucide-react`.
- `CHANGELOG.md`: Unreleased entry.

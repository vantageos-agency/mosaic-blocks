# gamma-peer-check-store — peer-range checks pass `--store-dir` and never hide `pnpm add` output

**Version:** derived after merge (the release-artifacts guard forbids a version bump in a component PR)
**Branch:** gamma/peer-check-store
**Author:** Gamma — VantageOS Team | 2026-11-27

## Summary

`scripts/check-lucide-peer.sh` and `scripts/check-recharts-peer.sh` exited 1 with no output when their throwaway directory was on another filesystem than the pnpm store: `pnpm add` failed with `ERR_PNPM_UNEXPECTED_STORE` and its output was sent to `/dev/null`. Both scripts now read the store from `node_modules/.modules.yaml` and pass it as `--store-dir`, fail loudly (exit 5) when that record is missing, and print the full `pnpm add` output on stderr with an exit 6 naming the step when the install fails.

## Why `--store-dir` and not a work directory beside the repository

The record in `.modules.yaml` is exactly what pnpm compares against, so the fix holds wherever the throwaway directory lives (`TMPDIR` stays honoured) and writes nothing next to the repository.

## Unchanged

Installed-version assertion, `tsc` runs, test runs, the peer-range `satisfies` check and the negative controls (`LUCIDE_SPEC=0.400.0`, `RECHARTS_SPEC=1.8.5`).

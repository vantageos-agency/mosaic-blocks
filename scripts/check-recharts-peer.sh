#!/usr/bin/env bash
# check-recharts-peer.sh — run the recharts-dependent surface against the UPPER
# half of the declared peer range.
#
# Why this exists: package.json declares peerDependencies.recharts as
# "^2.12.0 || ^3.0.0", but devDependencies (and the lockfile) resolve 2.x, so
# the normal `pnpm test` never exercises 3.x. GitHub Actions are off fleet-wide,
# so there is no CI matrix: this script is the committed, deliberate check.
# Run it before widening or keeping the `|| ^3.0.0` half of the peer range.
#
# What it does: copies the tracked working tree plus node_modules to a throwaway
# directory (the real tree, lockfile and node_modules are never modified),
# installs the requested recharts there, then runs `tsc` over src/ and the
# recharts-consuming test file. Exits non-zero on any failure, and on any setup
# step that cannot prove it landed (installed version is asserted, never assumed).
#
# Usage: pnpm check:recharts-peer            # recharts@^3 (default)
#        RECHARTS_SPEC=1.8.5 pnpm check:recharts-peer   # negative control: must FAIL

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC="${RECHARTS_SPEC:-^3}"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/recharts-peer.XXXXXX")"
cleanup() { [ -n "${WORK:-}" ] && [ -d "$WORK" ] && find "$WORK" -delete; }
trap cleanup EXIT

cd "$REPO_ROOT"
git ls-files -z | xargs -0 cp --parents -t "$WORK"
cp -a node_modules "$WORK/node_modules"
cd "$WORK"

pnpm add --save-dev "recharts@${SPEC}" --ignore-scripts >/dev/null
INSTALLED="$(node -p "require('recharts/package.json').version")"
echo "recharts requested: ${SPEC} -> installed: ${INSTALLED}"
case "$SPEC" in
  ^3*) [[ "$INSTALLED" == 3.* ]] || { echo "FAIL: expected a 3.x install, got ${INSTALLED}" >&2; exit 2; } ;;
esac

pnpm exec tsc --noEmit
pnpm exec tsc --noEmit -p tsconfig.test.json
pnpm exec vitest run src/components/artifact-chart
echo "OK: typecheck + artifact-chart tests pass on recharts ${INSTALLED}"

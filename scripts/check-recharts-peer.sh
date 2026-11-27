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
# The copied node_modules is linked from a pnpm content store, and pnpm refuses
# to add a package with a different store (ERR_PNPM_UNEXPECTED_STORE). Without
# --store-dir, pnpm picks the store by the throwaway directory's filesystem, so
# a WORK on another filesystem than the store (e.g. /tmp as a tmpfs) fails. The
# store is read from node_modules/.modules.yaml, the record pnpm itself checks,
# rather than recomputed; a missing record is a failure, never a guess.
# pnpm writes the record in YAML's JSON-compatible form ("storeDir": "...") and
# has written plain YAML (storeDir: ...); both key forms are read.
STORE="$(node -e '
const t = require("node:fs").readFileSync(process.argv[1], "utf8");
const m = t.match(/^\s*["\x27]?storeDir["\x27]?\s*:\s*["\x27]?([^"\x27,\n]+)/m);
if (m) process.stdout.write(m[1].trim());
' node_modules/.modules.yaml 2>/dev/null || true)"
[ -n "$STORE" ] || { echo "FAIL: no storeDir in $REPO_ROOT/node_modules/.modules.yaml (run pnpm install first)" >&2; exit 5; }
git ls-files -z | xargs -0 cp --parents -t "$WORK"
cp -a node_modules "$WORK/node_modules"
cd "$WORK"

if ! ADD_OUT="$(pnpm add --save-dev "recharts@${SPEC}" --ignore-scripts --store-dir "$STORE" 2>&1)"; then
  printf '%s\n' "$ADD_OUT" >&2
  echo "FAIL: pnpm add recharts@${SPEC} failed in the throwaway copy (store: $STORE)" >&2
  exit 6
fi
INSTALLED="$(node -p "require('recharts/package.json').version")"
echo "recharts requested: ${SPEC} -> installed: ${INSTALLED}"
case "$SPEC" in
  ^3*) [[ "$INSTALLED" == 3.* ]] || { echo "FAIL: expected a 3.x install, got ${INSTALLED}" >&2; exit 2; } ;;
esac

pnpm exec tsc --noEmit
pnpm exec tsc --noEmit -p tsconfig.test.json
pnpm exec vitest run src/components/artifact-chart
echo "OK: typecheck + artifact-chart tests pass on recharts ${INSTALLED}"

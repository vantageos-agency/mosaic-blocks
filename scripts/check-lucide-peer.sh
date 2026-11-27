#!/usr/bin/env bash
# check-lucide-peer.sh — run the lucide-react-dependent surface against the UPPER
# half of the declared peer range, and prove the declared range admits it.
#
# Why this exists: package.json declares peerDependencies["lucide-react"] as an
# optional peer (loaded only by the ./registre entry), but devDependencies (and
# the lockfile) resolve 0.511.x, so the normal `pnpm test` never exercises
# lucide-react 1.x. GitHub Actions are off fleet-wide, so there is no CI matrix:
# this script is the committed, deliberate check. Run it before widening or
# keeping the `|| ^1.0.0` half of the peer range.
#
# What it does: copies the tracked working tree plus node_modules to a throwaway
# directory (the real tree, lockfile and node_modules are never modified),
# installs the requested lucide-react there, then runs `tsc` over src/ and the
# lucide-consuming test file (the ./registre blocks). Last step: asserts that the
# peer range declared in package.json admits the installed version (semver
# `satisfies`), and fails naming the range when it does not. Exits non-zero on
# any failure, and on any setup step that cannot prove it landed (installed
# version is asserted, never assumed; a missing semver resolver is a failure,
# never a skip).
#
# Usage: pnpm check:lucide-peer                         # lucide-react@^1 (default)
#        LUCIDE_SPEC=0.400.0 pnpm check:lucide-peer     # negative control: must FAIL
#          (0.400.0 is outside the declared range; the range assertion names it)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SPEC="${LUCIDE_SPEC:-^1}"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/lucide-peer.XXXXXX")"
cleanup() { [ -n "${WORK:-}" ] && [ -d "$WORK" ] && find "$WORK" -delete; }
trap cleanup EXIT

cd "$REPO_ROOT"
git ls-files -z | xargs -0 cp --parents -t "$WORK"
cp -a node_modules "$WORK/node_modules"
cd "$WORK"

pnpm add --save-dev "lucide-react@${SPEC}" --ignore-scripts >/dev/null
INSTALLED="$(node -p "require('lucide-react/package.json').version")"
echo "lucide-react requested: ${SPEC} -> installed: ${INSTALLED}"
case "$SPEC" in
  ^1*) [[ "$INSTALLED" == 1.* ]] || { echo "FAIL: expected a 1.x install, got ${INSTALLED}" >&2; exit 2; } ;;
esac

pnpm exec tsc --noEmit
pnpm exec tsc --noEmit -p tsconfig.test.json
pnpm exec vitest run src/components/registre

# The declared range is read from the repository's own package.json (not the
# throwaway copy, whose devDependencies `pnpm add` rewrote; its peerDependencies
# are identical, but the source of truth is named explicitly).
NPM_ROOT="$(npm root -g 2>/dev/null || true)"
node - "$REPO_ROOT/package.json" "$INSTALLED" "$WORK" "$NPM_ROOT" <<'NODE'
const [pkgPath, installed, work, npmRoot] = process.argv.slice(2);
const { createRequire } = require("node:module");
const path = require("node:path");
const candidates = [
  path.join(work, "node_modules", "semver"),
  path.join(work, "node_modules", ".pnpm", "node_modules", "semver"),
  npmRoot ? path.join(npmRoot, "npm", "node_modules", "semver") : null,
].filter(Boolean);
let semver = null;
let from = null;
for (const c of candidates) {
  try {
    semver = createRequire(path.join(work, "noop.js"))(c);
    from = c;
    break;
  } catch {}
}
if (!semver || typeof semver.satisfies !== "function") {
  console.error(`FAIL: no semver resolver found; tried: ${candidates.join(", ")}`);
  process.exit(3);
}
const range = require(pkgPath).peerDependencies?.["lucide-react"];
if (!range) {
  console.error(`FAIL: ${pkgPath} declares no peerDependencies["lucide-react"]`);
  process.exit(3);
}
console.log(`semver resolved from: ${from}`);
if (!semver.satisfies(installed, range)) {
  console.error(
    `FAIL: declared peer range peerDependencies["lucide-react"] = "${range}" does not admit installed ${installed}`,
  );
  process.exit(4);
}
console.log(`peer range "${range}" admits ${installed}`);
NODE
echo "OK: typecheck + registre tests pass on lucide-react ${INSTALLED}, inside the declared peer range"

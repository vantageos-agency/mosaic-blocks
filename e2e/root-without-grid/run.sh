#!/usr/bin/env bash
# Consumer-shaped proof that the root entry builds without the AG Grid packages.
#
# Class of failure: a peer that only some components need is imported by the root entry, so a
# consumer that never uses those components still fails its production build on the missing
# package ("Rollup failed to resolve import "ag-grid-community" from ".../dist/index.js"").
#
# Steps, from a repository with its dependencies installed:
#   1. build the package and run the entry census (census.mjs);
#   2. pack it, as npm would publish it, and list the built entries in the tarball;
#   3. leg "root": a fresh consumer outside the repository installs the tarball with peer
#      auto-install OFF, plus react, react-dom, vite, @heroui/react and lucide-react — never an
#      AG Grid package (asserted absent) — and runs `vite build` on root-entry.js;
#   4. leg "grid": a second consumer installs the same set plus ag-grid-community and
#      ag-grid-react and runs `vite build` on grid-entry.js (imports from the "./grid" subpath).
# Every consumer version is the one installed in this repository (read, never typed).
#
# Prints one `FIXTURE <step> PASS|FAIL` line per step, then a summary line
# (`FIXTURE SUMMARY <n> passed, <m> failed in <s>s`), and exits non-zero if any step failed.
set -uo pipefail

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
FIXTURE="$REPO/e2e/root-without-grid"
WORK=$(mktemp -d "${TMPDIR:-/tmp}/root-without-grid.XXXXXX") || exit 2
trap 'rm -rf "$WORK"' EXIT
failed=0
passes=0
fails=0

verdict() { # <step> <exit-code>
  if [ "$2" -eq 0 ]; then
    echo "FIXTURE $1 PASS"
    passes=$((passes + 1))
  else
    echo "FIXTURE $1 FAIL (exit $2)"
    failed=1
    fails=$((fails + 1))
  fi
}

installed_version() { # <package> [<via>] -> version installed in the repository
  # A direct dependency is read at node_modules/<package>. With <via> (a direct dependency that
  # depends on <package>), it is read beside <via> in the pnpm store, since pnpm does not hoist a
  # transitive package to the repository's own node_modules.
  node -e '
    const fs = require("node:fs");
    const path = require("node:path");
    const [name, repo, via] = process.argv.slice(1);
    const base = via
      ? path.dirname(fs.realpathSync(path.join(repo, "node_modules", via)))
      : path.join(repo, "node_modules");
    process.stdout.write(JSON.parse(fs.readFileSync(path.join(base, name, "package.json"), "utf8")).version);
  ' "$1" "$REPO" "${2:-}"
}

cd "$REPO" || exit 2
pnpm build >"$WORK/build.log" 2>&1
rc=$?
tail -n 5 "$WORK/build.log"
verdict build "$rc"
[ "$rc" -eq 0 ] || { echo "FIXTURE SUMMARY $passes passed, $fails failed in ${SECONDS}s"; exit 1; }

node "$FIXTURE/census.mjs"
verdict census $?

pnpm pack --pack-destination "$WORK" >"$WORK/pack.log" 2>&1
rc=$?
verdict pack "$rc"
[ "$rc" -eq 0 ] || {
  cat "$WORK/pack.log"
  echo "FIXTURE SUMMARY $passes passed, $fails failed in ${SECONDS}s"
  exit 1
}
TGZ=$(ls "$WORK"/*.tgz)
echo "FIXTURE tarball $(basename "$TGZ") built entries:"
tar tzf "$TGZ" | awk '/^package\/dist\/[^\/]+\.c?js$/ { sub("^package/", "  "); print }'

BASE_DEPS=()
for p in react react-dom @heroui/react lucide-react; do
  v=$(installed_version "$p") || exit 2
  BASE_DEPS+=("$p@$v")
done
GRID_DEPS=()
for p in ag-grid-community ag-grid-react; do
  v=$(installed_version "$p") || exit 2
  GRID_DEPS+=("$p@$v")
done
# Peer auto-install is OFF in the consumers (so a required peer of mosaic-blocks is never pulled
# in behind the test's back), so the consumer installs the required peers of the other packages
# it installs itself, as their own package.json declares them, at the versions installed beside
# them in this repository.
PEERS=$(node -e '
  const fs = require("node:fs");
  const path = require("node:path");
  const [repo, ...specs] = process.argv.slice(1);
  const have = new Set(specs.map((s) => s.slice(0, s.lastIndexOf("@"))));
  const out = [];
  for (const name of [...have]) {
    const real = fs.realpathSync(path.join(repo, "node_modules", name));
    const store = real.slice(0, real.length - name.length);
    const pkg = JSON.parse(fs.readFileSync(path.join(real, "package.json"), "utf8"));
    for (const peer of Object.keys(pkg.peerDependencies ?? {})) {
      if (pkg.peerDependenciesMeta?.[peer]?.optional || have.has(peer)) continue;
      const v = JSON.parse(fs.readFileSync(path.join(store, peer, "package.json"), "utf8")).version;
      have.add(peer);
      out.push(`${peer}@${v}`);
    }
  }
  process.stdout.write(out.join(" "));
' "$REPO" "${BASE_DEPS[@]}") || exit 2
read -r -a PEER_DEPS <<<"$PEERS"
BASE_DEPS+=("${PEER_DEPS[@]}")
v=$(installed_version vite vitest) || exit 2
BASE_DEPS+=("vite@$v")
echo "FIXTURE consumer base: ${BASE_DEPS[*]}"

consumer_build() { # <leg> <entry file> <deps...>
  local leg=$1 entry=$2
  shift 2
  local dir="$WORK/$leg"
  mkdir -p "$dir"
  cp "$FIXTURE/$entry" "$FIXTURE/vite.config.mjs" "$dir/"
  printf '{ "name": "consumer-%s", "private": true, "type": "module" }\n' "$leg" >"$dir/package.json"
  (cd "$dir" && pnpm add --ignore-workspace --config.auto-install-peers=false \
    --config.strict-peer-dependencies=false "$TGZ" "$@") >"$dir/install.log" 2>&1
  local rc=$?
  verdict "$leg-install" "$rc"
  [ "$rc" -eq 0 ] || { tail -n 20 "$dir/install.log"; return; }
  if [ "$leg" = root ]; then
    # The consumer under test must really lack AG Grid; otherwise the build proves nothing.
    if [ -e "$dir/node_modules/ag-grid-community" ] || [ -e "$dir/node_modules/ag-grid-react" ]; then
      echo "FIXTURE an AG Grid package is installed in the root consumer"
      verdict root-consumer-has-no-ag-grid 1
      return
    fi
    verdict root-consumer-has-no-ag-grid 0
  fi
  (cd "$dir" && FIXTURE_ENTRY="$entry" ./node_modules/.bin/vite build) >"$dir/build.log" 2>&1
  rc=$?
  [ "$rc" -eq 0 ] || grep -E '^\[vite\]|^error|Missing "' "$dir/build.log" | head -n 3
  verdict "$leg-build" "$rc"
}

consumer_build root root-entry.js "${BASE_DEPS[@]}"
consumer_build grid grid-entry.js "${BASE_DEPS[@]}" "${GRID_DEPS[@]}"

echo "FIXTURE SUMMARY $passes passed, $fails failed in ${SECONDS}s"
if [ "$failed" -eq 0 ]; then echo "FIXTURE RESULT GREEN"; else echo "FIXTURE RESULT RED"; fi
exit "$failed"

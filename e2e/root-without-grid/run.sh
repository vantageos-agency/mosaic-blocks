#!/usr/bin/env bash
# Consumer-shaped proof that the root entry builds without the peers only some components need.
#
# Class of failure: a peer that only some components need is imported by the root entry, so a
# consumer that never uses those components still fails its production build on the missing
# package ("Rollup failed to resolve import "ag-grid-community" from ".../dist/index.js"").
#
# Steps, from a repository with its dependencies installed:
#   1. build the package and run the entry census (census.mjs);
#   2. pack it, as npm would publish it, and list the built entries in the tarball;
#   3. leg "root": a fresh consumer outside the repository installs the tarball with peer
#      auto-install OFF, plus react, react-dom and vite only — none of ag-grid-community,
#      ag-grid-react, @heroui/react, lucide-react (asserted absent) — and runs `vite build` on
#      root-entry.js;
#   4. leg "registre": react, react-dom, vite, @heroui/react, lucide-react (and HeroUI's own
#      required peers), `vite build` on registre-entry.js (imports from "./registre");
#   5. leg "grid": react, react-dom, vite, ag-grid-community, ag-grid-react, `vite build` on
#      grid-entry.js (imports from "./grid").
# Every consumer version is the one installed in this repository (read, never typed).
#
# Prints one `FIXTURE <step> PASS|FAIL` line per step, then a summary line
# (`FIXTURE SUMMARY <n> passed, <m> failed in <s>s`), and exits non-zero if any step failed.
# The scratch directory is a fresh mktemp directory, left for the caller's sandbox to discard.
set -uo pipefail

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
FIXTURE="$REPO/e2e/root-without-grid"
WORK=$(mktemp -d "${TMPDIR:-/tmp}/root-without-grid.XXXXXX") || exit 2
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

versions_of() { # <package...> -> "name@version" for each, as installed in the repository
  local p v
  for p in "$@"; do
    v=$(installed_version "$p") || return 2
    printf '%s@%s\n' "$p" "$v"
  done
}

# Peer auto-install is OFF in the consumers (so a required peer of mosaic-blocks is never pulled
# in behind the test's back), so a consumer installs the required peers of the other packages it
# lists itself, as their own package.json declares them, at the versions installed beside them in
# this repository.
peers_of() { # <name@version...> -> required peers not already listed, "name@version" per line
  node -e '
    const fs = require("node:fs");
    const path = require("node:path");
    const [repo, ...specs] = process.argv.slice(1);
    const have = new Set(specs.map((s) => s.slice(0, s.lastIndexOf("@"))));
    for (const name of [...have]) {
      const real = fs.realpathSync(path.join(repo, "node_modules", name));
      const store = real.slice(0, real.length - name.length);
      const pkg = JSON.parse(fs.readFileSync(path.join(real, "package.json"), "utf8"));
      for (const peer of Object.keys(pkg.peerDependencies ?? {})) {
        if (pkg.peerDependenciesMeta?.[peer]?.optional || have.has(peer)) continue;
        const v = JSON.parse(fs.readFileSync(path.join(store, peer, "package.json"), "utf8")).version;
        have.add(peer);
        console.log(`${peer}@${v}`);
      }
    }
  ' "$REPO" "$@"
}

deps_for() { # <package...> -> the packages with their required peers, one per line
  local listed
  listed=$(versions_of "$@") || return 2
  printf '%s\n' "$listed"
  # shellcheck disable=SC2086
  peers_of $listed || return 2
}

VITE=$(installed_version vite vitest) || exit 2
out=$(deps_for react react-dom) || exit 2
mapfile -t CORE_DEPS <<<"$out"
out=$(deps_for react react-dom @heroui/react lucide-react) || exit 2
mapfile -t REGISTRE_DEPS <<<"$out"
out=$(deps_for react react-dom ag-grid-community ag-grid-react) || exit 2
mapfile -t GRID_DEPS <<<"$out"
for set in CORE_DEPS REGISTRE_DEPS GRID_DEPS; do
  declare -n deps="$set"
  [ "${#deps[@]}" -gt 0 ] || { echo "FIXTURE could not read the versions of $set"; exit 2; }
  echo "FIXTURE $set: ${deps[*]} vite@$VITE"
  unset -n deps
done

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
    # The consumer under test must really lack these peers; otherwise the build proves nothing.
    local absent=0 p
    for p in ag-grid-community ag-grid-react @heroui/react lucide-react; do
      if [ -e "$dir/node_modules/$p" ]; then
        echo "FIXTURE $p is installed in the root consumer"
        absent=1
      fi
    done
    verdict root-consumer-lacks-optional-peers "$absent"
    [ "$absent" -eq 0 ] || return
  fi
  (cd "$dir" && FIXTURE_ENTRY="$entry" ./node_modules/.bin/vite build) >"$dir/build.log" 2>&1
  rc=$?
  [ "$rc" -eq 0 ] || grep -E '^\[vite\]|^error|Missing "' "$dir/build.log" | head -n 3
  verdict "$leg-build" "$rc"
}

consumer_build root root-entry.js "${CORE_DEPS[@]}" "vite@$VITE"
consumer_build registre registre-entry.js "${REGISTRE_DEPS[@]}" "vite@$VITE"
consumer_build grid grid-entry.js "${GRID_DEPS[@]}" "vite@$VITE"

echo "FIXTURE SUMMARY $passes passed, $fails failed in ${SECONDS}s"
if [ "$failed" -eq 0 ]; then echo "FIXTURE RESULT GREEN"; else echo "FIXTURE RESULT RED"; fi
exit "$failed"

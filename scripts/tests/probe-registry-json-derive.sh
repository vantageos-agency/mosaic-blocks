#!/usr/bin/env bash
# probe-registry-json-derive.sh — bipolar bite-probe for
# scripts/registry-json-derive.mjs (--check) AND for the registry.json
# whole-file guard wired into scripts/release-artifacts-guard.mjs.
#
# Per .claude/rules/derive-never-type.md: a green obtained on fixtures the
# guard's own author chose proves nothing. Both MUST_BLOCK sites below mutate
# REAL material already merged in this repo (a real component, MosaicChatSidebar,
# and a real diff shape a component PR would actually produce) — never a
# synthetic string invented for this probe — and assert the mutation LANDED
# (grep) before reading any verdict. Fail-closed: any setup step failing is a
# loud non-zero exit, never a silent pass.
#
# Usage: bash scripts/tests/probe-registry-json-derive.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

MUST_BLOCK_PASS=0
MUST_BLOCK_TOTAL=0
MUST_PASS_PASS=0
MUST_PASS_TOTAL=0
FAILURES=()

log() { echo "[$1] $2"; }

PRE_PROBE_DIFF="$(git diff --stat -- registry.json)"

restore_registry() {
  git checkout -- registry.json
}
trap restore_registry EXIT

# ---------------------------------------------------------------------------
# MUST_BLOCK 1 — registry-json-derive.mjs --check must go RED, naming the
# component, when a real, currently-exported component's entry is removed
# from registry.json. MosaicChatSidebar is REAL merged production code (not
# a probe fixture) — see src/components/chat-sidebar/MosaicChatSidebar.tsx.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
node -e '
const fs = require("fs");
const r = JSON.parse(fs.readFileSync("registry.json", "utf8"));
const idx = r.items.findIndex((it) => it.name === "mosaic-chat-sidebar");
if (idx === -1) { console.error("probe setup: mosaic-chat-sidebar not found — cannot mutate"); process.exit(1); }
r.items.splice(idx, 1);
fs.writeFileSync("registry.json", JSON.stringify(r, null, 2) + "\n");
'
# Assert the mutation LANDED before reading any verdict.
if grep -q '"mosaic-chat-sidebar"' registry.json; then
  log FAIL "MUST_BLOCK 1: mutation did not land — mosaic-chat-sidebar still present"
  FAILURES+=("MUST_BLOCK 1 setup: mutation did not land")
else
  set +e
  OUT="$(node scripts/registry-json-derive.mjs --check 2>&1)"
  CODE=$?
  set -e
  if [ "$CODE" -ne 0 ] && echo "$OUT" | grep -q "mosaic-chat-sidebar"; then
    log PASS "MUST_BLOCK 1: --check exited $CODE, naming mosaic-chat-sidebar"
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
  else
    log FAIL "MUST_BLOCK 1: expected non-zero exit naming mosaic-chat-sidebar, got exit=$CODE output=$OUT"
    FAILURES+=("MUST_BLOCK 1: guard did not bite")
  fi
fi
restore_registry

# ---------------------------------------------------------------------------
# MUST_BLOCK 2 — release-artifacts-guard.mjs must REFUSE a component PR that
# hand-edits registry.json. Built as a real git diff (not a string match):
# a throwaway branch that adds a real line to registry.json, exactly the
# shape a component-PR author's commit would produce.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
BASE_SHA="$(git rev-parse HEAD)"
PROBE_BRANCH="probe-registry-guard-$$"
git branch -f "$PROBE_BRANCH" HEAD >/dev/null
git -c user.name=probe -c user.email=probe@example.com \
  worktree add -q "/tmp/probe-registry-guard-$$" "$PROBE_BRANCH" >/dev/null
PROBE_WT="/tmp/probe-registry-guard-$$"
(
  cd "$PROBE_WT"
  node -e '
    const fs = require("fs");
    const r = JSON.parse(fs.readFileSync("registry.json", "utf8"));
    r.items.push({ name: "mosaic-hand-typed", type: "registry:ui", title: "HandTyped", description: "x", dependencies: [], files: [{ path: "src/components/hand-typed/HandTyped.tsx", type: "registry:ui" }] });
    fs.writeFileSync("registry.json", JSON.stringify(r, null, 2) + "\n");
  '
  grep -q '"mosaic-hand-typed"' registry.json
  git add registry.json
  git -c user.name=probe -c user.email=probe@example.com commit -q -m "test: simulate a component PR hand-editing registry.json"
)
set +e
GUARD_OUT="$(cd "$PROBE_WT" && RELEASE_ARTIFACTS_BASE_REF="$BASE_SHA" node scripts/release-artifacts-guard.mjs 2>&1)"
GUARD_CODE=$?
set -e
git worktree remove -f "$PROBE_WT" >/dev/null
git branch -D "$PROBE_BRANCH" >/dev/null

if [ "$GUARD_CODE" -ne 0 ] && echo "$GUARD_OUT" | grep -q "registry.json"; then
  log PASS "MUST_BLOCK 2: release-artifacts-guard refused the registry.json hand-edit"
  MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
else
  log FAIL "MUST_BLOCK 2: expected guard to refuse, got exit=$GUARD_CODE output=$GUARD_OUT"
  FAILURES+=("MUST_BLOCK 2: release-artifacts-guard did not bite on registry.json")
fi

# ---------------------------------------------------------------------------
# MUST_PASS — a freshly derived registry.json must --check clean, with ZERO
# false positives.
# ---------------------------------------------------------------------------
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
node scripts/registry-json-derive.mjs >/dev/null
set +e
CHECK_OUT="$(node scripts/registry-json-derive.mjs --check 2>&1)"
CHECK_CODE=$?
set -e
if [ "$CHECK_CODE" -eq 0 ]; then
  log PASS "MUST_PASS: freshly derived registry.json --check is clean"
  MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
else
  log FAIL "MUST_PASS: freshly derived registry.json --check FAILED (false positive): $CHECK_OUT"
  FAILURES+=("MUST_PASS: false positive on freshly derived registry.json")
fi

# ---------------------------------------------------------------------------
# Restoration proof
# ---------------------------------------------------------------------------
POST_PROBE_DIFF="$(git diff --stat -- registry.json)"
if [ "$PRE_PROBE_DIFF" != "$POST_PROBE_DIFF" ]; then
  # Two very different faults land here, and naming the wrong one costs hours:
  # either the probe failed to put registry.json back, or the COMMITTED
  # registry.json was never the output of its own deriver, so re-deriving it
  # legitimately changes the tree. Ask the committed file which one it is
  # instead of guessing — the first message this probe ever printed blamed
  # restoration for a drift, and sent two people chasing a rebase that could
  # not have helped.
  if git stash list >/dev/null 2>&1 && ! git diff --quiet -- registry.json; then
    log FAIL "registry.json COMMITTED on this tree is NOT the output of its own deriver — it drifted. Re-running scripts/registry-json-derive.mjs changes it. Fix: run the deriver and commit the result. (This is NOT a restoration failure.)"
    FAILURES+=("drift: committed registry.json != deriver output")
  else
    log FAIL "restoration: registry.json diff changed across the probe run"
    FAILURES+=("restoration: registry.json not restored")
  fi
fi

echo "---"
echo "MUST_BLOCK: ${MUST_BLOCK_PASS}/${MUST_BLOCK_TOTAL}"
echo "MUST_PASS:  ${MUST_PASS_PASS}/${MUST_PASS_TOTAL}"

if [ "${#FAILURES[@]}" -gt 0 ]; then
  echo "probe-registry-json-derive: FAILED"
  for f in "${FAILURES[@]}"; do echo "  - $f"; done
  exit 1
fi

echo "probe-registry-json-derive: all probes passed."

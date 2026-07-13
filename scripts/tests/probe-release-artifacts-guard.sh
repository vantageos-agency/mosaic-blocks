#!/usr/bin/env bash
# probe-release-artifacts-guard.sh — bipolar bite-probe for
# scripts/release-artifacts-guard.mjs, run on REAL historical material the
# guard's author did not choose (the guard was written after these commits
# already existed on main).
#
# Per .claude/rules/derive-never-type.md: a sonde bipolaire alone does not
# prove a matcher bites — only mutation on FOREIGN material, with an
# assertion that the mutation actually LANDED before reading the verdict,
# proves it. This probe:
#   1. Clones the real repo history into a scratch worktree (untouched by
#      this branch's own commits).
#   2. For each MUST_BLOCK site, cherry-picks the EXACT hunk from the real
#      historical commit (2016375 / 00ea886 / 13b7e14 / bc79eda — the four
#      component PRs of the train) onto an ancestor base, asserts via grep
#      that the mutated line landed, then runs the guard and asserts it
#      exits non-zero AND names the right file.
#   3. For each MUST_PASS site, builds a legitimate diff (either untouched
#      release artifacts, or a release PR carrying the escape-hatch marker)
#      and asserts the guard exits zero.
#   4. Restores every intermediate branch/clone; leaves the invoking
#      worktree's `git diff` empty.
#
# Usage: bash scripts/tests/probe-release-artifacts-guard.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOURCE_REPO="/root/coding/mosaic-blocks"
SCRATCH="$(mktemp -d)"
CLONE="$SCRATCH/clone"
trap 'rm -rf "$SCRATCH"' EXIT

MUST_BLOCK_PASS=0
MUST_BLOCK_TOTAL=0
MUST_PASS_PASS=0
MUST_PASS_TOTAL=0
FAILURES=()

log() { echo "[$1] $2"; }

# ---------------------------------------------------------------------------
# 0. Clone the REAL repo (full history) into a scratch dir, install the guard
#    + its shared dependency (this branch's own new files — the only thing
#    that is legitimately "ours" in this probe) into that clone's scripts/.
# ---------------------------------------------------------------------------
# Snapshot the invoking worktree's OWN state before touching anything — the
# restoration proof at the end compares against THIS snapshot, not against
# an assumed-clean tree (this worktree legitimately carries its own
# in-progress, not-yet-committed edits that are none of this probe's business).
PRE_PROBE_DIFF="$(cd "$REPO_ROOT" && git diff --stat)"

git clone --quiet "$SOURCE_REPO" "$CLONE"
cp "$REPO_ROOT/scripts/release-artifacts-guard.mjs" "$CLONE/scripts/release-artifacts-guard.mjs"
# docs-counts-shared.mjs already exists identically in $CLONE (it predates
# this branch) — do NOT overwrite it, that would defeat "foreign material".

run_guard() {
  local base_ref="$1"
  # Re-install the guard script every time: it is NEVER part of any probe
  # commit (it is our own tool, not the "foreign material" under test) and a
  # `git checkout` between cases can otherwise remove it from the worktree.
  cp "$REPO_ROOT/scripts/release-artifacts-guard.mjs" "$CLONE/scripts/release-artifacts-guard.mjs"
  (cd "$CLONE" && RELEASE_ARTIFACTS_BASE_REF="$base_ref" node scripts/release-artifacts-guard.mjs)
}

# ---------------------------------------------------------------------------
# MUST_BLOCK — replay the real version/count line from 4 real historical
# commits, each on a fresh branch off that commit's OWN parent, so the "PR
# diff" is byte-for-byte the real hunk from the real train.
# ---------------------------------------------------------------------------
# format: commit sha : file : grep-anchor-that-must-land
BLOCK_CASES=(
  "2016375:README.md:It provides 135 opinionated"
  "00ea886:package.json:0.5.16-alpha"
  "13b7e14:docs/components-catalog.md:**137** \`Mosaic*\` components and **170** total"
  "bc79eda:src/version.ts:0.5.18-alpha"
)

for case in "${BLOCK_CASES[@]}"; do
  IFS=':' read -r sha file anchor <<< "$case"
  MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
  parent="$(cd "$CLONE" && git rev-parse "${sha}^")"
  branch="probe-block-${sha}"
  (cd "$CLONE" && git checkout --quiet -b "$branch" "$parent")
  # Apply ONLY this file's hunk from the real historical commit — this is
  # foreign material: the exact bytes a real component PR shipped.
  (cd "$CLONE" && git diff "${parent}" "${sha}" -- "$file" | git apply -)

  # Assert the mutation LANDED before trusting any verdict.
  if ! grep -qF -- "$anchor" "$CLONE/$file"; then
    FAILURES+=("MUST_BLOCK $sha:$file — mutation did NOT land (anchor \"$anchor\" absent) — probe invalid")
  else
    (cd "$CLONE" && git add -- "$file" && git commit --quiet -m "probe: replay $sha's $file hunk")
    set +e
    output="$(run_guard "$parent" 2>&1)"
    status=$?
    set -e
    if [ "$status" -ne 0 ] && echo "$output" | grep -qF "$file"; then
      MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
      log MUST_BLOCK "PASS — $sha:$file — guard exited $status, named $file"
    else
      FAILURES+=("MUST_BLOCK $sha:$file — guard exited $status (expected non-zero) or did not name $file — output: $output")
      log MUST_BLOCK "FAIL — $sha:$file — exit=$status output=$output"
    fi
  fi

  (cd "$CLONE" && git checkout --quiet "$parent" && git branch -D --quiet "$branch")
done

# ---------------------------------------------------------------------------
# MUST_PASS #1 — a legitimate component PR that touches NEITHER version NOR
# a count line (add a harmless new file only).
# ---------------------------------------------------------------------------
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
base="$(cd "$CLONE" && git rev-parse main)"
(cd "$CLONE" && git checkout --quiet -b probe-pass-clean "$base")
echo "// probe: harmless new file, no release artifact touched" > "$CLONE/src/probe-harmless.ts"
(cd "$CLONE" && git add -- src/probe-harmless.ts && git commit --quiet -m "feat(probe): harmless component-only change")
if ! grep -qF "probe: harmless" "$CLONE/src/probe-harmless.ts"; then
  FAILURES+=("MUST_PASS clean-diff — mutation did NOT land — probe invalid")
else
  set +e
  output="$(run_guard "$base" 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
    log MUST_PASS "PASS — clean component diff — guard exited 0"
  else
    FAILURES+=("MUST_PASS clean-diff — guard exited $status (expected 0) — output: $output")
    log MUST_PASS "FAIL — clean component diff — exit=$status output=$output"
  fi
fi
(cd "$CLONE" && git checkout --quiet "$base" && git branch -D --quiet probe-pass-clean)

# ---------------------------------------------------------------------------
# MUST_PASS #2 — a genuine release PR: touches version, BUT carries the
# written escape-hatch marker on HEAD's commit message.
# ---------------------------------------------------------------------------
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
(cd "$CLONE" && git checkout --quiet -b probe-pass-release "$base")
sed -i 's/"version": "[^"]*"/"version": "9.9.9-alpha"/' "$CLONE/package.json"
(cd "$CLONE" && git add -- package.json && git commit --quiet -m "$(printf 'chore(release): bump to 9.9.9-alpha\n\n// allow-release-artifacts: probe MUST_PASS release marker case')")
if ! grep -qF '9.9.9-alpha' "$CLONE/package.json"; then
  FAILURES+=("MUST_PASS release-marker — mutation did NOT land — probe invalid")
else
  set +e
  output="$(run_guard "$base" 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ] && echo "$output" | grep -qF "SKIPPED"; then
    MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
    log MUST_PASS "PASS — release PR with allow-release-artifacts marker — guard exited 0 (SKIPPED)"
  else
    FAILURES+=("MUST_PASS release-marker — guard exited $status or did not report SKIPPED — output: $output")
    log MUST_PASS "FAIL — release-marker case — exit=$status output=$output"
  fi
fi
(cd "$CLONE" && git checkout --quiet "$base" && git branch -D --quiet probe-pass-release)

# ---------------------------------------------------------------------------
# MUST_BLOCK #5 — the marker MENTIONED IN PROSE must NOT disable the guard.
#
# Not hypothetical: the very commit that introduced this guard *explains* the
# escape hatch, therefore quotes the marker mid-sentence — and the first,
# unanchored regex read that explanation as a declaration and waved through a
# version regression (0.5.18-alpha -> 0.0.2-alpha) in the guard's own PR.
#
# A prose mention is not a declaration. The marker only counts at the start of
# its own line. Without this case, a guard that scans free prose passes every
# probe and protects nothing.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
(cd "$CLONE" && git checkout --quiet -b probe-block-prose "$base")
sed -i 's/"version": "[^"]*"/"version": "9.9.9-alpha"/' "$CLONE/package.json"
(cd "$CLONE" && git add -- package.json && git commit --quiet -m "$(printf 'feat(x): a component PR whose message merely DESCRIBES the escape hatch\n\nThe escape hatch is a written // allow-release-artifacts: <reason> line in the\nHEAD commit — quoting it here, in prose, must not disable anything.')")
if ! grep -qF '9.9.9-alpha' "$CLONE/package.json"; then
  FAILURES+=("MUST_BLOCK prose-marker — mutation did NOT land — probe invalid")
else
  set +e
  output="$(run_guard "$base" 2>&1)"
  status=$?
  set -e
  if [ "$status" -ne 0 ] && echo "$output" | grep -qF "package.json"; then
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
    log MUST_BLOCK "PASS — marker quoted in PROSE does not disable the guard — still blocked"
  else
    FAILURES+=("MUST_BLOCK prose-marker — guard exited $status (expected non-zero) — output: $output")
    log MUST_BLOCK "FAIL — prose-quoted marker DISABLED the guard — exit=$status output=$output"
  fi
fi
(cd "$CLONE" && git checkout --quiet "$base" && git branch -D --quiet probe-block-prose)

# ---------------------------------------------------------------------------
# Restoration proof — the INVOKING worktree (not the scratch clone) must be
# untouched by this probe.
# ---------------------------------------------------------------------------
cd "$REPO_ROOT"
POST_PROBE_DIFF="$(git diff --stat)"

echo ""
echo "==================== PROBE SUMMARY ===================="
echo "MUST_BLOCK: $MUST_BLOCK_PASS/$MUST_BLOCK_TOTAL"
echo "MUST_PASS:  $MUST_PASS_PASS/$MUST_PASS_TOTAL"
echo "Restoration ($REPO_ROOT diff before vs after probe, must be IDENTICAL — all probe work happened in the scratch clone, never here):"
if [ "$PRE_PROBE_DIFF" != "$POST_PROBE_DIFF" ]; then
  echo "BEFORE:"
  echo "$PRE_PROBE_DIFF"
  echo "AFTER:"
  echo "$POST_PROBE_DIFF"
  FAILURES+=("Restoration check — $REPO_ROOT's diff changed during probe run (before != after)")
else
  echo "unchanged (pre-existing diff, if any, preserved byte-for-byte)."
fi

if [ "${#FAILURES[@]}" -gt 0 ]; then
  echo ""
  echo "FAILURES (${#FAILURES[@]}):"
  for f in "${FAILURES[@]}"; do echo "  - $f"; done
  exit 1
fi

echo ""
echo "ALL BIPOLAR CASES PASSED — false positives: 0"

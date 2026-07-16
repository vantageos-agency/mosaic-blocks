#!/usr/bin/env bash
# probe-pr-title-matches-diff.sh — bipolar bite-probe for
# scripts/pr-title-matches-diff-guard.mjs, run on REAL historical material
# the guard's author did not choose.
#
# CENSUS — derived, not enumerated (per .claude/rules/guard-formulation-census.md).
# Produced by running, against this repo's own history:
#
#   git log --format=%s -300
#
# and classifying every subject line by shape. Seven distinct forms exist in
# real history; every one is exercised below with a MUST_BLOCK or MUST_PASS
# case built from a REAL commit's REAL diff, never synthetic text:
#
#   1. conventional-commit scope + Mosaic<Name> token, title MATCHES diff
#      -> MUST_PASS  (52cdb32 "feat(memory): MosaicMemoryGrid + MosaicMemoryList")
#   2. Mosaic<Name> token names the WRONG component (title does NOT match
#      diff) -> MUST_BLOCK (the three real incident commits: 2d49c9d /
#      183c6df / ee4877d — MANDATORY, not chosen by this probe's author)
#   3. conventional-commit scope, NO Mosaic token, title MATCHES diff via the
#      scope->PascalCase mapping alone -> MUST_PASS (dd69dca
#      "test(alert-dialog): ...")
#   4. free-form prose (no conventional-commit prefix) WITH a Mosaic<Name>
#      token, title MATCHES diff -> MUST_PASS (a307e19 "PR #11 T4 RESCOPED —
#      MosaicFeature3Col + motion-LogoCloud")
#   5. title carries ZERO literal Mosaic<Name> token (no token, no scope, OR
#      a scope that fails to corroborate), diff touches MANY real components
#      -> MUST_PASS: an empty claim is NOT promoted into a fabricated one
#      (DEFECT-1 FIX). This repo's own f8e4d41 "PR #10 forwardRef→React-19
#      ref-as-prop root-fix" (22 real .tsx files, zero claim in the title) is
#      one of the 14 real false positives this fix closes, measured over 120
#      real commits of main.
#   5b. a literal Mosaic<Name> token names the WRONG component AND the scope
#       does not corroborate the real one -> MUST_BLOCK (the empty-ACTUAL
#       intersection never matches; built on 2d49c9d's own real diff).
#   6. diff touches ZERO src/components/ files, release-bot commit
#      -> MUST_PASS (074de96 "chore(release): derive version ...")
#   7. diff touches ZERO src/components/ files, CI-only commit
#      -> MUST_PASS (e354887 "fix(ci): read the test count from JSON ...")
#   9. a literal Mosaic<Name> token names the WRONG component, but the
#      conventional-commit SCOPE corroborates the real one -> MUST_PASS: the
#      scope is read only as corroboration of an EXISTING claim, never as a
#      claim of its own (built on 2d49c9d's own real diff).
#
#   8. (MUST_BLOCK) escape-hatch marker MENTIONED IN PROSE must not disable
#      the guard — same anchoring defect this repo already fixed twice
#      elsewhere; without this case a guard that scans free prose passes
#      every probe and protects nothing.
#
# DEFECT 2 (PR path reads a synthetic subject nobody wrote) is covered
# separately, below the push-to-main sweep, by constructing a real
# `git merge --no-ff` synthetic-merge fixture (the exact shape
# `refs/pull/N/merge` takes) and proving both (a) the defect reproduces
# without the PR_TITLE_GUARD_SUBJECT/HEAD_REF override, and (b) the override
# fixes it while still blocking a genuinely lying PR title.
#
# Per .claude/rules/derive-never-type.md: a bipolar probe alone does not
# prove a matcher bites — only mutation on FOREIGN material, with an
# assertion that the mutation actually LANDED before reading the verdict,
# proves it. Every MUST_BLOCK case below cherry-picks the EXACT commit from
# real history to a scratch clone; every MUST_PASS case replays a real commit
# or a declared, marker-carrying variant of one.
#
# Usage: bash scripts/tests/probe-pr-title-matches-diff.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# DERIVED, never typed (see probe-release-artifacts-guard.sh's own comment on
# why an absolute path here is a hand-typed value in disguise, and dies on
# any runner but the one it was written on).
SOURCE_REPO="$(git -C "$REPO_ROOT" rev-parse --path-format=absolute --git-common-dir)"
if [ ! -d "$SOURCE_REPO" ]; then
  echo "probe: cannot resolve a clonable git repository from $REPO_ROOT (got '$SOURCE_REPO')." >&2
  echo "probe: refusing to run — a probe that cannot clone its own material proves NOTHING," >&2
  echo "probe: and a setup failure must never be read as a pass." >&2
  exit 1
fi
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
# 0. Clone the REAL repo (full history) into a scratch dir; install the guard
#    under test (this branch's own new file — the only thing legitimately
#    "ours" here) into that clone's scripts/.
# ---------------------------------------------------------------------------
PRE_PROBE_DIFF="$(cd "$REPO_ROOT" && git diff --stat)"

git clone --quiet "$SOURCE_REPO" "$CLONE"
git -C "$CLONE" fetch --quiet "$SOURCE_REPO" '+refs/heads/*:refs/heads/*' '+refs/remotes/origin/*:refs/remotes/origin/*' 2>/dev/null || true

git -C "$CLONE" config user.name "mosaic-blocks probe"
git -C "$CLONE" config user.email "probe@vantageos.invalid"
mkdir -p "$CLONE/scripts"
cp "$REPO_ROOT/scripts/pr-title-matches-diff-guard.mjs" "$CLONE/scripts/pr-title-matches-diff-guard.mjs"

run_guard() {
  local base_ref="$1"
  cp "$REPO_ROOT/scripts/pr-title-matches-diff-guard.mjs" "$CLONE/scripts/pr-title-matches-diff-guard.mjs"
  (cd "$CLONE" && env -u GITHUB_EVENT_NAME -u GITHUB_BASE_REF -u GITHUB_HEAD_REF -u GITHUB_REF_NAME PR_TITLE_GUARD_BASE_REF="$base_ref" node scripts/pr-title-matches-diff-guard.mjs)
}

# Resolve a base commit ONCE for cases that need "any valid ancestor to diff
# against" (the escape-hatch and empty-claim cases build a fresh commit ON
# TOP of a real base, rather than replaying a historical commit verbatim).
BASE=""
for candidate in main origin/main; do
  if (cd "$CLONE" && git rev-parse --verify --quiet "$candidate" >/dev/null); then
    BASE="$(cd "$CLONE" && git rev-parse "$candidate")"
    break
  fi
done
if [ -z "$BASE" ]; then
  echo "probe: no base commit resolvable (tried: main, origin/main) in the clone." >&2
  echo "probe: refusing to run — a probe with no base has nothing to diff against." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Helper — replay a REAL historical commit verbatim (full diff, not a single
# file's hunk — this guard reads the whole changed-file list) onto a fresh
# branch off that commit's own parent, assert the mutation landed, run the
# guard, then restore.
# ---------------------------------------------------------------------------
replay_commit() {
  local sha="$1" landing_file="$2" landing_anchor="$3"
  local parent branch
  parent="$(cd "$CLONE" && git rev-parse "${sha}^")"
  branch="probe-${sha}"
  (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet -b "$branch" "$parent")
  (cd "$CLONE" && git diff "${parent}" "${sha}" | git apply -)
  if ! grep -qF -- "$landing_anchor" "$CLONE/$landing_file"; then
    FAILURES+=("$sha — mutation did NOT land in $landing_file (anchor \"$landing_anchor\" absent) — probe invalid")
    (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet "$parent" && git branch -D --quiet "$branch")
    return 1
  fi
  (cd "$CLONE" && git add -A && git commit --quiet -m "$(git -C "$REPO_ROOT" log -1 --pretty=%B "$sha")")
  echo "$parent"
}

cleanup_branch() {
  local branch="$1" ref="$2"
  (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet "$ref" && git branch -D --quiet "$branch" 2>/dev/null || true)
}

# ===========================================================================
# MUST_BLOCK — form 2: the three real incident commits (MANDATORY material).
# ===========================================================================
BLOCK_TITLE_MISMATCH_CASES=(
  "2d49c9d2caa8b77aecccac6af21282234cfa5962:src/components/add-memory-form/MosaicAddMemoryForm.tsx:MosaicAddMemoryForm"
  "183c6dfe19bd398851fa4b5b9efd195d72e6da0d:src/components/edit-memory-dialog/MosaicEditMemoryDialog.tsx:MosaicEditMemoryDialog"
  "ee4877da9fe7ffc3c7f3a2344f74ecd321008b1c:src/components/memory-dashboard/MosaicMemoryDashboard.tsx:MosaicMemoryDashboard"
)
for case in "${BLOCK_TITLE_MISMATCH_CASES[@]}"; do
  IFS=':' read -r sha file anchor <<< "$case"
  MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
  parent="$(replay_commit "$sha" "$file" "$anchor" || true)"
  branch="probe-${sha}"
  if [ -z "$parent" ]; then
    log MUST_BLOCK "FAIL — $sha — replay setup failed"
    continue
  fi
  set +e
  output="$(run_guard "$parent" 2>&1)"
  status=$?
  set -e
  if [ "$status" -ne 0 ] && echo "$output" | grep -qF "BLOCKED"; then
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
    log MUST_BLOCK "PASS — $sha (real incident) — guard exited $status, BLOCKED"
  else
    FAILURES+=("MUST_BLOCK $sha (real incident) — guard exited $status (expected non-zero+BLOCKED) — output: $output")
    log MUST_BLOCK "FAIL — $sha — exit=$status output=$output"
  fi
  cleanup_branch "$branch" "$parent"
done

# ===========================================================================
# MUST_PASS — form 1: the true-titled sibling commit of the same train.
# ===========================================================================
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
sha="52cdb32a5a16b2db4651fd4b1f9adbc283b5af92"
parent="$(replay_commit "$sha" "src/components/memory-grid/MosaicMemoryGrid.tsx" "MosaicMemoryGrid" || true)"
branch="probe-${sha}"
if [ -z "$parent" ]; then
  log MUST_PASS "FAIL — $sha — replay setup failed"
else
  set +e
  output="$(run_guard "$parent" 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ] && echo "$output" | grep -qF "OK"; then
    MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
    log MUST_PASS "PASS — $sha (true title, same train) — guard exited 0"
  else
    FAILURES+=("MUST_PASS $sha (true title) — guard exited $status (expected 0) — output: $output")
    log MUST_PASS "FAIL — $sha — exit=$status output=$output"
  fi
  cleanup_branch "$branch" "$parent"
fi

# ===========================================================================
# MUST_PASS — form 3: conventional-commit scope, NO Mosaic token, matches via
# scope->PascalCase mapping alone (component-scoped test-only commit).
# ===========================================================================
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
sha="dd69dcaf8b91716f1b41ebbda66a837172487630"
parent="$(replay_commit "$sha" "src/components/alert-dialog/MosaicAlertDialog.test.tsx" "" || true)"
branch="probe-${sha}"
if [ -z "$parent" ]; then
  # test file's content anchor is irrelevant here — the guard only reads the
  # CHANGED FILE LIST + commit subject, not file content, for this case.
  # Re-attempt with a path-existence anchor instead.
  parent="$(cd "$CLONE" && git rev-parse "${sha}^" 2>/dev/null || true)"
fi
if [ -z "$parent" ]; then
  FAILURES+=("MUST_PASS $sha (scope-only match) — could not resolve parent — probe invalid")
  log MUST_PASS "FAIL — $sha — could not resolve parent"
else
  branch="probe-scope-${sha}"
  (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet -b "$branch" "$parent")
  (cd "$CLONE" && git diff "${parent}" "${sha}" | git apply -)
  if ! (cd "$CLONE" && git status --porcelain -uall | grep -qF "alert-dialog/MosaicAlertDialog.test.tsx"); then
    FAILURES+=("MUST_PASS $sha — mutation did NOT land (alert-dialog test file not in working tree change) — probe invalid")
    log MUST_PASS "FAIL — $sha — mutation did not land"
  else
    (cd "$CLONE" && git add -A && git commit --quiet -m "$(git -C "$REPO_ROOT" log -1 --pretty=%B "$sha")")
    set +e
    output="$(run_guard "$parent" 2>&1)"
    status=$?
    set -e
    if [ "$status" -eq 0 ] && echo "$output" | grep -qF "OK"; then
      MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
      log MUST_PASS "PASS — $sha (scope-only match, no Mosaic token) — guard exited 0"
    else
      FAILURES+=("MUST_PASS $sha (scope-only match) — guard exited $status (expected 0) — output: $output")
      log MUST_PASS "FAIL — $sha — exit=$status output=$output"
    fi
  fi
  cleanup_branch "$branch" "$parent"
fi

# ===========================================================================
# MUST_PASS — form 4: free-form prose (no conventional-commit prefix) WITH a
# Mosaic token, title matches diff.
# ===========================================================================
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
sha="a307e1932290b80158b4d46f2b8b299f1bcc8418"
parent="$(replay_commit "$sha" "src/components/feature-3col/MosaicFeature3Col.tsx" "MosaicFeature3Col" || true)"
branch="probe-${sha}"
if [ -z "$parent" ]; then
  log MUST_PASS "FAIL — $sha — replay setup failed"
else
  set +e
  output="$(run_guard "$parent" 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ] && echo "$output" | grep -qF "OK"; then
    MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
    log MUST_PASS "PASS — $sha (free-form prose + Mosaic token, matches) — guard exited 0"
  else
    FAILURES+=("MUST_PASS $sha (free-form prose) — guard exited $status (expected 0) — output: $output")
    log MUST_PASS "FAIL — $sha — exit=$status output=$output"
  fi
  cleanup_branch "$branch" "$parent"
fi

# ===========================================================================
# MUST_PASS — form 5: title names NOTHING at all (no literal Mosaic<Name>
# token, no conventional-commit scope), diff touches MANY real components
# (real mass-refactor commit). Per the DEFECT-1 fix, an empty literal claim
# is NOT promoted into a fabricated one — the author claimed nothing, so
# there is nothing to verify, and this MUST PASS. (Prior to the fix this was
# the exact shape of 14 real false positives measured over 120 commits —
# THIS repo's own commit f8e4d415 is one of them: "PR #10 forwardRef→
# React-19 ref-as-prop root-fix" on a diff touching 22 real .tsx files, none
# of which the title claims to be about, and the diff itself is healthy.)
# ===========================================================================
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
sha="f8e4d415a7fb1b768126ea81b24e909cbc7a0486"
parent="$(cd "$CLONE" && git rev-parse --verify --quiet "${sha}^" 2>/dev/null || true)"
if [ -z "$parent" ]; then
  FAILURES+=("MUST_PASS $sha (empty claim, mass refactor) — could not resolve parent — probe invalid")
  log MUST_PASS "FAIL — $sha — could not resolve parent"
else
  branch="probe-noclaim-${sha}"
  (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet -b "$branch" "$parent")
  (cd "$CLONE" && git diff "${parent}" "${sha}" | git apply -)
  if ! (cd "$CLONE" && git status --porcelain -uall | grep -qF "avatar/MosaicAvatar.tsx"); then
    FAILURES+=("MUST_PASS $sha (empty claim, mass refactor) — mutation did NOT land — probe invalid")
    log MUST_PASS "FAIL — $sha — mutation did not land"
  else
    (cd "$CLONE" && git add -A && git commit --quiet -m "$(git -C "$REPO_ROOT" log -1 --pretty=%B "$sha")")
    set +e
    output="$(run_guard "$parent" 2>&1)"
    status=$?
    set -e
    if [ "$status" -eq 0 ] && echo "$output" | grep -qF "no component claim to verify"; then
      MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
      log MUST_PASS "PASS — $sha (empty claim, real mass refactor) — guard exited 0, no fabricated claim"
    else
      FAILURES+=("MUST_PASS $sha (empty claim, mass refactor) — guard exited $status (expected 0, 'no component claim to verify') — output: $output")
      log MUST_PASS "FAIL — $sha — exit=$status output=$output"
    fi
  fi
  cleanup_branch "$branch" "$parent"
fi

# ===========================================================================
# MUST_BLOCK — form 5b: title carries a literal Mosaic<Name> token that
# matches NOTHING the diff touches, AND its conventional-commit scope also
# fails to corroborate — the mandatory "empty ACTUAL never matches" case.
# Built from the same real 2d49c9d incident material (title/diff pairing is
# what actually happened; this is the sweep-verified BLOCK, not synthetic).
# ===========================================================================
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
sha="2d49c9d2caa8b77aecccac6af21282234cfa5962"
parent="$(cd "$CLONE" && git rev-parse --verify --quiet "${sha}^" 2>/dev/null || true)"
if [ -z "$parent" ]; then
  FAILURES+=("MUST_BLOCK $sha (literal token, wrong component) — could not resolve parent — probe invalid")
  log MUST_BLOCK "FAIL — $sha — could not resolve parent"
else
  branch="probe-wrongtoken-${sha}"
  (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet -b "$branch" "$parent")
  (cd "$CLONE" && git diff "${parent}" "${sha}" | git apply -)
  if ! (cd "$CLONE" && git status --porcelain -uall | grep -qF "add-memory-form/MosaicAddMemoryForm.tsx"); then
    FAILURES+=("MUST_BLOCK $sha (literal token, wrong component) — mutation did NOT land — probe invalid")
    log MUST_BLOCK "FAIL — $sha — mutation did not land"
  else
    (cd "$CLONE" && git add -A && git commit --quiet -m "$(git -C "$REPO_ROOT" log -1 --pretty=%B "$sha")")
    set +e
    output="$(run_guard "$parent" 2>&1)"
    status=$?
    set -e
    if [ "$status" -ne 0 ] && echo "$output" | grep -qF "BLOCKED"; then
      MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
      log MUST_BLOCK "PASS — $sha (literal token names wrong component, real incident) — exited $status"
    else
      FAILURES+=("MUST_BLOCK $sha (literal token, wrong component) — guard exited $status (expected non-zero+BLOCKED) — output: $output")
      log MUST_BLOCK "FAIL — $sha — exit=$status output=$output"
    fi
  fi
  cleanup_branch "$branch" "$parent"
fi

# ===========================================================================
# MUST_PASS — form 6: diff touches ZERO src/components/ files (release-bot).
# ===========================================================================
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
sha="074de96c14f515024f002f75bbc3020e5ba32b72"
parent="$(replay_commit "$sha" "src/version.ts" "" || true)"
if [ -z "$parent" ]; then
  parent="$(cd "$CLONE" && git rev-parse "${sha}^" 2>/dev/null || true)"
  if [ -n "$parent" ]; then
    branch="probe-release-${sha}"
    (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet -b "$branch" "$parent")
    (cd "$CLONE" && git diff "${parent}" "${sha}" | git apply -)
    if ! (cd "$CLONE" && git status --porcelain | grep -qF "src/version.ts"); then
      FAILURES+=("MUST_PASS $sha (release, zero-component diff) — mutation did NOT land — probe invalid")
      parent=""
    else
      (cd "$CLONE" && git add -A && git commit --quiet -m "$(git -C "$REPO_ROOT" log -1 --pretty=%B "$sha")")
    fi
  fi
fi
branch="probe-release-${sha}"
if [ -z "$parent" ]; then
  log MUST_PASS "FAIL — $sha — replay setup failed"
else
  set +e
  output="$(run_guard "$parent" 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ] && echo "$output" | grep -qF "no component claim to verify"; then
    MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
    log MUST_PASS "PASS — $sha (release-bot, zero-component diff) — guard exited 0, exempted"
  else
    FAILURES+=("MUST_PASS $sha (release-bot) — guard exited $status (expected 0, exempted) — output: $output")
    log MUST_PASS "FAIL — $sha — exit=$status output=$output"
  fi
  cleanup_branch "$branch" "$parent"
fi

# ===========================================================================
# MUST_PASS — form 7: diff touches ZERO src/components/ files (CI-only fix).
# ===========================================================================
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
sha="e35488703d5c87fcfa25956b29c8fd63fca7e6f1"
parent="$(cd "$CLONE" && git rev-parse "${sha}^" 2>/dev/null || true)"
if [ -z "$parent" ]; then
  FAILURES+=("MUST_PASS $sha (CI-only, zero-component diff) — could not resolve parent — probe invalid")
  log MUST_PASS "FAIL — $sha — could not resolve parent"
else
  branch="probe-ci-${sha}"
  (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet -b "$branch" "$parent")
  (cd "$CLONE" && git diff "${parent}" "${sha}" | git apply -)
  if ! (cd "$CLONE" && git status --porcelain -uall | grep -qF ".github/workflows/ci.yml"); then
    FAILURES+=("MUST_PASS $sha (CI-only) — mutation did NOT land — probe invalid")
    log MUST_PASS "FAIL — $sha — mutation did not land"
  else
    (cd "$CLONE" && git add -A && git commit --quiet -m "$(git -C "$REPO_ROOT" log -1 --pretty=%B "$sha")")
    set +e
    output="$(run_guard "$parent" 2>&1)"
    status=$?
    set -e
    if [ "$status" -eq 0 ] && echo "$output" | grep -qF "no component claim to verify"; then
      MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
      log MUST_PASS "PASS — $sha (CI-only, zero-component diff) — guard exited 0, exempted"
    else
      FAILURES+=("MUST_PASS $sha (CI-only) — guard exited $status (expected 0, exempted) — output: $output")
      log MUST_PASS "FAIL — $sha — exit=$status output=$output"
    fi
  fi
  cleanup_branch "$branch" "$parent"
fi

# ===========================================================================
# MUST_BLOCK — form 8: escape-hatch marker MENTIONED IN PROSE must NOT
# disable the guard (same anchoring defect this repo has fixed twice before —
# without this case a prose-scanning guard passes every probe here too).
# Built on top of the real mismatch material (2d49c9d's own diff), because a
# marker only means anything on a commit that would otherwise be blocked.
# ===========================================================================
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
sha="2d49c9d2caa8b77aecccac6af21282234cfa5962"
parent="$(cd "$CLONE" && git rev-parse "${sha}^" 2>/dev/null || true)"
if [ -z "$parent" ]; then
  FAILURES+=("MUST_BLOCK prose-marker — could not resolve parent — probe invalid")
  log MUST_BLOCK "FAIL — prose-marker — could not resolve parent"
else
  branch="probe-prose-marker-${sha}"
  (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet -b "$branch" "$parent")
  (cd "$CLONE" && git diff "${parent}" "${sha}" | git apply -)
  if ! (cd "$CLONE" && git status --porcelain -uall | grep -qF "add-memory-form/MosaicAddMemoryForm.tsx"); then
    FAILURES+=("MUST_BLOCK prose-marker — mutation did NOT land — probe invalid")
    log MUST_BLOCK "FAIL — prose-marker — mutation did not land"
  else
    (cd "$CLONE" && git add -A && git commit --quiet -m "$(printf 'feat(thread-view): MosaicThreadView (#92)\n\nThe escape hatch here would be a written // allow-title-diff-mismatch: <reason> line — merely explaining that in prose must not disable anything.')")
    set +e
    output="$(run_guard "$parent" 2>&1)"
    status=$?
    set -e
    if [ "$status" -ne 0 ] && echo "$output" | grep -qF "BLOCKED"; then
      MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
      log MUST_BLOCK "PASS — marker quoted in PROSE does not disable the guard — still blocked"
    else
      FAILURES+=("MUST_BLOCK prose-marker — guard exited $status (expected non-zero) — output: $output")
      log MUST_BLOCK "FAIL — prose-marker DISABLED the guard — exit=$status output=$output"
    fi
  fi
  cleanup_branch "$branch" "$parent"
fi

# ===========================================================================
# MUST_PASS — form 9: literal Mosaic<Name> token names the WRONG component,
# but the conventional-commit SCOPE corroborates the real one — the scope is
# read only as corroboration of an existing claim, never as its own claim,
# but when it genuinely agrees with the diff it is honored. Built on
# 2d49c9d's own real diff (add-memory-form), with a scope that matches it.
# ===========================================================================
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
sha="2d49c9d2caa8b77aecccac6af21282234cfa5962"
parent="$(cd "$CLONE" && git rev-parse --verify --quiet "${sha}^" 2>/dev/null || true)"
if [ -z "$parent" ]; then
  FAILURES+=("MUST_PASS scope-corroborates — could not resolve parent — probe invalid")
  log MUST_PASS "FAIL — scope-corroborates — could not resolve parent"
else
  branch="probe-scopecorrob-${sha}"
  (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet -b "$branch" "$parent")
  (cd "$CLONE" && git diff "${parent}" "${sha}" | git apply -)
  if ! (cd "$CLONE" && git status --porcelain -uall | grep -qF "add-memory-form/MosaicAddMemoryForm.tsx"); then
    FAILURES+=("MUST_PASS scope-corroborates — mutation did NOT land — probe invalid")
    log MUST_PASS "FAIL — scope-corroborates — mutation did not land"
  else
    (cd "$CLONE" && git add -A && git commit --quiet -m "$(printf 'feat(add-memory-form): MosaicThreadView typo in title, scope corroborates real component')")
    set +e
    output="$(run_guard "$parent" 2>&1)"
    status=$?
    set -e
    if [ "$status" -eq 0 ] && echo "$output" | grep -qF "OK"; then
      MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
      log MUST_PASS "PASS — scope corroborates the real component despite a wrong literal token — exited 0"
    else
      FAILURES+=("MUST_PASS scope-corroborates — guard exited $status (expected 0) — output: $output")
      log MUST_PASS "FAIL — scope-corroborates — exit=$status output=$output"
    fi
  fi
  cleanup_branch "$branch" "$parent"
fi

# ===========================================================================
# MUST_PASS — the written escape hatch, ANCHORED at start-of-line, genuinely
# DOES disable the guard on the same real mismatch material.
# ===========================================================================
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
sha="2d49c9d2caa8b77aecccac6af21282234cfa5962"
parent="$(cd "$CLONE" && git rev-parse "${sha}^" 2>/dev/null || true)"
if [ -z "$parent" ]; then
  FAILURES+=("MUST_PASS declared-marker — could not resolve parent — probe invalid")
  log MUST_PASS "FAIL — declared-marker — could not resolve parent"
else
  branch="probe-declared-marker-${sha}"
  (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet -b "$branch" "$parent")
  (cd "$CLONE" && git diff "${parent}" "${sha}" | git apply -)
  if ! (cd "$CLONE" && git status --porcelain -uall | grep -qF "add-memory-form/MosaicAddMemoryForm.tsx"); then
    FAILURES+=("MUST_PASS declared-marker — mutation did NOT land — probe invalid")
    log MUST_PASS "FAIL — declared-marker — mutation did not land"
  else
    (cd "$CLONE" && git add -A && git commit --quiet -m "$(printf 'feat(thread-view): MosaicThreadView (#92)\n\n// allow-title-diff-mismatch: probe MUST_PASS declared exception case')")
    set +e
    output="$(run_guard "$parent" 2>&1)"
    status=$?
    set -e
    if [ "$status" -eq 0 ] && echo "$output" | grep -qF "SKIPPED"; then
      MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
      log MUST_PASS "PASS — declared // allow-title-diff-mismatch marker — guard exited 0 (SKIPPED)"
    else
      FAILURES+=("MUST_PASS declared-marker — guard exited $status or did not report SKIPPED — output: $output")
      log MUST_PASS "FAIL — declared-marker case — exit=$status output=$output"
    fi
  fi
  cleanup_branch "$branch" "$parent"
fi

# ===========================================================================
# PUSH-TO-MAIN PATH — reproduces CI's exact invocation on that path:
#   PR_TITLE_GUARD_BASE_REF=HEAD^  with HEAD = the real merge commit itself.
# No replay/apply here: these are REAL commits already reachable in the
# clone's fetched history, checked out DETACHED at their own real SHA, which
# is the closest possible reproduction of what push:main hands the guard —
# HEAD really is the merge commit, HEAD^ really is its first parent.
# ===========================================================================
run_guard_push_path() {
  local sha="$1"
  (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet --detach "$sha")
  cp "$REPO_ROOT/scripts/pr-title-matches-diff-guard.mjs" "$CLONE/scripts/pr-title-matches-diff-guard.mjs"
  (cd "$CLONE" && env -u GITHUB_EVENT_NAME -u GITHUB_BASE_REF -u GITHUB_HEAD_REF -u GITHUB_REF_NAME PR_TITLE_GUARD_BASE_REF="HEAD^" node scripts/pr-title-matches-diff-guard.mjs)
}

# --- MUST_BLOCK: the three real merge commits, on the push-to-main path. ---
PUSH_BLOCK_CASES=(
  "2d49c9d2caa8b77aecccac6af21282234cfa5962:src/components/add-memory-form/MosaicAddMemoryForm.tsx"
  "183c6dfe19bd398851fa4b5b9efd195d72e6da0d:src/components/edit-memory-dialog/MosaicEditMemoryDialog.tsx"
  "ee4877da9fe7ffc3c7f3a2344f74ecd321008b1c:src/components/memory-dashboard/MosaicMemoryDashboard.tsx"
)
for case in "${PUSH_BLOCK_CASES[@]}"; do
  IFS=':' read -r sha file <<< "$case"
  MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
  if ! (cd "$CLONE" && git cat-file -e "${sha}:${file}" 2>/dev/null); then
    FAILURES+=("PUSH-PATH MUST_BLOCK $sha — mutation did NOT land (${file} absent at ${sha}) — probe invalid")
    log MUST_BLOCK "FAIL — push-path $sha — real file absent, checkout landing not proven"
    continue
  fi
  set +e
  output="$(run_guard_push_path "$sha" 2>&1)"
  status=$?
  set -e
  claimed_component="$(git -C "$REPO_ROOT" log -1 --pretty=%s "$sha")"
  if [ "$status" -ne 0 ] && echo "$output" | grep -qF "BLOCKED" && echo "$output" | grep -qF "$(basename "$(dirname "$file")")"; then
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
    log MUST_BLOCK "PASS — push-path $sha (real merge-commit subject \"$claimed_component\") — exited $status, named claimed+actual component"
  else
    FAILURES+=("PUSH-PATH MUST_BLOCK $sha — guard exited $status (expected non-zero+BLOCKED naming ${file}) — output: $output")
    log MUST_BLOCK "FAIL — push-path $sha — exit=$status output=$output"
  fi
done

# --- MUST_PASS: the true-titled sibling merge commit, on the push-to-main path. ---
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
sha="52cdb32a5a16b2db4651fd4b1f9adbc283b5af92"
file="src/components/memory-grid/MosaicMemoryGrid.tsx"
if ! (cd "$CLONE" && git cat-file -e "${sha}:${file}" 2>/dev/null); then
  FAILURES+=("PUSH-PATH MUST_PASS $sha (true subject) — mutation did NOT land — probe invalid")
  log MUST_PASS "FAIL — push-path $sha — real file absent, checkout landing not proven"
else
  set +e
  output="$(run_guard_push_path "$sha" 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ] && echo "$output" | grep -qF "OK"; then
    MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
    log MUST_PASS "PASS — push-path $sha (true merge-commit subject) — exited 0"
  else
    FAILURES+=("PUSH-PATH MUST_PASS $sha (true subject) — guard exited $status (expected 0) — output: $output")
    log MUST_PASS "FAIL — push-path $sha — exit=$status output=$output"
  fi
fi

# --- MUST_PASS: a real chore(release) bot merge commit, push-to-main path. ---
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
sha="074de96c14f515024f002f75bbc3020e5ba32b72"
if ! (cd "$CLONE" && git cat-file -e "${sha}" 2>/dev/null); then
  FAILURES+=("PUSH-PATH MUST_PASS $sha (release bot) — commit unreachable in clone — probe invalid")
  log MUST_PASS "FAIL — push-path $sha — commit unreachable"
else
  set +e
  output="$(run_guard_push_path "$sha" 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ] && echo "$output" | grep -qF "no component claim to verify"; then
    MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
    log MUST_PASS "PASS — push-path $sha (release-bot merge commit) — exited 0, exempted"
  else
    FAILURES+=("PUSH-PATH MUST_PASS $sha (release bot) — guard exited $status (expected 0, exempted) — output: $output")
    log MUST_PASS "FAIL — push-path $sha — exit=$status output=$output"
  fi
fi

# --- MUST_PASS: a real scripts-only merge commit, push-to-main path. ---
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
sha="e35488703d5c87fcfa25956b29c8fd63fca7e6f1"
if ! (cd "$CLONE" && git cat-file -e "${sha}" 2>/dev/null); then
  FAILURES+=("PUSH-PATH MUST_PASS $sha (scripts/CI-only) — commit unreachable in clone — probe invalid")
  log MUST_PASS "FAIL — push-path $sha — commit unreachable"
else
  set +e
  output="$(run_guard_push_path "$sha" 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ] && echo "$output" | grep -qF "no component claim to verify"; then
    MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
    log MUST_PASS "PASS — push-path $sha (scripts/CI-only merge commit) — exited 0, exempted"
  else
    FAILURES+=("PUSH-PATH MUST_PASS $sha (scripts/CI-only) — guard exited $status (expected 0, exempted) — output: $output")
    log MUST_PASS "FAIL — push-path $sha — exit=$status output=$output"
  fi
fi

# ===========================================================================
# PULL_REQUEST PATH — DEFECT 2. `actions/checkout@v4` on `pull_request`
# checks out `refs/pull/N/merge`, whose HEAD subject is the SYNTHETIC
# "Merge <sha> into <sha>" string nobody wrote. This is not a hypothetical:
# it is reproduced below by constructing a real synthetic merge commit
# (`git merge --no-ff`, the exact shape GitHub produces) on top of real
# LYING-TITLE incident material (2d49c9d), then proving:
#
#   (a) without the override, the guard reads HEAD's own (synthetic) subject
#       — which carries NO literal Mosaic<Name> token, ever, regardless of
#       what the real PR title said — and, per the DEFECT-1 fix, an empty
#       claim now PASSES unconditionally. That means a PR-path guard with no
#       override SILENTLY PASSES a PR whose real title genuinely lies about
#       its diff — the defect is a false NEGATIVE once Defect 1 is fixed
#       (before Defect 1 was fixed, the same synthetic-subject read produced
#       a false POSITIVE instead, blocking 100% of PRs — either way, reading
#       carrier 2 of the title domain is wrong);
#   (b) passing PR_TITLE_GUARD_SUBJECT + PR_TITLE_GUARD_HEAD_REF (exactly as
#       ci.yml's pull_request step now does) makes the guard read the REAL
#       PR title and REAL PR diff instead, correctly BLOCKING the lying
#       title; and
#   (c) the same override correctly PASSES an honest PR (title and diff
#       agree) — the fix must not turn the PR path into pass-everything OR
#       block-everything.
# ===========================================================================
PR_PATH_TOTAL=0
PR_PATH_PASS=0

sha="2d49c9d2caa8b77aecccac6af21282234cfa5962"
base="$(cd "$CLONE" && git rev-parse --verify --quiet "${sha}^" 2>/dev/null || true)"
if [ -z "$base" ]; then
  FAILURES+=("PR-PATH fixture $sha — could not resolve parent — probe invalid")
  log PR_PATH "FAIL — fixture $sha — could not resolve parent"
else
  PR_PATH_TOTAL=$((PR_PATH_TOTAL + 1))
  (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet -b "pr-path-base" "$base")
  (cd "$CLONE" && git checkout --quiet -b "pr-path-feature" "$sha")
  (cd "$CLONE" && git checkout --quiet "pr-path-base")
  # This IS the synthetic ref GitHub builds for refs/pull/N/merge: a --no-ff
  # merge whose own subject nobody typed.
  (cd "$CLONE" && git merge --no-ff --quiet -m "Merge ${sha} into ${base}" "pr-path-feature")
  cp "$REPO_ROOT/scripts/pr-title-matches-diff-guard.mjs" "$CLONE/scripts/pr-title-matches-diff-guard.mjs"
  if ! (cd "$CLONE" && git log -1 --format=%s | grep -qF "Merge ${sha} into ${base}"); then
    FAILURES+=("PR-PATH fixture $sha — synthetic merge subject did NOT land — probe invalid")
    log PR_PATH "FAIL — fixture $sha — synthetic merge subject absent"
  else
    # (a) no override: guard reads the synthetic subject (zero literal
    #     token, always) — a genuinely LYING title silently PASSES.
    set +e
    output_no_override="$(cd "$CLONE" && env -u GITHUB_EVENT_NAME -u GITHUB_BASE_REF -u GITHUB_HEAD_REF -u GITHUB_REF_NAME PR_TITLE_GUARD_BASE_REF="$base" node scripts/pr-title-matches-diff-guard.mjs 2>&1)"
    status_no_override=$?
    set -e
    if [ "$status_no_override" -eq 0 ] && echo "$output_no_override" | grep -qF "no component claim to verify"; then
      log PR_PATH "CONFIRMED — synthetic merge subject silently PASSES a genuinely lying title (Defect 2 reproduced)"
    else
      FAILURES+=("PR-PATH defect-2 repro — expected synthetic subject to silently PASS the lying title without the override, got exit=$status_no_override output=$output_no_override")
      log PR_PATH "FAIL — defect-2 repro did not reproduce — exit=$status_no_override output=$output_no_override"
    fi

    # (b) AFTER the fix: override set exactly as ci.yml's pull_request step
    #     sets it, using the REAL lying title. Must BLOCK, and must never
    #     read the synthetic subject.
    real_title="$(cd "$CLONE" && git log -1 --format=%s "$sha")"
    set +e
    output_fixed="$(cd "$CLONE" && env -u GITHUB_EVENT_NAME -u GITHUB_BASE_REF -u GITHUB_HEAD_REF -u GITHUB_REF_NAME PR_TITLE_GUARD_BASE_REF="$base" PR_TITLE_GUARD_HEAD_REF="$sha" PR_TITLE_GUARD_SUBJECT="$real_title" node scripts/pr-title-matches-diff-guard.mjs 2>&1)"
    status_fixed=$?
    set -e
    if [ "$status_fixed" -ne 0 ] && echo "$output_fixed" | grep -qF "BLOCKED" && ! echo "$output_fixed" | grep -qF "Merge ${sha} into ${base}"; then
      PR_PATH_PASS=$((PR_PATH_PASS + 1))
      log PR_PATH "PASS — override reads the real (lying) PR title, never the synthetic merge subject, and BLOCKS it — exited $status_fixed"
    else
      FAILURES+=("PR-PATH fixed $sha — guard with override exited $status_fixed (expected non-zero+BLOCKED) or leaked the synthetic subject — output: $output_fixed")
      log PR_PATH "FAIL — fixed $sha — exit=$status_fixed output=$output_fixed"
    fi
  fi
  (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet "$base" 2>/dev/null || true)
  (cd "$CLONE" && git branch -D --quiet pr-path-base pr-path-feature 2>/dev/null || true)
fi

# --- (c) An HONEST PR (title and diff agree) must PASS under the same
#     override invocation — the fix must not turn the PR path into
#     block-everything either.
sha="52cdb32a5a16b2db4651fd4b1f9adbc283b5af92"
base="$(cd "$CLONE" && git rev-parse --verify --quiet "${sha}^" 2>/dev/null || true)"
if [ -z "$base" ]; then
  FAILURES+=("PR-PATH honest-title fixture $sha — could not resolve parent — probe invalid")
  log PR_PATH "FAIL — honest-title fixture $sha — could not resolve parent"
else
  PR_PATH_TOTAL=$((PR_PATH_TOTAL + 1))
  if ! (cd "$CLONE" && git cat-file -e "${sha}:src/components/memory-grid/MosaicMemoryGrid.tsx" 2>/dev/null); then
    FAILURES+=("PR-PATH honest-title fixture $sha — real file absent, landing not proven — probe invalid")
    log PR_PATH "FAIL — honest-title fixture $sha — landing not proven"
  else
    cp "$REPO_ROOT/scripts/pr-title-matches-diff-guard.mjs" "$CLONE/scripts/pr-title-matches-diff-guard.mjs"
    real_title="$(cd "$CLONE" && git log -1 --format=%s "$sha")"
    set +e
    output_honest="$(cd "$CLONE" && env -u GITHUB_EVENT_NAME -u GITHUB_BASE_REF -u GITHUB_HEAD_REF -u GITHUB_REF_NAME PR_TITLE_GUARD_BASE_REF="$base" PR_TITLE_GUARD_HEAD_REF="$sha" PR_TITLE_GUARD_SUBJECT="$real_title" node scripts/pr-title-matches-diff-guard.mjs 2>&1)"
    status_honest=$?
    set -e
    if [ "$status_honest" -eq 0 ] && echo "$output_honest" | grep -qF "OK"; then
      PR_PATH_PASS=$((PR_PATH_PASS + 1))
      log PR_PATH "PASS — an honest PR title still PASSES under the override invocation — exited 0"
    else
      FAILURES+=("PR-PATH honest-title $sha — guard exited $status_honest (expected 0) — output: $output_honest")
      log PR_PATH "FAIL — honest-title $sha — exit=$status_honest output=$output_honest"
    fi
  fi
fi

echo ""
echo "PR-PATH (defect 2): $PR_PATH_PASS/$PR_PATH_TOTAL"
if [ "$PR_PATH_PASS" -ne "$PR_PATH_TOTAL" ]; then
  FAILURES+=("PR-PATH sweep — $PR_PATH_PASS/$PR_PATH_TOTAL — not all cases passed")
fi

# ===========================================================================
# MUST_REFUSE — the third pole. A guard with only PASS/VIOLATION files "I
# could not measure" into one of the two, and both are wrong (see the
# guard's own header + .claude/rules/derive-never-type.md). exit 0 here is a
# silent fail-open; exit 1 here is a red that proves nothing. Only exit 2,
# naming what is missing, is correct.
#
# DERIVED CENSUS (never enumerated from memory — per
# .claude/rules/guard-formulation-census.md), produced by:
#
#   grep -n 'git(\[' scripts/pr-title-matches-diff-guard.mjs
#
# which surfaces exactly FIVE `git()` call sites, plus ONE non-git
# instrument-withholding path (the pull_request/empty-subject branch added
# alongside this three-state contract):
#
#   1. headFullMessage() -> git log -1 --pretty=%B HEAD_REF   (site: escape-hatch marker read)
#   2. headSubject()     -> git log -1 --pretty=%s HEAD_REF   (site: title fallback)
#   3. changedFiles()    -> git rev-parse --verify BASE_REF   (site: BASE_REF resolution)
#   4. changedFiles()    -> git diff --name-only BASE...HEAD  (site: the diff itself)
#   5. actualComponentClaim() -> git diff BASE...HEAD -- src/index.ts (site: export-surface scan)
#   6. headSubject()     -> GITHUB_EVENT_NAME=pull_request with PR_TITLE_GUARD_SUBJECT
#      empty/unset (site: CI withheld the real PR title — the instrument
#      that closes Defect 2)
#
# main()'s own call order makes site 1 fire before site 3/4 can ever be
# reached with a BAD HEAD_REF (headFullMessage() runs first) — so "HEAD_REF
# unresolvable" is exercised ONCE, at site 1, which is the site main()
# actually reaches first; that single mutation proves both site 1 and site 2
# share one failure mode (same `HEAD_REF`, same `git()` wrapper), not two.
# This is a DECLARED grouping, not a silent skip: sites 1+2 collapse to one
# MUST_REFUSE case below, sites 3 and 4 get their own (rev-parse succeeding
# on a non-commit object still leaves `git diff` unable to produce a
# range — a real, distinct failure mode from "ref does not resolve at all"),
# and site 5 is declared, not separately exercised: it is the textually
# IDENTICAL `git diff BASE...HEAD` invocation already proven to fail the
# same way at site 4 (same two refs, same triple-dot form) — a second
# mutation there would prove the same code path twice, not a new one.
# ===========================================================================
MUST_REFUSE_PASS=0
MUST_REFUSE_TOTAL=0

refuse_setup() {
  (cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet --detach "$BASE")
  cp "$REPO_ROOT/scripts/pr-title-matches-diff-guard.mjs" "$CLONE/scripts/pr-title-matches-diff-guard.mjs"
}

# --- MUST_REFUSE 1: HEAD_REF does not resolve at all (sites 1+2, declared-grouped). ---
MUST_REFUSE_TOTAL=$((MUST_REFUSE_TOTAL + 1))
refuse_setup
BOGUS_HEAD="0000000000000000000000000000000000dead"
if (cd "$CLONE" && git cat-file -e "$BOGUS_HEAD" 2>/dev/null); then
  FAILURES+=("MUST_REFUSE unresolvable-HEAD_REF — bogus SHA unexpectedly resolves — probe invalid, cannot inject this failure")
  log MUST_REFUSE "FAIL — unresolvable-HEAD_REF — mutation did not land (bogus SHA resolves)"
else
  set +e
  output="$(cd "$CLONE" && env -u GITHUB_EVENT_NAME -u GITHUB_BASE_REF -u GITHUB_HEAD_REF -u GITHUB_REF_NAME PR_TITLE_GUARD_HEAD_REF="$BOGUS_HEAD" node scripts/pr-title-matches-diff-guard.mjs 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 2 ] && echo "$output" | grep -qF "REFUSES TO JUDGE"; then
    MUST_REFUSE_PASS=$((MUST_REFUSE_PASS + 1))
    log MUST_REFUSE "PASS — unresolvable HEAD_REF — exited 2, REFUSES TO JUDGE, named the missing instrument"
  else
    FAILURES+=("MUST_REFUSE unresolvable-HEAD_REF — guard exited $status (expected 2) — output: $output")
    log MUST_REFUSE "FAIL — unresolvable-HEAD_REF — exit=$status (expected 2) output=$output"
  fi
fi

# --- MUST_REFUSE 2: BASE_REF does not resolve at all (site 3, rev-parse --verify itself fails). ---
MUST_REFUSE_TOTAL=$((MUST_REFUSE_TOTAL + 1))
refuse_setup
BOGUS_BASE="0000000000000000000000000000000000beef"
if (cd "$CLONE" && git cat-file -e "$BOGUS_BASE" 2>/dev/null); then
  FAILURES+=("MUST_REFUSE unresolvable-BASE_REF — bogus SHA unexpectedly resolves — probe invalid, cannot inject this failure")
  log MUST_REFUSE "FAIL — unresolvable-BASE_REF — mutation did not land (bogus SHA resolves)"
else
  set +e
  output="$(cd "$CLONE" && env -u GITHUB_EVENT_NAME -u GITHUB_BASE_REF -u GITHUB_HEAD_REF -u GITHUB_REF_NAME PR_TITLE_GUARD_BASE_REF="$BOGUS_BASE" node scripts/pr-title-matches-diff-guard.mjs 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 2 ] && echo "$output" | grep -qF "REFUSES TO JUDGE"; then
    MUST_REFUSE_PASS=$((MUST_REFUSE_PASS + 1))
    log MUST_REFUSE "PASS — unresolvable BASE_REF — exited 2, REFUSES TO JUDGE, named the missing instrument"
  else
    FAILURES+=("MUST_REFUSE unresolvable-BASE_REF — guard exited $status (expected 2) — output: $output")
    log MUST_REFUSE "FAIL — unresolvable-BASE_REF — exit=$status (expected 2) output=$output"
  fi
fi

# --- MUST_REFUSE 3: BASE_REF resolves as an OBJECT (rev-parse --verify
#     succeeds) but is not a commit-ish `git diff` can range against (site 4:
#     the diff command itself fails despite the ref existing). Uses a REAL
#     blob SHA from this repo's own history — foreign material, not a
#     synthetic string. ---
MUST_REFUSE_TOTAL=$((MUST_REFUSE_TOTAL + 1))
refuse_setup
BLOB_SHA="$(cd "$CLONE" && git rev-parse "${BASE}:package.json" 2>/dev/null || true)"
if [ -z "$BLOB_SHA" ]; then
  FAILURES+=("MUST_REFUSE non-commit-BASE_REF — could not resolve package.json's own blob SHA — probe invalid")
  log MUST_REFUSE "FAIL — non-commit-BASE_REF — could not resolve blob SHA"
elif ! (cd "$CLONE" && git cat-file -t "$BLOB_SHA" 2>/dev/null | grep -qF "blob"); then
  FAILURES+=("MUST_REFUSE non-commit-BASE_REF — $BLOB_SHA is not a blob — mutation did not land as intended — probe invalid")
  log MUST_REFUSE "FAIL — non-commit-BASE_REF — resolved object is not a blob"
else
  set +e
  output="$(cd "$CLONE" && env -u GITHUB_EVENT_NAME -u GITHUB_BASE_REF -u GITHUB_HEAD_REF -u GITHUB_REF_NAME PR_TITLE_GUARD_BASE_REF="$BLOB_SHA" node scripts/pr-title-matches-diff-guard.mjs 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 2 ] && echo "$output" | grep -qF "REFUSES TO JUDGE"; then
    MUST_REFUSE_PASS=$((MUST_REFUSE_PASS + 1))
    log MUST_REFUSE "PASS — BASE_REF is a real blob (rev-parse --verify succeeds, diff cannot range against it) — exited 2, REFUSES TO JUDGE"
  else
    FAILURES+=("MUST_REFUSE non-commit-BASE_REF — guard exited $status (expected 2) — output: $output")
    log MUST_REFUSE "FAIL — non-commit-BASE_REF — exit=$status (expected 2) output=$output"
  fi
fi

# --- MUST_REFUSE 4: pull_request event, PR_TITLE_GUARD_SUBJECT withheld
#     (site 6 — the exact shape of Defect 2's root cause: CI's own contract
#     broken). Uses the real 2d49c9d material so a false PASS here would be
#     the fail-open this whole contract exists to close. ---
MUST_REFUSE_TOTAL=$((MUST_REFUSE_TOTAL + 1))
sha="2d49c9d2caa8b77aecccac6af21282234cfa5962"
base_for_pr="$(cd "$CLONE" && git rev-parse --verify --quiet "${sha}^" 2>/dev/null || true)"
if [ -z "$base_for_pr" ]; then
  FAILURES+=("MUST_REFUSE withheld-PR-subject — could not resolve parent of $sha — probe invalid")
  log MUST_REFUSE "FAIL — withheld-PR-subject — could not resolve parent"
else
  refuse_setup
  set +e
  output="$(cd "$CLONE" && env -u GITHUB_BASE_REF -u GITHUB_HEAD_REF -u GITHUB_REF_NAME GITHUB_EVENT_NAME="pull_request" PR_TITLE_GUARD_BASE_REF="$base_for_pr" PR_TITLE_GUARD_HEAD_REF="$sha" node scripts/pr-title-matches-diff-guard.mjs 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 2 ] && echo "$output" | grep -qF "REFUSES TO JUDGE" && echo "$output" | grep -qF "PR_TITLE_GUARD_SUBJECT"; then
    MUST_REFUSE_PASS=$((MUST_REFUSE_PASS + 1))
    log MUST_REFUSE "PASS — pull_request event with PR_TITLE_GUARD_SUBJECT withheld — exited 2, named the missing instrument, never fell back to the synthetic subject"
  else
    FAILURES+=("MUST_REFUSE withheld-PR-subject — guard exited $status (expected 2, naming PR_TITLE_GUARD_SUBJECT) — output: $output")
    log MUST_REFUSE "FAIL — withheld-PR-subject — exit=$status output=$output"
  fi
fi

(cd "$CLONE" && git reset --hard --quiet && git clean -fdq && git checkout --quiet "$BASE" 2>/dev/null || true)

# Leave the clone on a clean, detached-free state before restoration check
# (does not touch $REPO_ROOT — only tidies the disposable scratch clone).
(cd "$CLONE" && git reset --hard --quiet 2>/dev/null || true)

# ---------------------------------------------------------------------------
# Restoration proof — the INVOKING worktree must be untouched by this probe.
# ---------------------------------------------------------------------------
cd "$REPO_ROOT"
POST_PROBE_DIFF="$(git diff --stat)"

echo ""
echo "==================== PROBE SUMMARY ===================="
echo "MUST_BLOCK:  $MUST_BLOCK_PASS/$MUST_BLOCK_TOTAL"
echo "MUST_PASS:   $MUST_PASS_PASS/$MUST_PASS_TOTAL"
echo "MUST_REFUSE: $MUST_REFUSE_PASS/$MUST_REFUSE_TOTAL"
if [ "$MUST_REFUSE_PASS" -ne "$MUST_REFUSE_TOTAL" ]; then
  FAILURES+=("MUST_REFUSE sweep — $MUST_REFUSE_PASS/$MUST_REFUSE_TOTAL — not all cases refused correctly")
fi
echo "Restoration ($REPO_ROOT diff before vs after probe, must be IDENTICAL):"
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

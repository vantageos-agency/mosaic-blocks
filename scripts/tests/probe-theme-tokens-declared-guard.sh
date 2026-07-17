#!/usr/bin/env bash
# probe-theme-tokens-declared-guard.sh — bipolar bite-probe for
# scripts/theme-tokens-declared-guard.mjs.
#
# Per .claude/rules/derive-never-type.md and
# .claude/rules/guard-formulation-census.md: a bipolar probe alone proves
# nothing unless it mutates ONE FORM PER FORM the guard covers, on material
# it SEEDS itself (never anchored on a real source line a future fix PR is
# free to delete — the exact landmine this repo hit once already, per the
# brief this probe was written against). This probe therefore authors its
# OWN scratch fixture tree (a component file + a stylesheet, neither of
# which exist anywhere in this repo's real `src/`) and points the guard at
# it via THEME_TOKENS_SRC_DIR / THEME_TOKENS_STYLES_PATH — no clone, no
# build step needed (the guard under test reads source text directly, it
# does not scan a built bundle).
#
# Forms covered (MUST_BLOCK):
#   1. consumed-but-undeclared — a fixture component uses a color utility
#      whose `--color-*` variable the fixture stylesheet never declares.
#   2. declared-but-unconsumed (stale) — the fixture stylesheet declares a
#      custom token no fixture component ever uses.
#   3. REFUSAL PATH (exit 2) — stylesheet path does not exist. The guard
#      must exit 2, distinguishably from exit 1 (a real violation).
#
# MUST_PASS:
#   4. Clean fixture tree — declared token consumed exactly once, plus a
#      spread of Tailwind BUILT-IN utilities (bg-red-500, border-t,
#      border-r-0, border-l-transparent, ring-2, ring-offset-4, divide-x-2,
#      from-50%, text-sm, bg-cover, shadow-sm, outline-none) that share a
#      color-bearing PREFIX but are NOT color tokens — false positives on
#      any of these would mean the guard cannot ship on the real
#      component tree, which uses every one of these forms today.
#   5. Written escape hatch on the CONSUMED side —
#      `// allow-undeclared-theme-token: <reason>` immediately above an
#      otherwise-undeclared usage — must not be reported.
#   6. Written escape hatch on the DECLARED side —
#      `/* allow-stale-theme-token: <reason> */` immediately above an
#      otherwise-unconsumed declaration — must not be reported.
#
# Usage: bash scripts/tests/probe-theme-tokens-declared-guard.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GUARD="$REPO_ROOT/scripts/theme-tokens-declared-guard.mjs"

SCRATCH="$(mktemp -d)"
trap 'rm -rf "$SCRATCH"' EXIT

# Snapshot the INVOKING worktree's own diff BEFORE this probe touches
# anything — it may legitimately carry in-progress, not-yet-committed edits
# (e.g. this exact PR's own styles.css fix). This probe's business is only
# its OWN scratch dir; restoration is proven by the diff being UNCHANGED
# across the run, not by it being empty.
PRE_PROBE_DIFF="$(cd "$REPO_ROOT" && git diff --stat)"

MUST_BLOCK_PASS=0
MUST_BLOCK_TOTAL=0
MUST_PASS_PASS=0
MUST_PASS_TOTAL=0
FAILURES=()

log() { echo "[$1] $2"; }

# Every fixture writer below is a pure `cat > file <<'EOF'` — deterministic
# no interpolation, so no need for a python/grep "did it land" dance beyond
# a final byte-for-byte content grep, still performed (rule: never trust an
# unverified write).

write_fixture_tree() {
  local dir="$1"
  mkdir -p "$dir/src/components/probe"
  cat > "$dir/src/components/probe/ProbeFixture.tsx" <<'EOF'
export function ProbeFixture() {
  return (
    <div className="bg-probe-brand border border-r-0 border-t border-l-transparent border-red-500 ring-2 ring-offset-4 divide-x-2 from-50% text-sm bg-cover shadow-sm outline-none">
      probe fixture
    </div>
  );
}
EOF
  cat > "$dir/src/styles.css" <<'EOF'
@theme inline {
  --color-probe-brand: var(--probe-brand);
}

:root {
  --probe-brand: oklch(0.5 0.1 250);
}

[data-theme="dark"] {
  --probe-brand: oklch(0.7 0.1 250);
}
EOF
}

assert_landed() {
  local file="$1" needle="$2" label="$3"
  if ! grep -qF -- "$needle" "$file"; then
    echo "probe: fixture write for '$label' did not land (needle '$needle' absent from $file) — probe invalid." >&2
    exit 1
  fi
}

run_guard() {
  local src="$1" styles="$2"
  THEME_TOKENS_SRC_DIR="$src" THEME_TOKENS_STYLES_PATH="$styles" node "$GUARD"
}

# ---------------------------------------------------------------------------
# MUST_PASS #4 — clean fixture tree, one declared token consumed once, a
# spread of built-in-shaped false-positive traps.
# ---------------------------------------------------------------------------
CLEAN="$SCRATCH/clean"
write_fixture_tree "$CLEAN"
assert_landed "$CLEAN/src/components/probe/ProbeFixture.tsx" "bg-probe-brand" "clean fixture component"
assert_landed "$CLEAN/src/styles.css" "--color-probe-brand" "clean fixture styles"

set +e
clean_output="$(run_guard "$CLEAN/src" "$CLEAN/src/styles.css" 2>&1)"
clean_status=$?
set -e
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
if [ "$clean_status" -eq 0 ]; then
  MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
  log MUST_PASS "PASS — clean fixture tree (declared==consumed, built-ins ignored) exits 0"
else
  FAILURES+=("MUST_PASS clean fixture tree — expected exit 0, got $clean_status. Output:\n$clean_output")
  log MUST_PASS "FAIL — clean fixture tree — exit=$clean_status"
fi

# ---------------------------------------------------------------------------
# MUST_BLOCK #1 — consumed but undeclared.
# ---------------------------------------------------------------------------
UNDECLARED_DIR="$SCRATCH/undeclared"
write_fixture_tree "$UNDECLARED_DIR"
cat > "$UNDECLARED_DIR/src/components/probe/ProbeFixture.tsx" <<'EOF'
export function ProbeFixture() {
  return (
    <div className="bg-probe-brand text-probe-ghost-token">
      probe fixture — undeclared token
    </div>
  );
}
EOF
assert_landed "$UNDECLARED_DIR/src/components/probe/ProbeFixture.tsx" "text-probe-ghost-token" "undeclared-form injection"

set +e
undeclared_output="$(run_guard "$UNDECLARED_DIR/src" "$UNDECLARED_DIR/src/styles.css" 2>&1)"
undeclared_status=$?
set -e
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
if [ "$undeclared_status" -eq 1 ] && echo "$undeclared_output" | grep -qF -- "--color-probe-ghost-token"; then
  MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
  log MUST_BLOCK "PASS — consumed-but-undeclared — guard named --color-probe-ghost-token, exit 1"
else
  FAILURES+=("MUST_BLOCK consumed-but-undeclared — exit=$undeclared_status, output:\n$undeclared_output")
  log MUST_BLOCK "FAIL — consumed-but-undeclared — exit=$undeclared_status"
fi

# ---------------------------------------------------------------------------
# MUST_BLOCK #2 — declared but never consumed (stale).
# ---------------------------------------------------------------------------
STALE_DIR="$SCRATCH/stale"
write_fixture_tree "$STALE_DIR"
cat >> "$STALE_DIR/src/styles.css" <<'EOF'

@theme inline {
  --color-probe-orphan: var(--probe-orphan);
}
:root {
  --probe-orphan: oklch(0.4 0.1 30);
}
EOF
assert_landed "$STALE_DIR/src/styles.css" "--color-probe-orphan" "stale-form injection"

set +e
stale_output="$(run_guard "$STALE_DIR/src" "$STALE_DIR/src/styles.css" 2>&1)"
stale_status=$?
set -e
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
if [ "$stale_status" -eq 1 ] && echo "$stale_output" | grep -qF -- "--color-probe-orphan"; then
  MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
  log MUST_BLOCK "PASS — declared-but-unconsumed — guard named --color-probe-orphan, exit 1"
else
  FAILURES+=("MUST_BLOCK declared-but-unconsumed — exit=$stale_status, output:\n$stale_output")
  log MUST_BLOCK "FAIL — declared-but-unconsumed — exit=$stale_status"
fi

# ---------------------------------------------------------------------------
# MUST_BLOCK #3 — refusal path (exit 2), stylesheet unreadable.
# ---------------------------------------------------------------------------
REFUSAL_DIR="$SCRATCH/refusal"
write_fixture_tree "$REFUSAL_DIR"
MISSING_STYLES="$REFUSAL_DIR/src/does-not-exist.css"

set +e
refusal_output="$(run_guard "$REFUSAL_DIR/src" "$MISSING_STYLES" 2>&1)"
refusal_status=$?
set -e
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
if [ "$refusal_status" -eq 2 ] && echo "$refusal_output" | grep -qF -- "REFUSES TO JUDGE"; then
  MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
  log MUST_BLOCK "PASS — refusal path — exit 2, distinguishable from exit 1 violation"
else
  FAILURES+=("MUST_BLOCK refusal path — expected exit 2 with REFUSES TO JUDGE, got exit=$refusal_status, output:\n$refusal_output")
  log MUST_BLOCK "FAIL — refusal path — exit=$refusal_status"
fi

# ---------------------------------------------------------------------------
# MUST_PASS #5 — written escape hatch, consumed side.
# ---------------------------------------------------------------------------
ESCAPE_CONSUMED_DIR="$SCRATCH/escape-consumed"
write_fixture_tree "$ESCAPE_CONSUMED_DIR"
cat > "$ESCAPE_CONSUMED_DIR/src/components/probe/ProbeFixture.tsx" <<'EOF'
export function ProbeFixture() {
  return (
    <div
      // allow-undeclared-theme-token: probe fixture, deliberately undeclared
      className="bg-probe-brand text-probe-escaped-token"
    >
      probe fixture — escaped undeclared token
    </div>
  );
}
EOF
assert_landed "$ESCAPE_CONSUMED_DIR/src/components/probe/ProbeFixture.tsx" "allow-undeclared-theme-token" "escape-consumed injection"

set +e
escape_consumed_output="$(run_guard "$ESCAPE_CONSUMED_DIR/src" "$ESCAPE_CONSUMED_DIR/src/styles.css" 2>&1)"
escape_consumed_status=$?
set -e
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
if [ "$escape_consumed_status" -eq 0 ]; then
  MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
  log MUST_PASS "PASS — written escape hatch (consumed side) — exit 0"
else
  FAILURES+=("MUST_PASS escape hatch consumed side — expected exit 0, got $escape_consumed_status, output:\n$escape_consumed_output")
  log MUST_PASS "FAIL — escape hatch consumed side — exit=$escape_consumed_status"
fi

# ---------------------------------------------------------------------------
# MUST_PASS #6 — written escape hatch, declared (stale) side.
# ---------------------------------------------------------------------------
ESCAPE_STALE_DIR="$SCRATCH/escape-stale"
write_fixture_tree "$ESCAPE_STALE_DIR"
cat >> "$ESCAPE_STALE_DIR/src/styles.css" <<'EOF'

@theme inline {
  /* allow-stale-theme-token: probe fixture, deliberately reserved */
  --color-probe-reserved: var(--probe-reserved);
}
:root {
  --probe-reserved: oklch(0.6 0.1 90);
}
EOF
assert_landed "$ESCAPE_STALE_DIR/src/styles.css" "allow-stale-theme-token" "escape-stale injection"

set +e
escape_stale_output="$(run_guard "$ESCAPE_STALE_DIR/src" "$ESCAPE_STALE_DIR/src/styles.css" 2>&1)"
escape_stale_status=$?
set -e
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
if [ "$escape_stale_status" -eq 0 ]; then
  MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
  log MUST_PASS "PASS — written escape hatch (declared/stale side) — exit 0"
else
  FAILURES+=("MUST_PASS escape hatch stale side — expected exit 0, got $escape_stale_status, output:\n$escape_stale_output")
  log MUST_PASS "FAIL — escape hatch stale side — exit=$escape_stale_status"
fi

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
echo
echo "===== probe-theme-tokens-declared-guard summary ====="
echo "MUST_BLOCK: $MUST_BLOCK_PASS/$MUST_BLOCK_TOTAL"
echo "MUST_PASS:  $MUST_PASS_PASS/$MUST_PASS_TOTAL"

# Restoration check — this probe never touches the invoking worktree, only
# its own scratch dir. Proven by the worktree diff being IDENTICAL
# before/after (not necessarily empty — an in-flight PR may legitimately
# carry its own uncommitted edits, which are none of this probe's business).
POST_PROBE_DIFF="$(cd "$REPO_ROOT" && git diff --stat)"
if [ "$POST_PROBE_DIFF" != "$PRE_PROBE_DIFF" ]; then
  FAILURES+=("worktree diff CHANGED across the probe run — probe leaked a mutation into the real repo.\nBEFORE:\n$PRE_PROBE_DIFF\nAFTER:\n$POST_PROBE_DIFF")
fi
echo "Restoration (git diff --stat unchanged across run): '${POST_PROBE_DIFF:-<empty>}'"

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo
  echo "FAILURES:"
  for f in "${FAILURES[@]}"; do
    echo -e "  - $f"
  done
  exit 1
fi

if [ "$MUST_BLOCK_PASS" -ne "$MUST_BLOCK_TOTAL" ] || [ "$MUST_PASS_PASS" -ne "$MUST_PASS_TOTAL" ]; then
  echo "probe: counts do not add up to full pass — treating as failure." >&2
  exit 1
fi

echo "probe-theme-tokens-declared-guard: ALL GREEN (MUST_BLOCK $MUST_BLOCK_PASS/$MUST_BLOCK_TOTAL, MUST_PASS $MUST_PASS_PASS/$MUST_PASS_TOTAL, 0 false positives, restoration clean)."

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
# MUST_BLOCK #7/#8/#9 — GAP A families: inset-ring / inset-shadow /
# text-shadow, each undeclared. One mutation PER FORM (per
# .claude/rules/guard-formulation-census.md — a bipolar probe alone does not
# prove a guard mordant on every form of the domain it covers).
# ---------------------------------------------------------------------------
declare -A GAP_A_FAMILIES=(
  [inset-ring]="inset-ring-probe-ir-ghost"
  [inset-shadow]="inset-shadow-probe-is-ghost"
  [text-shadow]="text-shadow-probe-ts-ghost"
)
for family in "${!GAP_A_FAMILIES[@]}"; do
  class="${GAP_A_FAMILIES[$family]}"
  # class = "<family>-probe-<abbrev>-ghost" -> token = "probe-<abbrev>-ghost"
  token="${class#${family}-}"
  dir="$SCRATCH/gapA-${family}"
  write_fixture_tree "$dir"
  cat > "$dir/src/components/probe/ProbeFixture.tsx" <<EOF
export function ProbeFixture() {
  return (
    <div className="bg-probe-brand ${class}">
      probe fixture — GAP A ${family} undeclared
    </div>
  );
}
EOF
  assert_landed "$dir/src/components/probe/ProbeFixture.tsx" "$class" "GAP A ${family} injection"

  set +e
  out="$(run_guard "$dir/src" "$dir/src/styles.css" 2>&1)"
  status=$?
  set -e
  MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
  if [ "$status" -eq 1 ] && echo "$out" | grep -qF -- "--color-${token}"; then
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
    log MUST_BLOCK "PASS — GAP A ${family} undeclared — guard named --color-${token}, exit 1"
  else
    FAILURES+=("MUST_BLOCK GAP A ${family} undeclared — exit=$status, output:\n$out")
    log MUST_BLOCK "FAIL — GAP A ${family} undeclared — exit=$status"
  fi
done

# ---------------------------------------------------------------------------
# COUNTER-TO-ZERO — installed tailwindcss vs. this guard's static domain.
# Prints the SAME derivation the guard runs on every invocation, so a human
# reviewing this probe's output sees the live count, not a claim.
# ---------------------------------------------------------------------------
echo
echo "----- GAP A counter-to-zero (installed tailwindcss vs COLOR_BEARING_PREFIXES) -----"
node --input-type=module -e "
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const libPath = require.resolve('tailwindcss', { paths: ['$REPO_ROOT'] });
const text = readFileSync(libPath, 'utf8');
const re = /r\(\"([a-z][a-z-]*)\",\(\)=>\[\{[\s\S]{0,400}?valueThemeKeys:\[([^\]]*)\]/g;
const derived = new Set();
let m;
while ((m = re.exec(text))) { if (/\"--color\"/.test(m[2])) derived.add(m[1]); }
const guardSrc = readFileSync('$REPO_ROOT/scripts/theme-tokens-declared-guard.mjs', 'utf8');
const staticListMatch = guardSrc.match(/const COLOR_BEARING_PREFIXES = \[([\s\S]*?)\];/);
const staticList = new Set([...staticListMatch[1].matchAll(/\"([a-z-]+)\"/g)].map((mm) => mm[1]));
const unknown = [...derived].filter((p) => !staticList.has(p));
console.log('installed tailwindcss color-bearing prefixes (derived):', [...derived].sort().join(', '));
console.log('COLOR_BEARING_PREFIXES (static domain):', [...staticList].sort().join(', '));
console.log('UNCOVERED (counter-to-zero):', unknown.length, unknown.length ? unknown.join(', ') : '(none)');
"

# ---------------------------------------------------------------------------
# MUST_PASS #7 — GAP B: canonical --mosaic-color-* consumed with NO escape
# marker, resolved purely via @import-following (no styles.css var()
# right-hand-side byte-match required).
# ---------------------------------------------------------------------------
GAPB_PASS_DIR="$SCRATCH/gapB-pass"
mkdir -p "$GAPB_PASS_DIR/src/components/probe"
cat > "$GAPB_PASS_DIR/src/probe-token-package.css" <<'EOF'
:root {
  --mosaic-probe-external: oklch(0.55 0.12 200);
}
EOF
cat > "$GAPB_PASS_DIR/src/styles.css" <<'EOF'
@import "./probe-token-package.css";

@theme inline {
  --color-probe-external: var(--mosaic-probe-external);
}
EOF
cat > "$GAPB_PASS_DIR/src/components/probe/ProbeFixture.tsx" <<'EOF'
export function ProbeFixture() {
  return (
    <div className="bg-probe-external">
      probe fixture — GAP B canonical token via @import, no marker
    </div>
  );
}
EOF
assert_landed "$GAPB_PASS_DIR/src/styles.css" "@import \"./probe-token-package.css\"" "GAP B pass-case @import"
assert_landed "$GAPB_PASS_DIR/src/components/probe/ProbeFixture.tsx" "bg-probe-external" "GAP B pass-case consumption"

set +e
gapb_pass_output="$(run_guard "$GAPB_PASS_DIR/src" "$GAPB_PASS_DIR/src/styles.css" 2>&1)"
gapb_pass_status=$?
set -e
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
if [ "$gapb_pass_status" -eq 0 ]; then
  MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
  log MUST_PASS "PASS — GAP B: --mosaic-* token resolved via @import chain, NO marker needed — exit 0"
else
  FAILURES+=("MUST_PASS GAP B @import-resolved token — expected exit 0, got $gapb_pass_status, output:\n$gapb_pass_output")
  log MUST_PASS "FAIL — GAP B @import-resolved token — exit=$gapb_pass_status"
fi

# ---------------------------------------------------------------------------
# MUST_BLOCK #10 — genuine dangle NOT supplied by any @import: @import
# resolution must not blind the guard to a real broken reference.
# ---------------------------------------------------------------------------
GAPB_DANGLE_DIR="$SCRATCH/gapB-dangle"
mkdir -p "$GAPB_DANGLE_DIR/src/components/probe"
cat > "$GAPB_DANGLE_DIR/src/probe-token-package.css" <<'EOF'
:root {
  --mosaic-probe-external: oklch(0.55 0.12 200);
}
EOF
cat > "$GAPB_DANGLE_DIR/src/styles.css" <<'EOF'
@import "./probe-token-package.css";

@theme inline {
  --color-probe-dangling: var(--this-name-is-declared-nowhere);
}
EOF
cat > "$GAPB_DANGLE_DIR/src/components/probe/ProbeFixture.tsx" <<'EOF'
export function ProbeFixture() {
  return (
    <div className="bg-probe-dangling">
      probe fixture — GAP B genuine dangle, not supplied by any @import
    </div>
  );
}
EOF
assert_landed "$GAPB_DANGLE_DIR/src/styles.css" "--this-name-is-declared-nowhere" "GAP B dangle injection"

set +e
gapb_dangle_output="$(run_guard "$GAPB_DANGLE_DIR/src" "$GAPB_DANGLE_DIR/src/styles.css" 2>&1)"
gapb_dangle_status=$?
set -e
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
if [ "$gapb_dangle_status" -eq 1 ] && echo "$gapb_dangle_output" | grep -qF -- "--color-probe-dangling"; then
  MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
  log MUST_BLOCK "PASS — GAP B genuine dangle (not supplied by @import) — named --color-probe-dangling, exit 1"
else
  FAILURES+=("MUST_BLOCK GAP B genuine dangle — expected exit 1 naming --color-probe-dangling, got exit=$gapb_dangle_status, output:\n$gapb_dangle_output")
  log MUST_BLOCK "FAIL — GAP B genuine dangle — exit=$gapb_dangle_status"
fi

# ---------------------------------------------------------------------------
# MUST_REFUSE — unresolvable @import specifier must REFUSE TO JUDGE (exit 2),
# never a silent pass and never conflated with a real exit-1 violation.
# ---------------------------------------------------------------------------
GAPB_REFUSE_DIR="$SCRATCH/gapB-refuse"
mkdir -p "$GAPB_REFUSE_DIR/src/components/probe"
cat > "$GAPB_REFUSE_DIR/src/styles.css" <<'EOF'
@import "@vantageos/this-package-does-not-exist-anywhere/css";

@theme inline {
  --color-probe-unreachable: var(--whatever);
}
EOF
cat > "$GAPB_REFUSE_DIR/src/components/probe/ProbeFixture.tsx" <<'EOF'
export function ProbeFixture() {
  return <div className="bg-probe-unreachable">probe fixture — unresolvable @import</div>;
}
EOF
assert_landed "$GAPB_REFUSE_DIR/src/styles.css" "@vantageos/this-package-does-not-exist-anywhere" "MUST_REFUSE injection"

set +e
gapb_refuse_output="$(run_guard "$GAPB_REFUSE_DIR/src" "$GAPB_REFUSE_DIR/src/styles.css" 2>&1)"
gapb_refuse_status=$?
set -e
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
if [ "$gapb_refuse_status" -eq 2 ] && echo "$gapb_refuse_output" | grep -qF -- "REFUSES TO JUDGE"; then
  MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
  log MUST_BLOCK "PASS — unresolvable @import specifier — exit 2 REFUSES TO JUDGE, distinguishable from exit 1"
else
  FAILURES+=("MUST_REFUSE unresolvable @import — expected exit 2 with REFUSES TO JUDGE, got exit=$gapb_refuse_status, output:\n$gapb_refuse_output")
  log MUST_BLOCK "FAIL — unresolvable @import specifier — exit=$gapb_refuse_status"
fi

# ---------------------------------------------------------------------------
# FORM 2 — `var(--color-<token>)` read from a JS string (how MosaicArtifactChart
# hands colours to recharts). Domain of consumption forms: (1) utility class,
# (2) var() reference in a string literal. Each case seeds its OWN fixture.
#
# Near-misses chosen from the guard's own logic (what must NOT count as
# consumption):
#   - `var(--probe-series)` — no `--color-` prefix. The guard's namespace is
#     the `--color-<token>` row Tailwind reads; the raw variable is a
#     different property, and referencing it leaves the theme row unused.
#   - the token inside a COMMENT only (`//` and `/* */`) — prose is not
#     consumption; the guard scans string literals with comments skipped.
#   - `var(--color-probe-${i})` — a run-time-built name: unreadable
#     statically, so it must not silently count (loud STALE, stated in the
#     guard header as a deliberate non-coverage).
# ---------------------------------------------------------------------------
write_var_fixture() { # $1 dir  $2 component body  $3.. declared tokens
  local dir="$1" body="$2"; shift 2
  mkdir -p "$dir/src/components/probe"
  printf '%s\n' "$body" > "$dir/src/components/probe/ProbeFixture.tsx"
  { echo "@theme inline {"; for t in "$@"; do echo "  --color-$t: var(--$t);"; done; echo "}"; echo ":root {"; for t in "$@"; do echo "  --$t: oklch(0.5 0.1 250);"; done; echo "}"; } > "$dir/src/styles.css"
}

expect() { # $1 kind(MUST_PASS|MUST_BLOCK) $2 label $3 dir $4 needle-or-empty
  local kind="$1" label="$2" dir="$3" needle="$4" out st
  set +e
  out="$(run_guard "$dir/src" "$dir/src/styles.css" 2>&1)"; st=$?
  set -e
  if [ "$kind" = MUST_PASS ]; then
    MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
    if [ "$st" -eq 0 ]; then MUST_PASS_PASS=$((MUST_PASS_PASS + 1)); log MUST_PASS "PASS — $label — exit 0"
    else FAILURES+=("MUST_PASS $label — exit=$st, output:\n$out"); log MUST_PASS "FAIL — $label — exit=$st"; fi
  else
    MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
    if [ "$st" -eq 1 ] && echo "$out" | grep -qF -- "$needle"; then MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1)); log MUST_BLOCK "PASS — $label — guard named $needle, exit 1"
    else FAILURES+=("MUST_BLOCK $label — exit=$st, output:\n$out"); log MUST_BLOCK "FAIL — $label — exit=$st"; fi
  fi
}

V1="$SCRATCH/var-pass"
write_var_fixture "$V1" 'const SERIES = ["var(--color-probe-dq)", '"'var(--color-probe-sq, #fff)'"', `var(--color-probe-tpl)`, "var( --color-probe-ws )"];
export function ProbeFixture() { return <div>{SERIES.length}</div>; }' probe-dq probe-sq probe-tpl probe-ws
assert_landed "$V1/src/components/probe/ProbeFixture.tsx" "var(--color-probe-sq, #fff)" "FORM 2 pass injection"
expect MUST_PASS "FORM 2 — tokens declared and referenced ONLY as var(--color-<token>) in JS strings (dq, sq+fallback, template, spaced)" "$V1" ""

V2="$SCRATCH/var-stale"
write_var_fixture "$V2" 'export function ProbeFixture() { return <div>nothing uses the token</div>; }' probe-nowhere
assert_landed "$V2/src/styles.css" "--color-probe-nowhere" "FORM 2 stale injection"
expect MUST_BLOCK "FORM 2 — declared token referenced in NO form is still STALE" "$V2" "--color-probe-nowhere"

V3="$SCRATCH/var-undeclared"
write_var_fixture "$V3" 'const C = ["var(--color-probe-declared)", "var(--color-probe-phantom)"];
export function ProbeFixture() { return <div>{C.length}</div>; }' probe-declared
assert_landed "$V3/src/components/probe/ProbeFixture.tsx" "var(--color-probe-phantom)" "FORM 2 undeclared injection"
expect MUST_BLOCK "FORM 2 — var(--color-<token>) to a token styles.css does not declare" "$V3" "--color-probe-phantom"

V4="$SCRATCH/var-noprefix"
write_var_fixture "$V4" 'const C = ["var(--probe-series)"];
export function ProbeFixture() { return <div>{C.length}</div>; }' probe-series
assert_landed "$V4/src/components/probe/ProbeFixture.tsx" "var(--probe-series)" "near-miss no-prefix injection"
expect MUST_BLOCK "near-miss — var(--probe-series) without --color- prefix is not consumption" "$V4" "--color-probe-series"

V5="$SCRATCH/var-comment"
write_var_fixture "$V5" '// uses var(--color-probe-series) someday
/* also var(--color-probe-series) and probe-series */
export function ProbeFixture() { return <div>comment only</div>; }' probe-series
assert_landed "$V5/src/components/probe/ProbeFixture.tsx" "var(--color-probe-series)" "near-miss comment injection"
expect MUST_BLOCK "near-miss — token named in comments only (// and /* */) is not consumption" "$V5" "--color-probe-series"

V6="$SCRATCH/var-dynamic"
write_var_fixture "$V6" 'export function ProbeFixture({ i }: { i: number }) { return <div style={{ color: `var(--color-probe-dyn-${i})` }} />; }' probe-dyn-1
assert_landed "$V6/src/components/probe/ProbeFixture.tsx" 'var(--color-probe-dyn-${i})' "near-miss dynamic injection"
expect MUST_BLOCK "near-miss — run-time-built var(--color-probe-dyn-\${i}) does not silently count" "$V6" "--color-probe-dyn-1"

# ---------------------------------------------------------------------------
# CASE — `var(...)` detection is case-INSENSITIVE, the declared-token lookup is
# case-SENSITIVE. The one regex (VAR_COLOR_REF_RE) had both faces wrong:
#   - `VAR(--color-chart-3)` (valid CSS: function names are case-insensitive)
#     was invisible, so its declared row read STALE            (over-block)
#   - `var(--color-Primary)` (custom properties are case-SENSITIVE, so this is
#     NOT the declared `--color-primary` and paints nothing) was invisible, so
#     the guard exited 0                                        (under-block)
#
# Per guard-formulation-census, these poles are NOT written in a shape the
# matcher already knows on a fixture this probe authors. Each is injected into
# a COPY of a REAL source file from this repo's own src/ tree, against this
# repo's real src/styles.css:
#   MUST_PASS  <- src/components/artifact-chart/MosaicArtifactChart.tsx, the
#                 ONLY consumer of `--color-chart-3` (line "var(--color-chart-3)"
#                 rewritten to "VAR(--color-chart-3)")
#   MUST_BLOCK <- src/components/toast/MosaicToast.tsx, with a mixed-case
#                 reference appended while `--color-primary` IS declared in the
#                 real styles.css (so a lowercased comparison would wrongly pass)
# Each injection is grep-asserted to have landed before the verdict is read,
# and the real tree is proven untouched (copies only).
# ---------------------------------------------------------------------------
REAL_SRC_REL="src"
make_real_copy() { # $1 dest
  mkdir -p "$1"
  cp -R "$REPO_ROOT/src" "$1/src"
}
REAL_STYLES_DECLARES_PRIMARY="$(grep -cE '^[[:space:]]*--color-primary:' "$REPO_ROOT/src/styles.css" || true)"
if [ "$REAL_STYLES_DECLARES_PRIMARY" -lt 1 ]; then
  echo "probe: real src/styles.css no longer declares --color-primary — the case-sensitivity pole has lost its anchor; re-pick a declared token." >&2
  exit 1
fi

# Baseline on the untouched real copy: must be clean, else the poles below
# would be judged against an already-dirty tree.
CASE_BASE="$SCRATCH/case-base"
make_real_copy "$CASE_BASE"
expect MUST_PASS "CASE baseline — unmutated copy of the real src/ tree is clean" "$CASE_BASE" ""

CASE_UPPER="$SCRATCH/case-upper-var"
make_real_copy "$CASE_UPPER"
CHART_REAL="$CASE_UPPER/src/components/artifact-chart/MosaicArtifactChart.tsx"
grep -qF -- '"var(--color-chart-3)"' "$CHART_REAL" || { echo "probe: real MosaicArtifactChart.tsx no longer has the anchor \"var(--color-chart-3)\" — re-pick a real consumer." >&2; exit 1; }
sed -i 's/"var(--color-chart-3)"/"VAR(--color-chart-3)"/' "$CHART_REAL"
assert_landed "$CHART_REAL" 'VAR(--color-chart-3)' "CASE upper-VAR injection (MosaicArtifactChart.tsx)"
if grep -qF -- '"var(--color-chart-3)"' "$CHART_REAL"; then echo "probe: lowercase original survived the rewrite — another consumer exists, pole invalid." >&2; exit 1; fi
expect MUST_PASS "CASE — uppercase VAR(--color-chart-3) (real MosaicArtifactChart.tsx) still counts as consumption, NOT reported STALE" "$CASE_UPPER" ""

CASE_MIXED="$SCRATCH/case-mixed-token"
make_real_copy "$CASE_MIXED"
TOAST_REAL="$CASE_MIXED/src/components/toast/MosaicToast.tsx"
printf '\nconst __probeMixedCase = "var(--color-Primary)";\nvoid __probeMixedCase;\n' >> "$TOAST_REAL"
assert_landed "$TOAST_REAL" 'var(--color-Primary)' "CASE mixed-case injection (MosaicToast.tsx)"
expect MUST_BLOCK "CASE — var(--color-Primary) (real MosaicToast.tsx) is a DIFFERENT property from declared --color-primary, NAMED undeclared" "$CASE_MIXED" "--color-Primary"

# ---------------------------------------------------------------------------
# CASE, prefix half — the `--color-` PREFIX is case-sensitive too. A custom
# property is case-SENSITIVE prefix included, so `--COLOR-chart-1` is a
# different property from the declared `--color-chart-1` and resolves to
# nothing. A detector that is case-insensitive over the WHOLE pattern reads it
# as the declared one: an under-block (F6) and a hidden STALE (F7). Both are
# injected into a copy of a REAL file; the premise (nothing declares the
# uppercase form) is asserted, not assumed.
# ---------------------------------------------------------------------------
if grep -qF -- '--COLOR-' "$REPO_ROOT/src/styles.css"; then
  echo "probe: real src/styles.css now declares an uppercase --COLOR- property — F6/F7 premise lost." >&2
  exit 1
fi

# F6 MUST_BLOCK — origin file: src/components/toast/MosaicToast.tsx
CASE_F6="$SCRATCH/case-f6-upper-prefix"
make_real_copy "$CASE_F6"
F6_FILE="$CASE_F6/src/components/toast/MosaicToast.tsx"
printf '\nconst __probeF6 = "var(--COLOR-chart-1)";\nvoid __probeF6;\n' >> "$F6_FILE"
assert_landed "$F6_FILE" 'var(--COLOR-chart-1)' "F6 upper-prefix injection (MosaicToast.tsx)"
expect MUST_BLOCK "F6 — var(--COLOR-chart-1) (real MosaicToast.tsx) is NOT the declared --color-chart-1, NAMED undeclared" "$CASE_F6" "--COLOR-chart-1"

# F7 MUST_BLOCK — origin file: src/components/artifact-chart/MosaicArtifactChart.tsx,
# the only consumer of --color-chart-3, rewritten to the upper-prefix form.
CASE_F7="$SCRATCH/case-f7-upper-prefix-stale"
make_real_copy "$CASE_F7"
F7_FILE="$CASE_F7/src/components/artifact-chart/MosaicArtifactChart.tsx"
grep -qF -- '"var(--color-chart-3)"' "$F7_FILE" || { echo "probe: real MosaicArtifactChart.tsx no longer has the anchor \"var(--color-chart-3)\" — re-pick a real consumer." >&2; exit 1; }
sed -i 's/"var(--color-chart-3)"/"var(--COLOR-chart-3)"/' "$F7_FILE"
assert_landed "$F7_FILE" 'var(--COLOR-chart-3)' "F7 upper-prefix injection (MosaicArtifactChart.tsx)"
if grep -qF -- '"var(--color-chart-3)"' "$F7_FILE"; then echo "probe: lowercase original survived the rewrite — another consumer exists, F7 invalid." >&2; exit 1; fi
expect MUST_BLOCK "F7 — --color-chart-3 consumed ONLY as var(--COLOR-chart-3) (real MosaicArtifactChart.tsx) is reported STALE" "$CASE_F7" "--color-chart-3 "

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

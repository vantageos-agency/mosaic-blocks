#!/usr/bin/env bash
# probe-no-hardcoded-words-guard.sh — bipolar bite-probe for
# scripts/no-hardcoded-words-guard.mjs, run on REAL component source the
# guard's author did not write for this probe (existing, already-shipped
# component files this branch does not otherwise touch).
#
# Per .claude/rules/derive-never-type.md and
# .claude/rules/guard-formulation-census.md: a bipolar probe alone is not
# enough, and neither is a single mutation — this guard exists specifically
# because a single-formulation source grep missed THREE of the four forms it
# now must cover. So this probe injects ONE mutation PER FORM into FOUR
# different, currently-clean, real component files, asserts each mutation
# actually LANDED (grep) before trusting any verdict, builds the REAL bundle
# from that mutated tree, and asserts the guard names every one of them.
#
# Forms covered (MUST_BLOCK):
#   1. children:     MosaicBadge.tsx        — hardcoded JSX text child
#   2. aria-label     MosaicAvatar.tsx        — hardcoded WAI-ARIA attribute value
#   3. placeholder    MosaicInput.tsx         — hardcoded WAI-ARIA/HTML attribute value
#   4. concatenation   MosaicIntegrationsBadge.tsx — `` `Remove ${label}` `` template literal
#   5. prose-marker immunity — an escape-hatch marker merely MENTIONED in a
#      commit message / comment (not anchored at start-of-line before the
#      offending statement) must NOT disable the guard — the same class of
#      self-disabling bug release-artifacts-guard's own probe exists to close.
#   6-8. ratchet grown / stale / reviewer-reinject — see below.
#   9. ratchet LOOSE BUDGET — a real BASELINE row's declared `maxCount`
#      widened above its actual bundle count (8 -> 99 for "Select "), with
#      ZERO component change. This is the exact hole a reviewer proved by
#      mutation: the guard must derive the current count from the artifact
#      and block when the declared ceiling sits above it, naming both
#      numbers — never trust a hand-editable number to only ever shrink.
#
# MUST_PASS:
#   6. A brand-new, harmless component using ONLY Tailwind-utility classes,
#      WAI-ARIA enum values, kebab data-slot identifiers, camelCase SVG
#      attribute values, and a KeyboardEvent.key comparison — must add ZERO
#      new offenders to the baseline count.
#   7. A genuine violation carrying the WRITTEN, anchored
#      `// allow-hardcoded-word: <reason>` marker immediately above it — must
#      NOT be reported.
#
# Usage: bash scripts/tests/probe-no-hardcoded-words-guard.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Resolved via git itself — never a hand-typed absolute path (see
# probe-release-artifacts-guard.sh's own header note on exactly this defect).
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
# 0. Snapshot the INVOKING worktree's own diff (it may legitimately carry
#    in-progress, not-yet-committed edits — none of this probe's business),
#    then clone the real repo (full history + all refs) into scratch.
# ---------------------------------------------------------------------------
PRE_PROBE_DIFF="$(cd "$REPO_ROOT" && git diff --stat)"

git clone --quiet "$SOURCE_REPO" "$CLONE"
git -C "$CLONE" fetch --quiet "$SOURCE_REPO" '+refs/heads/*:refs/heads/*' '+refs/remotes/origin/*:refs/remotes/origin/*' 2>/dev/null || true
git -C "$CLONE" config user.name "mosaic-blocks probe"
git -C "$CLONE" config user.email "probe@vantageos.invalid"

# RESOLVED base commit — never assumed `main` (a CI runner checking out a
# pull_request has no local `main`, only `origin/main` / a detached HEAD).
BASE=""
for candidate in main origin/main HEAD; do
  if git -C "$CLONE" rev-parse --verify --quiet "$candidate" >/dev/null; then
    BASE="$(git -C "$CLONE" rev-parse "$candidate")"
    break
  fi
done
if [ -z "$BASE" ]; then
  echo "probe: no base commit resolvable (tried: main, origin/main, HEAD) in the clone." >&2
  echo "probe: refusing to run — a setup failure must never be read as a pass." >&2
  exit 1
fi

# This branch's own copy of the guard is the ONE thing legitimately "ours"
# in this probe — every component file below is untouched, real, shipped
# source. Install deps once (mutations never touch package.json) — reused
# by every build below.
git -C "$CLONE" checkout --quiet -b probe-base "$BASE"
cp "$REPO_ROOT/scripts/no-hardcoded-words-guard.mjs" "$CLONE/scripts/no-hardcoded-words-guard.mjs"
(cd "$CLONE" && pnpm install --frozen-lockfile --silent >/dev/null 2>&1) || {
  echo "probe: \`pnpm install\` failed in the scratch clone — cannot build anything, refusing to report a pass." >&2
  exit 1
}

run_guard() {
  # Re-install the guard on every call: it is never part of any probe
  # commit (it is our own tool under test, not the "foreign material").
  cp "$REPO_ROOT/scripts/no-hardcoded-words-guard.mjs" "$CLONE/scripts/no-hardcoded-words-guard.mjs"
  (cd "$CLONE" && node scripts/no-hardcoded-words-guard.mjs)
}

build_clone() {
  (cd "$CLONE" && pnpm build >/tmp/probe-build.log 2>&1) || {
    echo "probe: \`pnpm build\` failed in the scratch clone. Log:" >&2
    cat /tmp/probe-build.log >&2
    return 1
  }
}

# ---------------------------------------------------------------------------
# Baseline build — establishes the "no NEW false positive" reference count
# for MUST_PASS #6. Derived from the actual clean tree, never hardcoded.
# ---------------------------------------------------------------------------
log INFO "building clean baseline (this takes ~15-25s)..."
if ! build_clone; then
  FAILURES+=("baseline build — pnpm build failed on clean $BASE, cannot establish a reference count")
  BASELINE_COUNT=""
else
  set +e
  baseline_output="$(run_guard 2>&1)"
  set -e
  BASELINE_COUNT="$(echo "$baseline_output" | grep -c '^  - ' || true)"
  log INFO "baseline offender count on clean $BASE: $BASELINE_COUNT (guard is EXPECTED to be red here until the known offenders are fixed by other PRs — that is correct)"
fi

# ---------------------------------------------------------------------------
# MUST_BLOCK #1-4 — one real component file per form, one hardcoded literal
# injected into each, on a single branch off $BASE (all four are foreign,
# pre-existing, currently-clean files this guard's author did not write for
# this probe).
# ---------------------------------------------------------------------------
git -C "$CLONE" checkout --quiet -b probe-block-forms "$BASE"

# Form 1 — children:
python3 - "$CLONE/src/components/badge/MosaicBadge.tsx" <<'PYEOF'
import sys
path = sys.argv[1]
with open(path) as f:
    text = f.read()
needle = "      className={cn(badgeVariants({ variant }), className)}\n      {...props}\n    />"
replacement = (
    "      className={cn(badgeVariants({ variant }), className)}\n"
    "      {...props}\n"
    "    >\n"
    "      Coming soon\n"
    "    </span>"
)
if needle not in text:
    raise SystemExit(f"probe: injection anchor not found in {path}")
text = text.replace(needle, replacement)
with open(path, "w") as f:
    f.write(text)
PYEOF

# Form 2 — aria-label
python3 - "$CLONE/src/components/avatar/MosaicAvatar.tsx" <<'PYEOF'
import sys
path = sys.argv[1]
with open(path) as f:
    text = f.read()
needle = '      ref={ref}\n      data-slot="avatar"\n'
replacement = '      ref={ref}\n      data-slot="avatar"\n      aria-label="User avatar"\n'
if needle not in text:
    raise SystemExit(f"probe: injection anchor not found in {path}")
text = text.replace(needle, replacement, 1)
with open(path, "w") as f:
    f.write(text)
PYEOF

# Form 3 — placeholder
python3 - "$CLONE/src/components/input/MosaicInput.tsx" <<'PYEOF'
import sys
path = sys.argv[1]
with open(path) as f:
    text = f.read()
needle = '      ref={ref as React.Ref<HTMLElement>}\n      data-slot="input"\n'
replacement = '      ref={ref as React.Ref<HTMLElement>}\n      data-slot="input"\n      placeholder="Enter value"\n'
if needle not in text:
    raise SystemExit(f"probe: injection anchor not found in {path}")
text = text.replace(needle, replacement, 1)
with open(path, "w") as f:
    f.write(text)
PYEOF

# Form 4 — concatenation (template literal)
python3 - "$CLONE/src/components/integrations-badge/MosaicIntegrationsBadge.tsx" <<'PYEOF'
import sys
path = sys.argv[1]
with open(path) as f:
    text = f.read()
needle = '        rel={target === "_blank" ? "noopener noreferrer" : undefined}\n        className={cn(badgeClass, hoverClass, className)}\n'
replacement = (
    '        rel={target === "_blank" ? "noopener noreferrer" : undefined}\n'
    '        title={`Remove ${label}`}\n'
    '        className={cn(badgeClass, hoverClass, className)}\n'
)
if needle not in text:
    raise SystemExit(f"probe: injection anchor not found in {path}")
text = text.replace(needle, replacement, 1)
with open(path, "w") as f:
    f.write(text)
PYEOF

# Assert every mutation LANDED before trusting anything.
declare -A LAND_CHECKS=(
  ["$CLONE/src/components/badge/MosaicBadge.tsx"]="Coming soon"
  ["$CLONE/src/components/avatar/MosaicAvatar.tsx"]="aria-label=\"User avatar\""
  ["$CLONE/src/components/input/MosaicInput.tsx"]="placeholder=\"Enter value\""
  ["$CLONE/src/components/integrations-badge/MosaicIntegrationsBadge.tsx"]="Remove \${label}"
)
LANDING_OK=true
for file in "${!LAND_CHECKS[@]}"; do
  anchor="${LAND_CHECKS[$file]}"
  if ! grep -qF -- "$anchor" "$file"; then
    FAILURES+=("MUST_BLOCK injection did NOT land in $file (anchor \"$anchor\" absent) — probe invalid")
    LANDING_OK=false
  fi
done

if [ "$LANDING_OK" = true ]; then
  (cd "$CLONE" && git add -A && git commit --quiet -m "probe: inject one hardcoded-word form per real component (children/aria-label/placeholder/concatenation)")
  log INFO "building form-injection tree (this takes ~15-25s)..."
  if ! build_clone; then
    FAILURES+=("MUST_BLOCK forms build — pnpm build failed on the mutated tree")
  else
    set +e
    output="$(run_guard 2>&1)"
    status=$?
    set -e
    # The guard reports `dist/index.cjs:<line>` — NOT a source file name (see
    # its own header comment on why file attribution was deliberately
    # dropped) — so each case is checked by the offending SNIPPET text only.
    FORM_CHECKS=(
      "children: (MosaicBadge \"Coming soon\")|Coming soon"
      "aria-label (MosaicAvatar \"User avatar\")|User avatar"
      "placeholder (MosaicInput \"Enter value\")|Enter value"
      "concatenation (MosaicIntegrationsBadge \"Remove \")|Remove "
    )
    for case_desc in "${FORM_CHECKS[@]}"; do
      IFS='|' read -r label snippet_pattern <<< "$case_desc"
      MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
      if [ "$status" -ne 0 ] && echo "$output" | grep -qF "$snippet_pattern"; then
        MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
        log MUST_BLOCK "PASS — $label — guard named \"$snippet_pattern\""
      else
        FAILURES+=("MUST_BLOCK $label — guard exited $status or did not name \"$snippet_pattern\"")
        log MUST_BLOCK "FAIL — $label — exit=$status"
      fi
    done
    # Extra rigor: the offender COUNT must have grown by exactly one line per
    # injected form that is genuinely NEW — not just "some" new entries, which
    # could mask a form silently failing to be counted at all.
    #
    # The delta is DERIVED, never typed. A hardcoded "+ 4" silently assumed
    # every injected value was absent from BASELINE; the moment one of them is
    # a baselined value (`Remove ` is, today), that injection GROWS an existing
    # row instead of opening a new one, the true delta is 3, and the probe
    # failed while the guard behaved perfectly. Ask BASELINE which of the
    # injected values it already declares.
    if [ -n "$BASELINE_COUNT" ]; then
      form_count="$(echo "$output" | grep -c '^  - ' || true)"
      new_forms=0
      for case_desc in "${FORM_CHECKS[@]}"; do
        IFS='|' read -r _label snippet_pattern <<< "$case_desc"
        if ! PROBE_SNIPPET="$snippet_pattern" python3 - "$REPO_ROOT/scripts/no-hardcoded-words-guard.mjs" <<'BASELINEQ'
import os
import re
import sys
with open(sys.argv[1]) as f:
    text = f.read()
rows = [m[0] for m in re.findall(r'value:\s*"((?:[^"\\]|\\.)*)"\s*,\s*\n\s*maxCount:\s*(\d+)\s*,', text)]
if not rows:
    raise SystemExit("probe: BASELINE declares NO rows — cannot derive the expected offender delta. Refusing.")
sys.exit(0 if os.environ["PROBE_SNIPPET"] in rows else 1)
BASELINEQ
        then
          new_forms=$((new_forms + 1))
        fi
      done
      echo "[INFO] derived expected offender delta: $new_forms of ${#FORM_CHECKS[@]} injected forms are absent from BASELINE (the rest GROW an existing row)"
      expected=$((BASELINE_COUNT + new_forms))
      if [ "$form_count" -ne "$expected" ]; then
        FAILURES+=("MUST_BLOCK forms — offender count is $form_count, expected exactly $expected (baseline $BASELINE_COUNT + $new_forms injected forms absent from BASELINE)")
      fi
    fi
  fi
else
  MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 4))
fi

(cd "$CLONE" && git checkout --quiet "$BASE" -- . && git clean -fdq && git checkout --quiet "$BASE" && git branch -D --quiet probe-block-forms)

# ---------------------------------------------------------------------------
# MUST_BLOCK #5 — the marker MENTIONED IN PROSE (not anchored at start of
# its own line, immediately before the offending statement) must NOT
# disable the guard. Same class of self-disabling bug the release-artifacts
# probe exists to close (see its own header comment).
#
# SEEDED, not anchored on existing source: this case used to anchor on
# MosaicOrgPanel.tsx's `member: { label: "Member", ... }` role-config object
# literal. PR #101 turned that literal into a host-supplied prop and deleted
# the object entirely — the anchor vanished from `main`, and the probe died
# at setup ("injection anchor not found") even though the case had nothing
# to do with PR #101. A probe anchored on code a fix PR may legitimately
# delete is a landmine timed to detonate at merge. Per
# .claude/rules/guard-formulation-census.md this probe now SEEDS its own
# fixture — content it owns — instead of hunting for material it does not
# control.
#
# NOTE ON POSITION (still true, now proven against a fixture this probe
# authors): a `//` comment placed immediately before a `return (` or a JSX
# attribute/child is STRIPPED ENTIRELY by esbuild's JSX transform and never
# reaches the bundle at all — testing the marker there would be VACUOUS (the
# guard "blocks" only because the comment never existed to test anchoring
# against). A `//` comment interleaved between OBJECT-LITERAL PROPERTIES,
# however, DOES survive unminified esbuild output — that is the shape seeded
# here and in MUST_PASS #7 below, so the anchoring behaviour is actually
# exercised.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
PROSE_MARKER_VALUE="Probeshortlabel"
if grep -rqF "$PROSE_MARKER_VALUE" "$CLONE/src" 2>/dev/null; then
  echo "probe: seeded value \"$PROSE_MARKER_VALUE\" ALREADY exists in the clone's sources — it would not be a subject this probe controls. Refusing to run MUST_BLOCK #5." >&2
  exit 1
fi
git -C "$CLONE" checkout --quiet -b probe-block-prose "$BASE"
mkdir -p "$CLONE/src/components/probe-prose-marker-seed"
cat > "$CLONE/src/components/probe-prose-marker-seed/MosaicProbeProseMarkerSeed.tsx" <<'SEEDEOF'
import * as React from "react";

// Object literal mirroring a real per-role config shape (label + description
// per key) — the comment BETWEEN properties below is the thing under test.
const probeProseMarkerSeedConfig = {
  member: {
    // This mentions allow-hardcoded-word in PROSE only — it does not
    // DECLARE the marker (no colon-delimited reason on its own anchored
    // line), so it must not disable the guard for the literal below.
    label: "Probeshortlabel",
  },
};

export const MosaicProbeProseMarkerSeed = React.forwardRef<HTMLSpanElement>((_props, ref) => (
  <span ref={ref}>{probeProseMarkerSeedConfig.member.label}</span>
));
MosaicProbeProseMarkerSeed.displayName = "MosaicProbeProseMarkerSeed";
SEEDEOF
printf '\nexport { MosaicProbeProseMarkerSeed } from "./components/probe-prose-marker-seed/MosaicProbeProseMarkerSeed";\n' >> "$CLONE/src/index.ts"
if ! grep -qF "This mentions allow-hardcoded-word in PROSE only" "$CLONE/src/components/probe-prose-marker-seed/MosaicProbeProseMarkerSeed.tsx"; then
  FAILURES+=("MUST_BLOCK prose-marker — seeded fixture did NOT land — probe invalid")
else
  (cd "$CLONE" && git add -A && git commit --quiet -m "probe: prose merely mentions allow-hardcoded-word, does not declare it")
  log INFO "building prose-marker tree (this takes ~15-25s)..."
  if ! build_clone; then
    FAILURES+=("MUST_BLOCK prose-marker build — pnpm build failed")
  elif ! grep -qF "$PROSE_MARKER_VALUE" "$CLONE/dist/index.cjs"; then
    FAILURES+=("MUST_BLOCK prose-marker — seeded value never reached the bundle — probe invalid")
  else
    set +e
    output="$(run_guard 2>&1)"
    status=$?
    set -e
    if [ "$status" -ne 0 ] && echo "$output" | grep -qF "$PROSE_MARKER_VALUE"; then
      MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
      log MUST_BLOCK "PASS — marker mentioned only in PROSE does not disable the guard — still blocked"
    else
      FAILURES+=("MUST_BLOCK prose-marker — guard exited $status (expected non-zero) or did not name the offender — output: $output")
      log MUST_BLOCK "FAIL — prose-quoted marker DISABLED the guard — exit=$status"
    fi
  fi
fi
(cd "$CLONE" && git checkout --quiet "$BASE" -- . && git clean -fdq && git checkout --quiet "$BASE" && git branch -D --quiet probe-block-prose)

# add_baseline_row is shared by MUST_BLOCK #6/#7/#8 below (all three seed
# their own row rather than reading the real, possibly-empty BASELINE) —
# defined once here so #6 can use it; redefined identically ahead of #7/#8
# for readability at their point of use (harmless — same body).
add_baseline_row() {
  # $1 = guard file to edit, $2 = value, $3 = maxCount
  PROBE_ROW_VALUE="$2" PROBE_ROW_MAX="$3" python3 - "$1" <<'ROWEOF'
import os
import re
import sys
path = sys.argv[1]
value = os.environ["PROBE_ROW_VALUE"]
maxc = os.environ["PROBE_ROW_MAX"]
with open(path) as f:
    text = f.read()
row = (
    '  {\n'
    '    value: "%s",\n'
    '    maxCount: %s,\n'
    '    note: "probe-seeded ratchet subject — restored before merge.",\n'
    '  },\n' % (value, maxc)
)
new_text, n = re.subn(r'^const BASELINE = \[\n', 'const BASELINE = [\n' + row, text, count=1, flags=re.M)
if n != 1:
    raise SystemExit("probe: could not find `const BASELINE = [` to seed a row into — probe invalid")
with open(path, "w") as f:
    f.write(new_text)
ROWEOF
}

# ---------------------------------------------------------------------------
# MUST_BLOCK #6 (RATCHET — baseline entry GROWS) — an extra occurrence of a
# BASELINE-declared value, beyond its declared maxCount, must BLOCK, naming
# the growth. This is the ratchet's pawl: a baseline value existing today
# must never be allowed to spread to a NEW site, even though it is not
# itself a "new" string.
#
# SEEDED, not derived from the real BASELINE: this case used to derive its
# subject by reading the first row out of the guard's live BASELINE array.
# That works only while BASELINE is non-empty — the moment the ratchet
# reaches its intended terminal state (BASELINE == [], "this guard is now
# absolute"), there is no row left to grow, and the case can never run
# again. A test whose ability to execute depends on the fix-in-progress
# NEVER finishing is backwards. So, like #7/#8 below, this case now seeds
# its own row AND its own matching occurrence: content this probe owns,
# never ambient state read off the artifact under test.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
GROWN_SEED_VALUE="Probeseededgrowthsubject"
if grep -rqF "$GROWN_SEED_VALUE" "$CLONE/src" 2>/dev/null; then
  echo "probe: seeded value \"$GROWN_SEED_VALUE\" ALREADY exists in the clone's sources — it would not be a subject this probe controls. Refusing to run MUST_BLOCK #6." >&2
  exit 1
fi
git -C "$CLONE" checkout --quiet -b probe-block-grown "$BASE"
mkdir -p "$CLONE/src/components/probe-growth-seed"
cat > "$CLONE/src/components/probe-growth-seed/MosaicProbeGrowthSeed.tsx" <<SEEDEOF
import * as React from "react";

export const MosaicProbeGrowthSeed = React.forwardRef<HTMLSpanElement>((_props, ref) => (
  <span ref={ref}>$GROWN_SEED_VALUE</span>
));
MosaicProbeGrowthSeed.displayName = "MosaicProbeGrowthSeed";
SEEDEOF
printf '\nexport { MosaicProbeGrowthSeed } from "./components/probe-growth-seed/MosaicProbeGrowthSeed";\n' >> "$CLONE/src/index.ts"
# A second, independent site emits the SAME value — this is the site the
# guard's declared maxCount=1 row (seeded below) does NOT account for, i.e.
# the growth.
python3 - "$CLONE/src/components/checkbox/MosaicCheckbox.tsx" <<PYEOF
import sys
path = sys.argv[1]
with open(path) as f:
    text = f.read()
needle = '    <Checkbox.Root\n      ref={ref}\n      data-slot="checkbox"\n'
injected = '      title={"$GROWN_SEED_VALUE"}\n'
replacement = (
    '    <Checkbox.Root\n'
    '      ref={ref}\n'
    '      data-slot="checkbox"\n'
    + injected
)
if needle not in text:
    raise SystemExit(f"probe: injection anchor not found in {path}")
text = text.replace(needle, replacement, 1)
with open(path, "w") as f:
    f.write(text)
PYEOF
if ! grep -qF "title={\"$GROWN_SEED_VALUE\"}" "$CLONE/src/components/checkbox/MosaicCheckbox.tsx"; then
  FAILURES+=("MUST_BLOCK ratchet-grown — 2nd-site mutation did NOT land — probe invalid")
else
  cp "$REPO_ROOT/scripts/no-hardcoded-words-guard.mjs" "$CLONE/scripts/no-hardcoded-words-guard.mjs"
  add_baseline_row "$CLONE/scripts/no-hardcoded-words-guard.mjs" "$GROWN_SEED_VALUE" 1
  if ! grep -qF "value: \"$GROWN_SEED_VALUE\"" "$CLONE/scripts/no-hardcoded-words-guard.mjs"; then
    FAILURES+=("MUST_BLOCK ratchet-grown — seeded BASELINE row did NOT land — probe invalid")
  else
    (cd "$CLONE" && git add -A && git commit --quiet -m "probe: seeded BASELINE row (maxCount=1) plus a 2nd site of the same value — must grow-block")
    log INFO "building ratchet-grown tree (this takes ~15-25s)..."
    if ! build_clone; then
      FAILURES+=("MUST_BLOCK ratchet-grown build — pnpm build failed")
    else
      set +e
      output="$(cd "$CLONE" && NO_HARDCODED_WORDS_DIST="$CLONE/dist/index.cjs" node "$CLONE/scripts/no-hardcoded-words-guard.mjs" 2>&1)"
      status=$?
      set -e
      if [ "$status" -ne 0 ] && echo "$output" | grep -qF "GREW" && echo "$output" | grep -qF "\"$GROWN_SEED_VALUE\""; then
        MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
        log MUST_BLOCK "PASS — ratchet-grown — extra '$GROWN_SEED_VALUE' occurrence blocked as BASELINE growth"
      else
        FAILURES+=("MUST_BLOCK ratchet-grown — guard exited $status (expected non-zero) or did not name the grown BASELINE entry — output: $output")
        log MUST_BLOCK "FAIL — ratchet-grown — exit=$status"
      fi
    fi
  fi
fi
(cd "$CLONE" && git checkout --quiet "$BASE" -- . && git clean -fdq && git checkout --quiet "$BASE" && git branch -D --quiet probe-block-grown)

# ---------------------------------------------------------------------------
# RATCHET SUBJECT (MUST_BLOCK #7 and #8) — the probe SEEDS its own subject.
#
# History, so nobody re-derives this the hard way. This section has now been
# wrong twice, in the same direction both times:
#
#   1. It hardcoded `placeholder="acme-inc"`. PR #100 turned that literal into
#      a host prop, the anchor vanished, and the probe died at setup.
#   2. It then DERIVED a subject from BASELINE by grepping the sources for the
#      DOUBLE-QUOTED form of the value. That is a mono-formulation matcher: a
#      user-facing string lives in source as `"x"`, `'x'`, a template literal
#      `` `x${...}` ``, or bare JSX text. Grepping one form found two hits that
#      DO NOT SHIP (a *.stories.tsx fixture and a line inside a JSDoc comment)
#      and MISSED the real producer, which is a template literal
#      (`aria-label={`Notifications${...}`}`). Blanking non-shipping text cannot
#      move the bundle, so rule 3 never fired and the case failed — loudly, but
#      for a reason that had nothing to do with the guard.
#
# The lesson is not "grep harder". The set of source FORMS a string can take is
# not enumerable from memory — which is exactly what
# .claude/rules/guard-formulation-census.md forbids relying on. So the probe
# stops hunting for material it does not control and SEEDS it instead:
# a unique value, in a file this probe authors, in a form it chose. The subject
# is CONTENT (a fixture the probe owns), never STATE read from the artifact —
# and every step below is asserted against the BUILT BUNDLE, never the source.
#
# Foreign-material bite proof is NOT this section's job: MUST_BLOCK #1-#4 inject
# into components the probe did not choose, and Eta's review independently bit
# three more sites (including an invented fifth prop name). This section proves
# the RATCHET RULES (3 then 1), which need a subject whose bundle count the
# probe can drive to exactly 0 and back.
# ---------------------------------------------------------------------------
RATCHET_VALUE="Probeseededratchetsubject"
RATCHET_SEED_DIR="$CLONE/src/components/probe-ratchet-seed"
RATCHET_SEED_FILE="$RATCHET_SEED_DIR/MosaicProbeRatchetSeed.tsx"
RATCHET_REINJECT_TARGET="$CLONE/src/components/checkbox/MosaicCheckbox.tsx"

# The seeded value must not already exist anywhere — otherwise "count reaches 0"
# would be a lie told by someone else's code.
if grep -rqF "$RATCHET_VALUE" "$CLONE/src" 2>/dev/null; then
  echo "probe: seeded ratchet subject \"$RATCHET_VALUE\" ALREADY exists in the clone's sources — it would not be a subject this probe controls. Refusing to run MUST_BLOCK #7/#8." >&2
  exit 1
fi

seed_ratchet_component() {
  # $1 = tree root to write into
  mkdir -p "$1/src/components/probe-ratchet-seed"
  cat > "$1/src/components/probe-ratchet-seed/MosaicProbeRatchetSeed.tsx" <<SEEDEOF
import * as React from "react";

export const MosaicProbeRatchetSeed = React.forwardRef<HTMLSpanElement>((_props, ref) => (
  <span ref={ref}>$RATCHET_VALUE</span>
));
MosaicProbeRatchetSeed.displayName = "MosaicProbeRatchetSeed";
SEEDEOF
  printf '\nexport { MosaicProbeRatchetSeed } from "./components/probe-ratchet-seed/MosaicProbeRatchetSeed";\n' >> "$1/src/index.ts"
}

add_baseline_row() {
  # $1 = guard file to edit, $2 = value, $3 = maxCount
  PROBE_ROW_VALUE="$2" PROBE_ROW_MAX="$3" python3 - "$1" <<'ROWEOF'
import os
import re
import sys
path = sys.argv[1]
value = os.environ["PROBE_ROW_VALUE"]
maxc = os.environ["PROBE_ROW_MAX"]
with open(path) as f:
    text = f.read()
row = (
    '  {\n'
    '    value: "%s",\n'
    '    maxCount: %s,\n'
    '    note: "probe-seeded ratchet subject — restored before merge.",\n'
    '  },\n' % (value, maxc)
)
new_text, n = re.subn(r'^const BASELINE = \[\n', 'const BASELINE = [\n' + row, text, count=1, flags=re.M)
if n != 1:
    raise SystemExit("probe: could not find `const BASELINE = [` to seed a row into — probe invalid")
with open(path, "w") as f:
    f.write(new_text)
ROWEOF
}

# ---------------------------------------------------------------------------
# MUST_BLOCK #7 (RATCHET — stale baseline entry) — a BASELINE row whose value
# no longer occurs in the bundle AT ALL must BLOCK, naming the row to delete.
# This is what forces every fix PR to shrink the list instead of leaving a
# permanent, silent exemption behind.
#
# Sequence: seed the component AND its BASELINE row -> the row is honest.
# Then DELETE the component (a genuine fix) while LEAVING the row -> the row is
# now stale, and rule 3 must fire and name it.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
git -C "$CLONE" checkout --quiet -b probe-block-stale "$BASE"
mkdir -p "$CLONE/scripts"
cp "$REPO_ROOT/scripts/no-hardcoded-words-guard.mjs" "$CLONE/scripts/no-hardcoded-words-guard.mjs"
add_baseline_row "$CLONE/scripts/no-hardcoded-words-guard.mjs" "$RATCHET_VALUE" 1
# The component is deliberately NOT created: the row declares a value the
# bundle does not carry, which is precisely the "fixed but undeleted" state.
if ! grep -qF "value: \"$RATCHET_VALUE\"" "$CLONE/scripts/no-hardcoded-words-guard.mjs"; then
  FAILURES+=("MUST_BLOCK ratchet-stale — seeded BASELINE row did NOT land — probe invalid")
  log MUST_BLOCK "FAIL — ratchet-stale — seed did not land"
else
  (cd "$CLONE" && git add -A && git commit --quiet -m "probe: BASELINE row for a value the bundle does not carry — must stale-block")
  log INFO "building ratchet-stale tree (this takes ~15-25s)..."
  if ! build_clone; then
    FAILURES+=("MUST_BLOCK ratchet-stale build — pnpm build failed")
  else
    # Assert the PREMISE on the ARTIFACT before reading any verdict: the value
    # must genuinely be absent from the built bundle.
    if grep -qF "$RATCHET_VALUE" "$CLONE/dist/index.cjs"; then
      FAILURES+=("MUST_BLOCK ratchet-stale — seeded value IS present in the bundle; the row is not stale — probe invalid")
      log MUST_BLOCK "FAIL — ratchet-stale — premise not met"
    else
      set +e
      output="$(cd "$CLONE" && NO_HARDCODED_WORDS_DIST="$CLONE/dist/index.cjs" node "$CLONE/scripts/no-hardcoded-words-guard.mjs" 2>&1)"
      status=$?
      set -e
      if [ "$status" -ne 0 ] && echo "$output" | grep -qF "STALE" && echo "$output" | grep -qF "\"$RATCHET_VALUE\""; then
        MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
        log MUST_BLOCK "PASS — ratchet-stale — BASELINE row for absent value '$RATCHET_VALUE' blocked, guard named the row to delete"
      else
        FAILURES+=("MUST_BLOCK ratchet-stale — guard exited $status (expected non-zero) or did not name the stale BASELINE entry — output: $output")
        log MUST_BLOCK "FAIL — ratchet-stale — exit=$status"
      fi
    fi
  fi
fi
(cd "$CLONE" && git checkout --quiet "$BASE" -- . && git clean -fdq && git checkout --quiet "$BASE" && git branch -D --quiet probe-block-stale)

# ---------------------------------------------------------------------------
# MUST_BLOCK #8 (RATCHET — the reviewer's EXACT probe) — once a value is
# genuinely fixed AND its BASELINE row correctly deleted (the two steps
# together, as a real fix PR does), re-introducing that same literal must go
# RED again as a BRAND-NEW offender under rule 1 — by construction, not by a
# special case. This is the proof the ratchet cannot be permanently disarmed
# by a string once it leaves the baseline.
#
# Sequence: BASELINE has no row for the value (nothing to delete — that is the
# post-fix state), and the value is introduced into a file that did not carry
# it. Rule 1 must fire and name it as NEW.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
git -C "$CLONE" checkout --quiet -b probe-block-reviewer-reinject "$BASE"
seed_ratchet_component "$CLONE"
if ! grep -qF "$RATCHET_VALUE" "$RATCHET_SEED_FILE"; then
  FAILURES+=("MUST_BLOCK reviewer-reinject — seeded component did NOT land — probe invalid")
  log MUST_BLOCK "FAIL — reviewer-reinject — seed did not land"
else
  (cd "$CLONE" && git add -A && git commit --quiet -m "probe: reviewer's exact scenario — re-introduce '$RATCHET_VALUE' with NO baseline row")
  log INFO "building reviewer-reinject tree (this takes ~15-25s)..."
  if ! build_clone; then
    FAILURES+=("MUST_BLOCK reviewer-reinject build — pnpm build failed")
  else
    # Assert the PREMISE on the ARTIFACT: the value must actually have reached
    # the bundle, and BASELINE must NOT declare it.
    if ! grep -qF "$RATCHET_VALUE" "$CLONE/dist/index.cjs"; then
      FAILURES+=("MUST_BLOCK reviewer-reinject — re-introduced value never reached the bundle — probe invalid")
      log MUST_BLOCK "FAIL — reviewer-reinject — mutation did not reach the artifact"
    elif grep -qF "value: \"$RATCHET_VALUE\"" "$REPO_ROOT/scripts/no-hardcoded-words-guard.mjs"; then
      FAILURES+=("MUST_BLOCK reviewer-reinject — BASELINE unexpectedly declares the seeded value — probe invalid")
      log MUST_BLOCK "FAIL — reviewer-reinject — baseline pollution"
    else
      set +e
      output="$(run_guard 2>&1)"
      status=$?
      set -e
      if [ "$status" -ne 0 ] && echo "$output" | grep -qF "$RATCHET_VALUE"; then
        MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
        log MUST_BLOCK "PASS — reviewer's exact probe — re-introduced '$RATCHET_VALUE' goes RED as a brand-new offender"
      else
        FAILURES+=("MUST_BLOCK reviewer-reinject — guard exited $status (expected non-zero) or did not name the re-introduced offender — output: $output")
        log MUST_BLOCK "FAIL — reviewer-reinject — exit=$status"
      fi
    fi
  fi
fi
(cd "$CLONE" && git checkout --quiet "$BASE" -- . && git clean -fdq && git checkout --quiet "$BASE" && git branch -D --quiet probe-block-reviewer-reinject)

# ---------------------------------------------------------------------------
# MUST_BLOCK #9 (RATCHET — the ACTUAL hole a reviewer proved by mutation) —
# widen a baseline row's declared `maxCount` ABOVE its actual bundle count,
# WITHOUT touching a single component file. The bundle never moves; only
# the number written in BASELINE does. A guard that only checks
# "current > maxCount" sees nothing wrong here — the current count is still
# below the (now-inflated) ceiling — and that silence IS the hole: it turns
# the ratchet into a plain exclusion list an author can loosen by hand
# whenever a real fix is inconvenient. The fixed guard instead compares the
# DERIVED actual count against the declared one in BOTH directions, so this
# MUST go RED, naming declared vs actual.
#
# SEEDED, not derived from the real BASELINE: this case used to read the
# first row out of the guard's live BASELINE array, exactly the same
# now-empty-BASELINE trap #6 hit above. It now seeds its own component (a
# fixed, known occurrence count) AND its own accurate row into a scratch
# clone, builds ONCE, then widens the row's maxCount on that same,
# already-built dist — the ARTIFACT is unchanged and only the guard's own
# BASELINE number moves, which is this case's whole point.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
LOOSE_VALUE="Probeseededloosebudgetsubject"
LOOSE_COUNT=2
if grep -rqF "$LOOSE_VALUE" "$CLONE/src" 2>/dev/null; then
  echo "probe: seeded value \"$LOOSE_VALUE\" ALREADY exists in the clone's sources — it would not be a subject this probe controls. Refusing to run MUST_BLOCK #9." >&2
  exit 1
fi
git -C "$CLONE" checkout --quiet -b probe-block-loose "$BASE"
mkdir -p "$CLONE/src/components/probe-loose-budget-seed"
cat > "$CLONE/src/components/probe-loose-budget-seed/MosaicProbeLooseBudgetSeed.tsx" <<SEEDEOF
import * as React from "react";

export const MosaicProbeLooseBudgetSeed = React.forwardRef<HTMLSpanElement>((_props, ref) => (
  <span ref={ref}>
    <span>$LOOSE_VALUE</span>
    <span title="$LOOSE_VALUE">occurrence two</span>
  </span>
));
MosaicProbeLooseBudgetSeed.displayName = "MosaicProbeLooseBudgetSeed";
SEEDEOF
printf '\nexport { MosaicProbeLooseBudgetSeed } from "./components/probe-loose-budget-seed/MosaicProbeLooseBudgetSeed";\n' >> "$CLONE/src/index.ts"
cp "$REPO_ROOT/scripts/no-hardcoded-words-guard.mjs" "$CLONE/scripts/no-hardcoded-words-guard.mjs"
add_baseline_row "$CLONE/scripts/no-hardcoded-words-guard.mjs" "$LOOSE_VALUE" "$LOOSE_COUNT"
if ! grep -qF "value: \"$LOOSE_VALUE\"" "$CLONE/scripts/no-hardcoded-words-guard.mjs"; then
  FAILURES+=("MUST_BLOCK loose-budget — seeded BASELINE row did NOT land — probe invalid")
  log MUST_BLOCK "FAIL — loose-budget — seed did not land"
else
  (cd "$CLONE" && git add -A && git commit --quiet -m "probe: seeded component with 2 occurrences + accurate BASELINE row (maxCount=2)")
  log INFO "building loose-budget tree (this takes ~15-25s)..."
  if ! build_clone; then
    FAILURES+=("MUST_BLOCK loose-budget build — pnpm build failed")
  elif [ "$(grep -oF "$LOOSE_VALUE" "$CLONE/dist/index.cjs" | wc -l)" -lt 2 ]; then
    FAILURES+=("MUST_BLOCK loose-budget — seeded value did not reach the bundle at least twice — premise not met, probe invalid")
  else
    MUTATED_GUARD="$SCRATCH/guard-loose-budget.mjs"
    cp "$CLONE/scripts/no-hardcoded-words-guard.mjs" "$MUTATED_GUARD"
    python3 - "$MUTATED_GUARD" "$LOOSE_VALUE" "$LOOSE_COUNT" <<'PYEOF'
import re
import sys
path, value, count = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path) as f:
    text = f.read()
pattern = re.compile(
    r'(value:\s*"' + re.escape(value) + r'"\s*,\s*\n\s*maxCount:\s*)' + re.escape(count) + r'(\s*,)'
)
new_text, n = pattern.subn(r"\g<1>99\g<2>", text, count=1)
if n != 1:
    raise SystemExit("probe: seeded row could not be widened — probe invalid")
with open(path, "w") as f:
    f.write(new_text)
PYEOF
    if ! grep -qF "maxCount: 99" "$MUTATED_GUARD"; then
      FAILURES+=("MUST_BLOCK loose-budget — mutation did NOT land in the guard copy — probe invalid")
      log MUST_BLOCK "FAIL — loose-budget — mutation did not land"
    else
      set +e
      output="$(cd "$CLONE" && NO_HARDCODED_WORDS_DIST="$CLONE/dist/index.cjs" node "$MUTATED_GUARD" 2>&1)"
      status=$?
      set -e
      if [ "$status" -ne 0 ] &&
         echo "$output" | grep -qF "\"$LOOSE_VALUE\"" &&
         echo "$output" | grep -qF "maxCount=99" &&
         echo "$output" | grep -Eq "actually has only [0-9]+ occurrence"; then
        MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
        log MUST_BLOCK "PASS — loose-budget — maxCount widened $LOOSE_COUNT->99 with zero bundle change blocked, naming declared=99 vs the actual count derived from the artifact"
      else
        FAILURES+=("MUST_BLOCK loose-budget — guard exited $status (expected non-zero) or did not name declared=99 vs the actual count it derived — output: $output")
        log MUST_BLOCK "FAIL — loose-budget — exit=$status"
      fi
    fi
  fi
fi
(cd "$CLONE" && git checkout --quiet "$BASE" -- . && git clean -fdq && git checkout --quiet "$BASE" && git branch -D --quiet probe-block-loose)

# ---------------------------------------------------------------------------
# MUST_PASS #6 — a brand-new, harmless component using ONLY legitimate
# non-word shapes must add ZERO new offenders vs the baseline count.
# ---------------------------------------------------------------------------
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
git -C "$CLONE" checkout --quiet -b probe-pass-harmless "$BASE"
mkdir -p "$CLONE/src/components/probe-harmless"
cat > "$CLONE/src/components/probe-harmless/MosaicProbeHarmless.tsx" <<'TSXEOF'
/**
 * MosaicProbeHarmless — probe-only fixture. Exercises every LEGITIMATE
 * non-word shape the no-hardcoded-words-guard must NOT flag: a Tailwind
 * utility class list, WAI-ARIA enum values, a kebab data-slot identifier, a
 * camelCase SVG attribute value, and a KeyboardEvent.key comparison.
 */
import type * as React from "react";

export interface MosaicProbeHarmlessProps {
  isOpen: boolean;
  onActivate: () => void;
}

export function MosaicProbeHarmless({ isOpen, onActivate }: MosaicProbeHarmlessProps) {
  return (
    <div
      data-slot="probe-harmless-panel"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm font-medium transition-colors hover:bg-accent"
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === "Escape") onActivate();
      }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2v20" />
      </svg>
      {isOpen ? null : null}
    </div>
  );
}

MosaicProbeHarmless.displayName = "MosaicProbeHarmless";
TSXEOF
if ! grep -qF "MosaicProbeHarmless" "$CLONE/src/components/probe-harmless/MosaicProbeHarmless.tsx"; then
  FAILURES+=("MUST_PASS harmless-addition — mutation did NOT land — probe invalid")
else
  # Wire it into the barrel so tsup actually bundles it into dist/index.cjs —
  # an unexported file proves nothing about what SHIPS.
  index_path="$CLONE/src/index.ts"
  echo 'export { MosaicProbeHarmless } from "./components/probe-harmless/MosaicProbeHarmless.js";' >> "$index_path"
  (cd "$CLONE" && git add -A && git commit --quiet -m "probe: add harmless component (legitimate shapes only)")
  log INFO "building harmless-addition tree (this takes ~15-25s)..."
  if ! build_clone; then
    FAILURES+=("MUST_PASS harmless-addition build — pnpm build failed")
  elif [ -z "$BASELINE_COUNT" ]; then
    FAILURES+=("MUST_PASS harmless-addition — no baseline count available to compare against (baseline build failed earlier)")
  else
    set +e
    output="$(run_guard 2>&1)"
    set -e
    new_count="$(echo "$output" | grep -c '^  - ' || true)"
    if [ "$new_count" -eq "$BASELINE_COUNT" ] && ! echo "$output" | grep -qF "MosaicProbeHarmless"; then
      MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
      log MUST_PASS "PASS — harmless component added ZERO new offenders (baseline $BASELINE_COUNT, now $new_count)"
    else
      FAILURES+=("MUST_PASS harmless-addition — offender count changed (baseline $BASELINE_COUNT, now $new_count) or the harmless file was named — false positive introduced")
      log MUST_PASS "FAIL — harmless-addition — baseline=$BASELINE_COUNT now=$new_count"
    fi
  fi
fi
(cd "$CLONE" && git checkout --quiet "$BASE" -- . && git clean -fdq && git checkout --quiet "$BASE" && git branch -D --quiet probe-pass-harmless)

# ---------------------------------------------------------------------------
# MUST_PASS #7 — a genuine violation carrying the WRITTEN, anchored
# `// allow-hardcoded-word: <reason>` marker must NOT be reported.
#
# SEEDED, not anchored on existing source — same landmine and same fix as
# MUST_BLOCK #5 above: this used to anchor on MosaicOrgPanel.tsx's
# `owner: { label: "Owner", ... }` role-config object literal, which PR #101
# deleted when it turned the label into a host prop. The probe now seeds its
# own fixture instead of hunting for material it does not control.
#
# Same POSITION note as MUST_BLOCK #5 above: only a `//` comment interleaved
# between OBJECT-LITERAL PROPERTIES is confirmed to survive esbuild's
# unminified output (a comment before `return (` or a JSX child is stripped
# and would make this test vacuous).
# ---------------------------------------------------------------------------
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
DECLARED_EXCEPTION_VALUE="Probedeclaredexception"
if grep -rqF "$DECLARED_EXCEPTION_VALUE" "$CLONE/src" 2>/dev/null; then
  echo "probe: seeded value \"$DECLARED_EXCEPTION_VALUE\" ALREADY exists in the clone's sources — it would not be a subject this probe controls. Refusing to run MUST_PASS #7." >&2
  exit 1
fi
git -C "$CLONE" checkout --quiet -b probe-pass-declared "$BASE"
mkdir -p "$CLONE/src/components/probe-declared-exception-seed"
cat > "$CLONE/src/components/probe-declared-exception-seed/MosaicProbeDeclaredExceptionSeed.tsx" <<'SEEDEOF'
import * as React from "react";

// Object literal mirroring a real per-role config shape (label + description
// per key) — the comment BETWEEN properties below is the thing under test.
const probeDeclaredExceptionSeedConfig = {
  owner: {
    // allow-hardcoded-word: probe MUST_PASS declared-exception case, restored before merge
    label: "Probedeclaredexception",
  },
};

export const MosaicProbeDeclaredExceptionSeed = React.forwardRef<HTMLSpanElement>((_props, ref) => (
  <span ref={ref}>{probeDeclaredExceptionSeedConfig.owner.label}</span>
));
MosaicProbeDeclaredExceptionSeed.displayName = "MosaicProbeDeclaredExceptionSeed";
SEEDEOF
printf '\nexport { MosaicProbeDeclaredExceptionSeed } from "./components/probe-declared-exception-seed/MosaicProbeDeclaredExceptionSeed";\n' >> "$CLONE/src/index.ts"
if ! grep -qF "allow-hardcoded-word: probe MUST_PASS declared-exception case" "$CLONE/src/components/probe-declared-exception-seed/MosaicProbeDeclaredExceptionSeed.tsx"; then
  FAILURES+=("MUST_PASS declared-exception — seeded fixture did NOT land — probe invalid")
else
  (cd "$CLONE" && git add -A && git commit --quiet -m "probe: declared exception via // allow-hardcoded-word marker")
  log INFO "building declared-exception tree (this takes ~15-25s)..."
  if ! build_clone; then
    FAILURES+=("MUST_PASS declared-exception build — pnpm build failed")
  elif ! grep -qF "$DECLARED_EXCEPTION_VALUE" "$CLONE/dist/index.cjs"; then
    FAILURES+=("MUST_PASS declared-exception — seeded value never reached the bundle — probe invalid")
  else
    set +e
    output="$(run_guard 2>&1)"
    set -e
    if ! echo "$output" | grep -qF "$DECLARED_EXCEPTION_VALUE"; then
      MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
      log MUST_PASS "PASS — declared // allow-hardcoded-word exception honored, not reported"
    else
      FAILURES+=("MUST_PASS declared-exception — guard STILL reported the declared literal — escape hatch broken")
      log MUST_PASS "FAIL — declared-exception — escape hatch did not suppress the reported literal"
    fi
  fi
fi
(cd "$CLONE" && git checkout --quiet "$BASE" -- . && git clean -fdq && git checkout --quiet "$BASE" && git branch -D --quiet probe-pass-declared)

# ---------------------------------------------------------------------------
# Restoration proof — the INVOKING worktree, never the scratch clone, must
# be untouched by this probe.
# ---------------------------------------------------------------------------
cd "$REPO_ROOT"
POST_PROBE_DIFF="$(git diff --stat)"

echo ""
echo "==================== PROBE SUMMARY ===================="
echo "Baseline offender count on clean $BASE (guard expected RED — known, un-fixed offenders): ${BASELINE_COUNT:-N/A}"
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

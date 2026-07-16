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
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
git -C "$CLONE" checkout --quiet -b probe-block-prose "$BASE"
# NOTE ON POSITION: a `//` comment placed immediately before a `return (` or
# a JSX attribute/child is STRIPPED ENTIRELY by esbuild's JSX transform and
# never reaches the bundle at all (confirmed empirically while building this
# probe) — testing the marker there would be VACUOUS (the guard "blocks"
# only because the comment never existed to test anchoring against). A `//`
# comment interleaved between OBJECT-LITERAL PROPERTIES, however, DOES
# survive unminified esbuild output (confirmed against this exact file's
# real `roleConfig` object) — that is the shape used here and in MUST_PASS
# #7 below, so the anchoring behaviour is actually exercised.
python3 - "$CLONE/src/components/org-panel/MosaicOrgPanel.tsx" <<'PYEOF'
import sys
path = sys.argv[1]
with open(path) as f:
    text = f.read()
needle = '    member: {\n      label: "Member",\n'
replacement = (
    '    member: {\n'
    '      // This mentions allow-hardcoded-word in PROSE only — it does not\n'
    '      // DECLARE the marker (no colon-delimited reason on its own anchored\n'
    '      // line), so it must not disable the guard for the literal below.\n'
    '      label: "Probeshortlabel",\n'
)
if needle not in text:
    raise SystemExit(f"probe: injection anchor not found in {path}")
text = text.replace(needle, replacement, 1)
with open(path, "w") as f:
    f.write(text)
PYEOF
if ! grep -qF "This mentions allow-hardcoded-word in PROSE only" "$CLONE/src/components/org-panel/MosaicOrgPanel.tsx"; then
  FAILURES+=("MUST_BLOCK prose-marker — mutation did NOT land — probe invalid")
else
  (cd "$CLONE" && git add -A && git commit --quiet -m "probe: prose merely mentions allow-hardcoded-word, does not declare it")
  log INFO "building prose-marker tree (this takes ~15-25s)..."
  if ! build_clone; then
    FAILURES+=("MUST_BLOCK prose-marker build — pnpm build failed")
  else
    set +e
    output="$(run_guard 2>&1)"
    status=$?
    set -e
    if [ "$status" -ne 0 ] && echo "$output" | grep -qF "Probeshortlabel"; then
      MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
      log MUST_BLOCK "PASS — marker mentioned only in PROSE does not disable the guard — still blocked"
    else
      FAILURES+=("MUST_BLOCK prose-marker — guard exited $status (expected non-zero) or did not name the offender — output: $output")
      log MUST_BLOCK "FAIL — prose-quoted marker DISABLED the guard — exit=$status"
    fi
  fi
fi
(cd "$CLONE" && git checkout --quiet "$BASE" -- . && git clean -fdq && git checkout --quiet "$BASE" && git branch -D --quiet probe-block-prose)

# ---------------------------------------------------------------------------
# MUST_BLOCK #6 (RATCHET — baseline entry GROWS) — a 9th occurrence of the
# BASELINE value "Select " (maxCount=8 today) must BLOCK, naming the growth.
# This is the ratchet's pawl: a baseline value existing today must never be
# allowed to spread to a NEW site, even though it is not itself a "new"
# string.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
git -C "$CLONE" checkout --quiet -b probe-block-grown "$BASE"
# The value to GROW is DERIVED from the guard's own BASELINE, never typed.
# Hardcoding "Select " here was a latent trap: the moment a fix PR deletes
# that row, this same injection stops being "growth of an existing row" and
# becomes a brand-new offender — the case would grep for GREW and fail on a
# guard that behaved perfectly. If BASELINE declares nothing, REFUSE loudly.
GROWN_VALUE="$(python3 - "$REPO_ROOT/scripts/no-hardcoded-words-guard.mjs" <<'PYEOF'
import re
import sys
with open(sys.argv[1]) as f:
    text = f.read()
rows = re.findall(r'value:\s*"((?:[^"\\]|\\.)*)"\s*,\s*\n\s*maxCount:\s*(\d+)\s*,', text)
if not rows:
    raise SystemExit("probe: BASELINE declares NO rows — cannot derive a ratchet-grown subject. Refusing to report a pass for a case that never ran.")
sys.stdout.write(rows[0][0])
PYEOF
)"
echo "[INFO] derived ratchet-grown subject: BASELINE value \"$GROWN_VALUE\" (one more occurrence must read as GREW)"
GROWN_VALUE="$GROWN_VALUE" python3 - "$CLONE/src/components/checkbox/MosaicCheckbox.tsx" <<'PYEOF'
import os
import sys
path = sys.argv[1]
value = os.environ["GROWN_VALUE"]
with open(path) as f:
    text = f.read()
needle = '    <Checkbox.Root\n      ref={ref}\n      data-slot="checkbox"\n'
# Emit the derived value as a plain JSX string attribute so the literal lands
# in the bundle verbatim, whatever characters it contains.
injected = '      title={"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"}\n'
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
if ! grep -qF "title={\"$GROWN_VALUE\"}" "$CLONE/src/components/checkbox/MosaicCheckbox.tsx"; then
  FAILURES+=("MUST_BLOCK ratchet-grown — mutation did NOT land — probe invalid")
else
  (cd "$CLONE" && git add -A && git commit --quiet -m "probe: one more occurrence of a derived baseline value — must grow-block")
  log INFO "building ratchet-grown tree (this takes ~15-25s)..."
  if ! build_clone; then
    FAILURES+=("MUST_BLOCK ratchet-grown build — pnpm build failed")
  else
    set +e
    output="$(run_guard 2>&1)"
    status=$?
    set -e
    if [ "$status" -ne 0 ] && echo "$output" | grep -qF "GREW" && echo "$output" | grep -qF "\"$GROWN_VALUE\""; then
      MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
      log MUST_BLOCK "PASS — ratchet-grown — extra '$GROWN_VALUE' occurrence blocked as BASELINE growth"
    else
      FAILURES+=("MUST_BLOCK ratchet-grown — guard exited $status (expected non-zero) or did not name the grown BASELINE entry — output: $output")
      log MUST_BLOCK "FAIL — ratchet-grown — exit=$status"
    fi
  fi
fi
(cd "$CLONE" && git checkout --quiet "$BASE" -- . && git clean -fdq && git checkout --quiet "$BASE" && git branch -D --quiet probe-block-grown)

# ---------------------------------------------------------------------------
# DERIVE RATCHET SUBJECT (for MUST_BLOCK #7 and #8 below) — per
# .claude/rules/derive-never-type.md and .claude/rules/guard-formulation-census.md:
# the SUBJECT of these two ratchet cases must never be a hand-typed literal.
# This probe previously hardcoded `placeholder="acme-inc"` as its anchor —
# PR #100 (commit 30e0279) turned that exact placeholder into a host-supplied
# prop (`slugPlaceholder`), so the literal legitimately no longer exists in
# MosaicOrgPanel.tsx, and the probe's own anchor grep started failing loudly
# (correctly — a probe that cannot find its material must not report a pass).
# The fix: DERIVE the subject at run time from the artifact instead of typing
# one. Read every `value: "..."` row straight out of BASELINE in THIS
# branch's own guard.mjs (the `^    value: "..."` 4-space-indent shape is
# unique to BASELINE rows in this file — verified: no other property in this
# script is indented and named that way), and pick the first row whose
# literal occurs EXACTLY ONCE in the clone's `src/**/*.tsx`, excluding
# `*.test.tsx` (test fixtures are host-supplied strings for test purposes,
# not library strings this guard is scoped to). That single occurrence is
# what "genuinely fixing the last remaining offender" means for rule 3
# (stale) and rule 1 (new offender on re-injection) below. If NO such row
# exists, this probe FAILS LOUDLY, naming every BASELINE value it checked —
# never a silent skip of #7/#8 (per guard-formulation-census.md: "toute
# échappatoire muette est interdite").
# ---------------------------------------------------------------------------
mapfile -t BASELINE_VALUES < <(grep -oP '^    value: "\K(?:[^"\\]|\\.)*(?=",$)' "$REPO_ROOT/scripts/no-hardcoded-words-guard.mjs")
if [ "${#BASELINE_VALUES[@]}" -eq 0 ]; then
  echo "probe: BASELINE in $REPO_ROOT/scripts/no-hardcoded-words-guard.mjs is empty or unparsable — cannot derive a ratchet-stale/reviewer-reinject subject for MUST_BLOCK #7/#8. Refusing to fabricate one." >&2
  exit 1
fi

RATCHET_VALUE=""
RATCHET_FILE=""
RATCHET_LINE=""
for candidate in "${BASELINE_VALUES[@]}"; do
  hits="$(grep -rn --include='*.tsx' -F "\"$candidate\"" "$CLONE/src" 2>/dev/null | grep -v '\.test\.tsx' || true)"
  count=0
  [ -n "$hits" ] && count="$(echo "$hits" | grep -c .)"
  if [ "$count" -eq 1 ]; then
    RATCHET_VALUE="$candidate"
    RATCHET_FILE="$(echo "$hits" | cut -d: -f1)"
    RATCHET_LINE="$(echo "$hits" | cut -d: -f2)"
    break
  fi
done

if [ -z "$RATCHET_VALUE" ]; then
  echo "probe: no BASELINE row's value occurs EXACTLY ONCE in the clone's src/**/*.tsx (excluding *.test.tsx). BASELINE rows checked: ${BASELINE_VALUES[*]@Q}" >&2
  echo "probe: refusing to run MUST_BLOCK #7/#8 with a fabricated anchor — a probe that cannot find its own material proves nothing." >&2
  exit 1
fi
log INFO "derived ratchet subject for MUST_BLOCK #7/#8: BASELINE value \"$RATCHET_VALUE\" — single occurrence at $RATCHET_FILE:$RATCHET_LINE"

# The re-injection target (MUST_BLOCK #8) must be a DIFFERENT file than the
# one holding the derived subject's only occurrence — fail loudly rather than
# silently reusing the same file, which would prove nothing about a NEW site.
RATCHET_REINJECT_TARGET="$CLONE/src/components/checkbox/MosaicCheckbox.tsx"
if [ "$RATCHET_FILE" = "$RATCHET_REINJECT_TARGET" ]; then
  echo "probe: derived ratchet subject \"$RATCHET_VALUE\" lives in the same file ($RATCHET_FILE) this probe reuses as its re-injection target — cannot exercise a NEW-site re-injection. Refusing to run MUST_BLOCK #7/#8." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# MUST_BLOCK #7 (RATCHET — stale baseline entry) — fixing the ONLY
# occurrence of the derived BASELINE value without deleting its BASELINE row
# must BLOCK, naming the row to delete. This is what forces every fix PR to
# shrink the list instead of leaving a permanent silent exemption behind.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
git -C "$CLONE" checkout --quiet -b probe-block-stale "$BASE"
python3 - "$RATCHET_FILE" "$RATCHET_LINE" "$RATCHET_VALUE" <<'PYEOF'
import sys
path, lineno, value = sys.argv[1], int(sys.argv[2]), sys.argv[3]
with open(path) as f:
    lines = f.readlines()
idx = lineno - 1
target = f'"{value}"'
if target not in lines[idx]:
    raise SystemExit(
        f"probe: derived line {lineno} of {path} does not contain expected literal {target!r}: {lines[idx]!r}"
    )
lines[idx] = lines[idx].replace(target, '""', 1)  # genuine fix: blank the hardcoded literal
with open(path, "w") as f:
    f.writelines(lines)
PYEOF
if grep -qF "\"$RATCHET_VALUE\"" "$RATCHET_FILE"; then
  FAILURES+=("MUST_BLOCK ratchet-stale — mutation did NOT land — probe invalid")
else
  (cd "$CLONE" && git add -A && git commit --quiet -m "probe: fix the ONLY '$RATCHET_VALUE' occurrence, BASELINE row left undeleted on purpose")
  log INFO "building ratchet-stale tree (this takes ~15-25s)..."
  if ! build_clone; then
    FAILURES+=("MUST_BLOCK ratchet-stale build — pnpm build failed")
  else
    set +e
    output="$(run_guard 2>&1)"
    status=$?
    set -e
    if [ "$status" -ne 0 ] && echo "$output" | grep -qF "STALE" && echo "$output" | grep -qF "\"$RATCHET_VALUE\""; then
      MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
      log MUST_BLOCK "PASS — ratchet-stale — fixed-but-undeleted BASELINE row for '$RATCHET_VALUE' blocked"
    else
      FAILURES+=("MUST_BLOCK ratchet-stale — guard exited $status (expected non-zero) or did not name the stale BASELINE entry — output: $output")
      log MUST_BLOCK "FAIL — ratchet-stale — exit=$status"
    fi
  fi
fi
(cd "$CLONE" && git checkout --quiet "$BASE" -- . && git clean -fdq && git checkout --quiet "$BASE" && git branch -D --quiet probe-block-stale)

# ---------------------------------------------------------------------------
# MUST_BLOCK #8 (RATCHET — the reviewer's EXACT probe) — once the derived
# ratchet subject is genuinely fixed AND its BASELINE row correctly deleted
# (the two steps together, as a real fix PR would do), re-injecting the SAME
# literal ELSEWHERE must go RED again — as a brand-new offender, not a
# special case. This is the concrete proof that the ratchet cannot be
# permanently disarmed by a single string once leaving the baseline: it
# falls straight back under rule 1 (new offender), by construction.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
git -C "$CLONE" checkout --quiet -b probe-block-reviewer-reinject "$BASE"
# Step 1: genuinely fix the only existing occurrence of the derived subject.
python3 - "$RATCHET_FILE" "$RATCHET_LINE" "$RATCHET_VALUE" <<'PYEOF'
import sys
path, lineno, value = sys.argv[1], int(sys.argv[2]), sys.argv[3]
with open(path) as f:
    lines = f.readlines()
idx = lineno - 1
target = f'"{value}"'
if target not in lines[idx]:
    raise SystemExit(
        f"probe: derived line {lineno} of {path} does not contain expected literal {target!r}: {lines[idx]!r}"
    )
lines[idx] = lines[idx].replace(target, '""', 1)  # genuine fix
with open(path, "w") as f:
    f.writelines(lines)
PYEOF
# Step 2: delete the now-stale BASELINE row (what the real fix PR is required
# to do — see MUST_BLOCK #7 above). The guard script itself is THIS branch's
# own tool under test, not "foreign material" the CLONE's own $BASE tree
# necessarily carries (this PR is what introduces the guard at all) — copy it
# in first, exactly like run_guard() does, before editing it.
mkdir -p "$CLONE/scripts"
cp "$REPO_ROOT/scripts/no-hardcoded-words-guard.mjs" "$CLONE/scripts/no-hardcoded-words-guard.mjs"
python3 - "$CLONE/scripts/no-hardcoded-words-guard.mjs" "$RATCHET_VALUE" <<'PYEOF'
import re
import sys
path, value = sys.argv[1], sys.argv[2]
with open(path) as f:
    text = f.read()
pattern = re.compile(
    r"\s*\{\s*\n\s*value: \"" + re.escape(value) + r"\",.*?\n\s*\},\n",
    re.DOTALL,
)
new_text, count = pattern.subn("\n", text, count=1)
if count != 1:
    raise SystemExit(f"probe: could not find the {value!r} BASELINE row to delete")
with open(path, "w") as f:
    f.write(new_text)
PYEOF
# Step 3: re-inject the exact same offender into a DIFFERENT, currently-clean
# file (derived above as RATCHET_REINJECT_TARGET, guaranteed != RATCHET_FILE)
# — the reviewer's precise scenario.
python3 - "$RATCHET_REINJECT_TARGET" "$RATCHET_VALUE" <<'PYEOF'
import sys
path, value = sys.argv[1], sys.argv[2]
with open(path) as f:
    text = f.read()
needle = '    <Checkbox.Root\n      ref={ref}\n      data-slot="checkbox"\n'
replacement = (
    '    <Checkbox.Root\n'
    '      ref={ref}\n'
    '      data-slot="checkbox"\n'
    f'      title="{value}"\n'
)
if needle not in text:
    raise SystemExit(f"probe: injection anchor not found in {path}")
text = text.replace(needle, replacement, 1)
with open(path, "w") as f:
    f.write(text)
PYEOF
if ! grep -qF "title=\"$RATCHET_VALUE\"" "$RATCHET_REINJECT_TARGET" || \
   grep -qF "value: \"$RATCHET_VALUE\"" "$CLONE/scripts/no-hardcoded-words-guard.mjs" || \
   grep -qF "\"$RATCHET_VALUE\"" "$RATCHET_FILE"; then
  FAILURES+=("MUST_BLOCK reviewer-reinject — one of the three mutation steps did NOT land as expected — probe invalid")
else
  (cd "$CLONE" && git add -A && git commit --quiet -m "probe: reviewer's exact scenario — fix+delete-row then re-inject '$RATCHET_VALUE' elsewhere")
  log INFO "building reviewer-reinject tree (this takes ~15-25s)..."
  if ! build_clone; then
    FAILURES+=("MUST_BLOCK reviewer-reinject build — pnpm build failed")
  else
    set +e
    # run_guard() re-installs THIS branch's guard.mjs on every call — but this
    # case's whole point is testing the CLONE's own (row-deleted) guard.mjs,
    # so it is invoked directly here instead of via run_guard().
    output="$(cd "$CLONE" && node scripts/no-hardcoded-words-guard.mjs 2>&1)"
    status=$?
    set -e
    if [ "$status" -ne 0 ] && echo "$output" | grep -qF "NEW offender" && echo "$output" | grep -qF "\"$RATCHET_VALUE\""; then
      MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
      log MUST_BLOCK "PASS — reviewer's exact probe — re-injected '$RATCHET_VALUE' goes RED as a brand-new offender"
    else
      FAILURES+=("MUST_BLOCK reviewer-reinject — guard exited $status (expected non-zero) or did not name '$RATCHET_VALUE' as a new offender — output: $output")
      log MUST_BLOCK "FAIL — reviewer-reinject — exit=$status"
    fi
  fi
fi
(cd "$CLONE" && git checkout --quiet "$BASE" -- . && git clean -fdq && git checkout --quiet "$BASE" && git branch -D --quiet probe-block-reviewer-reinject)

# ---------------------------------------------------------------------------
# MUST_BLOCK #9 (RATCHET — the ACTUAL hole a reviewer proved by mutation) —
# widen a REAL baseline row's declared `maxCount` ABOVE its actual bundle
# count, WITHOUT touching a single component file. The bundle never moves;
# only the number written in BASELINE does. A guard that only checks
# "current > maxCount" sees nothing wrong here — the current count is still
# below the (now-inflated) ceiling — and that silence IS the hole: it turns
# the ratchet into a plain exclusion list an author can loosen by hand
# whenever a real fix is inconvenient. The fixed guard instead compares the
# DERIVED actual count against the declared one in BOTH directions, so this
# MUST go RED, naming declared vs actual.
#
# No component mutation, so the ALREADY-BUILT clean-baseline dist (from the
# very first build above) is reused directly — this case's whole point is
# that the ARTIFACT is unchanged and only the guard's own BASELINE number
# moves. run_guard() is not used here (it re-installs the real, unmutated
# guard.mjs on every call) — the mutated copy is invoked directly instead.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
if [ -z "$BASELINE_COUNT" ]; then
  FAILURES+=("MUST_BLOCK loose-budget — no clean baseline dist available (baseline build failed earlier) — cannot run this case")
  log MUST_BLOCK "FAIL — loose-budget — no baseline dist to reuse"
else
  MUTATED_GUARD="$SCRATCH/guard-loose-budget.mjs"
  cp "$REPO_ROOT/scripts/no-hardcoded-words-guard.mjs" "$MUTATED_GUARD"
  # The row to widen is DERIVED from the guard's own BASELINE, never typed.
  # A hardcoded literal here ("Select ", maxCount: 8) is exactly what broke
  # this case once: a fix PR legitimately deleted that row and the probe died
  # at setup. The subject is whatever row BASELINE declares TODAY; if BASELINE
  # declares nothing, this REFUSES loudly instead of passing a case that never ran.
  LOOSE_SUBJECT="$(python3 - "$MUTATED_GUARD" <<'PYEOF'
import re
import sys
path = sys.argv[1]
with open(path) as f:
    text = f.read()
rows = re.findall(r'value:\s*"((?:[^"\\]|\\.)*)"\s*,\s*\n\s*maxCount:\s*(\d+)\s*,', text)
if not rows:
    raise SystemExit("probe: BASELINE declares NO rows — cannot derive a loose-budget subject. Refusing to report a pass for a case that never ran.")
value, count = rows[0]
pattern = re.compile(
    r'(value:\s*"' + re.escape(value) + r'"\s*,\s*\n\s*maxCount:\s*)' + count + r'(\s*,)'
)
new_text, n = pattern.subn(r"\g<1>99\g<2>", text, count=1)
if n != 1:
    raise SystemExit("probe: derived row %r/%s could not be widened — probe invalid" % (value, count))
with open(path, "w") as f:
    f.write(new_text)
sys.stdout.write("%s\t%s" % (value, count))
PYEOF
  )"
  LOOSE_VALUE="${LOOSE_SUBJECT%%$'\t'*}"
  LOOSE_COUNT="${LOOSE_SUBJECT##*$'\t'}"
  echo "[INFO] derived loose-budget subject: BASELINE row \"$LOOSE_VALUE\" declared maxCount=$LOOSE_COUNT -> widened to 99"
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
# ---------------------------------------------------------------------------
# Same POSITION note as MUST_BLOCK #5 above: only a `//` comment interleaved
# between OBJECT-LITERAL PROPERTIES is confirmed to survive esbuild's
# unminified output (a comment before `return (` or a JSX child is stripped
# and would make this test vacuous).
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
git -C "$CLONE" checkout --quiet -b probe-pass-declared "$BASE"
python3 - "$CLONE/src/components/org-panel/MosaicOrgPanel.tsx" <<'PYEOF'
import sys
path = sys.argv[1]
with open(path) as f:
    text = f.read()
needle = '    owner: {\n      label: "Owner",\n'
replacement = (
    '    owner: {\n'
    '      // allow-hardcoded-word: probe MUST_PASS declared-exception case, restored before merge\n'
    '      label: "Probedeclaredexception",\n'
)
if needle not in text:
    raise SystemExit(f"probe: injection anchor not found in {path}")
text = text.replace(needle, replacement, 1)
with open(path, "w") as f:
    f.write(text)
PYEOF
if ! grep -qF "allow-hardcoded-word: probe MUST_PASS declared-exception case" "$CLONE/src/components/org-panel/MosaicOrgPanel.tsx"; then
  FAILURES+=("MUST_PASS declared-exception — mutation did NOT land — probe invalid")
else
  (cd "$CLONE" && git add -A && git commit --quiet -m "probe: declared exception via // allow-hardcoded-word marker")
  log INFO "building declared-exception tree (this takes ~15-25s)..."
  if ! build_clone; then
    FAILURES+=("MUST_PASS declared-exception build — pnpm build failed")
  else
    set +e
    output="$(run_guard 2>&1)"
    set -e
    if ! echo "$output" | grep -qF "Probedeclaredexception"; then
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

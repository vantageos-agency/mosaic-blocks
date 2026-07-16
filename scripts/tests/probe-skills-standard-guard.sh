#!/usr/bin/env bash
# probe-skills-standard-guard.sh — bipolar bite-probe for
# scripts/skills-standard-guard.mjs, run on REAL, ALREADY-SHIPPED skill
# directories the guard's author did not choose (better-colors,
# better-typography, better-ui, vantage-design-system — merged on main
# before this guard existed).
#
# Per .claude/rules/derive-never-type.md and
# .claude/rules/guard-formulation-census.md: a probe written by the same
# author as the matcher, testing only synthetic text, proves only that the
# matcher understands itself. This probe instead:
#   1. Clones the real repo history into a scratch worktree.
#   2. Establishes a COMPLIANT BASELINE per real skill (adds the version
#      field, the trigger clause, and 3 valid evals — none of the 4 shipped
#      skills carry these today, measured directly, so a baseline commit is
#      the only way to isolate "does the guard catch THIS ONE injected
#      defect" from "the real skill was already non-conformant"). The
#      baseline commit is a FIXTURE, not the tested diff.
#   3. Applies ONE mutation per case on top of that baseline, in a SEPARATE
#      commit — this commit's diff vs the baseline is what the guard is run
#      against. Four DIFFERENT rule forms, four DIFFERENT real skill
#      directories (distinct sites):
#        a. better-typography — evals array EMPTIED to []
#        b. better-ui         — "SELLABLE AS" heading RE-ADDED
#        c. vantage-design-system — required frontmatter field (description)
#           DELETED
#        d. better-colors     — relative link target file RENAMED (link now
#           dangles)
#   4. Asserts via grep that each mutation LANDED before trusting any
#      verdict.
#   5. Restores the invoking worktree untouched (`git diff` unchanged).
#
# VENDORED-exemption poles (skills/VENDORED.json, Eta's PR #124 review gap):
# recensed domain of "what can happen to a declared-vendored skill dir" per
# .claude/rules/guard-formulation-census.md — three forms, three real sites:
#   e. better-colors — MUST_PASS: SKILL.md TOUCHED (mode-only chmod, content
#      byte-identical) while its VENDORED.json entry predates the diff —
#      digest still matches, exempted, exit 0.
#   f. better-ui     — MUST_BLOCK: SKILL.md CONTENT modified (trivial
#      comment) on a previously-declared VENDORED entry — digest breaks,
#      guard bites naming "digest integrity".
#   g. probe-fake-vendored-skill — MUST_BLOCK: a brand-new, non-conformant
#      home-grown skill dir adds ITS OWN VENDORED.json entry in the SAME
#      diff that introduces it (self-declaring VENDORED to dodge the
#      standard) — entry provenance check refuses the exemption (the entry
#      did not exist at BASE_REF) and the skill falls through to, and fails,
#      the full skill-standard-v2.md check.
# All three digests in the fixtures below are DERIVED from the actual
# on-disk clone content via `regen_vendored_manifest` (node sha256), never
# hand-typed — a probe that hand-types the hex it is meant to verify would be
# exactly the disease `.claude/rules/derive-never-type.md` closes.
#
# Usage: bash scripts/tests/probe-skills-standard-guard.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Resolved via git itself — a WORKTREE's .git is a file, not a directory;
# cloning that file path directly yields nothing clonable. See
# probe-release-artifacts-guard.sh for the identical fix and the incident
# that forced it (a hand-typed absolute path that only resolved on the
# author's own machine).
SOURCE_REPO="$(git -C "$REPO_ROOT" rev-parse --path-format=absolute --git-common-dir)"
if [ ! -d "$SOURCE_REPO" ]; then
  echo "probe: cannot resolve a clonable git repository from $REPO_ROOT (got '$SOURCE_REPO')." >&2
  echo "probe: refusing to run — a probe that cannot clone its own material proves NOTHING." >&2
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

PRE_PROBE_DIFF="$(cd "$REPO_ROOT" && git diff --stat)"

git clone --quiet "$SOURCE_REPO" "$CLONE"
# TWO separate fetches, not one combined refspec list. `git clone <path>`
# maps the SOURCE's `refs/heads/*` onto the new clone's `refs/remotes/origin/*`
# — so if the source repo (a shared common .git across many worktrees) has a
# STALE local `main` branch sitting alongside a fresh `refs/remotes/origin/main`
# (verified locally: local `main` was 2 commits behind origin/main), the fresh
# clone's own `origin/main` inherits the STALE value, not the fresh one.
# A single combined `git fetch ... refspec1 refspec2` aborts ENTIRELY the
# moment refspec1 hits a "refusing to fetch into branch checked out" conflict
# (the source's OWN currently-checked-out branch, e.g. gamma/design-skills-adopt),
# silently skipping refspec2 as well — which is exactly the refspec that would
# have corrected origin/main. Splitting them means the heads-refspec's known,
# expected failure (source has a branch checked out — always true for a
# worktree) cannot swallow the remotes-refspec's success.
git -C "$CLONE" fetch --quiet "$SOURCE_REPO" '+refs/remotes/origin/*:refs/remotes/origin/*' 2>/dev/null || true
git -C "$CLONE" fetch --quiet "$SOURCE_REPO" '+refs/heads/*:refs/heads/*' 2>/dev/null || true
git -C "$CLONE" config user.name "mosaic-blocks probe"
git -C "$CLONE" config user.email "probe@vantageos.invalid"

# origin/main FIRST, deliberately: this repo is checked out across many
# worktrees sharing one common .git, and a local `refs/heads/main` can be a
# stale ref left over from a worktree that has not fetched recently (proven
# locally: local `main` resolved to #118 while `origin/main` — the
# authoritative remote-tracking ref — correctly resolved to #119). Preferring
# the remote-tracking ref is not a style choice here, it is the only
# resolution that is not itself a hand-typed assumption about which local
# branch happens to be fresh.
base=""
for candidate in origin/main main; do
  if (cd "$CLONE" && git rev-parse --verify --quiet "$candidate" >/dev/null); then
    base="$(cd "$CLONE" && git rev-parse "$candidate")"
    break
  fi
done
if [ -z "$base" ]; then
  echo "probe: no base commit resolvable (tried: main, origin/main) in the clone." >&2
  exit 1
fi

install_guard() {
  cp "$REPO_ROOT/scripts/skills-standard-guard.mjs" "$CLONE/scripts/skills-standard-guard.mjs"
}

reset_clone() {
  local ref="$1"
  (cd "$CLONE" && git checkout -- scripts/skills-standard-guard.mjs 2>/dev/null || rm -f scripts/skills-standard-guard.mjs)
  (cd "$CLONE" && git clean -fdq && git checkout --quiet "$ref")
}

run_guard() {
  local base_ref="$1"
  local head_ref="$2"
  install_guard
  (cd "$CLONE" && SKILLS_GUARD_BASE_REF="$base_ref" SKILLS_GUARD_HEAD_REF="$head_ref" node scripts/skills-standard-guard.mjs)
}

# A minimal, standard-conformant evals.json for a given skill_name — used
# ONLY to build the compliant BASELINE fixture, never as the tested mutation.
write_compliant_evals() {
  local skill_dir="$1"
  local skill_name="$2"
  mkdir -p "$CLONE/skills/$skill_dir/evals"
  cat > "$CLONE/skills/$skill_dir/evals/evals.json" <<EOF
{
  "skill_name": "$skill_name",
  "evals": [
    {"id": 1, "prompt": "probe prompt 1", "expected_output": "probe expected output 1", "files": [], "expectations": ["probe expectation 1a", "probe expectation 1b"]},
    {"id": 2, "prompt": "probe prompt 2", "expected_output": "probe expected output 2", "files": [], "expectations": ["probe expectation 2a", "probe expectation 2b"]},
    {"id": 3, "prompt": "probe prompt 3", "expected_output": "probe expected output 3", "files": [], "expectations": ["probe expectation 3a", "probe expectation 3b"]}
  ]
}
EOF
}

# Appends `version:` + rewrites `description:` to end with the trigger
# clause, on the REAL shipped SKILL.md — a fixture step, not the tested edit.
make_baseline_compliant() {
  local skill_dir="$1"
  local f="$CLONE/skills/$skill_dir/SKILL.md"
  # insert version: right after the `name:` line
  sed -i '/^name: /a version: 0.0.1-probe' "$f"
  # append the trigger clause to the description line (single-line description
  # in all 4 shipped skills, verified against real content)
  sed -i 's/^description: \(.*\)$/description: \1 Use this even if they don'"'"'t say the skill name explicitly./' "$f"
}

# Regenerate (or add to) skills/VENDORED.json inside $CLONE for the named
# skill dirs, computing every file's sha256 from the ACTUAL on-disk content
# at call time — never a hand-typed digest. Preserves any pre-existing
# entries already present in the file.
regen_vendored_manifest() {
  local clone_dir="$CLONE"
  node - "$clone_dir" "$@" <<'NODE'
const { readFileSync, writeFileSync, existsSync, readdirSync, statSync } = require("node:fs");
const { createHash } = require("node:crypto");
const { join } = require("node:path");
const [, , cloneDir, ...names] = process.argv;
const manifestPath = join(cloneDir, "skills", "VENDORED.json");
let manifest = { schema_version: 1, skills: {} };
if (existsSync(manifestPath)) {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
}
function walk(dir) {
  let out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}
for (const name of names) {
  const dir = join(cloneDir, "skills", name);
  const files = walk(dir).sort();
  const digests = {};
  for (const f of files) {
    const rel = f.slice(dir.length + 1);
    digests[rel] = `sha256:${createHash("sha256").update(readFileSync(f)).digest("hex")}`;
  }
  manifest.skills[name] = {
    upstream: { repo: "https://github.com/jakubkrehel/skills", path: name, commit: "probe-fixture" },
    note: "probe fixture entry, digests derived from on-disk content at fixture time",
    files: digests,
  };
}
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
NODE
}

# ---------------------------------------------------------------------------
# Case a — MUST_BLOCK: better-typography, evals EMPTIED to []
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
reset_clone "$base"
(cd "$CLONE" && git checkout --quiet -b probe-block-evals-empty "$base")
make_baseline_compliant "better-typography"
write_compliant_evals "better-typography" "better-typography"
(cd "$CLONE" && git add -- skills/better-typography && git commit --quiet -m "probe: baseline compliant better-typography (fixture, not tested)")
baseline_sha="$(cd "$CLONE" && git rev-parse HEAD)"
cat > "$CLONE/skills/better-typography/evals/evals.json" <<EOF
{
  "skill_name": "better-typography",
  "evals": []
}
EOF
(cd "$CLONE" && git add -- skills/better-typography/evals/evals.json && git commit --quiet -m "probe: inject evals=[] on real shipped better-typography")
if ! grep -qF '"evals": []' "$CLONE/skills/better-typography/evals/evals.json"; then
  FAILURES+=("MUST_BLOCK evals-empty — mutation did NOT land — probe invalid")
else
  set +e
  output="$(run_guard "$baseline_sha" HEAD 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 1 ] && echo "$output" | grep -qF "better-typography/evals/evals.json"; then
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
    log MUST_BLOCK "PASS — better-typography evals=[] — guard exited 1, named the file"
  else
    FAILURES+=("MUST_BLOCK evals-empty — guard exited $status (expected 1) or did not name the file — output: $output")
    log MUST_BLOCK "FAIL — evals-empty — exit=$status output=$output"
  fi
fi

# ---------------------------------------------------------------------------
# Case b — MUST_BLOCK: better-ui, "SELLABLE AS" heading RE-ADDED
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
reset_clone "$base"
(cd "$CLONE" && git checkout --quiet -b probe-block-sellable "$base")
make_baseline_compliant "better-ui"
write_compliant_evals "better-ui" "better-ui"
(cd "$CLONE" && git add -- skills/better-ui && git commit --quiet -m "probe: baseline compliant better-ui (fixture, not tested)")
baseline_sha="$(cd "$CLONE" && git rev-parse HEAD)"
printf '\n## SELLABLE AS\n\nMaps to the internal perello-better-ui plugin.\n' >> "$CLONE/skills/better-ui/SKILL.md"
(cd "$CLONE" && git add -- skills/better-ui/SKILL.md && git commit --quiet -m "probe: inject SELLABLE AS heading on real shipped better-ui")
if ! grep -qF '## SELLABLE AS' "$CLONE/skills/better-ui/SKILL.md"; then
  FAILURES+=("MUST_BLOCK sellable-heading — mutation did NOT land — probe invalid")
else
  set +e
  output="$(run_guard "$baseline_sha" HEAD 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 1 ] && echo "$output" | grep -qF "better-ui/SKILL.md"; then
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
    log MUST_BLOCK "PASS — better-ui SELLABLE AS heading — guard exited 1, named the file"
  else
    FAILURES+=("MUST_BLOCK sellable-heading — guard exited $status (expected 1) or did not name the file — output: $output")
    log MUST_BLOCK "FAIL — sellable-heading — exit=$status output=$output"
  fi
fi

# ---------------------------------------------------------------------------
# Case c — MUST_BLOCK: vantage-design-system, required frontmatter field
# (`description:`) DELETED
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
reset_clone "$base"
(cd "$CLONE" && git checkout --quiet -b probe-block-missing-field "$base")
make_baseline_compliant "vantage-design-system"
write_compliant_evals "vantage-design-system" "vantage-design-system"
(cd "$CLONE" && git add -- skills/vantage-design-system && git commit --quiet -m "probe: baseline compliant vantage-design-system (fixture, not tested)")
baseline_sha="$(cd "$CLONE" && git rev-parse HEAD)"
sed -i '/^description: /d' "$CLONE/skills/vantage-design-system/SKILL.md"
(cd "$CLONE" && git add -- skills/vantage-design-system/SKILL.md && git commit --quiet -m "probe: delete description: field on real shipped vantage-design-system")
if grep -q '^description: ' "$CLONE/skills/vantage-design-system/SKILL.md"; then
  FAILURES+=("MUST_BLOCK missing-field — mutation did NOT land (description: still present) — probe invalid")
else
  set +e
  output="$(run_guard "$baseline_sha" HEAD 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 1 ] && echo "$output" | grep -qF "vantage-design-system/SKILL.md"; then
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
    log MUST_BLOCK "PASS — vantage-design-system missing description field — guard exited 1, named the file"
  else
    FAILURES+=("MUST_BLOCK missing-field — guard exited $status (expected 1) or did not name the file — output: $output")
    log MUST_BLOCK "FAIL — missing-field — exit=$status output=$output"
  fi
fi

# ---------------------------------------------------------------------------
# Case d — MUST_BLOCK: better-colors, relative link target RENAMED (link now
# dangles)
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
reset_clone "$base"
(cd "$CLONE" && git checkout --quiet -b probe-block-dangling-link "$base")
make_baseline_compliant "better-colors"
write_compliant_evals "better-colors" "better-colors"
(cd "$CLONE" && git add -- skills/better-colors && git commit --quiet -m "probe: baseline compliant better-colors (fixture, not tested)")
baseline_sha="$(cd "$CLONE" && git rev-parse HEAD)"
git -C "$CLONE" mv skills/better-colors/color-conversion.md skills/better-colors/color-conversion-renamed.md
(cd "$CLONE" && git commit --quiet -m "probe: rename real linked file on shipped better-colors, dangling the SKILL.md link")
if [ -f "$CLONE/skills/better-colors/color-conversion.md" ]; then
  FAILURES+=("MUST_BLOCK dangling-link — mutation did NOT land (color-conversion.md still present) — probe invalid")
else
  set +e
  output="$(run_guard "$baseline_sha" HEAD 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 1 ] && echo "$output" | grep -qF "better-colors/SKILL.md"; then
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
    log MUST_BLOCK "PASS — better-colors dangling link — guard exited 1, named the file"
  else
    FAILURES+=("MUST_BLOCK dangling-link — guard exited $status (expected 1) or did not name the file — output: $output")
    log MUST_BLOCK "FAIL — dangling-link — exit=$status output=$output"
  fi
fi

# ---------------------------------------------------------------------------
# MUST_PASS #1 — a diff that touches NO skills/<name>/ directory at all.
# ---------------------------------------------------------------------------
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
reset_clone "$base"
(cd "$CLONE" && git checkout --quiet -b probe-pass-no-skills "$base")
echo "// probe: harmless non-skill change" > "$CLONE/src/probe-harmless.ts"
(cd "$CLONE" && git add -- src/probe-harmless.ts && git commit --quiet -m "feat(probe): harmless non-skill change")
if ! grep -qF "probe: harmless" "$CLONE/src/probe-harmless.ts"; then
  FAILURES+=("MUST_PASS no-skills-touched — mutation did NOT land — probe invalid")
else
  set +e
  output="$(run_guard "$base" HEAD 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
    log MUST_PASS "PASS — no skills/ dir touched — guard exited 0"
  else
    FAILURES+=("MUST_PASS no-skills-touched — guard exited $status (expected 0) — output: $output")
    log MUST_PASS "FAIL — no-skills-touched — exit=$status output=$output"
  fi
fi

# ---------------------------------------------------------------------------
# MUST_PASS #2 — a fully compliant NEW skill directory (every rule satisfied).
# ---------------------------------------------------------------------------
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
reset_clone "$base"
(cd "$CLONE" && git checkout --quiet -b probe-pass-compliant "$base")
mkdir -p "$CLONE/skills/probe-compliant-skill/evals"
cat > "$CLONE/skills/probe-compliant-skill/SKILL.md" <<'EOF'
---
name: probe-compliant-skill
description: A fully compliant probe fixture skill. Use this even if they don't say the skill name explicitly.
version: 0.0.1-probe
---

# Probe compliant skill

A short, fully compliant body under 500 lines with no forbidden heading.
EOF
write_compliant_evals "probe-compliant-skill" "probe-compliant-skill"
(cd "$CLONE" && git add -- skills/probe-compliant-skill && git commit --quiet -m "feat(probe): add fully compliant probe-compliant-skill")
if ! grep -qF "probe-compliant-skill" "$CLONE/skills/probe-compliant-skill/SKILL.md"; then
  FAILURES+=("MUST_PASS compliant-skill — mutation did NOT land — probe invalid")
else
  set +e
  output="$(run_guard "$base" HEAD 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
    log MUST_PASS "PASS — fully compliant new skill — guard exited 0"
  else
    FAILURES+=("MUST_PASS compliant-skill — guard exited $status (expected 0) — output: $output")
    log MUST_PASS "FAIL — compliant-skill — exit=$status output=$output"
  fi
fi

# ---------------------------------------------------------------------------
# MUST_PASS #3 — escape hatch: a non-conformant skill diff, BUT HEAD commit
# carries the written `// allow-skills-standard:` marker.
# ---------------------------------------------------------------------------
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
reset_clone "$base"
(cd "$CLONE" && git checkout --quiet -b probe-pass-marker "$base")
mkdir -p "$CLONE/skills/probe-noncompliant-skill"
cat > "$CLONE/skills/probe-noncompliant-skill/SKILL.md" <<'EOF'
---
name: probe-noncompliant-skill
description: deliberately missing version and evals, and no trigger clause.
---

# Probe non-compliant skill, declared as an exception
EOF
(cd "$CLONE" && git add -- skills/probe-noncompliant-skill && git commit --quiet -m "$(printf 'feat(probe): intentionally non-conformant probe skill\n\n// allow-skills-standard: probe MUST_PASS escape-hatch case')")
if ! grep -qF "probe-noncompliant-skill" "$CLONE/skills/probe-noncompliant-skill/SKILL.md"; then
  FAILURES+=("MUST_PASS marker-escape-hatch — mutation did NOT land — probe invalid")
else
  set +e
  output="$(run_guard "$base" HEAD 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ] && echo "$output" | grep -qF "SKIPPED"; then
    MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
    log MUST_PASS "PASS — allow-skills-standard marker — guard exited 0 (SKIPPED)"
  else
    FAILURES+=("MUST_PASS marker-escape-hatch — guard exited $status or did not report SKIPPED — output: $output")
    log MUST_PASS "FAIL — marker-escape-hatch — exit=$status output=$output"
  fi
fi

# ---------------------------------------------------------------------------
# MUST_BLOCK #5 — marker MENTIONED IN PROSE must NOT disarm the guard (same
# discipline as release-artifacts-guard.mjs's own probe — the marker only
# counts anchored at the start of its own line).
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
reset_clone "$base"
(cd "$CLONE" && git checkout --quiet -b probe-block-prose-marker "$base")
mkdir -p "$CLONE/skills/probe-prose-marker-skill"
cat > "$CLONE/skills/probe-prose-marker-skill/SKILL.md" <<'EOF'
---
name: probe-prose-marker-skill
description: deliberately missing version and evals, no trigger clause.
---

# Probe skill whose commit message merely describes the escape hatch
EOF
(cd "$CLONE" && git add -- skills/probe-prose-marker-skill && git commit --quiet -m "$(printf 'feat(probe): a commit that only DESCRIBES the escape hatch in prose\n\nThe escape hatch is a written // allow-skills-standard: <reason> line at the\nstart of a line in the HEAD commit — quoting it here, in prose, must not disable anything.')")
if ! grep -qF "probe-prose-marker-skill" "$CLONE/skills/probe-prose-marker-skill/SKILL.md"; then
  FAILURES+=("MUST_BLOCK prose-marker — mutation did NOT land — probe invalid")
else
  set +e
  output="$(run_guard "$base" HEAD 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 1 ] && echo "$output" | grep -qF "probe-prose-marker-skill"; then
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
    log MUST_BLOCK "PASS — marker quoted in PROSE does not disarm the guard — still blocked"
  else
    FAILURES+=("MUST_BLOCK prose-marker — guard exited $status (expected 1) — output: $output")
    log MUST_BLOCK "FAIL — prose-marker — exit=$status output=$output"
  fi
fi

# ---------------------------------------------------------------------------
# Exit-2 pole — `skills/` directory absent entirely: the guard must REFUSE TO
# JUDGE (exit 2), naming what it could not read, never silently exit 0.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
reset_clone "$base"
(cd "$CLONE" && git checkout --quiet -b probe-exit2-no-skills-dir "$base")
git -C "$CLONE" rm -rq skills >/dev/null
(cd "$CLONE" && git commit --quiet -m "probe: remove skills/ entirely to force the exit-2 pole")
if [ -d "$CLONE/skills" ]; then
  FAILURES+=("EXIT2 no-skills-dir — mutation did NOT land (skills/ still present) — probe invalid")
else
  set +e
  output="$(run_guard "$base" HEAD 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 2 ] && echo "$output" | grep -qF "REFUSING TO JUDGE"; then
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
    log EXIT2 "PASS — skills/ absent — guard exited 2, naming the refusal"
  else
    FAILURES+=("EXIT2 no-skills-dir — guard exited $status (expected 2) or did not name the refusal — output: $output")
    log EXIT2 "FAIL — no-skills-dir — exit=$status output=$output"
  fi
fi

# ---------------------------------------------------------------------------
# Case e — MUST_PASS (VENDORED): better-colors, SKILL.md TOUCHED but content
# byte-identical (mode-only chmod). The file appears in the diff (git tracks
# mode changes), so touchedSkillDirs() picks up better-colors — the guard
# must recompute digests, find them unchanged, and exempt it.
# ---------------------------------------------------------------------------
MUST_PASS_TOTAL=$((MUST_PASS_TOTAL + 1))
reset_clone "$base"
(cd "$CLONE" && git checkout --quiet -b probe-pass-vendored-mode-touch "$base")
regen_vendored_manifest better-colors
(cd "$CLONE" && git add -- skills/VENDORED.json && git commit --quiet -m "probe: declare better-colors VENDORED (fixture baseline, PRIOR commit)")
baseline_sha="$(cd "$CLONE" && git rev-parse HEAD)"
chmod 755 "$CLONE/skills/better-colors/SKILL.md"
(cd "$CLONE" && git add -- skills/better-colors/SKILL.md && git commit --quiet -m "probe: mode-only touch on VENDORED better-colors/SKILL.md (content byte-identical)")
if ! git -C "$CLONE" diff --name-only "$baseline_sha" HEAD | grep -qF "skills/better-colors/SKILL.md"; then
  FAILURES+=("MUST_PASS vendored-mode-touch — mutation did NOT land (file absent from diff) — probe invalid")
else
  set +e
  output="$(run_guard "$baseline_sha" HEAD 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    MUST_PASS_PASS=$((MUST_PASS_PASS + 1))
    log MUST_PASS "PASS — VENDORED better-colors touched (mode only, digest unchanged) — exempted, exit 0"
  else
    FAILURES+=("MUST_PASS vendored-mode-touch — guard exited $status (expected 0) — output: $output")
    log MUST_PASS "FAIL — vendored-mode-touch — exit=$status output=$output"
  fi
fi

# ---------------------------------------------------------------------------
# Case f — MUST_BLOCK (VENDORED): better-ui, SKILL.md CONTENT modified
# (trivial comment) on a previously-declared VENDORED entry. Digest breaks —
# guard must bite, naming the file and "digest integrity", never silently
# pass a modified vendored file.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
reset_clone "$base"
(cd "$CLONE" && git checkout --quiet -b probe-block-vendored-modified "$base")
regen_vendored_manifest better-ui
(cd "$CLONE" && git add -- skills/VENDORED.json && git commit --quiet -m "probe: declare better-ui VENDORED (fixture baseline, PRIOR commit)")
baseline_sha="$(cd "$CLONE" && git rev-parse HEAD)"
printf '\n<!-- probe: trivial comment injected into VENDORED content -->\n' >> "$CLONE/skills/better-ui/SKILL.md"
(cd "$CLONE" && git add -- skills/better-ui/SKILL.md && git commit --quiet -m "probe: trivial comment edit on real shipped VENDORED better-ui/SKILL.md")
if ! grep -qF "probe: trivial comment injected" "$CLONE/skills/better-ui/SKILL.md"; then
  FAILURES+=("MUST_BLOCK vendored-modified — mutation did NOT land — probe invalid")
else
  set +e
  output="$(run_guard "$baseline_sha" HEAD 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 1 ] && echo "$output" | grep -qF "better-ui/SKILL.md" && echo "$output" | grep -qF "digest integrity"; then
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
    log MUST_BLOCK "PASS — VENDORED better-ui content modified — guard exited 1, named digest mismatch"
  else
    FAILURES+=("MUST_BLOCK vendored-modified — guard exited $status (expected 1) or missing digest-integrity mention — output: $output")
    log MUST_BLOCK "FAIL — vendored-modified — exit=$status output=$output"
  fi
fi

# ---------------------------------------------------------------------------
# Case g — MUST_BLOCK (VENDORED): a brand-new, non-conformant home-grown
# skill adds ITS OWN VENDORED.json entry in the SAME diff that introduces
# it — self-declaring VENDORED to dodge the standard. Entry-provenance check
# must refuse the exemption (the entry did not exist at BASE_REF) and the
# skill must fall through to, and fail, the full skill-standard-v2.md check.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
reset_clone "$base"
(cd "$CLONE" && git checkout --quiet -b probe-block-fake-vendored-self-declare "$base")
baseline_sha="$(cd "$CLONE" && git rev-parse HEAD)"
mkdir -p "$CLONE/skills/probe-fake-vendored-skill"
cat > "$CLONE/skills/probe-fake-vendored-skill/SKILL.md" <<'EOF'
---
name: probe-fake-vendored-skill
description: a home-grown skill trying to dodge the standard by claiming VENDORED status.
---

# Probe fake-vendored skill — no version, no evals, no trigger clause
EOF
regen_vendored_manifest probe-fake-vendored-skill
(cd "$CLONE" && git add -- skills/probe-fake-vendored-skill skills/VENDORED.json && git commit --quiet -m "probe: home-grown skill self-declares VENDORED in the SAME diff that introduces it")
if ! grep -qF "probe-fake-vendored-skill" "$CLONE/skills/VENDORED.json"; then
  FAILURES+=("MUST_BLOCK fake-vendored-self-declare — mutation did NOT land (manifest entry absent) — probe invalid")
else
  set +e
  output="$(run_guard "$baseline_sha" HEAD 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 1 ] && echo "$output" | grep -qF "entry provenance" && echo "$output" | grep -qF "probe-fake-vendored-skill"; then
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
    log MUST_BLOCK "PASS — home-grown skill self-declaring VENDORED in-diff — exemption refused AND full standard failed"
  else
    FAILURES+=("MUST_BLOCK fake-vendored-self-declare — guard exited $status (expected 1) or missing provenance/skill mention — output: $output")
    log MUST_BLOCK "FAIL — fake-vendored-self-declare — exit=$status output=$output"
  fi
fi

# ---------------------------------------------------------------------------
# Case h — MUST_BLOCK (VENDORED, Pi's live attack, same day): a manifest
# entry naming a skill directory that DOES NOT EXIST ON DISK, added by
# ITSELF — no skills/<name>/... path is touched, only skills/VENDORED.json.
# Pi measured this exact case against this guard's own SHA before this fix:
# `touchedSkillDirs()` never saw the manifest edit (VENDORED.json is a
# top-level file under skills/, same carve-out as ATTRIBUTION.md), so the
# guard printed "this diff touches no skills/<name>/ directory" and exited
# 0 — a phantom entry could merge clean, then a follow-up PR adding the real
# directory would find the entry already "predating" it (provenance
# satisfied) and dodge the standard in two moves. This pole proves the fix:
# touching skills/VENDORED.json alone must widen the checked set to every
# name the manifest lists, and a name with no matching directory must BITE
# — exit 1, naming the exact phantom skill — closing the two-PR path at
# PR#1, before a PR#2 ever gets a chance.
# ---------------------------------------------------------------------------
MUST_BLOCK_TOTAL=$((MUST_BLOCK_TOTAL + 1))
reset_clone "$base"
(cd "$CLONE" && git checkout --quiet -b probe-block-phantom-manifest-entry "$base")
regen_vendored_manifest better-ui
(cd "$CLONE" && git add -- skills/VENDORED.json && git commit --quiet -m "probe: declare better-ui VENDORED (fixture baseline, PRIOR commit)")
baseline_sha="$(cd "$CLONE" && git rev-parse HEAD)"
# Copy a real, already-vendored entry (better-ui) onto a name whose
# directory does not exist ANYWHERE on disk — exactly Pi's attack: reuse a
# legitimate entry's shape, point it at nothing.
node -e "
const fs = require('node:fs');
const manifestPath = '$CLONE/skills/VENDORED.json';
const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
m.skills['evil-home-skill'] = JSON.parse(JSON.stringify(m.skills['better-ui']));
fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2) + '\n');
"
(cd "$CLONE" && git add -- skills/VENDORED.json && git commit --quiet -m "probe: ATTACK — phantom VENDORED entry 'evil-home-skill', no directory touched, no skills/<name>/ path in this diff at all")
if ! grep -qF "evil-home-skill" "$CLONE/skills/VENDORED.json"; then
  FAILURES+=("MUST_BLOCK phantom-manifest-entry — mutation did NOT land (entry absent) — probe invalid")
elif [ -d "$CLONE/skills/evil-home-skill" ]; then
  FAILURES+=("MUST_BLOCK phantom-manifest-entry — probe invalid: skills/evil-home-skill/ exists on disk, this pole requires it to be ABSENT")
else
  set +e
  output="$(run_guard "$baseline_sha" HEAD 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 1 ] && echo "$output" | grep -qF "evil-home-skill" && echo "$output" | grep -qF "does not exist on disk"; then
    MUST_BLOCK_PASS=$((MUST_BLOCK_PASS + 1))
    log MUST_BLOCK "PASS — phantom manifest entry (no skills/<name>/ path in diff at all) — guard exited 1, named the phantom skill"
  else
    FAILURES+=("MUST_BLOCK phantom-manifest-entry — guard exited $status (expected 1) or did not name the phantom skill — output: $output")
    log MUST_BLOCK "FAIL — phantom-manifest-entry — exit=$status output=$output"
  fi
fi

# ---------------------------------------------------------------------------
# Restoration proof — the INVOKING worktree, never the scratch clone.
# ---------------------------------------------------------------------------
reset_clone "$base" 2>/dev/null || true
cd "$REPO_ROOT"
POST_PROBE_DIFF="$(git diff --stat)"

echo ""
echo "==================== PROBE SUMMARY ===================="
echo "MUST_BLOCK: $MUST_BLOCK_PASS/$MUST_BLOCK_TOTAL"
echo "MUST_PASS:  $MUST_PASS_PASS/$MUST_PASS_TOTAL"
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

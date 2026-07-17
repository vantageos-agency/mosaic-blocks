#!/usr/bin/env bash
#
# probe-derive-pr-url-resolution.sh — bite-probe for the "Open a PR with the
# derived artifacts (main is protected)" step in the derive-release-artifacts
# job of .github/workflows/ci.yml.
#
# NAMED FEAR (this is the whole point of the probe): the step used to capture
# `gh pr create`'s stdout AND stderr into CREATE_OUTPUT, then on the success
# path did `PR_URL="${CREATE_OUTPUT}"` — a value scraped from command output
# instead of resolved from the artifact GitHub already holds. Any warning gh
# emits on stderr pollutes PR_URL, and the following `gh pr merge --auto
# --squash "${PR_URL}"` receives garbage.
#
# The class is killed, not tested around: PR_URL is now resolved via
# `gh pr view "$BRANCH" --json url --jq .url` on every path (new PR and
# reused PR). CREATE_OUTPUT is only ever used to pick which path was taken —
# its literal text never becomes data again.
#
# The step's run script is extracted FROM THE PARSED YAML (python3 +
# yaml.safe_load, keyed on the step's name) — never copy-pasted here. A probe
# testing a copy of the code proves nothing about the code.
#
# CENSUS (derived from the step's own control flow, not enumerated from
# memory) — the step has exactly four outcomes after `gh pr create`:
#
#   1. create succeeds, but gh printed noise on stderr    -> MUST_PASS
#      (closes the named fear: old code fails this, new code passes it)
#   2. create fails because the PR already exists (re-run) -> MUST_PASS
#   3. create fails for any OTHER reason (bad token, etc.)  -> MUST_BLOCK
#      (script must exit non-zero and never call `gh pr merge`)
#   4. the PR URL cannot be resolved via `gh pr view`        -> MUST_BLOCK
#      (script must exit non-zero and never call `gh pr merge` with an
#      empty argument)
#
# This probe borrows NOTHING from its author's environment: no absolute path
# to a personal checkout, no assumed branch, no ambient env var. Every path
# is derived from the probe's own location ($SCRIPT_DIR), and it runs inside
# an isolated scratch git repo + a PATH-local stub `gh`/`git` it authors
# itself — nothing ever touches a real remote.
#
# HONESTY NOTE: this probe proves the step's LOGIC (the four outcomes above),
# not its real-world re-runnability — the job only fires on `push` to main,
# unreachable from a PR, so that stays unverified until the next merge.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKFLOW="$REPO_ROOT/.github/workflows/ci.yml"
STEP_NAME="Open a PR with the derived artifacts (main is protected)"

FAILURES=()
PASSES=0

fail() { # $1 label $2 reason
  FAILURES+=("$1 — $2")
  echo "[FAIL] $1 — $2"
}

pass() { # $1 label
  PASSES=$((PASSES + 1))
  echo "[PASS] $1"
}

# ── extract the step's run script from the PARSED yaml ─────────────────────
EXTRACT_DIR="$(mktemp -d)"
trap 'rm -rf "${EXTRACT_DIR}"' EXIT

RAW_SCRIPT="${EXTRACT_DIR}/step-raw.sh"

python3 - "$WORKFLOW" "$STEP_NAME" "$RAW_SCRIPT" <<'PYEOF'
import sys
import yaml

workflow_path, step_name, out_path = sys.argv[1], sys.argv[2], sys.argv[3]

with open(workflow_path, "r", encoding="utf-8") as fh:
    doc = yaml.safe_load(fh)

found = None
for job_key, job in doc.get("jobs", {}).items():
    for step in job.get("steps", []):
        if step.get("name") == step_name:
            found = step
            break
    if found:
        break

if found is None:
    sys.stderr.write(f"COULD NOT FIND step named {step_name!r} in {workflow_path}\n")
    sys.exit(1)

run = found.get("run")
if not run:
    sys.stderr.write(f"step {step_name!r} has no 'run:' block\n")
    sys.exit(1)

with open(out_path, "w", encoding="utf-8") as fh:
    fh.write(run)
PYEOF

if [ $? -ne 0 ] || [ ! -s "${RAW_SCRIPT}" ]; then
  echo "::error::could not extract the step's run script from the parsed YAML — refusing to fabricate a fixture."
  exit 1
fi
pass "extracted step '${STEP_NAME}' run script from parsed YAML (${RAW_SCRIPT})"

# `bash -n` sanity on the raw extracted script (before any expression
# substitution — the ${{ }} tokens are inert to bash, they are just words).
if ! bash -n "${RAW_SCRIPT}"; then
  fail "bash -n on extracted script" "syntax error in the extracted step"
else
  pass "bash -n on extracted step script"
fi

# GitHub Actions substitutes `${{ }}` expressions BEFORE bash ever sees the
# script. This step's run block references exactly one: the derived version
# output. Simulate that substitution textually — anything else left over
# is a real bug the probe should surface, not paper over.
STEP_SCRIPT="${EXTRACT_DIR}/step.sh"
sed 's/\${{ *steps\.derive-version\.outputs\.next_version *}}/9.9.9/' "${RAW_SCRIPT}" > "${STEP_SCRIPT}"

if grep -qF '${{' "${STEP_SCRIPT}"; then
  echo "::error::unrecognized \${{ }} expression left in the extracted step after substitution — the probe's model of this step is stale:"
  grep -nF '${{' "${STEP_SCRIPT}"
  exit 1
fi
pass "GH Actions expression substitution landed (no \${{ }} left)"

# ── stub bin dir: gh + git, PATH-local, authored by this probe ─────────────
STUB_BIN="${EXTRACT_DIR}/bin"
mkdir -p "${STUB_BIN}"

CALL_LOG="${EXTRACT_DIR}/calls.log"

# git stub: `status --porcelain` reports fake drift so the step proceeds past
# its early-exit; every other subcommand is a no-op that never touches a
# real remote.
cat > "${STUB_BIN}/git" <<'GITEOF'
#!/usr/bin/env bash
echo "git $*" >> "${CALL_LOG}"
case "$1" in
  status)
    echo " M package.json"
    ;;
  *)
    exit 0
    ;;
esac
GITEOF
chmod +x "${STUB_BIN}/git"

# gh stub: behavior driven by STUB_GH_CREATE_MODE / STUB_GH_VIEW_URL, set per
# scenario below. Logs every invocation so the probe can assert exactly what
# `gh pr merge` received.
cat > "${STUB_BIN}/gh" <<'GHEOF'
#!/usr/bin/env bash
echo "gh $*" >> "${CALL_LOG}"

case "$1 $2" in
  "pr create")
    case "${STUB_GH_CREATE_MODE:-}" in
      success_noisy)
        echo "Warning: gh emitted noise on stderr, this must never become the PR URL" >&2
        echo "https://github.com/example/mosaic-blocks/pull/999"
        exit 0
        ;;
      already_exists)
        echo "a pull request for branch \"bot/derive-9.9.9-fe9b8ba\" into branch \"main\" already exists:" >&2
        echo "https://github.com/example/mosaic-blocks/pull/321" >&2
        exit 1
        ;;
      fatal)
        echo "error validating token: 401 Bad credentials" >&2
        exit 1
        ;;
      *)
        echo "STUB MISCONFIGURED: STUB_GH_CREATE_MODE unset" >&2
        exit 99
        ;;
    esac
    ;;
  "pr view")
    if [ -n "${STUB_GH_VIEW_URL:-}" ]; then
      echo "${STUB_GH_VIEW_URL}"
    fi
    exit 0
    ;;
  "pr merge")
    echo "MERGE_CALLED_WITH:$*" >> "${CALL_LOG}"
    exit 0
    ;;
  *)
    echo "STUB gh: unhandled invocation: $*" >&2
    exit 98
    ;;
esac
GHEOF
chmod +x "${STUB_BIN}/gh"

export CALL_LOG

STEP_OUTPUT_LOG="${EXTRACT_DIR}/step-output.log"

run_scenario() { # $1 label, $2 create_mode, $3 view_url
  local label="$1" create_mode="$2" view_url="$3"
  local sandbox
  sandbox="$(mktemp -d)"
  : > "${CALL_LOG}"

  (
    cd "${sandbox}" &&
    PATH="${STUB_BIN}:${PATH}" \
    STUB_GH_CREATE_MODE="${create_mode}" \
    STUB_GH_VIEW_URL="${view_url}" \
    CALL_LOG="${CALL_LOG}" \
    GITHUB_SHA="fe9b8ba0000000000000000000000000000000" \
    GH_TOKEN="stub-token" \
    bash -eo pipefail "${STEP_SCRIPT}"
  ) > "${STEP_OUTPUT_LOG}" 2>&1
  local rc=$?
  rm -rf "${sandbox}"
  return "${rc}"
}

# ── scenario 1 (MUST_PASS): new PR, noisy stderr — THE POLE THAT CLOSES THE
# NAMED FEAR. Must fail against the old scrape-CREATE_OUTPUT code and pass
# against the resolved code. ────────────────────────────────────────────────
run_scenario "new-pr-noisy-stderr" "success_noisy" "https://github.com/example/mosaic-blocks/pull/999"
RC1=$?
if [ "${RC1}" -ne 0 ]; then
  fail "MUST_PASS new-PR noisy-stderr" "step exited ${RC1}, expected 0 — output: $(cat "${STEP_OUTPUT_LOG}" 2>/dev/null)"
elif ! grep -qxF "gh pr merge --auto --squash https://github.com/example/mosaic-blocks/pull/999" "${CALL_LOG}"; then
  fail "MUST_PASS new-PR noisy-stderr" "gh pr merge did not receive exactly the canonical URL — call log:
$(cat "${CALL_LOG}")"
else
  pass "MUST_PASS new-PR noisy-stderr: gh pr merge received EXACTLY the canonical resolved URL, stderr noise never leaked into it"
fi

# ── scenario 2 (MUST_PASS): re-run path, PR already exists ────────────────
run_scenario "already-exists-rerun" "already_exists" "https://github.com/example/mosaic-blocks/pull/321"
RC2=$?
if [ "${RC2}" -ne 0 ]; then
  fail "MUST_PASS already-exists re-run" "step exited ${RC2}, expected 0 — output: $(cat "${STEP_OUTPUT_LOG}" 2>/dev/null)"
elif ! grep -qxF "gh pr merge --auto --squash https://github.com/example/mosaic-blocks/pull/321" "${CALL_LOG}"; then
  fail "MUST_PASS already-exists re-run" "gh pr merge did not receive the reused PR's resolved URL — call log:
$(cat "${CALL_LOG}")"
else
  pass "MUST_PASS already-exists re-run: reused PR resolved to its canonical URL, exit 0"
fi

# ── scenario 3 (MUST_BLOCK): create fails for a reason OTHER than "already
# exists" — must exit non-zero and NEVER call gh pr merge. ─────────────────
run_scenario "fatal-create-failure" "fatal" ""
RC3=$?
if [ "${RC3}" -eq 0 ]; then
  fail "MUST_BLOCK fatal create failure" "step exited 0, expected non-zero"
elif grep -q "MERGE_CALLED_WITH" "${CALL_LOG}"; then
  fail "MUST_BLOCK fatal create failure" "gh pr merge was called despite a fatal, non-'already exists' create failure — call log:
$(cat "${CALL_LOG}")"
else
  pass "MUST_BLOCK fatal create failure: exit ${RC3}, gh pr merge never called"
fi

# ── scenario 4 (MUST_BLOCK): PR created, but gh pr view cannot resolve a URL
# — must exit non-zero and NEVER call gh pr merge with an empty argument. ──
run_scenario "unresolvable-url" "success_noisy" ""
RC4=$?
if [ "${RC4}" -eq 0 ]; then
  fail "MUST_BLOCK unresolvable URL" "step exited 0, expected non-zero"
elif grep -q "MERGE_CALLED_WITH" "${CALL_LOG}"; then
  fail "MUST_BLOCK unresolvable URL" "gh pr merge was called despite an unresolvable PR URL — call log:
$(cat "${CALL_LOG}")"
else
  pass "MUST_BLOCK unresolvable URL: exit ${RC4}, gh pr merge never called with an empty URL"
fi

# ── restoration proof ───────────────────────────────────────────────────────
DIFF_AFTER="$(cd "${REPO_ROOT}" && git diff --stat -- .github/workflows/ci.yml)"
if [ -n "${DIFF_AFTER}" ]; then
  echo "NOTE: ci.yml has uncommitted changes — expected while this fix is being authored, not a probe side effect:"
  echo "${DIFF_AFTER}"
fi

echo
echo "=== probe-derive-pr-url-resolution: ${PASSES} pass(es), ${#FAILURES[@]} failure(s) ==="
if [ "${#FAILURES[@]}" -gt 0 ]; then
  for f in "${FAILURES[@]}"; do
    echo "  - ${f}"
  done
  exit 1
fi
exit 0

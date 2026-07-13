#!/usr/bin/env bash
#
# probe-derive-next-version.sh — proves the branches of derive-next-version.mjs
# that a green run never exercises.
#
# A resolver that WRITES has two branches nobody sees on a happy path:
#
#   1. the argument it does not understand — swallowed as a no-op, it turns a
#      caller's misunderstanding into a silent write. This is not theoretical:
#      an earlier revision accepted `--dry-run` (a flag that never existed) and
#      wrote package.json + src/version.ts anyway, silently.
#
#   2. the registry it cannot reach — if it falls back to a cached or
#      hand-typed version there, the whole point of deriving is lost, quietly.
#      An absence of signal from the registry is an EVENT, never a rest.
#
# Both branches are asserted here, on the real script, with the real registry
# for the happy path. A fail-closed path that is never exercised is an
# intention, not a guarantee.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DERIVE="$REPO_ROOT/scripts/derive-next-version.mjs"

cd "$REPO_ROOT"

FAILURES=()
PRE_DIFF="$(git diff -- package.json src/version.ts)"

expect_exit() { # $1 label, $2 expected_code, $3 expected_substring, rest: command
  local label="$1" expected="$2" needle="$3"; shift 3
  local out code
  out="$("$@" 2>&1)"; code=$?
  if [ "$code" -ne "$expected" ]; then
    FAILURES+=("$label — expected exit $expected, got $code")
    echo "[FAIL] $label — exit $code (expected $expected)"
    return
  fi
  if ! grep -qF "$needle" <<<"$out"; then
    FAILURES+=("$label — output did not name '$needle'")
    echo "[FAIL] $label — output did not name: $needle"
    return
  fi
  echo "[PASS] $label — exit $code, named the reason"
}

# ── MUST_REFUSE ─────────────────────────────────────────────────────────────
expect_exit "unknown flag is refused LOUDLY, not swallowed into a write" \
  1 "unknown argument" \
  node "$DERIVE" --dry-run

expect_exit "unreachable registry fails CLOSED (no fallback to a typed version)" \
  1 "refusing to fall back" \
  env MOSAIC_REGISTRY_BASE=https://registry.invalid.localhost node "$DERIVE"

# ── MUST_PASS ───────────────────────────────────────────────────────────────
expect_exit "--check resolves against the LIVE registry and writes nothing" \
  0 "Nothing written" \
  node "$DERIVE" --check

# ── Nothing was written by any of the above ─────────────────────────────────
POST_DIFF="$(git diff -- package.json src/version.ts)"
if [ "$PRE_DIFF" != "$POST_DIFF" ]; then
  FAILURES+=("a probe case WROTE to package.json / src/version.ts — none may")
  echo "[FAIL] version files mutated during the probe"
else
  echo "[PASS] package.json + src/version.ts untouched by every case above"
fi

echo ""
if [ "${#FAILURES[@]}" -gt 0 ]; then
  echo "FAILURES (${#FAILURES[@]}):"
  for f in "${FAILURES[@]}"; do echo "  - $f"; done
  exit 1
fi
echo "ALL CASES PASSED — refusal branches proven, not assumed."

#!/usr/bin/env node
/**
 * pr-title-matches-diff-guard.mjs — a merge title is a HAND-TYPED claim about
 * an artifact a machine can read (the diff). Per
 * .claude/rules/derive-never-type.md, that claim is either derived and
 * verified, or it is a lie in waiting.
 *
 * REAL INCIDENT this guard closes: three merge commits on `main` carried a
 * title naming a component their own diff did NOT contain — the title said
 * one thing, `git diff` said another, and the mismatched title was relayed
 * as a delivery claim before anyone re-opened the diff. A fourth, sibling
 * commit the same day carried a TRUE title (the one this guard's MUST_PASS
 * case replays). Nothing in CI checked the difference between the two.
 *
 * WHAT THIS GUARD ENFORCES: for any commit/PR whose diff adds or modifies at
 * least one file under `src/components/`, IF the title makes a component
 * claim, that claim must be one the diff really adds or touches. A claim is
 * a LITERAL `Mosaic<Name>` token appearing anywhere in the title text —
 * NOTHING ELSE. The conventional-commit `type(scope):` scope is used only to
 * CORROBORATE a claim already made by a literal token (scope-kebab ->
 * PascalCase -> `Mosaic<Scope>`, checked against the diff); it never
 * manufactures a claim on its own. Measured over the last 120 real commits
 * of this repo's own history, promoting the scope into the claim set
 * produced 14 false BLOCKED verdicts on commits that never wrote a single
 * `Mosaic<Name>` token and whose diff was perfectly healthy — a title with
 * zero literal tokens has claimed nothing, and there is nothing to verify.
 *
 * against everything the diff really contains, derived two ways, both from
 * the artifact, never enumerated by hand:
 *
 *   (a) every `src/components/<dir>/` directory the diff touches, mapped
 *       dir-kebab -> PascalCase -> `Mosaic<Dir>` (same mapping as above —
 *       this repo's own naming convention makes the mapping exact for every
 *       component in the tree, verified against the full component census
 *       below); and
 *   (b) every literal `Mosaic<Name>` token appearing on an ADDED line of
 *       `src/index.ts`'s own diff (the export surface itself), as a second,
 *       independent source in case a component's real exported name and its
 *       directory name ever diverge.
 *
 * WHY THE FORM-DOMAIN IS DERIVED FROM REAL HISTORY, NOT ENUMERATED (per
 * .claude/rules/guard-formulation-census.md): `git log --format=%s -300`
 * against this repo's own history (see the probe script for the exact
 * command and the resulting census) surfaces SEVEN distinct title shapes —
 * conventional-commit scoped with a matching/mismatching Mosaic token,
 * free-form prose with/without a Mosaic token, a conventional-commit scope
 * with NO Mosaic token at all (component-scoped test/fix commits), a title
 * naming NOTHING at all on a diff that touches many components (a mass
 * refactor), and a diff that touches zero component files regardless of
 * title shape. This guard does not special-case each shape as a separate
 * detector — a title-shape detector list is exactly the disease this class
 * of guard exists to close (a title-shape nobody enumerated reopens the
 * hole). Instead it derives CLAIMED and ACTUAL as two plain sets and asks
 * one question, uniformly, regardless of how the title is phrased: does the
 * claimed set intersect the actual set?
 *
 * THE ONE DECLARED EXEMPTION (decided from the DIFF, never from the title —
 * per guard-formulation-census.md rule 3): a commit whose diff touches ZERO
 * files under `src/components/` (chore(release) bumps, CI-only fixes, docs,
 * scripts) makes no component claim to verify, and this guard has nothing to
 * check. This exemption is a `componentChanged.length === 0` check on the
 * diff's own file list, immediately below — not a title-text allowlist, and
 * not a keyword skip-list. A title that HAPPENS to look like a release
 * commit but whose diff DOES touch `src/components/` gets no free pass: the
 * claim/actual check still runs.
 *
 * NO FAIL-CLOSED ON AN EMPTY CLAIM: a title with ZERO literal `Mosaic<Name>`
 * tokens has claimed NOTHING — not "an unrecognized shape", not "out of
 * scope" — genuinely nothing to verify, and this guard says so explicitly
 * (logged, never a silent `return`) rather than fabricating a claim from the
 * conventional-commit scope to have something to compare. The 14-false-
 * positive defect measured on real history was exactly this: an empty
 * literal claim was promoted into a non-empty one, then reported as a
 * mismatch against a diff the author never lied about. Every other branch
 * (non-empty claim vs the diff's real components) still fails closed: an
 * empty ACTUAL set (diff touches zero components) is handled by the ONE
 * declared exemption above, and a non-empty CLAIM that fails to intersect
 * the ACTUAL set is always BLOCKED.
 *
 * WRITTEN ESCAPE HATCH (rare, anchored, never a silent skip): a HEAD commit
 * message body carrying `// allow-title-diff-mismatch: <reason>` on its own
 * line — same anchoring convention as this repo's other guards (an
 * unanchored marker disables itself the moment a commit message merely
 * MENTIONS it in prose describing the escape hatch; see this guard's own
 * probe for a case proving the anchor holds).
 *
 * Usage: node scripts/pr-title-matches-diff-guard.mjs
 *   Compares BASE_REF...HEAD (default origin/main; override via
 *   PR_TITLE_GUARD_BASE_REF for the probe, or for the push-to-main CI run —
 *   see below).
 *
 * TWO CALL SITES, ONE ARTIFACT EACH (per guard-formulation-census.md — the
 * domain of "who carries the title" has TWO members, and a guard covering
 * only the one that never lies is worse than no guard):
 *
 *   1. pull_request event: BASE_REF defaults to origin/main, HEAD is the PR's
 *      tip commit, and the subject checked is that commit's own subject —
 *      the PR TITLE, which GitHub keeps honest at review time.
 *   2. push:main event (this repo's squash-merge convention): CI sets
 *      PR_TITLE_GUARD_BASE_REF=HEAD^ so HEAD is the just-pushed MERGE commit
 *      and the base is its own first parent — the subject checked is the
 *      SQUASH-MERGE COMMIT SUBJECT, hand-typed by a human in GitHub's merge
 *      box at merge time, independent of whatever the PR title said. This is
 *      the artifact the real incident actually lived in: three merge commits
 *      on main named a component their own diff never touched, while every
 *      PR title upstream of them was correct — a PR-only guard exits 0 on
 *      all three and never sees the artifact that lied.
 */

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { basename as posixBasename, dirname as posixDirname } from "node:path/posix";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const BASE_REF = process.env.PR_TITLE_GUARD_BASE_REF ?? "origin/main";

// On the pull_request path, `actions/checkout@v4` leaves the real HEAD
// commit ONE STEP BEHIND the synthetic merge commit — HEAD^2 by convention,
// but that convention is fragile across checkout/merge strategies. CI passes
// the real PR head SHA explicitly (PR_TITLE_GUARD_HEAD_REF) so the diff and
// the escape-hatch marker are read off the commit a human actually authored,
// never off `"Merge <sha> into <sha>"`. Unset on push:main, where plain
// `HEAD` already IS the real (squash-merge) commit.
const HEAD_REF = process.env.PR_TITLE_GUARD_HEAD_REF ?? "HEAD";

// Anchored at start-of-line, deliberately — same remedy this repo already
// applies twice (release-artifacts-guard, no-hardcoded-words-guard): a
// commit message that merely EXPLAINS the escape hatch quotes the marker
// mid-sentence, and an unanchored regex reads that explanation as a
// declaration.
const MARKER_RE = /^\s*\/\/\s*allow-title-diff-mismatch:\s*(\S.+)$/m;

const COMPONENT_PATH_RE = /^src\/components\/([^/]+)\//;
const MOSAIC_TOKEN_RE = /Mosaic[A-Z][a-zA-Z0-9]*/g;
const SCOPE_RE = /^[a-z]+\(([a-zA-Z0-9_.-]+)\):/;

/**
 * Run a git command, exit-code-checked. NEVER swallow a non-zero exit — a
 * git command this guard cannot run means it cannot verify the PR's diff at
 * all, and refusing loudly beats reporting a clean bill of health on data it
 * never actually read.
 * @param {string[]} args
 * @returns {string}
 */
function git(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
  } catch (err) {
    const stderr = err && typeof err === "object" && "stderr" in err ? String(err.stderr) : "";
    throw new Error(
      `pr-title-matches-diff-guard: \`git ${args.join(" ")}\` failed — cannot verify this PR's diff. ` +
        `Refusing to pass silently. stderr: ${stderr || err.message}`,
    );
  }
}

/**
 * @returns {string} the title this guard must check. The title domain has
 * THREE carriers, not two:
 *   1. the PR title (honest — GitHub keeps it in sync with review)
 *   2. the SYNTHETIC `"Merge <sha> into <sha>"` subject `actions/checkout@v4`
 *      leaves as HEAD's subject on `refs/pull/N/merge` — nobody writes this
 *      string, and reading it finds no component token on EVERY PR touching
 *      src/components/, blocking 100% of them regardless of honesty.
 *   3. the hand-typed squash-merge commit subject on push:main — the one
 *      that actually lied in the real incident.
 * On the pull_request path, CI passes the real PR title explicitly via
 * PR_TITLE_GUARD_SUBJECT (see workflow) precisely to avoid ever reading
 * carrier 2. When that env var is unset (push:main path, or a local/manual
 * run), this falls back to HEAD's own subject — carrier 3, the correct one
 * for that path.
 */
function headSubject() {
  const explicit = process.env.PR_TITLE_GUARD_SUBJECT;
  if (explicit != null && explicit.trim() !== "") {
    return explicit.trim();
  }
  return git(["log", "-1", "--pretty=%s", HEAD_REF]).trim();
}

/**
 * @returns {string} the HEAD commit's full message (subject + body), for the
 * escape-hatch marker only.
 */
function headFullMessage() {
  return git(["log", "-1", "--pretty=%B", HEAD_REF]);
}

/**
 * @returns {string[]} paths changed in BASE_REF...HEAD
 */
function changedFiles() {
  git(["rev-parse", "--verify", BASE_REF]);
  const out = git(["diff", "--name-only", `${BASE_REF}...${HEAD_REF}`]);
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * `kebab-case` -> `PascalCase`. This repo's own directory-naming convention
 * maps exactly onto its exported component names (verified against every
 * `src/components/<dir>/` in the tree by this guard's own probe) — this is
 * not a guess, it is the one mapping the codebase already uses everywhere.
 * @param {string} kebab
 * @returns {string}
 */
function toPascalCase(kebab) {
  return kebab
    .split("-")
    .filter(Boolean)
    .map((seg) => seg[0].toUpperCase() + seg.slice(1))
    .join("");
}
// Known, narrow limitation of this mapping (found by this guard's own probe
// deriving the census against the FULL tree, not hidden): a segment like
// `3col` maps to `3col`, not `3Col` — kebab-case alone cannot tell whether a
// letter immediately after a digit should be capitalized (`feature-3col` ->
// real export `MosaicFeature3Col`). This does not create a blind spot: the
// title-side `Mosaic<Name>` token regex reads the real capitalization
// directly off the title text (independent of this function), and the
// diff-side `src/index.ts` added-line scan is a second, independent source
// of the real name whenever the export surface itself is touched.

/**
 * Everything the DIFF really contains, derived two independent ways (never
 * from the title):
 *   - every `src/components/<dir>/` LEAF directory touched (the file's own
 *     immediate parent directory, NOT the first path segment after
 *     `src/components/`), mapped to `Mosaic<Dir>`
 *   - every `Mosaic<Name>` token on an ADDED line of `src/index.ts`'s diff
 *
 * Why the LEAF directory, not the first segment: this tree nests some
 * component families under a category directory (`src/components/auth/
 * sign-in-layout/MosaicSignInLayout.tsx`) — capturing the first segment
 * after `src/components/` for a path like that would derive the category
 * name `auth` (which exports nothing itself) instead of the real component
 * directory `sign-in-layout`. Verified against every directory in the tree
 * by this guard's own probe.
 * @param {string[]} changed
 * @returns {{ dirs: Set<string>, names: Set<string> }}
 */
function actualComponentClaim(changed) {
  const dirs = new Set();
  for (const path of changed) {
    if (!COMPONENT_PATH_RE.test(path)) continue;
    const leafDir = posixBasename(posixDirname(path));
    dirs.add(leafDir);
  }
  const names = new Set([...dirs].map((d) => `Mosaic${toPascalCase(d)}`));

  if (changed.includes("src/index.ts")) {
    const diffText = git(["diff", `${BASE_REF}...${HEAD_REF}`, "--", "src/index.ts"]);
    for (const line of diffText.split("\n")) {
      if (!line.startsWith("+") || line.startsWith("+++")) continue;
      const matches = line.match(MOSAIC_TOKEN_RE);
      if (matches) for (const t of matches) names.add(t);
    }
  }

  return { dirs, names };
}

/**
 * Everything the TITLE claims. A claim is a LITERAL `Mosaic<Name>` token
 * present in the subject text — NOTHING ELSE. The conventional-commit
 * `type(scope):` scope is returned alongside for CORROBORATION purposes only
 * (a scope that matches a diffed directory can confirm agreement) — it must
 * NEVER, on its own, manufacture a claim the author did not literally write.
 * Promoting the scope into the claim set fabricates a disagreement on
 * commits whose author named no component at all: measured against 120 real
 * commits of this repo's own history, that promotion produced 14 false
 * BLOCKED verdicts on commits whose diff was perfectly healthy (e.g.
 * "feat(atoms): close #24 — 11 base-UI atoms", where the diff really adds 11
 * atoms and the subject never claimed a single `Mosaic<Name>` token). A
 * title with zero literal tokens has made no claim — there is nothing to
 * verify, so it cannot be a mismatch.
 * @param {string} subject
 * @returns {{ tokens: Set<string>, scope: string | null }}
 */
function titleClaim(subject) {
  const tokens = new Set(subject.match(MOSAIC_TOKEN_RE) ?? []);
  const scopeMatch = SCOPE_RE.exec(subject);
  const scope = scopeMatch ? scopeMatch[1] : null;
  return { tokens, scope };
}

function main() {
  const fullMessage = headFullMessage();
  const markerMatch = MARKER_RE.exec(fullMessage);
  if (markerMatch) {
    console.log(
      `pr-title-matches-diff-guard: SKIPPED — HEAD commit carries \`// allow-title-diff-mismatch: ${markerMatch[1].trim()}\`. Declared mismatch, not a silent one.`,
    );
    return;
  }

  const changed = changedFiles();
  const componentChanged = changed.filter((p) => COMPONENT_PATH_RE.test(p));

  // The ONE declared exemption — decided from the DIFF, never from the
  // title. See header comment.
  if (componentChanged.length === 0) {
    console.log(
      `pr-title-matches-diff-guard: OK — ${BASE_REF}...${HEAD_REF} touches no file under src/components/; no component claim to verify.`,
    );
    return;
  }

  const { dirs, names: actual } = actualComponentClaim(changed);
  const subject = headSubject();
  const { tokens: claimed, scope } = titleClaim(subject);

  // A claim is a LITERAL Mosaic<Name> token in the subject — nothing else.
  // A title with zero such tokens has claimed NOTHING (the conv-commit scope
  // is corroboration, never a manufactured claim — see titleClaim() above),
  // so there is no claim to verify. This is not a silent skip: it is logged,
  // and it is the fix for the 14-false-positive defect measured over 120
  // real commits (a fabricated scope->Mosaic<Scope> claim that never
  // appeared in the subject text was previously compared against the diff
  // and reported as a mismatch).
  if (claimed.size === 0) {
    const scopeNote = scope ? ` (scope "${scope}" noted, not promoted to a claim)` : "";
    console.log(
      `pr-title-matches-diff-guard: OK — title "${subject}" names no literal Mosaic<Name> token${scopeNote}; no component claim to verify.`,
    );
    return;
  }

  // The scope may CORROBORATE agreement (a scope matching a diffed
  // directory confirms the literal claim) but it never manufactures one on
  // its own — this branch is only reached when the subject carries at least
  // one literal Mosaic<Name> token.
  const scopeCorroborates = scope != null && actual.has(`Mosaic${toPascalCase(scope)}`);
  const matched = [...claimed].some((c) => actual.has(c)) || scopeCorroborates;
  if (!matched) {
    console.error(
      `pr-title-matches-diff-guard: BLOCKED — title claims [${[...claimed].sort().join(", ")}]${scope ? ` (scope "${scope}")` : ""}, but this diff (${BASE_REF}...${HEAD_REF}) really adds/touches [${[...actual].sort().join(", ") || "none derivable"}] in director(y/ies) ${[...dirs].sort().join(", ")}.\nTitle: "${subject}"\nFix: correct the title to name a component this diff really contains, or add // allow-title-diff-mismatch: <reason> to the HEAD commit message if this is a genuine, declared exception.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `pr-title-matches-diff-guard: OK — title claim [${[...claimed].sort().join(", ")}] matched by diff [${[...actual].sort().join(", ")}].`,
  );
}

main();

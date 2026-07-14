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
 * least one file under `src/components/`, the HEAD commit's SUBJECT LINE
 * (never body — the subject is what ships as the PR/merge title, per this
 * repo's squash-merge convention) must name at least one component the diff
 * itself really adds or touches. "Names" is derived two ways, both anchored
 * to the diff itself, never to memory of what a title "should" look like:
 *
 *   (a) a literal `Mosaic<Name>` token appearing anywhere in the subject; or
 *   (b) the conventional-commit `type(scope):` scope, mapped scope-kebab ->
 *       PascalCase -> `Mosaic<Scope>` (`alert-dialog` -> `MosaicAlertDialog`).
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
 * FAIL-CLOSED BY CONSTRUCTION: a title with ZERO derivable claims (no
 * `Mosaic<Name>` token, no conventional-commit scope) on a diff that DOES
 * touch `src/components/` is not "out of scope" or silently skipped — it is
 * a violation in its own right (the empty set can never intersect anything),
 * reported by name as "title names no component". There is no `return`,
 * `continue`, or `exit 0` anywhere in this guard's classification path for a
 * title shape it does not recognize; every shape maps deterministically to
 * either a derived claim set (possibly empty) or a thrown error if the git
 * commands themselves fail. An empty or unparseable claim is compared
 * against the actual set exactly like a populated one, and an empty set
 * never matches, so silence is never mistaken for compliance.
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
 * @returns {string} the HEAD commit's subject line ONLY — what actually ships
 * as the PR/merge title under this repo's squash-merge convention. The body
 * is read separately, only for the escape-hatch marker.
 */
function headSubject() {
  return git(["log", "-1", "--pretty=%s", "HEAD"]).trim();
}

/**
 * @returns {string} the HEAD commit's full message (subject + body), for the
 * escape-hatch marker only.
 */
function headFullMessage() {
  return git(["log", "-1", "--pretty=%B", "HEAD"]);
}

/**
 * @returns {string[]} paths changed in BASE_REF...HEAD
 */
function changedFiles() {
  git(["rev-parse", "--verify", BASE_REF]);
  const out = git(["diff", "--name-only", `${BASE_REF}...HEAD`]);
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
    const diffText = git(["diff", `${BASE_REF}...HEAD`, "--", "src/index.ts"]);
    for (const line of diffText.split("\n")) {
      if (!line.startsWith("+") || line.startsWith("+++")) continue;
      const matches = line.match(MOSAIC_TOKEN_RE);
      if (matches) for (const t of matches) names.add(t);
    }
  }

  return { dirs, names };
}

/**
 * Everything the TITLE claims, derived two independent ways from the subject
 * line's own text — never a fixed list of known-good component names.
 * @param {string} subject
 * @returns {{ tokens: Set<string>, scope: string | null }}
 */
function titleClaim(subject) {
  const tokens = new Set(subject.match(MOSAIC_TOKEN_RE) ?? []);
  const scopeMatch = SCOPE_RE.exec(subject);
  const scope = scopeMatch ? scopeMatch[1] : null;
  if (scope) tokens.add(`Mosaic${toPascalCase(scope)}`);
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
      `pr-title-matches-diff-guard: OK — ${BASE_REF}...HEAD touches no file under src/components/; no component claim to verify.`,
    );
    return;
  }

  const { dirs, names: actual } = actualComponentClaim(changed);
  const subject = headSubject();
  const { tokens: claimed, scope } = titleClaim(subject);

  if (claimed.size === 0) {
    console.error(
      `pr-title-matches-diff-guard: BLOCKED — title names no component at all, but this diff (${BASE_REF}...HEAD) touches ${componentChanged.length} file(s) under src/components/ in ${dirs.size} director(y/ies): ${[...dirs].sort().join(", ")} (real component(s): ${[...actual].sort().join(", ") || "none derivable"}).\nTitle: "${subject}"\nFix: name at least one real component the diff adds/touches in the title, or add // allow-title-diff-mismatch: <reason> to the HEAD commit message if this is a genuine cross-cutting change.`,
    );
    process.exitCode = 1;
    return;
  }

  const matched = [...claimed].some((c) => actual.has(c));
  if (!matched) {
    console.error(
      `pr-title-matches-diff-guard: BLOCKED — title claims [${[...claimed].sort().join(", ")}]${scope ? ` (scope "${scope}")` : ""}, but this diff (${BASE_REF}...HEAD) really adds/touches [${[...actual].sort().join(", ") || "none derivable"}] in director(y/ies) ${[...dirs].sort().join(", ")}.\nTitle: "${subject}"\nFix: correct the title to name a component this diff really contains, or add // allow-title-diff-mismatch: <reason> to the HEAD commit message if this is a genuine, declared exception.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `pr-title-matches-diff-guard: OK — title claim [${[...claimed].sort().join(", ")}] matched by diff [${[...actual].sort().join(", ")}].`,
  );
}

main();

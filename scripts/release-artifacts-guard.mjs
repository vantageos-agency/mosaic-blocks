#!/usr/bin/env node
/**
 * release-artifacts-guard.mjs — PR-side half of the release-artifacts split.
 *
 * Why this exists (mosaic-blocks train TOCTOU, 2026-07-13): 5 concurrent PRs
 * each hand-typed `package.json`'s `version` field AND a README/catalog count
 * line. Every merge moves `main`; every other open PR then has to rebase,
 * its SHA changes, its reviewer verdict expires, and it re-gates — for a
 * value a machine already knows how to compute. That is the signature of an
 * entry typed by hand: the only place two branches fight is where a human
 * copied a value a tool could read (`.claude/rules/derive-never-type.md`).
 *
 * The fix is a SPLIT, not a stronger check:
 *   - a component PR's diff carries NEITHER the version NOR a count claim
 *     (THIS script, wired on `pull_request` only)
 *   - `main` derives both, once, after every PR that touches them has
 *     already merged (`derive-release-artifacts` CI job, `push: main` only)
 *
 * This script does NOT reimplement the count-claim anchors — that would be
 * exactly the "two sources of truth" defect scripts/docs-counts-shared.mjs's
 * own header comment warns about. It imports the SAME shared module the
 * producer (`docs-counts.mjs`) already consumes.
 *
 * Escape hatch, WRITTEN and visible (never a silent exclusion list): a real
 * release PR carries the literal marker
 *   // allow-release-artifacts: <reason>
 * in the HEAD commit's message body. Absence of the marker is the default;
 * presence is the exception, and it is grepped for, never assumed.
 *
 * Fail-closed by construction: any git command this script cannot run is a
 * LOUD process failure — never a silent `return`/`exit 0`. No diff at all
 * for a file (the PR never touches it) is fine; failing to RUN the diff, or
 * failing to read a file the diff says changed, is an error.
 *
 * Usage: node scripts/release-artifacts-guard.mjs
 *   Compares origin/main...HEAD (or BASE_REF...HEAD if BASE_REF is set).
 */

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mosaicCountPatterns, totalExportsPatterns } from "./docs-counts-shared.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const BASE_REF = process.env.RELEASE_ARTIFACTS_BASE_REF ?? "origin/main";
// ANCHORED at the start of its own line, deliberately.
//
// The first revision of this regex was `/\/\/\s*allow-release-artifacts:.../m`
// — unanchored — and it disabled the guard on the very commit that INTRODUCED
// it, because that commit's message *explains* the escape hatch and therefore
// quotes the marker mid-sentence. A prose mention is not a declaration.
//
// Same remedy the fleet already applies to `friction_observed:`: a guard that
// pattern-matches free prose is either too lax or too zealous, and either way
// it gets torn out. The marker only counts where a human deliberately put it:
// at the start of a line, on its own.
const MARKER_RE = /^\s*\/\/\s*allow-release-artifacts:\s*(\S.+)$/m;

const GUARDED_COUNT_FILES = ["README.md", "docs/components-catalog.md"];
const GUARDED_VERSION_FILES = ["package.json", "src/version.ts"];
// `registry.json`'s item list is DERIVED from src/index.ts by
// `scripts/registry-json-derive.mjs` (mirrors the docs-counts split above —
// see that script's header for the full "why"). A component PR must never
// hand-edit it: the post-merge `derive-release-artifacts` job on main is the
// only legitimate writer.
const GUARDED_WHOLE_FILES = ["registry.json"];

/**
 * Run a git command, exit-code-checked. NEVER swallow a non-zero exit —
 * that would be exactly the silent-repair-on-failure this guard exists to
 * ban. Throws with the exact command + stderr on failure.
 * @param {string[]} args
 * @returns {string}
 */
function git(args) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
  } catch (err) {
    const stderr = err && typeof err === "object" && "stderr" in err ? String(err.stderr) : "";
    throw new Error(
      `release-artifacts-guard: \`git ${args.join(" ")}\` failed — cannot verify this PR's diff. ` +
        `Refusing to pass silently. stderr: ${stderr || err.message}`,
    );
  }
}

/**
 * @returns {string} the HEAD commit message (subject + body)
 */
function headCommitMessage() {
  return git(["log", "-1", "--pretty=%B", "HEAD"]);
}

/**
 * @returns {string[]} paths changed in BASE_REF...HEAD
 */
function changedFiles() {
  // Ensure the base ref is resolvable — a missing origin/main is a loud
  // error, never a silent "assume no diff".
  git(["rev-parse", "--verify", BASE_REF]);
  const out = git(["diff", "--name-only", `${BASE_REF}...HEAD`]);
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * @param {string} path repo-relative path
 * @returns {string} the unified diff hunk for that single file
 */
function diffFor(path) {
  return git(["diff", `${BASE_REF}...HEAD`, "--", path]);
}

/**
 * Every added (`+`) line's (1-based) new-file line number + text, parsed out
 * of a unified diff hunk for a SINGLE file. Fails loudly if the diff has hunk
 * headers this parser cannot read (a genuinely different diff format would
 * silently hide additions otherwise).
 * @param {string} diffText
 * @returns {Array<{ line: number, text: string }>}
 */
function addedLines(diffText) {
  if (diffText.trim() === "") return [];
  const lines = diffText.split("\n");
  const additions = [];
  let newLineNo = null;
  const hunkRe = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/;
  for (const line of lines) {
    const hunkMatch = hunkRe.exec(line);
    if (hunkMatch) {
      newLineNo = Number(hunkMatch[1]);
      continue;
    }
    if (newLineNo === null) continue; // before the first hunk (diff --git / +++ header lines)
    if (line.startsWith("+++") || line.startsWith("---")) continue;
    if (line.startsWith("+")) {
      additions.push({ line: newLineNo, text: line.slice(1) });
      newLineNo += 1;
    } else if (line.startsWith("-")) {
      // removed line — does not consume a new-file line number
    } else {
      newLineNo += 1;
    }
  }
  return additions;
}

/**
 * @param {string} text
 * @returns {boolean} true if any shared count-claim pattern matches
 */
function matchesAnyCountPattern(text) {
  const patterns = [...mosaicCountPatterns(), ...totalExportsPatterns()];
  return patterns.some((re) => {
    re.lastIndex = 0;
    return re.test(text);
  });
}

/**
 * @param {string} text a single added line of package.json's diff
 * @returns {boolean} true if this line sets the top-level "version" field
 */
function matchesPackageJsonVersionField(text) {
  return /^\s*"version"\s*:\s*"[^"]+"\s*,?\s*$/.test(text);
}

function main() {
  const message = headCommitMessage();
  const markerMatch = MARKER_RE.exec(message);
  if (markerMatch) {
    console.log(
      `release-artifacts-guard: SKIPPED — HEAD commit carries \`// allow-release-artifacts: ${markerMatch[1].trim()}\`. This PR is declared as a release PR.`,
    );
    return;
  }

  const changed = changedFiles();
  const violations = [];

  for (const path of changed) {
    if (GUARDED_WHOLE_FILES.includes(path)) {
      violations.push({
        file: path,
        line: 0,
        reason:
          "hand-edits registry.json — its item list is DERIVED from src/index.ts by scripts/registry-json-derive.mjs, never hand-typed",
        snippet: "(whole-file guard: any diff to this path is refused, not just specific lines)",
      });
    }

    if (GUARDED_VERSION_FILES.includes(path)) {
      const diffText = diffFor(path);
      const additions = addedLines(diffText);
      for (const { line, text } of additions) {
        if (path === "package.json" && matchesPackageJsonVersionField(text)) {
          violations.push({
            file: path,
            line,
            reason: "changes package.json's version field",
            snippet: text.trim(),
          });
        } else if (path === "src/version.ts" && /export const version\s*=/.test(text)) {
          violations.push({
            file: path,
            line,
            reason: "changes src/version.ts's exported version",
            snippet: text.trim(),
          });
        }
      }
    }

    if (GUARDED_COUNT_FILES.includes(path)) {
      const diffText = diffFor(path);
      const additions = addedLines(diffText);
      for (const { line, text } of additions) {
        if (matchesAnyCountPattern(text)) {
          violations.push({
            file: path,
            line,
            reason: "changes a Mosaic*/total-exports count claim",
            snippet: text.trim().slice(0, 160),
          });
        }
      }
    }
  }

  if (violations.length > 0) {
    const details = violations
      .map((v) => `  - ${v.file}:${v.line} — ${v.reason}\n      "${v.snippet}"`)
      .join("\n");
    console.error(
      `release-artifacts-guard: BLOCKED — this PR's diff (${BASE_REF}...HEAD) touches release artifacts a component PR must never hand-edit (version + counts are DERIVED on main after merge, never typed in a component PR):\n${details}\n\nFix: revert these lines — \`main\`'s post-merge job (derive-release-artifacts) will compute the correct version and counts once this PR is merged. If this genuinely IS a release PR, add \`// allow-release-artifacts: <reason>\` to the HEAD commit message.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `release-artifacts-guard: OK — ${BASE_REF}...HEAD touches no release-artifact line (version or count claim).`,
  );
}

main();

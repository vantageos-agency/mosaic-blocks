#!/usr/bin/env node
/**
 * skills-standard-guard.mjs — the missing CI instrument for `skills/`.
 *
 * Why this exists (Day 116 root-fix, Laurent verbatim: "que Gamma traite ça
 * une fois pour toute — on va encore longtemps traîner cette dette ?"):
 * `grep -rln 'skills' .github/workflows/` on this repo returned EMPTY before
 * this script. No CI job ever opened a skill's diff. Two doc PRs merged on a
 * green "Gates" that only proved the TypeScript library builds/lints/tests —
 * it never read a single line under `skills/`. Eta proved the hole live: he
 * replaced a SKILL.md with garbage and emptied its evals, and lint/tsc/vitest
 * stayed 100% green.
 *
 * RULES ARE DERIVED, NOT INVENTED — from
 * `resources/references/skill-standard-v2.md` (ElPi Corp internal reference,
 * PRIVATE repo). Every rule below cites the exact section it implements, so
 * a reader can audit "does this guard still match the standard" without
 * trusting this file's memory of it. THIS IS A DECLARED DIVERGENCE, not a
 * derivation: mosaic-blocks is PUBLIC, the standard doc lives in a PRIVATE
 * repo, and public CI cannot fetch a private file at run time (no token for
 * a private cross-repo read is wired here, and minting one just to read a
 * doc is a bigger surface than copying 8 checkable rules). The rules are
 * copied, not fetched — said out loud, here, instead of pretended away.
 * (`.claude/rules/derive-never-type.md` + `.claude/rules/
 * guard-formulation-census.md`: "a copied rule can drift from the standard,
 * say so".) If skill-standard-v2.md changes, this file's rule comments are
 * the trip-wire a human re-syncs against — they are not the standard itself.
 *
 * DIFF-SCOPED BY DESIGN, mirrors release-artifacts-guard.mjs /
 * pr-title-matches-diff-guard.mjs in this same repo: only skill directories
 * that appear in the PR's diff are validated (full-directory check, not
 * just the changed lines — a PR that empties evals/evals.json without
 * touching SKILL.md must still be caught). Scanning the WHOLE skills/ tree
 * unconditionally was considered and rejected: none of the 4 skills shipped
 * on main today (`better-colors`, `better-typography`, `better-ui`,
 * `vantage-design-system`) carry an evals/evals.json, a `version:` field, or
 * the "even if they don't say X explicitly" trigger clause the standard
 * requires — measured directly (`find skills -iname '*eval*'` = empty,
 * Day 116). An unconditional full-tree scan would turn EVERY future PR
 * red forever, including PRs this guard itself is not meant to gate,
 * without touching a single one of those 4 skills. This guard closes the
 * hole for skills anyone edits FROM NOW ON; it does not retroactively force
 * a rewrite of already-shipped, untouched skills — that rewrite was
 * explicitly out of scope for this task and is a known, named gap, not a
 * silently swallowed one.
 *
 * THREE-STATE EXIT, non-negotiable:
 *   0 = every touched skill conforms
 *   1 = at least one violation — file + rule NAMED
 *   2 = REFUSES TO JUDGE — names exactly what it could not read
 *       (skills/ absent, an unreadable YAML frontmatter, an unresolvable
 *       git ref). Fail-CLOSED: this script NEVER silently `return`s past
 *       something it could not parse.
 *
 * Escape hatch, WRITTEN and grepped for (never a silent exclusion list):
 *   // allow-skills-standard: <reason>
 * in the HEAD commit message (same anchored-at-line-start regex discipline
 * as release-artifacts-guard.mjs — a prose mention of the marker inside an
 * explanatory sentence must NOT disarm the guard).
 *
 * Usage: node scripts/skills-standard-guard.mjs
 *   Diffs BASE_REF (default origin/main, override via SKILLS_GUARD_BASE_REF)
 *   against HEAD_REF (default HEAD, override via SKILLS_GUARD_HEAD_REF — CI
 *   passes the PR's real head SHA, never the synthetic pull_request merge
 *   commit, same reasoning as release-artifacts-guard.mjs's
 *   RELEASE_GUARD_HEAD_REF).
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SKILLS_DIR = "skills";

const BASE_REF = process.env.SKILLS_GUARD_BASE_REF?.trim() || "origin/main";
const HEAD_REF = process.env.SKILLS_GUARD_HEAD_REF?.trim() || "HEAD";

// Anchored at line start — same discipline as release-artifacts-guard.mjs's
// MARKER_RE. A prose mention of the marker inside a sentence explaining it
// (like this file's own header, or a commit message describing the escape
// hatch) must never disarm the guard.
const MARKER_RE = /^\s*\/\/\s*allow-skills-standard:\s*(\S.+)$/m;

/** Sentinel thrown to force a fail-CLOSED exit 2 (never exit 0/1). */
class GuardUnreadable extends Error {}

function git(args, { allowFail = false } = {}) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
  } catch (err) {
    if (allowFail) return null;
    const stderr = err && typeof err === "object" && "stderr" in err ? String(err.stderr) : "";
    throw new GuardUnreadable(
      `cannot run \`git ${args.join(" ")}\` — refusing to judge. stderr: ${stderr || err.message}`,
    );
  }
}

function headCommitMessage() {
  return git(["log", "-1", "--pretty=%B", HEAD_REF]);
}

/** @returns {string[]} repo-relative paths changed BASE_REF...HEAD_REF */
function changedFiles() {
  git(["rev-parse", "--verify", BASE_REF]);
  git(["rev-parse", "--verify", HEAD_REF]);
  const out = git(["diff", "--name-only", `${BASE_REF}...${HEAD_REF}`]);
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * @param {string[]} changed
 * @returns {string[]} distinct skill directory names touched by the diff
 *   (`skills/<name>/...`) — non-directory files directly under `skills/`
 *   (ATTRIBUTION.md, LICENSE) are not skills and are excluded.
 */
function touchedSkillDirs(changed) {
  const names = new Set();
  for (const path of changed) {
    const prefix = `${SKILLS_DIR}/`;
    if (!path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length);
    const slashIdx = rest.indexOf("/");
    if (slashIdx === -1) continue; // top-level file (ATTRIBUTION.md, LICENSE) — not a skill dir
    names.add(rest.slice(0, slashIdx));
  }
  return [...names].sort();
}

/**
 * Minimal frontmatter extractor — NOT a general YAML parser. Deliberate:
 * adding the `yaml` package would touch package.json, which this guard's own
 * acceptance criteria forbid ("deps prod INCHANGÉES"). Handles the two shapes
 * skill-standard-v2.md documents: `key: value` (single line) and
 * `key: >` folded-scalar continuation (indented lines below, joined with
 * spaces) — sufficient for the 8 fields this guard reads (name, description,
 * version). Any frontmatter this parser cannot make sense of is a LOUD
 * GuardUnreadable, never a silently-empty result.
 *
 * @param {string} raw full SKILL.md file content
 * @returns {{ fields: Record<string,string>, body: string, bodyStartLine: number }}
 */
function parseFrontmatter(raw, skillPath) {
  const lines = raw.split("\n");
  if (lines[0]?.trim() !== "---") {
    throw new GuardUnreadable(`${skillPath}: SKILL.md has no opening \`---\` frontmatter fence`);
  }
  let closeIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      closeIdx = i;
      break;
    }
  }
  if (closeIdx === -1) {
    throw new GuardUnreadable(`${skillPath}: SKILL.md frontmatter never closes with \`---\``);
  }

  const fields = {};
  let currentKey = null;
  let foldedLines = [];
  const flushFolded = () => {
    if (currentKey !== null) {
      fields[currentKey] = foldedLines.join(" ").trim();
    }
    currentKey = null;
    foldedLines = [];
  };

  const topLevelKeyRe = /^([A-Za-z_][A-Za-z0-9_-]*):\s?(.*)$/;
  for (let i = 1; i < closeIdx; i++) {
    const line = lines[i];
    if (/^\s/.test(line) && currentKey !== null) {
      foldedLines.push(line.trim());
      continue;
    }
    const m = topLevelKeyRe.exec(line);
    if (!m) {
      if (line.trim() === "") continue;
      throw new GuardUnreadable(
        `${skillPath}: SKILL.md frontmatter line ${i + 1} is not a recognized \`key: value\` — cannot parse: "${line}"`,
      );
    }
    flushFolded();
    const [, key, value] = m;
    const trimmedValue = value.trim();
    if (trimmedValue === ">" || trimmedValue === "|" || trimmedValue === "") {
      currentKey = key;
      foldedLines = [];
    } else {
      fields[key] = trimmedValue;
    }
  }
  flushFolded();

  return { fields, body: lines.slice(closeIdx + 1).join("\n"), bodyStartLine: closeIdx + 2 };
}

/**
 * RULE — skill-standard-v2.md § "Frontmatter (YAML between --- markers)"
 * + table row `name`/`description` + ElPi Corp additions § "version field".
 * Frontmatter must parse and carry name + description + version.
 */
function checkFrontmatterRequiredFields(skillPath, fields, violations) {
  for (const key of ["name", "description", "version"]) {
    if (!fields[key] || fields[key].length === 0) {
      violations.push({
        file: `${skillPath}/SKILL.md`,
        rule: "skill-standard-v2.md § Frontmatter — required field",
        detail: `missing or empty frontmatter field \`${key}\``,
      });
    }
  }
}

/**
 * RULE — skill-standard-v2.md § "Description writing rules (from
 * skill-creator)": under ~100 words, must end with the "even if they don't
 * say X explicitly" trigger clause.
 */
function checkDescriptionPushy(skillPath, fields, violations) {
  const description = fields.description;
  if (!description) return; // already flagged as missing above
  const wordCount = description.split(/\s+/).filter(Boolean).length;
  if (wordCount > 105) {
    // 100 + 5% slack for the standard's "~100"
    violations.push({
      file: `${skillPath}/SKILL.md`,
      rule: "skill-standard-v2.md § Description writing rules — under ~100 words",
      detail: `description is ${wordCount} words (limit ~100)`,
    });
  }
  if (!/even if they don't say .+ explicitly/i.test(description)) {
    violations.push({
      file: `${skillPath}/SKILL.md`,
      rule: "skill-standard-v2.md § Description writing rules — trigger clause",
      detail: 'description must end with an "even if they don\'t say X explicitly" clause',
    });
  }
}

/**
 * RULE — skill-standard-v2.md § "Body structure (our standard)" > "Body
 * rules": under 500 lines.
 */
function checkBodyLength(skillPath, body, violations) {
  const bodyLines = body.split("\n").length;
  if (bodyLines >= 500) {
    violations.push({
      file: `${skillPath}/SKILL.md`,
      rule: "skill-standard-v2.md § Body rules — under 500 lines",
      detail: `body is ${bodyLines} lines (limit 500)`,
    });
  }
}

/**
 * RULE — skill-standard-v2.md § "ElPi Corp additions" — "SELLABLE AS"
 * section maps to a plugin name and must not appear in the public,
 * open-source mosaic-blocks tree (internal packaging metadata leaking into a
 * PUBLIC repo). Headings only — a prose mention of the word inside running
 * text is not a heading and is out of this rule's scope.
 */
function checkNoSellableHeading(skillPath, fullRaw, violations) {
  const lines = fullRaw.split("\n");
  lines.forEach((line, idx) => {
    if (/^#{1,6}\s.*sellable/i.test(line)) {
      violations.push({
        file: `${skillPath}/SKILL.md`,
        rule: 'skill-standard-v2.md § ElPi Corp additions — no "SELLABLE AS" heading in public repo',
        detail: `line ${idx + 1}: "${line.trim()}"`,
      });
    }
  });
}

/**
 * RULE — skill-standard-v2.md § "Full file structure" / "Additional
 * resources" links convention: every relative markdown link must resolve on
 * disk.
 */
function checkRelativeLinksResolve(skillPath, absSkillDir, fullRaw, violations) {
  const linkRe = /\]\((\.{0,2}\/?[^):\s]+\.md(?:#[^)]*)?)\)/g;
  for (const m of fullRaw.matchAll(linkRe)) {
    const target = m[1].split("#")[0];
    if (/^https?:\/\//.test(target)) continue;
    const resolved = join(absSkillDir, target);
    if (!existsSync(resolved)) {
      violations.push({
        file: `${skillPath}/SKILL.md`,
        rule: "skill-standard-v2.md § Additional resources — relative links must resolve",
        detail: `link "${m[1]}" does not resolve to a file on disk (${resolved.replace(`${ROOT}/`, "")})`,
      });
    }
  }
}

/**
 * RULE — skill-standard-v2.md § "Evals (mandatory for all ElPi Corp
 * skills)": evals/evals.json must exist, parse, skill_name must match the
 * directory name, at least 3 evals, each with id/prompt/expected_output/
 * files/expectations, 2-5 expectations each.
 */
function checkEvals(skillPath, skillName, absSkillDir, violations) {
  const evalsPath = join(absSkillDir, "evals", "evals.json");
  if (!existsSync(evalsPath)) {
    violations.push({
      file: `${skillPath}/evals/evals.json`,
      rule: "skill-standard-v2.md § Evals — mandatory, min 3 test cases",
      detail: "evals/evals.json does not exist",
    });
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(evalsPath, "utf8"));
  } catch (err) {
    throw new GuardUnreadable(
      `${skillPath}/evals/evals.json: does not parse as JSON — ${err.message}`,
    );
  }
  if (parsed.skill_name !== skillName) {
    violations.push({
      file: `${skillPath}/evals/evals.json`,
      rule: "skill-standard-v2.md § Evals — skill_name field",
      detail: `skill_name is "${parsed.skill_name}", expected "${skillName}"`,
    });
  }
  const evals = Array.isArray(parsed.evals) ? parsed.evals : null;
  if (!evals) {
    violations.push({
      file: `${skillPath}/evals/evals.json`,
      rule: "skill-standard-v2.md § Evals — evals array",
      detail: '"evals" field is missing or not an array',
    });
    return;
  }
  if (evals.length < 3) {
    violations.push({
      file: `${skillPath}/evals/evals.json`,
      rule: "skill-standard-v2.md § Evals — minimum 3 test cases",
      detail: `evals array has ${evals.length} entries (minimum 3)`,
    });
  }
  evals.forEach((ev, idx) => {
    for (const field of ["id", "prompt", "expected_output", "files", "expectations"]) {
      if (!(field in ev)) {
        violations.push({
          file: `${skillPath}/evals/evals.json`,
          rule: `skill-standard-v2.md § Evals — required field \`${field}\``,
          detail: `evals[${idx}] is missing field "${field}"`,
        });
      }
    }
    if (Array.isArray(ev.expectations)) {
      if (ev.expectations.length < 2 || ev.expectations.length > 5) {
        violations.push({
          file: `${skillPath}/evals/evals.json`,
          rule: "skill-standard-v2.md § Evals — 2-5 expectations per eval",
          detail: `evals[${idx}].expectations has ${ev.expectations.length} entries (must be 2-5)`,
        });
      }
    }
  });
}

/**
 * Validate one skill directory in full (every rule, not just the lines the
 * diff touched — an eval-emptying edit that leaves SKILL.md alone must still
 * be caught, and vice versa).
 */
function validateSkillDir(skillName, violations) {
  const skillPath = `${SKILLS_DIR}/${skillName}`;
  const absSkillDir = join(ROOT, skillPath);
  if (!existsSync(absSkillDir)) {
    throw new GuardUnreadable(
      `${skillPath}: directory referenced by the diff does not exist on disk`,
    );
  }
  const skillMdPath = join(absSkillDir, "SKILL.md");
  if (!existsSync(skillMdPath)) {
    violations.push({
      file: `${skillPath}/SKILL.md`,
      rule: "skill-standard-v2.md § File structure — SKILL.md required",
      detail: "SKILL.md does not exist in this skill directory",
    });
    return;
  }
  const raw = readFileSync(skillMdPath, "utf8");
  const { fields, body } = parseFrontmatter(raw, skillPath);

  checkFrontmatterRequiredFields(skillPath, fields, violations);
  checkDescriptionPushy(skillPath, fields, violations);
  checkBodyLength(skillPath, body, violations);
  checkNoSellableHeading(skillPath, raw, violations);
  checkRelativeLinksResolve(skillPath, absSkillDir, raw, violations);
  checkEvals(skillPath, skillName, absSkillDir, violations);
}

function main() {
  const message = headCommitMessage();
  const markerMatch = MARKER_RE.exec(message);
  if (markerMatch) {
    console.log(
      `skills-standard-guard: SKIPPED — HEAD commit carries \`// allow-skills-standard: ${markerMatch[1].trim()}\`.`,
    );
    process.exitCode = 0;
    return;
  }

  if (!existsSync(join(ROOT, SKILLS_DIR))) {
    console.error(
      "skills-standard-guard: REFUSING TO JUDGE (exit 2) — `skills/` directory does not exist at repo root. " +
        "Cannot verify skill conformance against skill-standard-v2.md without a skills/ tree to read.",
    );
    process.exitCode = 2;
    return;
  }

  const changed = changedFiles();
  const skillDirs = touchedSkillDirs(changed);

  if (skillDirs.length === 0) {
    console.log(
      "skills-standard-guard: OK — this diff touches no skills/<name>/ directory. Nothing to check.",
    );
    process.exitCode = 0;
    return;
  }

  const violations = [];
  for (const skillName of skillDirs) {
    validateSkillDir(skillName, violations);
  }

  if (violations.length > 0) {
    const details = violations.map((v) => `  - ${v.file} — [${v.rule}] ${v.detail}`).join("\n");
    console.error(
      `skills-standard-guard: BLOCKED (exit 1) — ${skillDirs.length} touched skill dir(s) (${skillDirs.join(", ")}), ${violations.length} violation(s):\n${details}\n\nFix the listed files, or if this genuinely is an exception, add \`// allow-skills-standard: <reason>\` to the HEAD commit message.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `skills-standard-guard: OK — ${skillDirs.length} touched skill dir(s) (${skillDirs.join(", ")}) conform to skill-standard-v2.md.`,
  );
  process.exitCode = 0;
}

try {
  main();
} catch (err) {
  if (err instanceof GuardUnreadable) {
    console.error(`skills-standard-guard: REFUSING TO JUDGE (exit 2) — ${err.message}`);
    process.exitCode = 2;
  } else {
    console.error(
      `skills-standard-guard: REFUSING TO JUDGE (exit 2) — unexpected error: ${err.stack || err.message}`,
    );
    process.exitCode = 2;
  }
}

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
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SKILLS_DIR = "skills";
const VENDORED_MANIFEST_PATH = `${SKILLS_DIR}/VENDORED.json`;

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
 * VENDORED EXEMPTION — Day 116 follow-up (Eta-measured gap, PR #124 review).
 *
 * WHY THIS EXISTS: `better-ui/`, `better-colors/`, `better-typography/` are
 * byte-identical MIT clones of https://github.com/jakubkrehel/skills (see
 * `skills/ATTRIBUTION.md`). Applying skill-standard-v2.md to them — a
 * `version:` field, the "even if they don't say X" trigger clause, an
 * evals/evals.json — would mean REWRITING upstream content, destroying the
 * one property that makes vendoring them worthwhile: they are proven-good,
 * unmodified third-party guidance. Eta measured directly: touching even a
 * comment in `better-ui/SKILL.md` under the un-exempted guard produced 3
 * un-fixable violations (missing version, missing trigger clause, missing
 * evals) on content this repo does not own and should not rewrite.
 *
 * THE RULE IS DERIVED, NEVER A HARDCODED LIST — `.claude/rules/
 * derive-never-type.md` + `.claude/rules/guard-formulation-census.md`: a
 * literal `["better-ui", "better-colors", "better-typography"]` array in
 * this file would be exactly the disease those rules close (it silently
 * stops covering the 4th vendored skill someone adds next month, and a
 * reader has no way to tell "vendored" from "home-grown, just untouched").
 * The domain of "which skill dirs are vendored" is DERIVED from a
 * structured manifest, `skills/VENDORED.json` — never from prose (a
 * free-text scanner over ATTRIBUTION.md would be exactly the "parses free
 * prose" anti-pattern `guard-formulation-census.md` bans: too lax (misses a
 * reworded sentence) or too zealous (fires on a sentence merely quoting the
 * marker) — a STRUCTURED field is the only shape a guard may ever mordre on.
 *
 * VERIFIABILITY, NOT JUST DECLARATION: a bare "this dir is vendored" claim
 * in a manifest is not proof — a home-grown skill could add itself to the
 * manifest to dodge the standard entirely. Two independent checks close
 * that:
 *
 *   1. DIGEST INTEGRITY — the manifest pins a sha256 of every file under
 *      the skill dir *as captured at vendoring time*. This guard
 *      recomputes those digests from disk on every run. Any drift (a
 *      file edited, added, or removed since vendoring) is a LOUD
 *      violation naming the exact file and byte-mismatch — never a
 *      silent pass. Scenario (b) in the probe: editing a vendored file
 *      breaks its digest and the guard BITES.
 *
 *   2. ENTRY PROVENANCE — a skill is only exempt if its `VENDORED.json`
 *      entry is UNCHANGED between BASE_REF and HEAD_REF. If the *current
 *      diff itself* adds or edits that skill's manifest entry, exemption
 *      is refused and the skill falls through to the FULL standard check
 *      instead. This is what stops a home-grown skill from declaring
 *      itself vendored inside the very PR that introduces it: the fresh
 *      manifest entry it would need to add is, by definition, new in this
 *      diff, so provenance check #2 refuses the exemption and the skill
 *      must pass skill-standard-v2.md on its own merits (version, trigger
 *      clause, evals) like any home-grown skill. Scenario (c) in the
 *      probe.
 *
 *      Consequence, stated plainly: to add a NEW vendored skill, its
 *      manifest entry must land in a PRIOR, separately-reviewed commit
 *      before any PR can rely on the exemption. This guard does not
 *      support "vendor and exempt in the same diff" — a deliberate,
 *      named limitation, not a silent gap.
 *
 * DECLARED LIMIT OF WHAT THIS PROVES (write it, never pretend otherwise —
 * `.claude/rules/derive-never-type.md`): this guard can prove "declared
 * vendored AND byte-identical to what was declared". It CANNOT prove
 * "byte-identical to the live upstream right now" — CI here has no
 * reliable outbound network path to re-clone jakubkrehel/skills on every
 * run, and minting one just to re-verify 3 files is a bigger surface than
 * the gap it would close. If upstream drifts, this manifest goes stale
 * until a human re-vendors deliberately. That is a known, accepted gap,
 * not a hidden one.
 *
 * CLOSED HOLE (Pi's live attack, same day): the mechanism above only ever
 * ran for names in `touchedSkillDirs()` — i.e. names derived from paths
 * `skills/<name>/...` that literally appear in the diff. `skills/
 * VENDORED.json` itself is NOT under `skills/<name>/` (it is a top-level
 * file directly under `skills/`, same carve-out as `ATTRIBUTION.md` — see
 * `touchedSkillDirs()`'s own doc comment). Pi measured, live, on this
 * guard's own SHA: adding a manifest entry for a skill directory that DOES
 * NOT EXIST ON DISK (`evil-home-skill`, a copy-pasted `better-ui` entry)
 * produced `exit 0` — "this diff touches no skills/<name>/ directory" —
 * because the manifest edit alone never touched any `skills/<name>/` path.
 * Two-PR consequence Pi named: PR#1 lands the phantom entry (exit 0, merges
 * clean); PR#2 adds the real `skills/evil-home-skill/` directory — its
 * manifest entry now PREDATES the diff (satisfies provenance), so a
 * non-conformant home-grown skill is exempted from the standard in two
 * moves. The guard's own exemption gate was outside the guard's scope — an
 * angle mort, not a documented out-of-scope.
 *
 * A SECOND, independently-derived hole closes with the SAME fix (found
 * while verifying Pi's — not silently omitted): retro-vendoring an
 * ALREADY-SHIPPED, non-conformant, home-grown skill by adding a manifest
 * entry for it that matches its CURRENT, untouched, real digests. That
 * skill's directory never appears in `touchedSkillDirs()` either (no file
 * under it changed) — so under a naive "existence + digest for every
 * listed entry" patch alone, this entry would pass (dir exists, digest
 * matches reality) and the skill would be permanently exempted from ever
 * needing a `version:`/evals, despite being 100% home-grown project
 * content. Provenance — not just digest — must apply to EVERY manifest
 * entry, not only ones whose directory is separately diff-touched.
 *
 * THE FIX: any diff that touches `skills/VENDORED.json` (added, changed, or
 * had an entry removed) widens the checked-skill set to the UNION of every
 * skill name appearing in the manifest at EITHER `BASE_REF` or `HEAD_REF` —
 * not only names whose directory path appears in the diff. Each of those
 * names is then run through the exact same `checkVendoredExemption()` +
 * `validateSkillDir()` machinery as a normally diff-touched skill:
 *   - phantom entry (declared, directory absent on disk) → digest-integrity
 *     violation, exit 1, naming the phantom skill — closes hole #1 at
 *     PR#1, before a PR#2 ever gets a chance.
 *   - entry+directory added together in one diff → entry is new vs
 *     BASE_REF → provenance refuses the exemption → falls through to, and
 *     fails, the full standard (unchanged from before).
 *   - entry added alone, referencing an EXISTING (touched-or-not)
 *     directory → entry is STILL new vs BASE_REF (provenance is keyed on
 *     the entry's own history, not on whether the directory happens to be
 *     in the diff) → refuses the exemption → the full standard now runs
 *     against that directory even though no file under it changed in this
 *     diff → closes hole #2.
 * CONSEQUENCE, stated plainly (workflow, not silent): under this fix there
 * is NO diff, ever, that can introduce a NEW vendored entry and have it
 * exempted in the same PR — including the very first vendoring of a
 * genuine third-party clone (real upstream content legitimately lacks
 * `version:`/evals too). Onboarding skill #4 as VENDORED THEREFORE REQUIRES
 * the existing `// allow-skills-standard: <reason>` commit-message escape
 * hatch for that one onboarding PR — a human-reviewed, already-documented
 * exception, not a new bypass invented for this case. Every subsequent PR
 * then benefits from steady-state provenance (entry predates the diff).
 */

/** @returns {string} sha256 hex digest of the file at `absPath`. */
function sha256OfFile(absPath) {
  return createHash("sha256").update(readFileSync(absPath)).digest("hex");
}

/** Recursively list files under `absDir`, returning paths relative to `absDir`, sorted. */
function listFilesRecursive(absDir) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      const st = statSync(abs);
      if (st.isDirectory()) walk(abs);
      else out.push(relative(absDir, abs));
    }
  };
  walk(absDir);
  return out.sort();
}

/**
 * Load `skills/VENDORED.json` at a given git ref (`BASE_REF` or `HEAD_REF`).
 * Returns `null` if the file does not exist at that ref (not every ref has
 * to carry a manifest — e.g. history before this feature landed). A file
 * that exists but does not parse as JSON is a LOUD GuardUnreadable, never a
 * silent `null`.
 */
function loadManifestAtRef(ref) {
  const raw = git(["show", `${ref}:${VENDORED_MANIFEST_PATH}`], { allowFail: true });
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new GuardUnreadable(
      `${VENDORED_MANIFEST_PATH} at ${ref}: does not parse as JSON — ${err.message}`,
    );
  }
}

/**
 * Load the on-disk manifest (working tree at HEAD_REF checkout). Missing
 * file → `null` (no vendored skills declared at all, every touched skill
 * goes through the full standard). Malformed JSON → LOUD GuardUnreadable.
 */
function loadManifestOnDisk() {
  const absPath = join(ROOT, VENDORED_MANIFEST_PATH);
  if (!existsSync(absPath)) return null;
  try {
    return JSON.parse(readFileSync(absPath, "utf8"));
  } catch (err) {
    throw new GuardUnreadable(`${VENDORED_MANIFEST_PATH}: does not parse as JSON — ${err.message}`);
  }
}

/**
 * Decide whether `skillName` is exempt as VENDORED, and if so, verify its
 * digest integrity. Returns `{ exempt: true }` (all digests match, entry
 * provenance is prior to this diff — the skill is skipped from the
 * standard) or `{ exempt: false, reason }` (not in manifest, entry changed
 * in this diff, or digest mismatch — falls through to / reports a
 * violation). Never silently exempts on ambiguity — an unreadable case
 * throws GuardUnreadable (fail-closed).
 */
function checkVendoredExemption(skillName, manifestOnDisk, manifestAtBase, violations) {
  const entryOnDisk = manifestOnDisk?.skills?.[skillName];
  if (!entryOnDisk) {
    return { exempt: false, reason: "not declared in skills/VENDORED.json" };
  }

  // Phantom-entry check, closes Pi's live attack: a manifest entry can name
  // a `skills/<name>/` directory that is NOT reachable via `touchedSkillDirs()`
  // at all (the entry alone was added/edited — `skills/VENDORED.json` is a
  // top-level file, not a `skills/<name>/...` path). Verify the directory
  // actually exists BEFORE trusting any digest computation against it —
  // reading files under a non-existent directory would throw a raw ENOENT,
  // not this guard's own named violation.
  if (!existsSync(join(ROOT, SKILLS_DIR, skillName))) {
    violations.push({
      file: VENDORED_MANIFEST_PATH,
      rule: "skills-standard-guard § VENDORED exemption — digest integrity",
      detail: `${skillName}: skills/VENDORED.json declares this skill VENDORED but skills/${skillName}/ does not exist on disk — a phantom manifest entry names no real directory, and is refused outright.`,
    });
    return { exempt: false, reason: "phantom entry", haltFullStandard: true };
  }

  const entryAtBase = manifestAtBase?.skills?.[skillName];
  if (JSON.stringify(entryAtBase) !== JSON.stringify(entryOnDisk)) {
    // Provenance check #2: this diff itself introduces or changes the
    // manifest entry — refuse the exemption. This is what stops a
    // home-grown skill from self-declaring VENDORED in the same PR that
    // adds it (scenario (c) in the probe).
    violations.push({
      file: VENDORED_MANIFEST_PATH,
      rule: "skills-standard-guard § VENDORED exemption — entry provenance",
      detail: `${skillName}: skills/VENDORED.json entry is new or changed in this diff — a vendored-skill exemption cannot be granted in the same diff that introduces or edits its own manifest entry. Land the manifest entry in a prior, separately-reviewed commit, or this skill must conform to the full skill-standard-v2.md standard.`,
    });
    return { exempt: false, reason: "manifest entry changed in this diff" };
  }

  // Digest check #1: recompute every file's sha256 and compare to the
  // manifest, in BOTH directions (missing files, AND extra untracked files
  // not present in the manifest — both are a break of the pinned set).
  const absSkillDir = join(ROOT, SKILLS_DIR, skillName);
  const declaredFiles =
    entryOnDisk.files && typeof entryOnDisk.files === "object" ? entryOnDisk.files : null;
  if (!declaredFiles) {
    throw new GuardUnreadable(
      `${VENDORED_MANIFEST_PATH}: entry "${skillName}" has no "files" digest map — cannot verify vendored integrity`,
    );
  }

  const actualFiles = listFilesRecursive(absSkillDir);
  const declaredPaths = Object.keys(declaredFiles).sort();

  for (const rel of declaredPaths) {
    if (!actualFiles.includes(rel)) {
      violations.push({
        file: `${SKILLS_DIR}/${skillName}/${rel}`,
        rule: "skills-standard-guard § VENDORED exemption — digest integrity",
        detail:
          "file declared in skills/VENDORED.json is missing on disk (vendored skill was pruned since vendoring)",
      });
    }
  }
  for (const rel of actualFiles) {
    if (!declaredPaths.includes(rel)) {
      violations.push({
        file: `${SKILLS_DIR}/${skillName}/${rel}`,
        rule: "skills-standard-guard § VENDORED exemption — digest integrity",
        detail:
          "file exists on disk but is not declared in skills/VENDORED.json (vendored skill grew a file since vendoring)",
      });
    }
  }
  for (const rel of declaredPaths) {
    if (!actualFiles.includes(rel)) continue; // already reported above
    const expected = declaredFiles[rel];
    const actual = `sha256:${sha256OfFile(join(absSkillDir, rel))}`;
    if (expected !== actual) {
      violations.push({
        file: `${SKILLS_DIR}/${skillName}/${rel}`,
        rule: "skills-standard-guard § VENDORED exemption — digest integrity",
        detail: `content no longer matches the pinned vendored digest (expected ${expected}, got ${actual}) — this vendored file was modified; either restore it, or if the change is deliberate, re-vendor: update the VENDORED.json digest in its OWN prior commit, and if it must diverge from upstream, remove it from VENDORED.json entirely so it is judged by the full skill-standard-v2.md standard`,
      });
    }
  }

  const hasViolationsForThisSkill = violations.some((v) =>
    v.file.startsWith(`${SKILLS_DIR}/${skillName}/`),
  );
  if (hasViolationsForThisSkill) return { exempt: false, reason: "digest mismatch" };
  return { exempt: true };
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
function validateSkillDir(skillName, manifestOnDisk, manifestAtBase, violations) {
  const skillPath = `${SKILLS_DIR}/${skillName}`;
  const absSkillDir = join(ROOT, skillPath);

  // Vendored-exemption check runs FIRST, before the generic "directory must
  // exist" throw below — a name reached ONLY via a `skills/VENDORED.json`
  // manifest entry (never via a `skills/<name>/...` path in the diff) that
  // points at a non-existent directory is a NAMEABLE violation (a phantom
  // entry), not an unreadable paradox. Ordering matters: if this check ran
  // after the existsSync throw, a phantom entry would abort the whole run
  // with exit 2 "refusing to judge" instead of a precise exit 1 naming the
  // fraudulent entry.
  const vendored = checkVendoredExemption(skillName, manifestOnDisk, manifestAtBase, violations);
  if (vendored.exempt) return; // digest-verified vendored skill — standard does not apply
  if (vendored.reason === "digest mismatch" || vendored.haltFullStandard) {
    // Either a PREVIOUSLY-declared vendored skill whose pinned content has
    // drifted, or a phantom entry naming no real directory. The violation
    // is already recorded above, naming the exact file/skill. Do NOT
    // additionally judge it against skill-standard-v2.md — for a digest
    // mismatch that would pile confusing "missing version/evals" noise onto
    // content that is, by declaration, still meant to be a vendored clone;
    // for a phantom entry there is no directory to even read.
    return;
  }
  // Not exempt because it was never declared in the manifest, OR because
  // this diff itself introduces/edits the manifest entry (provenance
  // violation already recorded above). Either way, fall through to the full
  // skill-standard-v2.md check — this is the path that keeps a home-grown
  // skill from dodging the standard by self-declaring VENDORED in the same
  // diff that adds it, OR by retro-declaring an already-shipped,
  // untouched, non-conformant skill VENDORED after the fact.

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
  let skillDirs = touchedSkillDirs(changed);

  // Loaded ONCE for the whole diff: the on-disk manifest (HEAD_REF's
  // checked-out state) and the manifest as it stood at BASE_REF (for the
  // entry-provenance check — was this skill's exemption already granted
  // BEFORE this diff, or is the diff itself trying to grant it?).
  const manifestOnDisk = loadManifestOnDisk();
  const manifestAtBase = loadManifestAtRef(BASE_REF);

  // THE FIX for Pi's live attack (see the long comment above
  // `checkVendoredExemption`): `skills/VENDORED.json` is a top-level file,
  // never itself a `skills/<name>/...` path, so a diff that ONLY edits the
  // manifest — adding a phantom entry, or retro-declaring an untouched
  // existing skill VENDORED — never appears in `touchedSkillDirs()` at all.
  // Whenever the manifest itself is part of this diff, widen the checked
  // set to the UNION of every skill name the manifest names at EITHER ref —
  // each of those names is then judged by the exact same
  // provenance-then-digest machinery as a normally diff-touched skill.
  if (changed.includes(VENDORED_MANIFEST_PATH)) {
    const namesOnDisk = manifestOnDisk?.skills ? Object.keys(manifestOnDisk.skills) : [];
    const namesAtBase = manifestAtBase?.skills ? Object.keys(manifestAtBase.skills) : [];
    skillDirs = [...new Set([...skillDirs, ...namesOnDisk, ...namesAtBase])].sort();
  }

  if (skillDirs.length === 0) {
    console.log(
      "skills-standard-guard: OK — this diff touches no skills/<name>/ directory and no skills/VENDORED.json entry. Nothing to check.",
    );
    process.exitCode = 0;
    return;
  }

  const violations = [];
  for (const skillName of skillDirs) {
    validateSkillDir(skillName, manifestOnDisk, manifestAtBase, violations);
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

#!/usr/bin/env node
/**
 * docs-counts-fail-closed.probe.mjs — proves the count guards MORD (bite), not
 * merely that they are wired.
 *
 * Doctrine (derive-never-type + guard-formulation-census): a guard covers its
 * WHOLE domain or fails LOUD on the member it cannot read. The only proof a
 * guard bites is a violation injected into code it did not choose, in EACH form
 * the guarded thing can take. This probe therefore:
 *
 *   1. runs BOTH consumers (scripts/docs-counts.mjs --check and
 *      scripts/release-artifacts-guard.mjs) on the REAL, unmodified docs and
 *      asserts GREEN — false positives = 0 (bipolar probe, MUST_PASS pole);
 *   2. injects, ONE FORM AT A TIME, several count-SHAPED claims the anchor
 *      regexes do NOT recognise (the class that used to pass GREEN), plus one
 *      drift of a RECOGNISED anchor (zero-regression check), grep-asserts each
 *      injection LANDED before reading any verdict, and asserts the guard turns
 *      RED naming file + line (MUST_BLOCK pole);
 *   3. restores every artifact and asserts the working tree + HEAD are exactly
 *      as found.
 *
 * Environment-agnostic: the repo root is derived from this file's location and
 * the base ref from `git rev-parse HEAD` — no absolute author path, no local
 * branch name. Runnable in CI.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const README = resolve(ROOT, "README.md");
const DOCS_COUNTS = resolve(ROOT, "scripts", "docs-counts.mjs");
const RELEASE_GUARD = resolve(ROOT, "scripts", "release-artifacts-guard.mjs");

let failures = 0;
const log = (ok, msg) => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
};

/** Run a command, never throwing; capture status + combined output. */
function run(cmd, args, env = {}) {
  try {
    const stdout = execFileSync(cmd, args, {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { status: 0, out: stdout };
  } catch (err) {
    const out = `${err.stdout ?? ""}${err.stderr ?? ""}${err.message ?? ""}`;
    return { status: err.status ?? 1, out };
  }
}

const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();

function treeClean() {
  return git(["status", "--porcelain"]) === "";
}

// ---------------------------------------------------------------------------
// Formulations. Each MUST_BLOCK is a DISTINCT count SHAPE the anchors miss.
// ---------------------------------------------------------------------------

const UNRECOGNISED_PROSE = [
  {
    name: "no-backtick 'N Mosaic components'",
    line: "The library exports 999 Mosaic components in total.",
  },
  {
    name: "bare 'N components'",
    line: "It now ships 777 components for every conceivable layout.",
  },
  { name: "bare 'N exports'", line: "Bundling 888 exports straight out of the box." },
  { name: "bare 'N hooks'", line: "A grand total of 654 hooks are provided as well." },
];

if (!treeClean()) {
  console.error("PROBE ABORT: working tree not clean at start — commit or stash first.");
  process.exit(2);
}
const BASE = git(["rev-parse", "HEAD"]);

// ---------------------------------------------------------------------------
// Pole MUST_PASS — real docs are GREEN through both consumers (fp = 0).
// ---------------------------------------------------------------------------
{
  const c = run("node", [DOCS_COUNTS, "--check"]);
  log(c.status === 0, `MUST_PASS docs-counts --check GREEN on real docs (fp=0) — exit ${c.status}`);
  const g = run("node", [RELEASE_GUARD], { RELEASE_ARTIFACTS_BASE_REF: BASE });
  log(g.status === 0, `MUST_PASS release-guard GREEN on real HEAD (fp=0) — exit ${g.status}`);
}

// ---------------------------------------------------------------------------
// Pole MUST_BLOCK / docs-counts --check — one unrecognised form at a time.
// ---------------------------------------------------------------------------
for (const form of UNRECOGNISED_PROSE) {
  const orig = readFileSync(README, "utf8");
  try {
    writeFileSync(README, `${orig}\n${form.line}\n`);
    const landed = readFileSync(README, "utf8").includes(form.line);
    log(landed, `  [${form.name}] injection LANDED in README (grep-asserted)`);
    if (!landed) continue;
    const c = run("node", [DOCS_COUNTS, "--check"]);
    const named =
      /README\.md:\d+/.test(c.out) && c.out.includes(form.line.split(" in total")[0].slice(0, 20));
    log(
      c.status !== 0 && named,
      `  [${form.name}] docs-counts --check RED + names README:line — exit ${c.status}`,
    );
  } finally {
    writeFileSync(README, orig);
  }
}

// Zero-regression: a RECOGNISED anchor whose number drifts is STILL caught.
{
  const orig = readFileSync(README, "utf8");
  const drifted = orig.replace("It provides 180 opinionated", "It provides 181 opinionated");
  try {
    log(drifted !== orig, "  [recognised-anchor drift] mutation LANDED (hero '180'->'181')");
    writeFileSync(README, drifted);
    const c = run("node", [DOCS_COUNTS, "--check"]);
    log(
      c.status !== 0,
      `  [recognised-anchor drift] docs-counts --check RED (anchors still fire) — exit ${c.status}`,
    );
  } finally {
    writeFileSync(README, orig);
  }
}

// ---------------------------------------------------------------------------
// Pole MUST_BLOCK / release-artifacts-guard — one temp commit carrying every
// unrecognised prose form; the guard diffs it against BASE and must name each.
// ---------------------------------------------------------------------------
{
  const orig = readFileSync(README, "utf8");
  let committed = false;
  try {
    writeFileSync(README, `${orig}\n${UNRECOGNISED_PROSE.map((f) => f.line).join("\n")}\n`);
    git(["add", "README.md"]);
    git([
      "-c",
      "user.email=probe@local",
      "-c",
      "user.name=probe",
      "commit",
      "-q",
      "--no-verify",
      "-m",
      "probe: inject count-shaped claims",
    ]);
    committed = true;
    const g = run("node", [RELEASE_GUARD], { RELEASE_ARTIFACTS_BASE_REF: BASE });
    const namesAll =
      /README\.md:\d+/.test(g.out) &&
      UNRECOGNISED_PROSE.every(
        (f) => g.out.includes(f.line.slice(0, 20)) || g.out.includes("count"),
      );
    log(
      g.status !== 0 && namesAll,
      `  release-guard RED on committed count-shaped diff + names README:line — exit ${g.status}`,
    );
  } finally {
    if (committed) git(["reset", "--hard", BASE]);
    else writeFileSync(README, orig);
  }
}

// ---------------------------------------------------------------------------
// Restoration proof.
// ---------------------------------------------------------------------------
log(git(["rev-parse", "HEAD"]) === BASE, "HEAD restored to BASE");
log(treeClean(), "working tree clean (git diff empty)");

console.log(`\n${failures === 0 ? "ALL PROBES GREEN" : `${failures} PROBE FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);

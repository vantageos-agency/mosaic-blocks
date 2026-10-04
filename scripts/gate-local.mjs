#!/usr/bin/env node
/**
 * gate-local.mjs — run the `run:` steps of .github/workflows/ci.yml locally.
 *
 * Why this exists: GitHub Actions is OFF on this repository, so every gate wired
 * only in ci.yml runs nowhere. The formal gate is the author's full local run plus
 * the reviewer's fresh-clone rerun of THIS command.
 *
 * The step list is DERIVED from ci.yml at run time — never retyped here. A step
 * added to ci.yml appears in the next run with no edit to this file.
 *
 * A step that cannot run locally is SKIPPED with a printed reason, never silently.
 * What counts as "cannot run locally" is decided from what the step CONTAINS and is
 * declared in ONE place: SKIP_RULES below.
 *
 * Anything in the workflow this runner cannot interpret (an unknown key, a matrix,
 * a non-bash shell, an `if:` it cannot classify) throws GateLocalError naming it —
 * exit 2. Exit 1 = a step that ran failed. Exit 0 = every step that ran passed.
 *
 * Usage:
 *   pnpm gate:local                        run every runnable step of ci.yml
 *   pnpm gate:local --list                 print the plan (run/skip per step), run nothing
 *   pnpm gate:local --workflow <file>      use another workflow file (fixtures, tests)
 *
 * NOTE: a run executes the steps for real, including `pnpm build`, and writes the
 * same files CI would (dist/, .next/ in sandbox/). Run it on a clean worktree.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

export class GateLocalError extends Error {}

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_WORKFLOW = ".github/workflows/ci.yml";

// ── The domain this runner understands. Anything outside it fails loud. ───────
const WORKFLOW_KEYS = new Set(["name", "on", "concurrency", "jobs", "env", "permissions"]);
const JOB_KEYS = new Set([
  "name",
  "runs-on",
  "timeout-minutes",
  "steps",
  "if",
  "permissions",
  "env",
  "needs",
  "defaults",
]);
const STEP_KEYS = new Set([
  "name",
  "id",
  "if",
  "uses",
  "with",
  "run",
  "env",
  "working-directory",
  "shell",
]);

// ── SKIP_RULES — the single place that decides what cannot run locally. ──────
// First matching rule wins. `test` receives { job, step, run, text } where `text`
// is the step's run script plus its env values (the surface a rule can inspect).
const CTX_EXPR = /\$\{\{[^}]*\b(github|secrets|steps|needs|runner|matrix|vars|inputs)\./;
export const SKIP_RULES = [
  {
    id: "uses-action",
    reason: (c) => `uses: ${c.step.uses} — CI-runner provisioning, no local equivalent`,
    test: (c) => typeof c.step.uses === "string",
  },
  {
    id: "job-event-conditional",
    reason: (c) => `job \`if: ${c.job.if}\` — runs only on a CI event (writes/derives on main)`,
    test: (c) => typeof c.job.if === "string" && CTX_EXPR.test(`\${{ ${c.job.if} }}`),
  },
  {
    id: "step-event-conditional",
    reason: (c) => `step \`if: ${c.step.if}\` — conditional on a CI event context`,
    test: (c) => typeof c.step.if === "string" && CTX_EXPR.test(`\${{ ${c.step.if} }}`),
  },
  {
    id: "secrets",
    reason: () => "needs secrets (`${{ secrets.* }}` in run or env)",
    test: (c) => /\$\{\{[^}]*\bsecrets\./.test(c.text),
  },
  {
    id: "ci-context",
    reason: () => "reads a CI-only context (`${{ github.* }}`, `steps.*`, `needs.*`, ...)",
    test: (c) => CTX_EXPR.test(c.text),
  },
  {
    id: "publish",
    reason: () => "publishes or mutates the remote (npm publish / gh pr|release / git push)",
    test: (c) =>
      /\b(npm|pnpm|yarn|bun)\s+publish\b/.test(c.run) ||
      /\bgh\s+(pr|release)\s+(create|merge|edit|close)\b/.test(c.run) ||
      /\bgit\s+push\b/.test(c.run),
  },
  {
    id: "os-install",
    reason: () => "OS-level install (needs root / apt) — provision the host once, by hand",
    test: (c) => /--with-deps\b|\bapt(-get)?\s+install\b|\bsudo\b/.test(c.run),
  },
];

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

function assertKnownKeys(obj, allowed, where) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      throw new GateLocalError(
        `${where}: unsupported key \`${key}\` — this runner cannot interpret it (add support or remove it)`,
      );
    }
  }
}

function envOf(raw, where) {
  if (raw === undefined) return {};
  if (!isObject(raw)) throw new GateLocalError(`${where}: \`env\` must be a mapping`);
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v)]));
}

/** Parse workflow YAML text into an ordered plan: [{ jobId, jobName, steps: [...] }]. */
export function buildPlan(yamlText) {
  const doc = parse(yamlText);
  if (!isObject(doc)) throw new GateLocalError("workflow: top level is not a mapping");
  assertKnownKeys(doc, WORKFLOW_KEYS, "workflow");
  if (!isObject(doc.jobs) || Object.keys(doc.jobs).length === 0) {
    throw new GateLocalError("workflow: no `jobs` mapping found");
  }
  const workflowEnv = envOf(doc.env, "workflow");
  const seen = new Set();
  const plan = [];

  for (const [jobId, job] of Object.entries(doc.jobs)) {
    const jobWhere = `job \`${jobId}\``;
    if (!isObject(job)) throw new GateLocalError(`${jobWhere}: not a mapping`);
    assertKnownKeys(job, JOB_KEYS, jobWhere);
    if (!Array.isArray(job.steps)) {
      throw new GateLocalError(
        `${jobWhere}: no \`steps\` list (reusable-workflow jobs unsupported)`,
      );
    }
    const needs = job.needs === undefined ? [] : [].concat(job.needs);
    for (const dep of needs) {
      if (!seen.has(dep)) {
        throw new GateLocalError(
          `${jobWhere}: \`needs: ${dep}\` is not an earlier job — unsupported order`,
        );
      }
    }
    seen.add(jobId);

    const defaults = job.defaults?.run ?? {};
    if (job.defaults) {
      assertKnownKeys(job.defaults, new Set(["run"]), `${jobWhere} defaults`);
      assertKnownKeys(
        defaults,
        new Set(["shell", "working-directory"]),
        `${jobWhere} defaults.run`,
      );
    }
    const jobEnv = { ...workflowEnv, ...envOf(job.env, jobWhere) };

    const steps = job.steps.map((step, i) => {
      const label = step?.name ?? step?.run ?? step?.uses ?? `step ${i + 1}`;
      const where = `${jobWhere} step ${i + 1} (${String(label).split("\n")[0]})`;
      if (!isObject(step)) throw new GateLocalError(`${where}: not a mapping`);
      assertKnownKeys(step, STEP_KEYS, where);
      if (step.run === undefined && step.uses === undefined) {
        throw new GateLocalError(`${where}: neither \`run\` nor \`uses\``);
      }
      if (step.run !== undefined && typeof step.run !== "string") {
        throw new GateLocalError(`${where}: \`run\` is not a string`);
      }
      const shell = step.shell ?? defaults.shell ?? "bash";
      if (step.run !== undefined && !/^bash\b/.test(shell)) {
        throw new GateLocalError(`${where}: shell \`${shell}\` unsupported (bash only)`);
      }
      const env = { ...jobEnv, ...envOf(step.env, where) };
      const run = step.run ?? "";
      const text = `${run}\n${Object.values(env).join("\n")}`;
      const ctx = { job, step, run, text };
      const rule = SKIP_RULES.find((r) => r.test(ctx));
      // An `if:` the rules did not classify is a construct we cannot honour: fail loud.
      if (!rule && step.if !== undefined) {
        throw new GateLocalError(`${where}: \`if: ${step.if}\` cannot be evaluated locally`);
      }
      return {
        index: i + 1,
        name: String(step.name ?? run.split("\n")[0] ?? step.uses),
        run,
        env,
        cwd: step["working-directory"] ?? defaults["working-directory"] ?? ".",
        skip: rule ? { rule: rule.id, reason: rule.reason(ctx) } : null,
      };
    });
    plan.push({ jobId, jobName: String(job.name ?? jobId), steps });
  }
  return plan;
}

/** Execute a plan. `exec(step, root)` returns an exit status; injectable for tests. */
export function runPlan(plan, { root = REPO_ROOT, exec = defaultExec, log = console.log } = {}) {
  const results = [];
  for (const job of plan) {
    log(`\n=== job ${job.jobId} (${job.jobName}) ===`);
    for (const step of job.steps) {
      const tag = `${job.jobId}#${step.index} ${step.name}`;
      if (step.skip) {
        log(`--- SKIP ${tag}\n    reason: ${step.skip.reason}`);
        results.push({ tag, status: "skipped", reason: step.skip.reason });
        continue;
      }
      log(`--- RUN  ${tag}`);
      const code = exec(step, root);
      results.push({ tag, status: code === 0 ? "passed" : "failed", code });
      if (code !== 0) log(`--- FAIL ${tag} (exit ${code})`);
    }
  }
  return results;
}

function defaultExec(step, root) {
  const r = spawnSync("bash", ["-e", "-c", step.run], {
    cwd: resolve(root, step.cwd),
    env: { ...process.env, ...step.env },
    stdio: "inherit",
  });
  return r.status ?? 1;
}

export function summarize(results) {
  const total = results.length;
  const skipped = results.filter((r) => r.status === "skipped");
  const failed = results.filter((r) => r.status === "failed");
  const ran = total - skipped.length;
  const lines = [
    `gate:local — ${ran} run / ${total} total, ${skipped.length} skipped, ${failed.length} failed`,
  ];
  for (const s of skipped) lines.push(`  skipped: ${s.tag} — ${s.reason}`);
  for (const f of failed) lines.push(`  FAILED:  ${f.tag} (exit ${f.code})`);
  return { text: lines.join("\n"), failed: failed.length };
}

function main(argv) {
  const wfIdx = argv.indexOf("--workflow");
  const file = resolve(REPO_ROOT, wfIdx === -1 ? DEFAULT_WORKFLOW : (argv[wfIdx + 1] ?? ""));
  const unknown = argv.filter(
    (a, i) => !["--list", "--workflow"].includes(a) && argv[i - 1] !== "--workflow",
  );
  if (unknown.length > 0) throw new GateLocalError(`unknown argument(s): ${unknown.join(" ")}`);
  const plan = buildPlan(readFileSync(file, "utf8"));
  const exec = argv.includes("--list") ? () => 0 : defaultExec;
  const log = argv.includes("--list")
    ? (m) => console.log(String(m).replace(/^--- RUN /, "--- WOULD RUN "))
    : console.log;
  const { text, failed } = summarize(runPlan(plan, { exec, log }));
  console.log(`\n${text}`);
  return failed > 0 ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    if (err instanceof GateLocalError) {
      console.error(`gate:local REFUSES TO RUN — ${err.message}`);
      process.exit(2);
    }
    throw err;
  }
}

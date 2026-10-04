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
 *   pnpm gate:local --base <ref>           base for the PR/push gates (default origin/main)
 *   pnpm gate:local --install-browsers     opt in: run the Playwright install step WITHOUT --with-deps
 *
 * EVENT EMULATION: ci.yml conditions some steps on the CI event (`if: github.event_name
 * == 'pull_request'`) only because CI needs a base ref and the PR's real head/title.
 * Locally the base is `--base` (origin/main), the head is HEAD and the title is HEAD's
 * subject. EVENT_EMULATION below is the ONE table of what is supplied; a step whose
 * needs are not in it stays skipped, with its reason.
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
// First matching rule wins. `test` receives { job, step, run, text, yamlText, opts }
// where `text` is the step's run script plus its env values (the surface a rule can
// inspect). Event-conditional steps are NOT skipped here: they are evaluated against
// EVENT_EMULATION below, and only skipped when that table cannot satisfy them.
export const SKIP_RULES = [
  {
    id: "uses-action",
    reason: (c) => `uses: ${c.step.uses} — CI-runner provisioning, no local equivalent`,
    test: (c) => typeof c.step.uses === "string",
  },
  {
    id: "step-output-producer",
    reason: (c) =>
      `produces step output \`${c.step.id}\` consumed only by CI-only steps (\`steps.${c.step.id}.*\`)`,
    test: (c) => typeof c.step.id === "string" && c.yamlText.includes(`steps.${c.step.id}.`),
  },
  {
    id: "secrets",
    reason: () => "needs secrets (`${{ secrets.* }}` in run or env)",
    test: (c) => /\$\{\{[^}]*\bsecrets\./.test(c.text),
  },
  {
    id: "writes-derived-files",
    reason: () =>
      "writes tracked derived files (docs:counts / registry:derive without --check); its --check form runs as its own step",
    test: (c) =>
      c.run
        .split("\n")
        .some((l) => /\bpnpm\s+(docs:counts|registry:derive)\b/.test(l) && !/--check\b/.test(l)),
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
    // `--install-browsers` opts into running the browser install WITHOUT `--with-deps`
    // (no root needed); `rewrite` is the declared transformation. apt/sudo is never run.
    test: (c) =>
      /\bapt(-get)?\s+install\b|\bsudo\b/.test(c.run) ||
      (/--with-deps\b/.test(c.run) && !c.opts.installBrowsers),
    rewrite: (c) => (c.opts.installBrowsers ? c.run.replace(/\s--with-deps\b/g, "") : c.run),
  },
];

// ── EVENT_EMULATION — the single table of what a local run supplies for CI's events.
// A local run is the SUPERSET of CI's events: a step runs when its `if:` holds under
// ANY emulated event. `contexts(env)` returns one flat `${{ ... }}` map per event;
// BASE_ENV names the env vars the guard scripts read for their base ref when the
// workflow does not pass one (a step's own `env:` always wins).
export const EVENT_EMULATION = {
  contexts: ({ base, headSha, baseSha, subject, branch }) => [
    {
      "github.event_name": "pull_request",
      "github.ref": `refs/heads/${branch}`,
      "github.sha": headSha,
      "github.event.pull_request.head.sha": headSha,
      "github.event.pull_request.base.sha": baseSha,
      "github.event.pull_request.title": subject,
      "github.base_ref": base,
    },
    // push:main — the merge-commit guard compares HEAD's subject with HEAD's own diff.
    { "github.event_name": "push", "github.ref": "refs/heads/main", "github.sha": headSha },
  ],
  BASE_ENV: ["RELEASE_ARTIFACTS_BASE_REF", "SKILLS_GUARD_BASE_REF", "PR_TITLE_GUARD_BASE_REF"],
};

const git = (args, root) => {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (r.status !== 0) {
    throw new GateLocalError(`git ${args.join(" ")} failed: ${(r.stderr || "").trim()}`);
  }
  return r.stdout.trim();
};

/** Derive the emulated event contexts from the repository: head=HEAD, base=--base. */
export function emulatedEvents({ base = "origin/main", root = REPO_ROOT } = {}) {
  const baseSha = git(["rev-parse", "--verify", base], root);
  return {
    base,
    contexts: EVENT_EMULATION.contexts({
      base,
      baseSha,
      headSha: git(["rev-parse", "HEAD"], root),
      subject: git(["log", "-1", "--format=%s"], root),
      branch: git(["rev-parse", "--abbrev-ref", "HEAD"], root),
    }),
  };
}

class Unresolvable extends Error {}

function lookup(ctx, path) {
  if (!(path in ctx)) throw new Unresolvable(`\`${path}\``);
  return ctx[path];
}

/** Evaluate an `if:` expression (==, !=, &&, ||, 'literals', context paths) in ctx. */
function evalCondition(expr, ctx) {
  const operand = (tok) => {
    const t = tok.trim();
    const lit = /^'([^']*)'$/.exec(t);
    if (lit) return lit[1];
    if (/^[A-Za-z_][\w.-]*$/.test(t)) return lookup(ctx, t);
    throw new GateLocalError(`\`if: ${expr}\` has an operand this runner cannot interpret: ${t}`);
  };
  const atom = (a) => {
    const m = /^(.+?)\s*(==|!=)\s*(.+)$/.exec(a.trim());
    if (!m) return Boolean(operand(a));
    const eq = operand(m[1]) === operand(m[3]);
    return m[2] === "==" ? eq : !eq;
  };
  return expr
    .replace(/^\$\{\{\s*|\s*\}\}$/g, "")
    .split("||")
    .some((conj) => conj.split("&&").every(atom));
}

/** Substitute `${{ path }}` in text from ctx; any other expression is unresolvable. */
function substitute(text, ctx) {
  return text.replace(/\$\{\{\s*([^}]*?)\s*\}\}/g, (_, path) => String(lookup(ctx, path)));
}

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
export function buildPlan(yamlText, opts = {}) {
  const contexts = opts.contexts ?? [];
  const baseEnv = Object.fromEntries(
    EVENT_EMULATION.BASE_ENV.map((k) => [k, opts.base ?? "origin/main"]),
  );
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
      const rctx = { job, step, run, text, yamlText, opts };
      const rule = SKIP_RULES.find((r) => r.test(rctx));
      let skip = rule ? { rule: rule.id, reason: rule.reason(rctx) } : null;
      let finalRun = skip
        ? run
        : SKIP_RULES.reduce((r, rl) => (rl.rewrite ? rl.rewrite({ ...rctx, run: r }) : r), run);
      let finalEnv = env;
      if (!skip) {
        // Evaluate job `if` and step `if` under each emulated event; first event that
        // satisfies both supplies the `${{ }}` values for this step.
        const conds = [job.if, step.if].filter((c) => c !== undefined).map(String);
        try {
          let ctx = contexts[0] ?? {};
          if (conds.length > 0) {
            if (contexts.length === 0) throw new Unresolvable("an emulated event (none supplied)");
            ctx = contexts.find((c) => conds.every((cond) => evalCondition(cond, c)));
            if (!ctx) {
              skip = {
                rule: "event-conditional",
                reason: `\`if: ${conds.join(" && ")}\` false under every emulated event (${contexts.map((c) => c["github.event_name"]).join(", ")})`,
              };
            }
          }
          if (!skip) {
            finalRun = substitute(finalRun, ctx);
            finalEnv = Object.fromEntries(
              Object.entries(env).map(([k, v]) => [k, substitute(v, ctx)]),
            );
          }
        } catch (err) {
          if (!(err instanceof Unresolvable)) throw err;
          skip = {
            rule: "ci-context",
            reason: `needs ${err.message}, which the local event emulation does not supply`,
          };
        }
      }
      return {
        index: i + 1,
        name: String(step.name ?? run.split("\n")[0] ?? step.uses),
        run: finalRun,
        env: { ...baseEnv, ...finalEnv },
        cwd: step["working-directory"] ?? defaults["working-directory"] ?? ".",
        skip,
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
  const value = (flag) => {
    const i = argv.indexOf(flag);
    if (i === -1) return undefined;
    if (!argv[i + 1] || argv[i + 1].startsWith("--"))
      throw new GateLocalError(`${flag} needs a value`);
    return argv[i + 1];
  };
  const known = new Set(["--list", "--workflow", "--base", "--install-browsers"]);
  const flagValues = new Set([value("--workflow"), value("--base")]);
  const unknown = argv.filter((a) => !known.has(a) && !flagValues.has(a));
  if (unknown.length > 0) throw new GateLocalError(`unknown argument(s): ${unknown.join(" ")}`);
  const file = resolve(REPO_ROOT, value("--workflow") ?? DEFAULT_WORKFLOW);
  const { base, contexts } = emulatedEvents({ base: value("--base") ?? "origin/main" });
  const plan = buildPlan(readFileSync(file, "utf8"), {
    contexts,
    base,
    installBrowsers: argv.includes("--install-browsers"),
  });
  const list = argv.includes("--list");
  const log = list
    ? (m) => console.log(String(m).replace(/^--- RUN /, "--- WOULD RUN "))
    : console.log;
  const { text, failed } = summarize(runPlan(plan, { exec: list ? () => 0 : defaultExec, log }));
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

// Unit tests for scripts/gate-local.mjs — parsing, skip classification, fail-loud.
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GateLocalError, buildPlan, runPlan, summarize } from "../gate-local.mjs";

const FIXTURE = `
name: Fixture
on: push
env:
  WF: wf
jobs:
  ci:
    runs-on: ubuntu-latest
    env:
      JOB: job
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Plain
        run: echo plain
      - name: Multi
        working-directory: sub
        env:
          STEP: step
        run: |
          set -e
          echo one
          echo two
      - name: Uses secret
        env:
          TOKEN: \${{ secrets.NPM_TOKEN }}
        run: echo hi
      - name: Uses github context
        run: echo "\${{ github.sha }}"
      - name: Publish
        run: pnpm publish --no-git-checks
      - name: Playwright
        run: npx playwright install chromium --with-deps
`;

const byName = (plan, name) => plan[0].steps.find((s) => s.name === name);

describe("gate-local buildPlan", () => {
  const plan = buildPlan(FIXTURE);

  it("lists every step in file order, derived from the YAML", () => {
    expect(plan[0].steps.map((s) => s.name)).toEqual([
      "Checkout",
      "Plain",
      "Multi",
      "Uses secret",
      "Uses github context",
      "Publish",
      "Playwright",
    ]);
  });

  it("keeps a plain run step runnable and a multi-line run as one script", () => {
    expect(byName(plan, "Plain").skip).toBeNull();
    const multi = byName(plan, "Multi");
    expect(multi.skip).toBeNull();
    expect(multi.run).toContain("echo one\necho two");
  });

  it("merges workflow, job and step env and honours working-directory", () => {
    const multi = byName(plan, "Multi");
    expect(multi.env).toEqual({ WF: "wf", JOB: "job", STEP: "step" });
    expect(multi.cwd).toBe("sub");
  });

  it.each([
    ["Checkout", "uses-action"],
    ["Uses secret", "secrets"],
    ["Uses github context", "ci-context"],
    ["Publish", "publish"],
    ["Playwright", "os-install"],
  ])("skips %s with rule %s and a printed reason", (name, rule) => {
    const step = byName(plan, name);
    expect(step.skip?.rule).toBe(rule);
    expect(step.skip?.reason.length).toBeGreaterThan(10);
  });
});

describe("gate-local fails loud on constructs it cannot interpret", () => {
  const wrap = (job) => `jobs:\n  j:\n${job}`;

  it("unknown step key", () => {
    const y = wrap("    steps:\n      - run: echo\n        continue-on-error: true\n");
    expect(() => buildPlan(y)).toThrow(/unsupported key `continue-on-error`/);
  });
  it("matrix strategy", () => {
    const y = wrap("    strategy:\n      matrix:\n        n: [1]\n    steps:\n      - run: echo\n");
    expect(() => buildPlan(y)).toThrow(GateLocalError);
    expect(() => buildPlan(y)).toThrow(/`strategy`/);
  });
  it("non-bash shell", () => {
    const y = wrap("    steps:\n      - run: echo\n        shell: pwsh\n");
    expect(() => buildPlan(y)).toThrow(/shell `pwsh` unsupported/);
  });
  it("an `if:` it cannot classify", () => {
    const y = wrap("    steps:\n      - run: echo\n        if: always()\n");
    expect(() => buildPlan(y)).toThrow(/cannot be evaluated locally/);
  });
});

describe("gate-local execution and summary", () => {
  it("runs steps via bash, counts run/total/skipped, names failures", () => {
    const plan = buildPlan(`
jobs:
  j:
    steps:
      - name: ok
        run: echo ok
      - name: bad
        run: exit 3
      - uses: actions/checkout@v4
`);
    const lines = [];
    const results = runPlan(plan, {
      log: (m) => lines.push(m),
      exec: (step) => spawnSync("bash", ["-e", "-c", step.run]).status,
    });
    const { text, failed } = summarize(results);
    expect(failed).toBe(1);
    expect(text).toMatch(/2 run \/ 3 total, 1 skipped, 1 failed/);
    expect(text).toMatch(/FAILED:\s+j#2 bad \(exit 3\)/);
    expect(text).toMatch(/skipped: j#3 .*actions\/checkout/);
  });

  it("CLI: a step added to the workflow runs with no runner edit; exit 1 on failure", () => {
    const dir = mkdtempSync(join(tmpdir(), "gate-local-"));
    const wf = join(dir, "wf.yml");
    const base = "jobs:\n  j:\n    steps:\n      - run: echo base-step\n";
    writeFileSync(wf, `${base}      - run: echo gamma-derived-proof\n`);
    const ok = spawnSync("node", ["scripts/gate-local.mjs", "--workflow", wf], {
      encoding: "utf8",
    });
    expect(ok.status).toBe(0);
    expect(ok.stdout).toContain("gamma-derived-proof");
    expect(ok.stdout).toMatch(/2 run \/ 2 total, 0 skipped, 0 failed/);
    writeFileSync(wf, `${base}      - run: exit 1\n`);
    const red = spawnSync("node", ["scripts/gate-local.mjs", "--workflow", wf], {
      encoding: "utf8",
    });
    expect(red.status).toBe(1);
    writeFileSync(wf, `${base}      - run: echo\n        bogus: 1\n`);
    const loud = spawnSync("node", ["scripts/gate-local.mjs", "--workflow", wf], {
      encoding: "utf8",
    });
    expect(loud.status).toBe(2);
    expect(loud.stderr).toContain("bogus");
  });
});

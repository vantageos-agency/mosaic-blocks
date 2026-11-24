// Unit tests for scripts/gate-local.mjs — parsing, skip classification, fail-loud.
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  GateLocalError,
  buildPlan,
  expandScripts,
  playwrightBrowserGap,
  runPlan,
  summarize,
} from "../gate-local.mjs";

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

// The CLI derives its emulated events from git (base = `--base`, default origin/main;
// head, subject and branch from HEAD) in the directory that holds the script. These
// tests never run it against this checkout: a sandbox export may carry no .git, or a
// shallow one with no origin/main, and the result would then depend on the clone.
// Each CLI test builds its own throwaway repository: a base commit, origin/main set
// on it, then the commit under test — and runs a copy of the script from there.
const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "gate-local.mjs");
const REPO_NODE_MODULES = resolve(dirname(SCRIPT), "..", "node_modules");

function fixtureGit(cwd, args) {
  const r = spawnSync(
    "git",
    [
      "-c",
      "user.name=gate-local fixture",
      "-c",
      "user.email=fixture@invalid",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    { cwd, encoding: "utf8" },
  );
  if (r.status !== 0) {
    throw new Error(`fixture setup: git ${args.join(" ")} failed: ${r.stderr || r.error}`);
  }
  return r.stdout.trim();
}

/**
 * A throwaway git repository the CLI can resolve, independent of this checkout.
 * Returns { dir, run(args) }. `withBase: false` leaves origin/main unset (the
 * refusal path). Setup failure throws; the landing of each ref is asserted.
 */
function cliFixture({ withBase = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "gate-local-git-"));
  mkdirSync(join(dir, "scripts"));
  copyFileSync(SCRIPT, join(dir, "scripts", "gate-local.mjs"));
  if (!existsSync(join(REPO_NODE_MODULES, "yaml"))) {
    throw new Error(`fixture setup: ${REPO_NODE_MODULES}/yaml not found — install deps first`);
  }
  symlinkSync(REPO_NODE_MODULES, join(dir, "node_modules"), "dir");
  writeFileSync(join(dir, ".gitignore"), "node_modules\n*.yml\n");
  fixtureGit(dir, ["init", "-q", "-b", "fixture-branch"]);
  fixtureGit(dir, ["add", "-A"]);
  fixtureGit(dir, ["commit", "-q", "-m", "chore: fixture base"]);
  const baseSha = fixtureGit(dir, ["rev-parse", "HEAD"]);
  if (withBase) {
    fixtureGit(dir, ["update-ref", "refs/remotes/origin/main", baseSha]);
    expect(fixtureGit(dir, ["rev-parse", "--verify", "origin/main"])).toBe(baseSha);
  }
  writeFileSync(join(dir, "change.txt"), "the change under test\n");
  fixtureGit(dir, ["add", "change.txt"]);
  fixtureGit(dir, ["commit", "-q", "-m", "feat(fixture): the change under test"]);
  expect(fixtureGit(dir, ["rev-parse", "HEAD~1"])).toBe(baseSha);
  const run = (args) =>
    spawnSync("node", [join(dir, "scripts", "gate-local.mjs"), ...args], {
      cwd: dir,
      encoding: "utf8",
    });
  return { dir, run };
}

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
    expect(multi.env).toMatchObject({ WF: "wf", JOB: "job", STEP: "step" });
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
  it("an `if:` it cannot interpret", () => {
    const y = wrap("    steps:\n      - run: echo\n        if: always()\n");
    expect(() => buildPlan(y, { contexts: [{ "github.event_name": "push" }] })).toThrow(
      /cannot interpret/,
    );
  });
});

describe("gate-local event emulation", () => {
  const PR = {
    "github.event_name": "pull_request",
    "github.event.pull_request.head.sha": "abc123",
    "github.event.pull_request.title": "feat(x): y",
  };
  const PUSH = { "github.event_name": "push", "github.ref": "refs/heads/main" };
  const y = `
jobs:
  j:
    steps:
      - name: pr-only
        if: github.event_name == 'pull_request'
        env:
          HEAD: \${{ github.event.pull_request.head.sha }}
          TITLE: \${{ github.event.pull_request.title }}
        run: echo "$HEAD $TITLE"
      - name: push-main-only
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: echo main
      - name: never
        if: github.event_name == 'schedule'
        run: echo never
      - name: unknown-ctx
        run: echo "\${{ github.run_id }}"
`;
  const step = (plan, n) => plan[0].steps.find((s) => s.name === n);

  it("runs an event-conditional step and supplies head/title from the emulated context", () => {
    const plan = buildPlan(y, { contexts: [PR, PUSH], base: "origin/main" });
    const pr = step(plan, "pr-only");
    expect(pr.skip).toBeNull();
    expect(pr.env.HEAD).toBe("abc123");
    expect(pr.env.TITLE).toBe("feat(x): y");
    expect(step(plan, "push-main-only").skip).toBeNull();
  });

  it("supplies the base ref to the guards' base-ref env vars, step env winning", () => {
    const plan = buildPlan(y, { contexts: [PR, PUSH], base: "origin/dev" });
    expect(step(plan, "pr-only").env.RELEASE_ARTIFACTS_BASE_REF).toBe("origin/dev");
    expect(step(plan, "pr-only").env.PR_TITLE_GUARD_BASE_REF).toBe("origin/dev");
  });

  it("skips with a reason when no emulated event satisfies the condition", () => {
    const plan = buildPlan(y, { contexts: [PR, PUSH] });
    expect(step(plan, "never").skip.rule).toBe("event-conditional");
  });

  it("skips (never silently) a step whose context the emulation does not supply", () => {
    const plan = buildPlan(y, { contexts: [PR, PUSH] });
    const s = step(plan, "unknown-ctx").skip;
    expect(s.rule).toBe("ci-context");
    expect(s.reason).toContain("github.run_id");
  });

  it("skips writing derive steps but keeps their --check form", () => {
    const plan = buildPlan(
      "jobs:\n  j:\n    steps:\n      - name: w\n        run: pnpm registry:derive\n      - name: c\n        run: pnpm registry:derive --check\n",
    );
    expect(plan[0].steps[0].skip.rule).toBe("writes-derived-files");
    expect(plan[0].steps[1].skip).toBeNull();
  });

  it("skips the r/ generator (writes tracked files) but keeps the r/ drift check", () => {
    const plan = buildPlan(
      "jobs:\n  j:\n    steps:\n      - name: w\n        run: pnpm build:registry-items\n      - name: c\n        run: pnpm check:registry-items-drift\n",
    );
    expect(plan[0].steps[0].skip.rule).toBe("writes-derived-files");
    expect(plan[0].steps[1].skip).toBeNull();
  });

  it("--install-browsers drops --with-deps; without it the step stays skipped", () => {
    const wf =
      "jobs:\n  j:\n    steps:\n      - run: npx playwright install chromium --with-deps\n";
    expect(buildPlan(wf)[0].steps[0].skip.rule).toBe("os-install");
    const on = buildPlan(wf, { installBrowsers: true })[0].steps[0];
    expect(on.skip).toBeNull();
    expect(on.run).toBe("npx playwright install chromium");
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
    const { dir, run } = cliFixture();
    const wf = join(dir, "wf.yml");
    const base = "jobs:\n  j:\n    steps:\n      - run: echo base-step\n";
    writeFileSync(wf, `${base}      - run: echo gamma-derived-proof\n`);
    const ok = run(["--workflow", wf]);
    expect(ok.stderr).toBe("");
    expect(ok.status).toBe(0);
    expect(ok.stdout).toContain("gamma-derived-proof");
    expect(ok.stdout).toMatch(/2 run \/ 2 total, 0 skipped, 0 failed/);
    writeFileSync(wf, `${base}      - run: exit 1\n`);
    const red = run(["--workflow", wf]);
    expect(red.status).toBe(1);
    expect(red.stdout).toMatch(/FAILED:\s+j#2/);
    writeFileSync(wf, `${base}      - run: echo\n        bogus: 1\n`);
    const loud = run(["--workflow", wf]);
    expect(loud.status).toBe(2);
    expect(loud.stderr).toContain("bogus");
  });

  it("CLI: a base ref that does not resolve, or no git repository, is a named refusal (exit 2)", () => {
    const { dir, run } = cliFixture({ withBase: false });
    const wf = join(dir, "wf.yml");
    writeFileSync(wf, "jobs:\n  j:\n    steps:\n      - run: echo never-runs\n");
    const noBase = run(["--workflow", wf]);
    expect(noBase.status).toBe(2);
    expect(noBase.stderr).toMatch(
      /gate:local REFUSES TO RUN — git rev-parse --verify origin\/main failed/,
    );
    expect(noBase.stdout).not.toContain("never-runs");
    const missing = run(["--workflow", wf, "--base", "refs/heads/no-such-base"]);
    expect(missing.status).toBe(2);
    expect(missing.stderr).toContain("git rev-parse --verify refs/heads/no-such-base failed");

    const bare = mkdtempSync(join(tmpdir(), "gate-local-nogit-"));
    mkdirSync(join(bare, "scripts"));
    copyFileSync(SCRIPT, join(bare, "scripts", "gate-local.mjs"));
    symlinkSync(REPO_NODE_MODULES, join(bare, "node_modules"), "dir");
    const noGit = spawnSync("node", [join(bare, "scripts", "gate-local.mjs"), "--workflow", wf], {
      cwd: bare,
      env: { ...process.env, GIT_CEILING_DIRECTORIES: dirname(bare) },
      encoding: "utf8",
    });
    expect(noGit.status).toBe(2);
    expect(noGit.stderr).toMatch(
      /gate:local REFUSES TO RUN — git rev-parse --verify origin\/main failed: fatal: not a git repository/,
    );
  });
});

describe("gate-local preconditions — a step whose host prerequisite is absent COULD NOT RUN", () => {
  const wf = `
jobs:
  j:
    steps:
      - name: Install browsers
        run: npx playwright install chromium --with-deps
      - name: E2E
        run: pnpm test:browser
      - name: Unit
        run: pnpm test
`;
  const scriptsFor = () => ({ "test:browser": "playwright test", test: "vitest run" });

  it("attaches the precondition through the package script, derived from the job's install line", () => {
    const steps = buildPlan(wf, { scriptsFor })[0].steps;
    expect(steps[1].precondition).toEqual({
      id: "playwright-browsers",
      need: {
        installRun: "npx playwright install chromium",
        dryRun: "npx playwright install chromium --dry-run",
      },
    });
    expect(steps[2].precondition).toBeNull();
    expect(expandScripts("pnpm run test:browser", scriptsFor())).toMatch(/\[playwright test\]/);
  });

  it("refuses (fail-closed) a playwright step whose job has no install line to derive browsers from", () => {
    const bare = "jobs:\n  j:\n    steps:\n      - run: npx playwright test\n";
    expect(() => buildPlan(bare)).toThrow(/0 `playwright install` line/);
  });

  it("reports the step COULD-NOT-RUN with the named gap, never executes it, never counts it passed", () => {
    const plan = buildPlan(wf, { scriptsFor, installBrowsers: true });
    const ran = [];
    const results = runPlan(plan, {
      log: () => {},
      exec: (step) => {
        ran.push(step.name);
        return 0;
      },
      checkPrecondition: () => "Playwright browser(s) not installed: /x/chromium-1",
    });
    expect(ran).toEqual(["Install browsers", "Unit"]);
    const { text, failed, couldNotRun } = summarize(results);
    expect(failed).toBe(0);
    expect(couldNotRun).toBe(1);
    expect(text).toMatch(/2 run \/ 3 total, 0 skipped, 0 failed, 1 could not run/);
    expect(text).toMatch(/COULD-NOT-RUN: j#2 E2E — \[playwright-browsers\] .*chromium-1/);
  });

  it("names every missing install location reported by Playwright's own dry run", () => {
    const gap = playwrightBrowserGap(
      {
        installRun: "npx playwright install chromium",
        dryRun:
          "printf '  Install location:    /nonexistent/chromium-9\\n  Install location: /nonexistent/shell-9\\n'",
      },
      tmpdir(),
    );
    expect(gap).toContain("/nonexistent/chromium-9, /nonexistent/shell-9");
    expect(gap).toContain("pnpm gate:local --install-browsers");
  });

  it("refuses to read silence: a dry run listing no location, or failing, is a gap", () => {
    expect(playwrightBrowserGap({ installRun: "x", dryRun: "true" }, tmpdir())).toMatch(
      /listed no install location/,
    );
    expect(playwrightBrowserGap({ installRun: "x", dryRun: "exit 7" }, tmpdir())).toMatch(
      /exited 7/,
    );
  });

  it.runIf(process.platform === "linux")(
    "names the system libraries a present browser cannot load (ldd), with the root-only provisioning",
    () => {
      const dir = mkdtempSync(join(tmpdir(), "gate-local-pw-"));
      const loc = join(dir, "chromium-1");
      mkdirSync(join(loc, "chrome-linux64"), { recursive: true });
      const exe = join(loc, "chrome-linux64", "chrome");
      writeFileSync(exe, "\x7fELF fake");
      chmodSync(exe, 0o755);
      const bin = join(dir, "bin");
      mkdirSync(bin);
      writeFileSync(
        join(bin, "ldd"),
        "#!/bin/sh\necho '\tlibnss3.so => not found'\necho '\tlibc.so.6 => /lib/libc.so.6'\n",
      );
      chmodSync(join(bin, "ldd"), 0o755);
      const prevPath = process.env.PATH;
      process.env.PATH = `${bin}:${prevPath}`;
      try {
        const gap = playwrightBrowserGap(
          {
            installRun: "npx playwright install chromium",
            dryRun: `echo '  Install location: ${loc}'`,
          },
          tmpdir(),
        );
        expect(gap).toMatch(/browser system libraries missing: libnss3\.so/);
        expect(gap).toContain("sudo npx playwright install-deps chromium");
      } finally {
        process.env.PATH = prevPath;
      }
    },
  );

  it("CLI: a could-not-run step with no failure exits 2, never 0", () => {
    const { dir, run } = cliFixture();
    const file = join(dir, "wf.yml");
    writeFileSync(
      file,
      "jobs:\n  j:\n    steps:\n      - run: true playwright install chromium\n      - run: echo playwright test\n",
    );
    const r = run(["--workflow", file]);
    expect(r.stderr).not.toMatch(/REFUSES TO RUN/);
    expect(r.status).toBe(2);
    expect(r.stdout).toMatch(/COULD-NOT-RUN j#2 .*listed no install location/s);
  });
});

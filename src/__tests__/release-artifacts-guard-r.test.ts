import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

/**
 * release-artifacts-guard x r/*.json: a change to a committed r/ item is allowed
 * only when it equals the generator's output. Each case runs the REAL guard
 * (copied with the generator it imports) in a throwaway git repo that carries its
 * own package.json, registry.json, sources and r/ - nothing is borrowed from the
 * invoking environment.
 */
const repoRoot = join(__dirname, "..", "..");
const SCRIPTS = [
  "release-artifacts-guard.mjs",
  "docs-counts-shared.mjs",
  "build-registry-items.mjs",
  "check-registry-items-drift.mjs",
  "non-shipped.mjs",
];
const roots: string[] = [];

afterEach(() => {
  for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
});

const git = (root: string, ...args: string[]) =>
  execFileSync(
    "git",
    ["-c", "user.name=probe", "-c", "user.email=probe@example.invalid", ...args],
    { cwd: root, encoding: "utf8" },
  );

const write = (root: string, rel: string, text: string) => {
  mkdirSync(join(root, rel, ".."), { recursive: true });
  writeFileSync(join(root, rel), text, "utf8");
};

/** Regenerate every r/ item through the copied generator, exactly as the derive step does. */
const generate = (root: string) =>
  execFileSync("node", ["scripts/build-registry-items.mjs"], { cwd: root, encoding: "utf8" });

function fixtureRepo() {
  const root = mkdtempSync(join(tmpdir(), "guard-r-"));
  roots.push(root);
  mkdirSync(join(root, "scripts"));
  for (const f of SCRIPTS) copyFileSync(join(repoRoot, "scripts", f), join(root, "scripts", f));
  // non-shipped.mjs derives its test-file exclusion from the repo's tsconfig.test.json.
  for (const f of ["tsconfig.json", "tsconfig.test.json"])
    copyFileSync(join(repoRoot, f), join(root, f));
  // ...and its stories exclusion from the storybook config.
  mkdirSync(join(root, ".storybook"));
  copyFileSync(join(repoRoot, ".storybook/main.ts"), join(root, ".storybook/main.ts"));
  write(
    root,
    "package.json",
    `${JSON.stringify({ name: "@scope/fx", version: "1.0.0-alpha" }, null, 2)}\n`,
  );
  write(
    root,
    "registry.json",
    JSON.stringify({
      items: [
        { name: "a", type: "registry:ui", files: [{ path: "src/a/A.tsx", type: "registry:ui" }] },
        { name: "b", type: "registry:ui", files: [{ path: "src/b/B.tsx", type: "registry:ui" }] },
      ],
    }),
  );
  write(root, "src/a/A.tsx", 'import { X } from "../b/B.js";\nexport const A = X;\n');
  write(root, "src/b/B.tsx", "export const X = 1;\n");
  generate(root);
  git(root, "init", "-q", "-b", "main");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "base");
  git(root, "checkout", "-q", "-b", "work");
  return root;
}

function guard(root: string) {
  const r = spawnSync("node", ["scripts/release-artifacts-guard.mjs"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, RELEASE_ARTIFACTS_BASE_REF: "main", RELEASE_GUARD_HEAD_REF: "" },
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

const commit = (root: string, msg: string) => {
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", msg);
};

describe("release-artifacts-guard: r/*.json is derived, never hand-typed", () => {
  it("accepts an r/ change equal to the generator output (source edited, r/ regenerated)", () => {
    const root = fixtureRepo();
    write(root, "src/b/B.tsx", "export const X = 2;\n");
    generate(root);
    commit(root, "feat: change B and regenerate r/");
    expect(git(root, "diff", "--name-only", "main...HEAD")).toContain("r/b.json");
    const { status, out } = guard(root);
    expect(out).toContain("OK");
    expect(status).toBe(0);
  });

  it("refuses a hand edit of an r/ file, naming it", () => {
    const root = fixtureRepo();
    const p = join(root, "r/b.json");
    writeFileSync(
      p,
      readFileSync(p, "utf8").replace("export const X = 1;", "export const X = 99;"),
    );
    expect(readFileSync(p, "utf8")).toContain("X = 99"); // the mutation landed
    commit(root, "hand edit");
    const { status, out } = guard(root);
    expect(status).toBe(1);
    expect(out).toMatch(
      /r\/b\.json:0 — r\/\*\.json differs from what scripts\/build-registry-items\.mjs derives/,
    );
    expect(out).not.toMatch(/r\/a\.json/);
  });

  it("refuses a hand-edited pinned version in an r/ file (the property under test: version is derived)", () => {
    const root = fixtureRepo();
    const p = join(root, "r/a.json");
    writeFileSync(p, readFileSync(p, "utf8").replace("@1.0.0-alpha/", "@0.0.1/"));
    expect(readFileSync(p, "utf8")).toContain("@0.0.1/");
    commit(root, "hand edit version");
    const { status, out } = guard(root);
    expect(status).toBe(1);
    expect(out).toContain("r/a.json");
  });

  it("refuses r/ left at the old version after a package.json bump (the derive step must regenerate)", () => {
    const root = fixtureRepo();
    write(
      root,
      "package.json",
      `${JSON.stringify({ name: "@scope/fx", version: "1.0.1-alpha" }, null, 2)}\n`,
    );
    write(root, "src/b/B.tsx", "export const X = 3;\n");
    // r/ regenerated against the OLD version would be stale; here r/a.json is touched by hand.
    const p = join(root, "r/a.json");
    writeFileSync(p, `${readFileSync(p, "utf8")} `);
    commit(root, "bump without regenerating r/");
    expect(guard(root).out).toContain("r/a.json");
  });

  it("after a bump + regeneration every r/ file equals the generator output (no r/ violation)", () => {
    const root = fixtureRepo();
    write(
      root,
      "package.json",
      `${JSON.stringify({ name: "@scope/fx", version: "1.0.1-alpha" }, null, 2)}\n`,
    );
    generate(root);
    commit(root, "bump + regenerate");
    expect(readFileSync(join(root, "r/a.json"), "utf8")).toContain("@1.0.1-alpha/");
    const { out } = guard(root);
    expect(out).toContain("package.json"); // the version line itself is still refused in a component PR
    expect(out).not.toContain("r/a.json");
  });

  it("a PR that touches no r/ file never loads the generator (positive control: guard still OK)", () => {
    const root = fixtureRepo();
    write(root, "notes.txt", "x\n");
    commit(root, "unrelated");
    expect(guard(root).status).toBe(0);
  });
});

import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

/**
 * pr-title-matches-diff-guard x component entries: the guard's second source of "what the diff
 * really contains" is every `Mosaic<Name>` token on an ADDED line of a component barrel. The
 * barrels are the entries of package.json "exports" (src/index.ts, and today src/grid.ts and
 * src/registre.ts), not src/index.ts alone: a component exported only from "./grid" or
 * "./registre" is a real export the diff adds, and a title naming it is honest.
 *
 * Each case runs the REAL guard (copied with the modules it imports) in a throwaway git repo that
 * carries its own package.json, barrels and component file — nothing is borrowed from the invoking
 * environment. The component directory name deliberately does not map to the exported name, so
 * the barrel line is the only source that can see it.
 */
const repoRoot = join(__dirname, "..", "..");
const SCRIPTS = [
  "pr-title-matches-diff-guard.mjs",
  "docs-counts-shared.mjs",
  "source-tokens-shared.mjs",
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

const entry = (name: string) => ({
  types: `./dist/${name}.d.ts`,
  import: `./dist/${name}.js`,
  require: `./dist/${name}.cjs`,
});

/** A repo with root, grid and registre barrels; returns its root. */
function fixtureRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "pr-title-entries-"));
  roots.push(root);
  for (const s of SCRIPTS) {
    mkdirSync(join(root, "scripts"), { recursive: true });
    copyFileSync(join(repoRoot, "scripts", s), join(root, "scripts", s));
  }
  write(
    root,
    "package.json",
    `${JSON.stringify({
      name: "fixture",
      exports: {
        ".": entry("index"),
        "./server": entry("server"),
        "./grid": entry("grid"),
        "./registre": entry("registre"),
        "./styles.css": "./dist/styles.css",
      },
    })}\n`,
  );
  write(
    root,
    "src/index.ts",
    'export { MosaicZqRoot } from "./components/zq-root/MosaicZqRoot.js";\n',
  );
  write(root, "src/grid.ts", "\n");
  write(root, "src/registre.ts", "\n");
  write(root, "src/components/zq-root/MosaicZqRoot.tsx", "export const MosaicZqRoot = 1;\n");
  git(root, "init", "-q", "-b", "main");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "base");
  return root;
}

/** Adds a component in directory `zq-misc` (maps to MosaicZqMisc, never to the name) and exports it from `barrel`, then commits. */
function addComponent(root: string, barrel: string, name: string) {
  write(root, `src/components/zq-misc/${name}.tsx`, `export const ${name} = 1;\n`);
  write(root, barrel, `export { ${name} } from "./components/zq-misc/${name}.js";\n`);
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", `feat: ${name}`);
}

function runGuard(root: string, subject: string) {
  const env = { ...process.env, PR_TITLE_GUARD_BASE_REF: "HEAD^", PR_TITLE_GUARD_SUBJECT: subject };
  for (const k of ["GITHUB_EVENT_NAME", "GITHUB_BASE_REF", "GITHUB_HEAD_REF", "GITHUB_REF_NAME"]) {
    delete env[k];
  }
  delete env.PR_TITLE_GUARD_HEAD_REF;
  const r = spawnSync("node", [join(root, "scripts", "pr-title-matches-diff-guard.mjs")], {
    cwd: root,
    encoding: "utf8",
    env,
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

describe("pr-title-matches-diff-guard reads every component entry of package.json exports", () => {
  for (const barrel of ["src/grid.ts", "src/registre.ts", "src/index.ts"]) {
    it(`a component exported only from ${barrel} is seen: a title naming it passes`, () => {
      const root = fixtureRepo();
      addComponent(root, barrel, "MosaicZqShelf");
      const r = runGuard(root, "feat: add MosaicZqShelf");
      expect(r.out).toContain("matched by diff");
      expect(r.out).toContain("MosaicZqShelf");
      expect(r.code).toBe(0);
    });

    it(`a phantom is still blocked when the diff exports from ${barrel}`, () => {
      const root = fixtureRepo();
      addComponent(root, barrel, "MosaicZqShelf");
      const r = runGuard(root, "feat: add MosaicZqShelf and MosaicZqPhantom");
      expect(r.out).toContain("BLOCKED");
      expect(r.out).toContain("MosaicZqPhantom");
      expect(r.code).toBe(1);
    });
  }

  it("refuses to judge (exit 2) when package.json at the head has no exports map", () => {
    const root = fixtureRepo();
    write(root, "package.json", `${JSON.stringify({ name: "fixture" })}\n`);
    addComponent(root, "src/grid.ts", "MosaicZqShelf");
    const r = runGuard(root, "feat: add MosaicZqShelf");
    expect(r.out).toContain("REFUSES TO JUDGE");
    expect(r.code).toBe(2);
  });
});

/**
 * Exit-code contract of `scripts/registry-json-derive.mjs` (three states):
 *
 *   0 — clean: registry.json is the derivation of src/index.ts;
 *   1 — VIOLATION: the artifacts were read and something is wrong in them
 *       (an item missing or stale, saved dependencies drifted from the imports,
 *       a file importing a package package.json does not declare);
 *   2 — REFUSING TO JUDGE: the script could not read something it needs
 *       (an unreadable/absent file, an export form or a dynamic import it cannot
 *       read, a declaration it cannot apply). The output names what it could not
 *       read, and is never mistakable for a violation by exit code.
 *
 * Every case runs the real script on a throwaway COPY of the repo files it
 * reads (scripts/, src/, package.json, registry.json, tsconfig.test.json,
 * .storybook/), never on the working tree: other test files read those files
 * in parallel. The copy's registry.json is first re-derived in place so the
 * baseline is self-consistent whatever state the committed file is in; a
 * positive control proves the clean copy exits 0. Each mutation's landing is
 * asserted before its verdict is read.
 */

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..", "..");
const COPIED = ["scripts", "src", "package.json", "registry.json", "tsconfig.test.json", ".storybook"];

const work = mkdtempSync(path.join(tmpdir(), "registry-derive-exit-"));
const base = path.join(work, "base");
let caseNo = 0;

afterAll(() => rmSync(work, { recursive: true, force: true }));

function run(cwd: string, ...args: string[]) {
  const r = spawnSync("node", ["scripts/registry-json-derive.mjs", ...args], {
    cwd,
    encoding: "utf-8",
  });
  if (r.error) throw r.error;
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

beforeAll(() => {
  for (const entry of COPIED) {
    cpSync(path.join(ROOT, entry), path.join(base, entry), { recursive: true });
  }
  const derived = run(base);
  if (derived.code !== 0) {
    throw new Error(`setup: deriving the copy's registry.json failed (exit ${derived.code}): ${derived.out}`);
  }
}, 60_000);

/** A fresh copy of the self-consistent baseline, for one mutation. */
function freshCopy(): string {
  caseNo += 1;
  const dir = path.join(work, `case-${caseNo}`);
  cpSync(base, dir, { recursive: true });
  return dir;
}

const read = (dir: string, rel: string): string => readFileSync(path.join(dir, rel), "utf-8");
const write = (dir: string, rel: string, body: string): void =>
  writeFileSync(path.join(dir, rel), body, "utf-8");

const SELECT_TSX = "src/components/select/MosaicSelect.tsx";

describe("registry-json-derive --check — exit 0 on a clean tree (positive control)", () => {
  it("exits 0 and says OK", () => {
    const r = run(freshCopy(), "--check");
    expect(r.out).toContain("--check: OK");
    expect(r.code).toBe(0);
  });
});

describe("registry-json-derive --check — exit 1 on a VIOLATION, never REFUSING TO JUDGE", () => {
  it("dependency drift: an item's saved dependencies differ from its imports", () => {
    const dir = freshCopy();
    const reg = JSON.parse(read(dir, "registry.json"));
    const item = reg.items.find((i: { dependencies: string[] }) => i.dependencies.length > 0);
    expect(item).toBeDefined(); // positive control: some item carries a dependency
    const dropped = item.dependencies[0];
    item.dependencies = item.dependencies.slice(1);
    write(dir, "registry.json", `${JSON.stringify(reg, null, 2)}\n`);
    const landed = JSON.parse(read(dir, "registry.json")).items.find(
      (i: { name: string }) => i.name === item.name,
    );
    expect(landed.dependencies).not.toContain(dropped); // mutation landed

    const r = run(dir, "--check");
    expect(r.out).toContain("DEPENDENCIES");
    expect(r.out).toContain(item.name);
    expect(r.out).not.toContain("REFUSING TO JUDGE");
    expect(r.code).toBe(1);
  });

  it("missing item: an exported component absent from registry.json", () => {
    const dir = freshCopy();
    const reg = JSON.parse(read(dir, "registry.json"));
    reg.items = reg.items.filter((i: { name: string }) => i.name !== "mosaic-select");
    write(dir, "registry.json", `${JSON.stringify(reg, null, 2)}\n`);
    expect(read(dir, "registry.json")).not.toContain('"mosaic-select"'); // mutation landed

    const r = run(dir, "--check");
    expect(r.out).toMatch(/MISSING.*mosaic-select/);
    expect(r.out).not.toContain("REFUSING TO JUDGE");
    expect(r.code).toBe(1);
  });

  it("undeclared package: a shipped file imports a package package.json does not declare", () => {
    const dir = freshCopy();
    write(dir, SELECT_TSX, `${read(dir, SELECT_TSX)}\nimport "zed-undeclared-pkg";\n`);
    expect(read(dir, SELECT_TSX)).toContain('import "zed-undeclared-pkg";'); // mutation landed

    const r = run(dir, "--check");
    expect(r.out).toContain("zed-undeclared-pkg");
    expect(r.out).toContain(SELECT_TSX);
    expect(r.out).not.toContain("REFUSING TO JUDGE");
    expect(r.code).toBe(1);
  });
});

describe("registry-json-derive --check — exit 2 REFUSING TO JUDGE when it cannot read, naming what", () => {
  it.each<[string, (dir: string) => string, string]>([
    [
      "a non-literal dynamic import(nm)",
      (dir) => {
        write(
          dir,
          SELECT_TSX,
          `${read(dir, SELECT_TSX)}\nconst nm = "x";\nexport const zedLoad = () => import(nm);\n`,
        );
        return read(dir, SELECT_TSX).includes("import(nm)") ? "landed" : "";
      },
      SELECT_TSX,
    ],
    [
      "a non-literal require(nm)",
      (dir) => {
        write(dir, SELECT_TSX, `${read(dir, SELECT_TSX)}\nconst zedReq = require(String(1));\n`);
        return read(dir, SELECT_TSX).includes("require(String(1))") ? "landed" : "";
      },
      SELECT_TSX,
    ],
    [
      "an export form it cannot map (export *)",
      (dir) => {
        write(dir, "src/index.ts", `${read(dir, "src/index.ts")}\nexport * from "./zed.js";\n`);
        return read(dir, "src/index.ts").includes('export * from "./zed.js";') ? "landed" : "";
      },
      "src/index.ts",
    ],
    [
      "registry.json that is not JSON",
      (dir) => {
        write(dir, "registry.json", "{ not json");
        return read(dir, "registry.json") === "{ not json" ? "landed" : "";
      },
      "registry.json",
    ],
    [
      "registry.json absent",
      (dir) => {
        rmSync(path.join(dir, "registry.json"));
        return existsSync(path.join(dir, "registry.json")) ? "" : "landed";
      },
      "registry.json",
    ],
    [
      "a component directory the barrel points at, emptied of its source file",
      (dir) => {
        rmSync(path.join(dir, SELECT_TSX));
        return existsSync(path.join(dir, SELECT_TSX)) ? "" : "landed";
      },
      "src/components/select",
    ],
    [
      "registry.json whose items is not a list",
      (dir) => {
        write(dir, "registry.json", '{ "items": 3 }\n');
        return read(dir, "registry.json").includes('"items": 3') ? "landed" : "";
      },
      "registry.json",
    ],
  ])("%s -> exit 2", (_label, mutate, names) => {
    const dir = freshCopy();
    expect(mutate(dir)).toBe("landed");

    const r = run(dir, "--check");
    expect(r.out).toContain("REFUSING TO JUDGE");
    expect(r.out).toContain(names);
    expect(r.code).toBe(2);
  });

  it("--check with --stdout (conflicting modes) -> exit 2", () => {
    const r = run(freshCopy(), "--check", "--stdout");
    expect(r.out).toContain("REFUSING TO JUDGE");
    expect(r.code).toBe(2);
  });
});

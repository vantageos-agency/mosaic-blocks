import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildItem,
  buildPathIndex,
  findRelativeImports,
  loadRegistry,
  serializeItem,
} from "../../scripts/build-registry-items.mjs";
import { checkDrift } from "../../scripts/check-registry-items-drift.mjs";

const repoRoot = join(__dirname, "..", "..");
const ACCORDION_SRC = "src/components/accordion/MosaicAccordion.tsx";
const tmpRoots: string[] = [];

/** A self-contained fixture root: carries its own sources, registry list and r/. */
function fixture(files: Record<string, string>, items: Array<Record<string, unknown>>) {
  const root = mkdtempSync(join(tmpdir(), "registry-items-"));
  tmpRoots.push(root);
  for (const [rel, text] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, text, "utf8");
  }
  return { root, items: items as never[], pathToItem: buildPathIndex(items as never[]) };
}

afterEach(() => {
  for (const r of tmpRoots.splice(0)) rmSync(r, { recursive: true, force: true });
});

describe("build-registry-items: clean item", () => {
  it("output equals source and the committed r/mosaic-accordion.json byte for byte", () => {
    const items = loadRegistry();
    const item = items.find((i) => i.name === "mosaic-accordion");
    expect(item).toBeDefined();
    const built = buildItem(item as never, { pathToItem: buildPathIndex(items) }) as {
      files: Array<{ content: string; target: string }>;
    };
    expect(built.files).toHaveLength(1);
    expect(built.files[0].content).toBe(readFileSync(join(repoRoot, ACCORDION_SRC), "utf8"));
    expect(built.files[0].target).toBe("components/ui/MosaicAccordion.tsx");
    expect(serializeItem(built)).toBe(
      readFileSync(join(repoRoot, "r/mosaic-accordion.json"), "utf8"),
    );
  });
});

describe("build-registry-items: refusals", () => {
  const item = {
    name: "a",
    type: "registry:ui",
    files: [{ path: "src/a/A.tsx", type: "registry:ui" }],
  };

  it("refuses a cross-directory relative import, naming item and import", () => {
    const f = fixture(
      {
        "src/a/A.tsx": 'import { X } from "../b/B.js";\nexport const A = X;\n',
        "src/b/B.tsx": "export const X = 1;\n",
      },
      [item, { name: "b", type: "registry:ui", files: [{ path: "src/b/B.tsx" }] }],
    );
    expect(() => buildItem(item as never, { root: f.root, pathToItem: f.pathToItem })).toThrow(
      /item "a".*"\.\.\/b\/B\.js"/,
    );
  });

  it("refuses a same-directory import of another item that is not declared", () => {
    const f = fixture(
      {
        "src/a/A.tsx": 'import { X } from "./B";\nexport const A = X;\n',
        "src/a/B.tsx": "export const X = 1;\n",
      },
      [item, { name: "b", type: "registry:ui", files: [{ path: "src/a/B.tsx" }] }],
    );
    expect(() => buildItem(item as never, { root: f.root, pathToItem: f.pathToItem })).toThrow(
      /belongs to item "b", which is not declared/,
    );
  });

  it("accepts that same import once the dependency is declared", () => {
    const declared = { ...item, registryDependencies: ["b"] };
    const f = fixture(
      {
        "src/a/A.tsx": 'import { X } from "./B";\nexport const A = X;\n',
        "src/a/B.tsx": "export const X = 1;\n",
      },
      [declared, { name: "b", type: "registry:ui", files: [{ path: "src/a/B.tsx" }] }],
    );
    expect(() =>
      buildItem(declared as never, { root: f.root, pathToItem: f.pathToItem }),
    ).not.toThrow();
  });

  it("refuses a same-directory import that resolves to no registry file", () => {
    const f = fixture({ "src/a/A.tsx": 'import "./styles.css";\n' }, [item]);
    expect(() => buildItem(item as never, { root: f.root, pathToItem: f.pathToItem })).toThrow(
      /resolves to no registry file/,
    );
  });

  it("finds multi-line, side-effect, dynamic and re-export forms", () => {
    const src = [
      'import {\n  a,\n} from "../x/A.js";',
      'import "./side";',
      'const m = import("../lazy/L.js");',
      'export * from "./re";',
    ].join("\n");
    expect(findRelativeImports(src)).toEqual(["../x/A.js", "./side", "../lazy/L.js", "./re"]);
  });

  it("fails loud on a missing source file", () => {
    const f = fixture({}, [item]);
    expect(() => buildItem(item as never, { root: f.root, pathToItem: f.pathToItem })).toThrow(
      /source file not found on disk: src\/a\/A\.tsx/,
    );
  });

  it("fails loud on an empty source file", () => {
    const f = fixture({ "src/a/A.tsx": "" }, [item]);
    expect(() => buildItem(item as never, { root: f.root, pathToItem: f.pathToItem })).toThrow(
      /source file is empty: src\/a\/A\.tsx/,
    );
  });

  it("fails loud on an item with no files[]", () => {
    expect(() => buildItem({ name: "z", files: [] } as never)).toThrow(/no files\[\]/);
  });

  it("the CLI exits 1 on the real registry and writes nothing (all-or-nothing)", () => {
    const run = spawnSync("node", ["scripts/build-registry-items.mjs"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/REFUSED — item "[^"]+": \S+ imports "/);
    const ls = spawnSync("git", ["status", "--porcelain", "--", "r"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(ls.stdout).toBe("");
  });
});

describe("check-registry-items-drift", () => {
  const item = { name: "a", type: "registry:ui", files: [{ path: "src/a/A.tsx" }] };

  function committed(srcText: string) {
    const f = fixture({ "src/a/A.tsx": srcText }, [item]);
    mkdirSync(join(f.root, "r"));
    writeFileSync(
      join(f.root, "r/a.json"),
      serializeItem(buildItem(item as never, { root: f.root, pathToItem: f.pathToItem })),
      "utf8",
    );
    return f;
  }

  it("is green on a regenerated tree", () => {
    const f = committed("export const A = 1;\n");
    expect(checkDrift({ root: f.root, items: f.items })).toEqual({ checked: 1, problems: [] });
  });

  it("goes red when the source changes without a regeneration", () => {
    const f = committed("export const A = 1;\n");
    writeFileSync(join(f.root, "src/a/A.tsx"), "export const A = 2;\n", "utf8");
    const { problems } = checkDrift({ root: f.root, items: f.items });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/a\.json: differs from its source/);
  });

  it("goes red on a committed file with no registry item", () => {
    const f = committed("export const A = 1;\n");
    writeFileSync(join(f.root, "r/ghost.json"), "{}\n", "utf8");
    expect(checkDrift({ root: f.root, items: f.items }).problems.join("\n")).toMatch(
      /ghost\.json: no item/,
    );
  });

  it("goes red when nothing is committed, a comparison of nothing is not a pass", () => {
    const f = fixture({ "src/a/A.tsx": "x\n" }, [item]);
    expect(checkDrift({ root: f.root, items: f.items }).problems.join("\n")).toMatch(
      /nothing was compared/,
    );
  });

  it("is green on the real committed r/ tree", () => {
    const { checked, problems } = checkDrift();
    expect(problems).toEqual([]);
    expect(checked).toBeGreaterThan(0);
  });
});

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildItem,
  buildPathIndex,
  findRelativeImports,
  isShipped,
  loadRegistry,
  pinnedItemUrl,
  readPackageIdentity,
  serializeItem,
} from "../../scripts/build-registry-items.mjs";
import { checkDrift } from "../../scripts/check-registry-items-drift.mjs";

const repoRoot = join(__dirname, "..", "..");
const ACCORDION_SRC = "src/components/accordion/MosaicAccordion.tsx";
const tmpRoots: string[] = [];
const FIXTURE_PKG = { name: "@scope/fixture", version: "9.8.7-alpha" };
const pinned = (name: string) => pinnedItemUrl(name, FIXTURE_PKG);

/** A self-contained fixture root: carries its own sources, registry list and r/. */
function fixture(files: Record<string, string>, items: Array<Record<string, unknown>>) {
  const root = mkdtempSync(join(tmpdir(), "registry-items-"));
  tmpRoots.push(root);
  writeFileSync(join(root, "package.json"), JSON.stringify(FIXTURE_PKG), "utf8");
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
  it("output equals source, carries no target, and equals the committed r/mosaic-accordion.json", () => {
    const items = loadRegistry();
    const item = items.find((i) => i.name === "mosaic-accordion");
    expect(item).toBeDefined();
    const built = buildItem(item as never, { pathToItem: buildPathIndex(items) }) as {
      files: Array<{ content: string; target?: string }>;
    };
    expect(built.files).toHaveLength(1);
    expect(built.files[0].content).toBe(readFileSync(join(repoRoot, ACCORDION_SRC), "utf8"));
    expect(built.files[0].target).toBeUndefined();
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

  const itemB = { name: "b", type: "registry:ui", files: [{ path: "src/b/B.tsx" }] };
  const cross = {
    "src/a/A.tsx": 'import { X } from "../b/B.js";\nexport const A = X;\n',
    "src/b/B.tsx": "export const X = 1;\n",
  };

  it("rewrites a cross-item import to the flat alias and derives the registryDependency", () => {
    const f = fixture(cross, [item, itemB]);
    const built = buildItem(item as never, { root: f.root, pathToItem: f.pathToItem }) as {
      registryDependencies: string[];
      files: Array<{ content: string }>;
    };
    expect(built.files[0].content).toBe(
      'import { X } from "@/components/ui/B";\nexport const A = X;\n',
    );
    expect(built.registryDependencies).toEqual([pinned("b")]);
  });

  it("derives the dependency from the graph, merged with a declared one, never duplicated", () => {
    const declared = { ...item, registryDependencies: ["b", "z"] };
    const f = fixture(cross, [declared, itemB]);
    const built = buildItem(declared as never, { root: f.root, pathToItem: f.pathToItem }) as {
      registryDependencies: string[];
    };
    expect(built.registryDependencies).toEqual([pinned("b"), "z"]);
  });

  it("rewrites multi-line, re-export and dynamic cross-item imports too", () => {
    const f = fixture(
      {
        "src/a/A.tsx":
          'import {\n  X,\n} from "../b/B.js";\nexport * from \'../b/B.js\';\nconst m = import("../b/B.js");\n',
        "src/b/B.tsx": "export const X = 1;\n",
      },
      [item, itemB],
    );
    const built = buildItem(item as never, { root: f.root, pathToItem: f.pathToItem }) as {
      files: Array<{ content: string }>;
    };
    expect(built.files[0].content).not.toMatch(/\.\.\//);
    expect(
      built.files[0].content.match(/@\/components\/ui\/B"|@\/components\/ui\/B'/g),
    ).toHaveLength(3);
  });

  it("refuses a cross-directory import that resolves to no shipped file, by name", () => {
    const f = fixture(
      { "src/a/A.tsx": 'import { X } from "../no-such-item/X.js";\nexport const A = X;\n' },
      [item],
    );
    expect(() => buildItem(item as never, { root: f.root, pathToItem: f.pathToItem })).toThrow(
      /item "a".*"\.\.\/no-such-item\/X\.js" — resolves to no shipped registry file/,
    );
  });

  it("refuses a cross-item import of a story file (it is not shipped)", () => {
    const f = fixture(
      {
        "src/a/A.tsx": 'import { X } from "../b/B.stories.js";\n',
        "src/b/B.stories.tsx": "export const X = 1;\n",
      },
      [item, { name: "b", type: "registry:ui", files: [{ path: "src/b/B.stories.tsx" }] }],
    );
    expect(() => buildItem(item as never, { root: f.root, pathToItem: f.pathToItem })).toThrow(
      /resolves to no shipped registry file/,
    );
  });

  it("refuses a deeper path it cannot map to an alias", () => {
    const f = fixture(
      {
        "src/a/A.tsx": 'import { X } from "../b/c/B.js";\n',
        "src/b/c/B.tsx": "export const X = 1;\n",
      },
      [item, { name: "b", type: "registry:ui", files: [{ path: "src/b/c/B.tsx" }] }],
    );
    expect(() => buildItem(item as never, { root: f.root, pathToItem: f.pathToItem })).toThrow(
      /cannot map it to an alias/,
    );
  });

  it("refuses when the flat basename is shared by another shipped file", () => {
    const f = fixture(
      {
        ...cross,
        "src/c/B.tsx": "export const X = 2;\n",
      },
      [item, itemB, { name: "c", type: "registry:ui", files: [{ path: "src/c/B.tsx" }] }],
    );
    expect(() => buildItem(item as never, { root: f.root, pathToItem: f.pathToItem })).toThrow(
      /basename "B\.tsx" is shared with src\/c\/B\.tsx/,
    );
  });

  it("keeps a same-directory import of another item as is and derives its dependency", () => {
    const f = fixture(
      {
        "src/a/A.tsx": 'import { X } from "./B";\nexport const A = X;\n',
        "src/a/B.tsx": "export const X = 1;\n",
      },
      [item, { name: "b", type: "registry:ui", files: [{ path: "src/a/B.tsx" }] }],
    );
    const built = buildItem(item as never, { root: f.root, pathToItem: f.pathToItem }) as {
      registryDependencies: string[];
      files: Array<{ content: string }>;
    };
    expect(built.files[0].content).toContain('from "./B"');
    expect(built.registryDependencies).toEqual([pinned("b")]);
  });

  it("refuses a same-directory import that resolves to no registry file", () => {
    const f = fixture({ "src/a/A.tsx": 'import "./styles.css";\n' }, [item]);
    expect(() => buildItem(item as never, { root: f.root, pathToItem: f.pathToItem })).toThrow(
      /resolves to no shipped registry file/,
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

  it("does not refuse over, nor ship, a story/test file importing ../x", () => {
    const withStory = {
      ...item,
      files: [
        { path: "src/a/A.tsx", type: "registry:ui" },
        { path: "src/a/A.stories.tsx", type: "registry:ui" },
        { path: "src/a/A.test.tsx", type: "registry:ui" },
      ],
    };
    const f = fixture(
      {
        "src/a/A.tsx": "export const A = 1;\n",
        "src/a/A.stories.tsx": 'import { X } from "../b/B.js";\nexport default X;\n',
        "src/a/A.test.tsx": 'import { X } from "../b/B.js";\nexport default X;\n',
      },
      [withStory],
    );
    const built = buildItem(withStory as never, { root: f.root, pathToItem: f.pathToItem }) as {
      files: Array<{ path: string }>;
    };
    expect(built.files.map((x) => x.path)).toEqual(["src/a/A.tsx"]);
  });

  it("derives the non-shipped domain: stories, tests, specs, __tests__ out; sources in", () => {
    expect(isShipped("src/components/a/A.stories.tsx")).toBe(false);
    expect(isShipped("src/components/a/A.test.tsx")).toBe(false);
    expect(isShipped("src/components/a/A.spec.ts")).toBe(false);
    expect(isShipped("src/__tests__/x.ts")).toBe(false);
    expect(isShipped("src/components/a/A.tsx")).toBe(true);
    expect(isShipped("src/hooks/useX.ts")).toBe(true);
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

  it("builds every real registry item: no refusal, no relative import left that crosses a directory", () => {
    const items = loadRegistry();
    const pathToItem = buildPathIndex(items);
    for (const it of items) {
      const built = buildItem(it, { pathToItem }) as { files: Array<{ content: string }> };
      for (const file of built.files) {
        expect(findRelativeImports(file.content).filter((s) => !/^\.\/[^/]+$/.test(s))).toEqual([]);
      }
    }
  });
});

describe("pinned jsdelivr registryDependencies", () => {
  const pkg = readPackageIdentity(repoRoot);
  const rDir = join(repoRoot, "r");
  const urlRe = /^https:\/\/cdn\.jsdelivr\.net\/npm\/(.+)@([^/@]+)\/r\/([^/]+)\.json$/;

  /** Every registryDependency URL in every committed r/*.json, with its file. */
  function allUrls(dir: string) {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .flatMap((f) =>
        (JSON.parse(readFileSync(join(dir, f), "utf8")).registryDependencies as string[]).map(
          (url) => ({ file: f, url }),
        ),
      );
  }

  /** Files whose URL does not carry `@<version>/`; the property under test. */
  const wrongVersion = (urls: Array<{ file: string; url: string }>, version: string) =>
    urls.filter((u) => !u.url.includes(`@${version}/`)).map((u) => `${u.file}: ${u.url}`);

  it("builds the URL from package.json name and version, never typed", () => {
    expect(pinnedItemUrl("mosaic-x", pkg)).toBe(
      `https://cdn.jsdelivr.net/npm/${pkg.name}@${pkg.version}/r/mosaic-x.json`,
    );
  });

  it("every committed r/*.json registryDependency is a URL pinned to package.json's version", () => {
    const urls = allUrls(rDir);
    expect(urls.length).toBeGreaterThan(0);
    expect(wrongVersion(urls, pkg.version)).toEqual([]);
    for (const { url } of urls) expect(url).toMatch(urlRe);
  });

  it("every pinned URL names an item that exists in registry.json", () => {
    const names = new Set(loadRegistry().map((i) => i.name));
    for (const { file, url } of allUrls(rDir)) {
      expect(names.has(url.match(urlRe)?.[3] ?? ""), `${file}: ${url}`).toBe(true);
    }
  });

  it("positive control: a mutated version string is detected", () => {
    const good = { file: "x.json", url: pinnedItemUrl("mosaic-y", pkg) };
    const bad = { file: "z.json", url: good.url.replace(`@${pkg.version}/`, "@0.0.0-mutated/") };
    expect(bad.url).not.toBe(good.url);
    expect(wrongVersion([good], pkg.version)).toEqual([]);
    expect(wrongVersion([good, bad], pkg.version)).toEqual([`z.json: ${bad.url}`]);
  });

  it("items with no cross-item dependency carry no registryDependencies URL", () => {
    const acc = JSON.parse(readFileSync(join(rDir, "mosaic-accordion.json"), "utf8"));
    expect(acc.registryDependencies).toEqual([]);
  });

  it("external npm dependencies stay in dependencies, not registryDependencies", () => {
    const f = fixture({ "src/a/A.tsx": "export const A = 1;\n" }, [
      { name: "a", type: "registry:ui", dependencies: ["clsx"], files: [{ path: "src/a/A.tsx" }] },
    ]);
    const built = buildItem(f.items[0], { root: f.root, pathToItem: f.pathToItem }) as {
      dependencies: string[];
      registryDependencies: string[];
    };
    expect(built.dependencies).toEqual(["clsx"]);
    expect(built.registryDependencies).toEqual([]);
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

  it("goes red on a registry item with no committed r/ file", () => {
    const itemB = { name: "b", type: "registry:ui", files: [{ path: "src/a/B.tsx" }] };
    const f = fixture({ "src/a/A.tsx": "export const A = 1;\n", "src/a/B.tsx": "x\n" }, [
      item,
      itemB,
    ]);
    mkdirSync(join(f.root, "r"));
    writeFileSync(
      join(f.root, "r/a.json"),
      serializeItem(buildItem(item as never, { root: f.root, pathToItem: f.pathToItem })),
      "utf8",
    );
    expect(checkDrift({ root: f.root, items: f.items }).problems.join("\n")).toMatch(
      /r\/b\.json: missing/,
    );
  });

  it("goes red when a pinned version in a committed file is hand-edited", () => {
    const itemB = { name: "b", type: "registry:ui", files: [{ path: "src/b/B.tsx" }] };
    const itemA = { ...item, files: [{ path: "src/a/A.tsx" }] };
    const f = fixture(
      {
        "src/a/A.tsx": 'import { X } from "../b/B.js";\nexport const A = X;\n',
        "src/b/B.tsx": "export const X = 1;\n",
      },
      [itemA, itemB],
    );
    mkdirSync(join(f.root, "r"));
    for (const it of [itemA, itemB]) {
      writeFileSync(
        join(f.root, `r/${it.name}.json`),
        serializeItem(buildItem(it as never, { root: f.root, pathToItem: f.pathToItem })),
        "utf8",
      );
    }
    expect(checkDrift({ root: f.root, items: f.items }).problems).toEqual([]);
    const p = join(f.root, "r/a.json");
    writeFileSync(p, readFileSync(p, "utf8").replace("@9.8.7-alpha/", "@1.0.0/"), "utf8");
    expect(checkDrift({ root: f.root, items: f.items }).problems.join("\n")).toMatch(
      /a\.json: differs from its source/,
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

describe("registry.json: shipped files only", () => {
  const items = loadRegistry();
  const paths = items.flatMap((i) => (i.files ?? []).map((f) => f.path));

  it("lists no story, test or spec file (same exclusion as the generator)", () => {
    expect(paths.filter((p) => !isShipped(p))).toEqual([]);
  });

  it("positive control: a known component source is still listed", () => {
    expect(paths).toContain(ACCORDION_SRC);
  });
});

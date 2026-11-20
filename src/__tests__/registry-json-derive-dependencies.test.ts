/**
 * Dependency-domain guard for scripts/registry-json-derive.mjs.
 *
 * Before this fix an item's `dependencies` came from a hand-typed allowlist and
 * from the PRIMARY file's imports only: an item whose primary file imported
 * `ag-grid-*` while its sibling files imported `@heroui/react` and `lucide-react`
 * derived `"dependencies": []`, so a host installing it from the registry got none.
 *
 * CENSUS of module-specifier forms a shipped file can carry — derived from the
 * ES/TypeScript module grammar: `import … from "x"`, `import type … from "x"`,
 * `export … from "x"`, side-effect `import "x"`, dynamic `import("x")` (and the
 * type form `typeof import("x")`), `require("x")`. One fixture per form below.
 * Specifier classes: relative, node builtin, react/react-dom, eligible (declared
 * in package.json), undeclared bare (must throw).
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { dependenciesOfFiles, eligibleDependencies } from "../../scripts/registry-json-derive.mjs";

const ROOT = path.resolve(__dirname, "..", "..");
const SCRIPT = path.join(ROOT, "scripts", "registry-json-derive.mjs");
const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf-8"));

const fixtureDir = mkdtempSync(path.join(tmpdir(), "registry-deps-"));
afterAll(() => rmSync(fixtureDir, { recursive: true, force: true }));
const fixture = (name: string, body: string): string => {
  const p = path.join(fixtureDir, name);
  writeFileSync(p, body, "utf-8");
  return p;
};

const ELIGIBLE = new Set([
  "ag-grid-react",
  "@heroui/react",
  "lucide-react",
  "@base-ui/react",
  "svix",
]);

describe("eligibleDependencies — derived from package.json, never typed", () => {
  it("is peerDependencies + dependencies minus react and react-dom", () => {
    const expected = [
      ...Object.keys(pkg.peerDependencies ?? {}),
      ...Object.keys(pkg.dependencies ?? {}),
    ]
      .filter((n) => n !== "react" && n !== "react-dom")
      .sort();
    expect([...eligibleDependencies(pkg)].sort()).toEqual(expected);
    expect(eligibleDependencies(pkg).has("react")).toBe(false);
    expect(eligibleDependencies(pkg).has("ag-grid-community")).toBe(true);
  });
});

describe("dependenciesOfFiles — union over every file of an item", () => {
  it("counts a NON-primary file's import", () => {
    const primary = fixture("Primary.tsx", 'import { AgGridReact } from "ag-grid-react";\n');
    const sibling = fixture("Sibling.tsx", 'import { Button } from "@heroui/react";\n');
    expect(dependenciesOfFiles([primary, sibling], ELIGIBLE)).toEqual([
      "@heroui/react",
      "ag-grid-react",
    ]);
  });

  it("reads every specifier form, maps subpaths to the package, skips relative/builtin/react", () => {
    const f = fixture(
      "Forms.ts",
      [
        'import type { X } from "lucide-react";',
        'export { Y } from "@base-ui/react/popover";',
        'import "./side-effect.css";',
        'import React from "react";',
        'import { jsx } from "react/jsx-runtime";',
        'import { createPortal } from "react-dom";',
        'import { join } from "node:path";',
        'import { readFileSync } from "fs";',
        'import { local } from "./local.js";',
        'let W: typeof import("svix").Webhook;',
        '// import { Ghost } from "ghost-in-a-comment";',
        '/* from "ghost-in-a-block-comment" */',
        'const s = "reachable from \\"idle\\"";',
      ].join("\n"),
    );
    expect(dependenciesOfFiles([f], ELIGIBLE)).toEqual(["@base-ui/react", "lucide-react", "svix"]);
  });

  it.each([
    ["static import", 'import { Z } from "zed-undeclared";'],
    ["side-effect import", 'import "zed-undeclared/style.css";'],
    ["export from", 'export * from "@zed/undeclared";'],
    ["dynamic import", 'const m = await import("zed-undeclared");'],
    ["require", 'const m = require("zed-undeclared");'],
  ])("THROWS naming file + package on an undeclared bare %s", (_label, body) => {
    const f = fixture(`Undeclared-${_label.replace(/\W/g, "-")}.ts`, `${body}\n`);
    expect(readFileSync(f, "utf-8")).toContain("undeclared"); // mutation landed
    expect(() => dependenciesOfFiles([f], ELIGIBLE)).toThrow(
      new RegExp(`${path.basename(f)}.*(zed-undeclared|@zed/undeclared)`),
    );
  });

  it("THROWS on a non-literal dynamic import it cannot read", () => {
    const f = fixture("DynamicVar.ts", "const name = 'x';\nconst m = await import(name);\n");
    expect(() => dependenciesOfFiles([f], ELIGIBLE)).toThrow(/DynamicVar\.ts.*non-literal/);
  });
});

describe("registry.json derivation — mosaic-grille-registre", () => {
  it("carries every package its files import, not only the primary's", () => {
    const out = execFileSync("node", [SCRIPT, "--stdout"], { cwd: ROOT, encoding: "utf-8" });
    const item = JSON.parse(out).items.find(
      (i: { name: string }) => i.name === "mosaic-grille-registre",
    );
    expect(item).toBeDefined();
    expect(item.dependencies).toEqual([
      "@heroui/react",
      "ag-grid-community",
      "ag-grid-react",
      "lucide-react",
    ]);
    // Independent of the curated-preserve path: re-derive from the item's own
    // files, so a preserved stale value in registry.json cannot satisfy this.
    const abs = item.files.map((f: { path: string }) => path.join(ROOT, f.path));
    expect(dependenciesOfFiles(abs, eligibleDependencies(pkg))).toEqual(item.dependencies);
  });
});

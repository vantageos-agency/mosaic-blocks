/**
 * Drift guard: asserts that every catalog-managed version in package.json and
 * sandbox/package.json matches src/versions.ts.
 *
 * If this test fails, run `pnpm sync-versions` to re-align the package.json
 * files with the catalog, then commit both.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { versions } from "./versions.js";

// Resolve repo root from this test file's location (src/ → ../)
const root = resolve(import.meta.dirname, "..");

function readPkg(rel: string): Record<string, Record<string, string>> {
  return JSON.parse(readFileSync(resolve(root, rel), "utf8")) as Record<
    string,
    Record<string, string>
  >;
}

const SECTIONS = ["dependencies", "devDependencies", "peerDependencies"] as const;

function collectPackageVersions(
  pkg: Record<string, Record<string, string>>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const section of SECTIONS) {
    const entries = pkg[section] ?? {};
    for (const [key, value] of Object.entries(entries)) {
      // Only track keys that appear in the catalog
      if (key in versions) {
        result[key] = value as string;
      }
    }
  }
  return result;
}

describe("versions catalog drift guard", () => {
  it("package.json (lib) — all catalog-managed entries match versions.ts", () => {
    const pkg = readPkg("package.json");
    const found = collectPackageVersions(pkg);

    for (const [key, value] of Object.entries(found)) {
      expect(
        value,
        `package.json: "${key}" is "${value}" but versions.ts says "${versions[key as keyof typeof versions]}". Run \`pnpm sync-versions\`.`,
      ).toBe(versions[key as keyof typeof versions]);
    }
  });

  it("sandbox/package.json — all catalog-managed entries match versions.ts", () => {
    const pkg = readPkg("sandbox/package.json");
    const found = collectPackageVersions(pkg);

    for (const [key, value] of Object.entries(found)) {
      expect(
        value,
        `sandbox/package.json: "${key}" is "${value}" but versions.ts says "${versions[key as keyof typeof versions]}". Run \`pnpm sync-versions\`.`,
      ).toBe(versions[key as keyof typeof versions]);
    }
  });

  it("versions.ts is non-empty and has expected shape", () => {
    const keys = Object.keys(versions);
    expect(keys.length).toBeGreaterThan(0);
    // Spot-check a few required entries
    expect(versions.react).toBeDefined();
    expect(versions["react-dom"]).toBeDefined();
    expect(versions["@base-ui/react"]).toBeDefined();
    expect(versions.next).toBeDefined();
    expect(versions.tailwindcss).toBeDefined();
    expect(versions.typescript).toBeDefined();
  });
});

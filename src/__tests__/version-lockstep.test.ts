/**
 * Drift guard: asserts `src/version.ts` and `package.json`'s own `version`
 * field are always in lockstep. These are two independent hand-editable
 * sources of the same fact — nothing derives one from the other at build
 * time — so a guard that actually reads both, rather than trusting a human
 * to keep them in sync, is the only thing standing between a release and a
 * silently-stale `version.ts` export.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { version } from "../version.js";

const root = resolve(import.meta.dirname, "..", "..");

describe("version lockstep guard", () => {
  it("src/version.ts matches package.json's version field", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8")) as {
      version: string;
    };
    expect(
      version,
      `src/version.ts exports "${version}" but package.json says "${pkg.version}" — keep them in lockstep.`,
    ).toBe(pkg.version);
  });
});

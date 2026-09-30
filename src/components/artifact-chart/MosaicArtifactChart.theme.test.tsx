/**
 * MosaicArtifactChart — theme tests
 *
 * The chart paints its series with `var(--color-chart-N)`. That variable must
 * be DECLARED by the stylesheet this package ships (src/styles.css), and it
 * must resolve to the tokens package's palette — a different set in light and
 * in dark. A hardcoded hex fallback that always wins is the defect this file
 * guards against: it renders identically in both themes and hides the missing
 * declaration.
 *
 * Instrument: the real src/styles.css is compiled by Tailwind's own compiler
 * (the same one a consuming app runs), then the emitted custom properties are
 * resolved at the <html> element, where MosaicThemeToggle sets `data-theme`.
 * Nothing is read from the author's environment; everything resolves from
 * the repository and node_modules.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { render } from "@testing-library/react";
import type * as React from "react";
import { compile } from "tailwindcss";
import { beforeAll, describe, expect, it } from "vitest";
import type { MosaicArtifactChartRecharts } from "./MosaicArtifactChart.js";
import { MosaicArtifactChart } from "./MosaicArtifactChart.js";

const ROOT = process.cwd();
const require_ = createRequire(path.join(ROOT, "package.json"));

// ── Compile the shipped stylesheet ────────────────────────────────────────────

async function compileStyles(): Promise<string> {
  const entry = path.join(ROOT, "src/styles.css");
  const compiler = await compile(readFileSync(entry, "utf8"), {
    base: path.dirname(entry),
    loadStylesheet: async (id, base) => {
      const file = id.startsWith(".") ? path.resolve(base, id) : require_.resolve(id);
      return { path: file, base: path.dirname(file), content: readFileSync(file, "utf8") };
    },
  });
  return compiler.build([]);
}

type Decls = Map<string, string>;

/** selector text -> merged declarations, from every brace-free rule block. */
function parseRules(css: string): Map<string, Decls> {
  const rules = new Map<string, Decls>();
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = (m[1] ?? "").trim();
    const decls = rules.get(selector) ?? new Map<string, string>();
    for (const d of (m[2] ?? "").split(";")) {
      const i = d.indexOf(":");
      if (i > 0) decls.set(d.slice(0, i).trim(), d.slice(i + 1).trim());
    }
    rules.set(selector, decls);
  }
  return rules;
}

/** Custom properties in effect on <html> for a theme (dark rule overlays :root). */
function themeScope(rules: Map<string, Decls>, theme: "light" | "dark"): Decls {
  const scope: Decls = new Map();
  for (const [selector, decls] of rules) {
    if (selector.split(",").some((s) => s.trim() === ":root")) {
      for (const [k, v] of decls) scope.set(k, v);
    }
  }
  if (theme === "dark") {
    for (const [k, v] of rules.get('[data-theme="dark"]') ?? []) scope.set(k, v);
  }
  return scope;
}

class UndeclaredVariable extends Error {}

/** Resolve `var(--x, fallback)` against a scope. The fallback applies only when --x is undeclared, as in CSS. */
function resolve(value: string, scope: Decls, seen: string[] = []): string {
  const m = value.match(/^var\(\s*(--[a-z0-9-]+)\s*(?:,\s*(.+))?\)$/i);
  if (!m) return value.trim();
  const name = m[1] as string;
  const declared = scope.get(name);
  if (declared === undefined) {
    if (m[2] !== undefined) {
      // A fallback is a value the stylesheet did not supply — report it as such.
      throw new UndeclaredVariable(
        `${name} is not declared by src/styles.css (it would resolve to the hardcoded fallback ${m[2]})`,
      );
    }
    throw new UndeclaredVariable(`${name} is not declared by src/styles.css`);
  }
  if (seen.includes(name)) throw new Error(`cycle on ${name}`);
  return resolve(declared, scope, [...seen, name]);
}

// ── Capture the colours the chart actually hands to recharts ──────────────────

type P = { children?: React.ReactNode } & Record<string, unknown>;

function seriesColoursFor(type: "bar" | "line" | "pie"): string[] {
  const fills: string[] = [];
  const Pass = ({ children }: P) => <>{children}</>;
  const Leaf = (prop: "fill" | "stroke") => (p: P) => {
    fills.push(String(p[prop]));
    return null;
  };
  const stub = {
    BarChart: Pass,
    LineChart: Pass,
    PieChart: Pass,
    ResponsiveContainer: Pass,
    Pie: Pass,
    Bar: Leaf("fill"),
    Line: Leaf("stroke"),
    Cell: Leaf("fill"),
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  } as unknown as MosaicArtifactChartRecharts;

  // Five series (bar/line) or five slices (pie) — one colour per palette slot.
  const rows =
    type === "pie"
      ? ["a", "b", "c", "d", "e"].map((name) => ({ name, value: 1 }))
      : [{ x: "r", s1: 1, s2: 2, s3: 3, s4: 4, s5: 5 }];
  render(
    <MosaicArtifactChart
      data={{ title: "t", type, data: rows }}
      labels={{
        typeBadgeLabel: (t) => t,
        pointsLabel: (n) => String(n),
        unsupportedTypeMessage: (t) => t,
        unavailableMessage: "n/a",
      }}
      recharts={stub}
    />,
  );
  return fills;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MosaicArtifactChart follows the theme", () => {
  let rules: Map<string, Decls>;
  beforeAll(async () => {
    rules = parseRules(await compileStyles());
  });

  // Positive control: the instrument can read a declared variable in both themes.
  it("instrument control: resolves a known token in each theme", () => {
    expect(resolve("var(--mosaic-color-background)", themeScope(rules, "light"))).not.toBe(
      resolve("var(--mosaic-color-background)", themeScope(rules, "dark")),
    );
  });

  for (const type of ["bar", "line", "pie"] as const) {
    describe(`${type}`, () => {
      it("paints five series, each through a --color-chart-N variable", () => {
        const colours = seriesColoursFor(type);
        expect(colours).toHaveLength(5);
        colours.forEach((c, i) => {
          expect(c).toMatch(new RegExp(`^var\\(--color-chart-${i + 1}\\b`));
        });
      });

      it("every series variable is declared by the shipped stylesheet and resolves to a token colour, not a hex", () => {
        for (const theme of ["light", "dark"] as const) {
          const scope = themeScope(rules, theme);
          for (const c of seriesColoursFor(type)) {
            const resolved = resolve(c, scope);
            expect(resolved, `${c} in ${theme}`).toMatch(/^oklch\(/);
          }
        }
      });

      it("the five series are distinct within each theme", () => {
        for (const theme of ["light", "dark"] as const) {
          const scope = themeScope(rules, theme);
          const resolved = seriesColoursFor(type).map((c) => resolve(c, scope));
          expect(new Set(resolved).size, `${theme}: ${resolved.join(" | ")}`).toBe(5);
        }
      });

      it("each series colour differs between light and dark", () => {
        const light = themeScope(rules, "light");
        const dark = themeScope(rules, "dark");
        seriesColoursFor(type).forEach((c, i) => {
          expect(resolve(c, light), `series ${i + 1}`).not.toBe(resolve(c, dark));
        });
      });
    });
  }
});

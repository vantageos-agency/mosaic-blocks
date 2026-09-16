/**
 * theme-depth guard — the "relief and motion" contract.
 *
 * Context: three HeroUI theming trials were judged "flat, a mockup, no
 * relief, no animation". This suite defines relief and motion ONCE, as CSS
 * custom-property DATA in the shipped stylesheet, and proves it by PARSING
 * the real CSS the package ships — never a copy pasted into the test.
 *
 * Entry point: src/styles.css, followed through its real `@import` chain
 * (mosaic-tokens canonical values + this package's own theme/depth.css),
 * exactly as a consumer's bundler would resolve it. A missing or malformed
 * file is a loud, named failure — never a silent empty parse.
 *
 * Four contracts asserted:
 *   (i)   four distinct surface luminance steps per mode (page ground /
 *         sidebar / card / nested well), same relative ordering light+dark
 *   (ii)  three elevation levels, each a shadow token + a highlight-edge token
 *   (iii) motion tokens (durations, easings, entry preset, hover-lift preset),
 *         all zeroed/disabled under prefers-reduced-motion
 *   (iv)  accent + semantic success/danger/warning colours, declared in both
 *         light and dark
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve as resolvePath } from "node:path";
import { describe, expect, it } from "vitest";

const nodeRequire = createRequire(import.meta.url);
const root = resolvePath(import.meta.dirname, "..", "..");
const entryPoint = resolvePath(root, "src", "styles.css");

// ── CSS loader — follows the real @import chain, fails loudly ─────────────

function resolveImportSpecifier(specifier: string, fromFile: string): string {
  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    return resolvePath(dirname(fromFile), specifier);
  }
  try {
    return nodeRequire.resolve(specifier);
  } catch (err) {
    throw new Error(
      `theme-depth.test.ts: could not resolve @import "${specifier}" from "${fromFile}" — ` +
        `is the package installed? (${(err as Error).message})`,
    );
  }
}

function stripCssComments(text: string): string {
  // Comments can legitimately mention "@import ..." as documentation (see
  // styles.css line 1) — they must never be read as a real import directive.
  return text.replace(/\/\*[\s\S]*?\*\//g, "");
}

function loadCssRecursive(filePath: string, visited: Set<string> = new Set()): string {
  if (visited.has(filePath)) return "";
  visited.add(filePath);

  let rawText: string;
  try {
    rawText = readFileSync(filePath, "utf-8");
  } catch (err) {
    throw new Error(
      `theme-depth.test.ts: could not read CSS file "${filePath}" — ${(err as Error).message}`,
    );
  }
  const text = stripCssComments(rawText);

  const importRe = /@import\s+(?:url\()?["']([^"']+)["']\)?\s*;/g;
  let out = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard exec loop
  while ((match = importRe.exec(text))) {
    out += text.slice(lastIndex, match.index);
    const resolved = resolveImportSpecifier(match[1], filePath);
    out += loadCssRecursive(resolved, visited);
    lastIndex = importRe.lastIndex;
  }
  out += text.slice(lastIndex);
  return out;
}

function loadShippedCss(): string {
  const css = loadCssRecursive(entryPoint);
  if (css.trim().length < 200) {
    throw new Error(
      `theme-depth.test.ts: parsed CSS from "${entryPoint}" is suspiciously short ` +
        `(${css.trim().length} chars) — the @import chain likely resolved to near-nothing.`,
    );
  }
  return css;
}

// ── Block extraction — brace-matched, so nested @media / rules are safe ───

function collectAllBlocks(css: string, selectorPattern: RegExp): string {
  const re = new RegExp(selectorPattern.source, "g");
  let result = "";
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard exec loop
  while ((match = re.exec(css))) {
    const braceStart = css.indexOf("{", match.index);
    if (braceStart === -1) continue;
    let depth = 1;
    let i = braceStart + 1;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    result += `${css.slice(braceStart + 1, i - 1)}\n`;
    re.lastIndex = i;
  }
  return result;
}

const LIGHT_ROOT = /:root\s*\{/;
const DARK_ROOT = /\[data-theme=["']dark["']\]\s*\{/;
const REDUCED_MOTION = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/;

function extractCustomProp(block: string, name: string): string | null {
  const re = new RegExp(`${escapeRegExp(name)}\\s*:\\s*([^;]+);`);
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractOklchL(value: string): number {
  const m = value.match(/oklch\(\s*([0-9.]+)/);
  if (!m) {
    throw new Error(`theme-depth.test.ts: could not parse an OKLCH lightness out of "${value}"`);
  }
  return Number.parseFloat(m[1]);
}

// ── Fixture: load once for the whole suite ─────────────────────────────────

const css = loadShippedCss();
const lightBlock = collectAllBlocks(css, LIGHT_ROOT);
const darkBlock = collectAllBlocks(css, DARK_ROOT);
const reducedMotionBlock = collectAllBlocks(css, REDUCED_MOTION);

if (lightBlock.trim().length === 0) {
  throw new Error('theme-depth.test.ts: no ":root { ... }" block found in the shipped CSS.');
}
if (darkBlock.trim().length === 0) {
  throw new Error(
    "theme-depth.test.ts: no '[data-theme=\"dark\"] { ... }' block found in the shipped CSS.",
  );
}

// ── (i) surface ladder — four distinct luminance steps, ordered consistently ─

describe("surface ladder — page ground / sidebar / card / nested well", () => {
  const SURFACE_NAMES = [
    "--mosaic-surface-ground",
    "--mosaic-surface-sidebar",
    "--mosaic-surface-card",
    "--mosaic-surface-well",
  ];

  function readSurfaceLuminances(block: string, modeLabel: string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const name of SURFACE_NAMES) {
      const raw = extractCustomProp(block, name);
      if (raw === null) {
        throw new Error(
          `theme-depth.test.ts: surface token "${name}" is not declared in the ${modeLabel} block.`,
        );
      }
      out[name] = extractOklchL(raw);
    }
    return out;
  }

  it("declares four DISTINCT surface luminance steps in light mode", () => {
    const values = readSurfaceLuminances(lightBlock, "light (:root)");
    const distinct = new Set(Object.values(values));
    expect(distinct.size, `expected 4 distinct L values, got: ${JSON.stringify(values)}`).toBe(4);
  });

  it("declares four DISTINCT surface luminance steps in dark mode", () => {
    const values = readSurfaceLuminances(darkBlock, 'dark ([data-theme="dark"])');
    const distinct = new Set(Object.values(values));
    expect(distinct.size, `expected 4 distinct L values, got: ${JSON.stringify(values)}`).toBe(4);
  });

  it("orders the four surface steps the SAME way in light and dark", () => {
    const light = readSurfaceLuminances(lightBlock, "light (:root)");
    const dark = readSurfaceLuminances(darkBlock, 'dark ([data-theme="dark"])');
    const rank = (values: Record<string, number>) =>
      [...SURFACE_NAMES].sort((a, b) => values[a] - values[b]);
    expect(rank(dark), "dark-mode surface ranking diverges from light-mode ranking").toEqual(
      rank(light),
    );
  });

  // ── Wave-1 T5 reopen defect 4 ────────────────────────────────────────────
  // "distinct" alone let ground/card sit only 0.06 apart in dark mode — the
  // pilot's screenshot showed cards "barely separating from the page
  // ground". A dark-mode box-shadow barely reads on a dark background, so
  // the ground↔card luminance gap itself has to carry more of the relief.

  it("keeps a real (not just technically-distinct) luminance gap between dark-mode ground and card", () => {
    const dark = readSurfaceLuminances(darkBlock, 'dark ([data-theme="dark"])');
    const gap = dark["--mosaic-surface-card"] - dark["--mosaic-surface-ground"];
    expect(gap, `ground/card gap too small to read as relief: ${gap}`).toBeGreaterThanOrEqual(0.08);
  });
});

// ── (ii) elevation — three levels, each shadow + highlight edge ────────────

describe("elevation — three levels, shadow + highlight edge", () => {
  for (const level of [1, 2, 3] as const) {
    it(`declares a shadow AND a highlight-edge token for elevation level ${level}`, () => {
      const shadowName = `--mosaic-elevation-${level}-shadow`;
      const highlightName = `--mosaic-elevation-${level}-highlight`;
      const shadow = extractCustomProp(css, shadowName);
      const highlight = extractCustomProp(css, highlightName);
      if (shadow === null) {
        throw new Error(
          `theme-depth.test.ts: "${shadowName}" is not declared anywhere in the shipped CSS.`,
        );
      }
      if (highlight === null) {
        throw new Error(
          `theme-depth.test.ts: "${highlightName}" is not declared anywhere in the shipped CSS.`,
        );
      }
      expect(shadow.toLowerCase()).not.toBe("none");
      expect(highlight.toLowerCase()).not.toBe("none");
    });
  }

  it("gives each elevation level a visually distinct shadow spread", () => {
    const shadows = [1, 2, 3].map((level) => {
      const raw = extractCustomProp(css, `--mosaic-elevation-${level}-shadow`);
      if (raw === null) throw new Error(`theme-depth.test.ts: elevation ${level} shadow missing.`);
      return raw;
    });
    expect(
      new Set(shadows).size,
      `elevation shadows are not distinct: ${JSON.stringify(shadows)}`,
    ).toBe(3);
  });
});

// ── (iii) motion — durations, easings, presets, reduced-motion zeroing ─────

describe("motion tokens", () => {
  it("declares non-zero default entry and hover durations", () => {
    const entry = extractCustomProp(css, "--mosaic-motion-duration-entry");
    const hover = extractCustomProp(css, "--mosaic-motion-duration-hover");
    if (entry === null) {
      throw new Error('theme-depth.test.ts: "--mosaic-motion-duration-entry" is not declared.');
    }
    if (hover === null) {
      throw new Error('theme-depth.test.ts: "--mosaic-motion-duration-hover" is not declared.');
    }
    expect(entry).not.toBe("0ms");
    expect(hover).not.toBe("0ms");
  });

  it("declares entry and hover easing curves", () => {
    const entryEasing = extractCustomProp(css, "--mosaic-motion-easing-entry");
    const hoverEasing = extractCustomProp(css, "--mosaic-motion-easing-hover");
    if (entryEasing === null) {
      throw new Error('theme-depth.test.ts: "--mosaic-motion-easing-entry" is not declared.');
    }
    if (hoverEasing === null) {
      throw new Error('theme-depth.test.ts: "--mosaic-motion-easing-hover" is not declared.');
    }
    expect(entryEasing.length).toBeGreaterThan(0);
    expect(hoverEasing.length).toBeGreaterThan(0);
  });

  it("ships an entry preset class using an animation", () => {
    const re = /\.mosaic-motion-entry\s*\{([^}]*)\}/;
    const m = css.match(re);
    if (!m) {
      throw new Error('theme-depth.test.ts: no ".mosaic-motion-entry" preset class found.');
    }
    expect(m[1]).toMatch(/animation:/);
  });

  it("ships a hover-lift preset class using a transition", () => {
    const re = /\.mosaic-motion-hover-lift\s*\{([^}]*)\}/;
    const m = css.match(re);
    if (!m) {
      throw new Error('theme-depth.test.ts: no ".mosaic-motion-hover-lift" preset class found.');
    }
    expect(m[1]).toMatch(/transition:/);
  });

  it("zeroes or disables every motion preset under prefers-reduced-motion", () => {
    if (reducedMotionBlock.trim().length === 0) {
      throw new Error(
        'theme-depth.test.ts: no "@media (prefers-reduced-motion: reduce) { ... }" block found in the shipped CSS.',
      );
    }

    const durationsZeroed =
      /--mosaic-motion-duration-entry\s*:\s*0ms\s*;/.test(reducedMotionBlock) &&
      /--mosaic-motion-duration-hover\s*:\s*0ms\s*;/.test(reducedMotionBlock);

    const entryMatch = reducedMotionBlock.match(/\.mosaic-motion-entry\s*\{([^}]*)\}/);
    const hoverMatch = reducedMotionBlock.match(/\.mosaic-motion-hover-lift\s*\{([^}]*)\}/);
    const presetsDisabled =
      !!entryMatch &&
      /animation:\s*none/.test(entryMatch[1]) &&
      !!hoverMatch &&
      /transition:\s*none/.test(hoverMatch[1]);

    expect(
      durationsZeroed || presetsDisabled,
      "prefers-reduced-motion block neither zeroes the duration tokens nor disables the preset classes",
    ).toBe(true);
  });
});

// ── (iv) accent + semantic success/danger/warning, both modes ──────────────

describe("accent + semantic colours (success / danger / warning)", () => {
  const SEMANTIC_TOKENS = [
    "--mosaic-color-accent",
    "--mosaic-color-success-500",
    "--mosaic-color-danger-500",
    "--mosaic-color-warning-500",
  ];

  for (const name of SEMANTIC_TOKENS) {
    it(`"${name}" is declared in BOTH light and dark`, () => {
      const light = extractCustomProp(lightBlock, name);
      const dark = extractCustomProp(darkBlock, name);
      if (light === null) {
        throw new Error(
          `theme-depth.test.ts: "${name}" is not declared in the light (:root) block.`,
        );
      }
      if (dark === null) {
        throw new Error(
          `theme-depth.test.ts: "${name}" is not declared in the dark ([data-theme="dark"]) block.`,
        );
      }
    });
  }

  it("exposes danger as a consumer-facing Tailwind utility token (like success and warning)", () => {
    const danger = extractCustomProp(css, "--color-danger-500");
    if (danger === null) {
      throw new Error(
        'theme-depth.test.ts: "--color-danger-500" is not wired into the @theme inline block ' +
          "(success and warning already are — danger is the gap this task closes).",
      );
    }
  });
});

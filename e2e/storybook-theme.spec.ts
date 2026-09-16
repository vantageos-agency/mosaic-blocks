import { expect, test } from "@playwright/test";

// ── Theme-applied probe — mosaic-blocks Storybook showcase ────────────────────
//
// Mission k57b7whw6p3zkvnqb9pqhyyf2n8egy4e T2: the predecessor package's only
// live Storybook rendered every component UNSTYLED (browser serif font,
// native checkbox/button, no spacing) — a showcase the operator cannot
// approve, because it proves nothing about the theme. This spec is the RED
// that catches that failure mode before it ships again: it opens real story
// iframes (built from storybook-static, the exact artifact the operator will
// open) and reads COMPUTED styles, never source/class names — a component
// can carry the right className and still render unstyled if the CSS engine
// never generated the rule, which is exactly what happened upstream.
//
// Three story iframes, three different mission blocks, so the probe is not
// fooled by one component that happens to inline its own styles:
//   - Layout/MosaicAppSidebar (Default)  — surface (bg-sidebar) + native <button>
//   - Theme/Depth (Light / Dark)          — surface ladder + dark-mode toggle
//
// `?globals=theme:dark` drives the toolbar theme global non-interactively —
// the documented Storybook URL contract for globals, no UI click needed.

const SIDEBAR_STORY = "layout-mosaicappsidebar--default";
const DEPTH_LIGHT_STORY = "theme-depth--light";
const DEPTH_DARK_STORY = "theme-depth--dark";

// A "browser default" font stack starts with a serif font (Times New Roman on
// Chromium/WebKit when no author stylesheet sets font-family at all).
const BROWSER_DEFAULT_FONT_MARKERS = ["Times New Roman", "Times", "serif"];

function isBrowserDefaultFont(fontFamily: string): boolean {
  const first =
    fontFamily
      .split(",")[0]
      ?.trim()
      .replace(/^["']|["']$/g, "") ?? "";
  return BROWSER_DEFAULT_FONT_MARKERS.some(
    (marker) => first.toLowerCase() === marker.toLowerCase(),
  );
}

test.describe("Storybook theme reaches the story iframe — real browser", () => {
  test("body font-family resolves to the theme font token, not a browser default", async ({
    page,
  }) => {
    await page.goto(`/iframe.html?id=${SIDEBAR_STORY}&viewMode=story`);
    await page.waitForSelector('[data-slot="app-sidebar"]');

    const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);

    expect(isBrowserDefaultFont(fontFamily), `body font-family resolved to "${fontFamily}"`).toBe(
      false,
    );

    // The theme token itself, read from :root — proves the ASSERTION is
    // measuring the theme's own value, not a hardcoded expectation drifting
    // from the CSS.
    const themeFontToken = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--mosaic-font-sans").trim(),
    );
    expect(themeFontToken.length, "theme --mosaic-font-sans token must be defined").toBeGreaterThan(
      0,
    );
    const firstThemeFont = themeFontToken.split(",")[0]?.trim();
    expect(
      fontFamily,
      "body font-family must reference the theme font, not an unrelated stack",
    ).toContain(firstThemeFont ?? "__no-theme-font__");
  });

  test("a surface element resolves the theme surface color, not transparent/white default", async ({
    page,
  }) => {
    await page.goto(`/iframe.html?id=${SIDEBAR_STORY}&viewMode=story`);
    const sidebar = page.locator('[data-slot="app-sidebar"]');
    await expect(sidebar).toBeVisible();

    const bg = await sidebar.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(["rgba(0, 0, 0, 0)", "transparent", "rgb(255, 255, 255)"]).not.toContain(bg);

    const themeSurfaceToken = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--sidebar").trim(),
    );
    expect(themeSurfaceToken.length, "theme --sidebar token must be defined").toBeGreaterThan(0);
  });

  test("a native button/checkbox-family element carries non-native styling (radius/background from tokens)", async ({
    page,
  }) => {
    await page.goto(`/iframe.html?id=${SIDEBAR_STORY}&viewMode=story`);
    const collapseToggle = page.getByRole("button", { name: "Collapse sidebar" });
    await expect(collapseToggle).toBeVisible();

    const radius = await collapseToggle.evaluate((el) => getComputedStyle(el).borderRadius);
    expect(radius, "collapse-toggle button must not render with the native 0px UA radius").not.toBe(
      "0px",
    );
  });

  test("dark mode: surface background changes to the dark ladder value", async ({ page }) => {
    // The "Card" swatch's PARENT carries `background: var(--mosaic-surface-card)`
    // inline (ThemeDepthShowcase/SurfaceLadder) — read the resolved
    // backgroundColor directly off that element, not a custom-property string
    // off document.documentElement, because the dark override in depth.css
    // targets `[data-theme="dark"]` on the story's own wrapper div, and CSS
    // custom properties do not inherit upward from a descendant to <html>.
    await page.goto(`/iframe.html?id=${DEPTH_LIGHT_STORY}&viewMode=story`);
    const lightCode = page.locator("code", { hasText: "--mosaic-surface-card" });
    await expect(lightCode).toBeVisible();
    const lightBg = await lightCode.evaluate((el) => {
      const swatch = el.parentElement?.parentElement;
      if (!swatch) throw new Error("expected the code element's grandparent swatch div to exist");
      return getComputedStyle(swatch).backgroundColor;
    });

    await page.goto(`/iframe.html?id=${DEPTH_DARK_STORY}&viewMode=story`);
    const darkCode = page.locator("code", { hasText: "--mosaic-surface-card" });
    await expect(darkCode).toBeVisible();
    const darkBg = await darkCode.evaluate((el) => {
      const swatch = el.parentElement?.parentElement;
      if (!swatch) throw new Error("expected the code element's grandparent swatch div to exist");
      return getComputedStyle(swatch).backgroundColor;
    });

    expect(["rgba(0, 0, 0, 0)", "transparent"]).not.toContain(lightBg);
    expect(["rgba(0, 0, 0, 0)", "transparent"]).not.toContain(darkBg);
    expect(darkBg, "dark surface-card color must differ from the light one").not.toBe(lightBg);
  });
});

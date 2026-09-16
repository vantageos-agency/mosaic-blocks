// scripts/showcase-screenshots.mjs — one-off screenshot capture for the
// operator's approval showcase (mission k57b7whw6p3zkvnqb9pqhyyf2n8egy4e T2).
// NOT part of the CI test suite — a manual/CI-triggered capture pass, driven
// against the already-built storybook-static via the SAME http-server the
// playwright.config.ts webServer uses. Run:
//   pnpm build-storybook --quiet && pnpm exec http-server storybook-static -p 6417 -s &
//   node scripts/showcase-screenshots.mjs

import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASE_URL = "http://127.0.0.1:6417";
const OUT_DIR = "showcase-screenshots";

const MISSION_BLOCK_STORIES = [
  ["MosaicAppSidebar", "layout-mosaicappsidebar--default"],
  ["MosaicStatsGrid", "blocks-mosaicstatsgrid--default"],
  ["MosaicArtifactChart", "blocks-mosaicartifactchart--revenus-locatifs"],
  ["MosaicDataTable", "blocks-mosaicdatatable--baux-en-cours"],
  ["MosaicDrawer", "blocks-mosaicdrawer--detail-du-bail"],
  ["MosaicPdfViewer", "blocks-mosaicpdfviewer--contrat-de-bail"],
  ["MosaicResizableSplitPane", "blocks-mosaicresizablesplitpane--liste-et-apercu"],
  ["MosaicCard", "blocks-mosaiccard--annonce-bien"],
  ["MosaicEmptyState", "blocks-mosaicemptystate--aucun-bail-en-attente"],
  ["MosaicSkeleton", "blocks-mosaicskeleton--chargement-fiche-bail"],
];

const PAGE_STORIES = [
  ["Dashboard", "pages-dashboard--default"],
  ["BauxDuMois", "pages-baux-du-mois--default"],
];

const VIEWPORTS = [
  ["desktop1440", { width: 1440, height: 900 }],
  ["phone390", { width: 390, height: 844 }],
];

const THEMES = ["light", "dark"];

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const files = [];

  for (const [slug, storyId] of [...MISSION_BLOCK_STORIES, ...PAGE_STORIES]) {
    for (const theme of THEMES) {
      for (const [vpSlug, viewport] of VIEWPORTS) {
        const page = await browser.newPage({ viewport });
        const url = `${BASE_URL}/iframe.html?id=${storyId}&viewMode=story&globals=theme:${theme}`;
        await page.goto(url, { waitUntil: "networkidle" });
        await page.waitForTimeout(150); // settle entry animations
        const fileName = `${slug}--${theme}--${vpSlug}.png`;
        const filePath = `${OUT_DIR}/${fileName}`;
        await page.screenshot({ path: filePath, fullPage: true });
        files.push(filePath);
        await page.close();
        console.log(`captured ${filePath}`);
      }
    }
  }

  await browser.close();
  console.log(`\n${files.length} screenshots written to ${OUT_DIR}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

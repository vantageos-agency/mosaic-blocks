import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // Declared, not inherited: vitest's implicit 5000 ms default is a number nobody
    // chose here. Under host load (a run at load 24 failed 1 test with no record of
    // which) a jsdom render test crossing it fails non-deterministically and looks
    // like a real regression. 15000 ms = ~10x the slowest test measured in a full
    // verbose run (1422 ms, MosaicSelect "opens popup on click"): headroom for load,
    // still tight enough that a genuinely slow test surfaces rather than hides.
    testTimeout: 15000,
    hookTimeout: 15000,
    setupFiles: ["./src/test-setup.ts"],
    // `src/__tests__/derived/` asserts that the DERIVED docs (README + catalog
    // counts) match src/index.ts. The release-artifacts guard forbids a PR from
    // hand-editing those counts, so running this suite inside the plain
    // `pnpm test` made every export-adding PR unmergeable (the guard forbids
    // touching the counts, the suite demands they be touched).
    //
    // The suite is NOT dropped — it has its own config (vitest.derived.config.ts)
    // and `pnpm gate:local` runs it through the derive-release-artifacts job's
    // check steps in ci.yml (GitHub Actions is off, so nothing runs it in CI).
    // `e2e/**` holds real-browser Playwright specs (playwright.config.ts),
    // deliberately outside jsdom/src/test-setup.ts — see e2e/selector-modal.spec.ts.
    // Vitest's default glob (**/*.spec.ts) would otherwise pick these up and
    // fail on Playwright's own test.describe() runtime guard.
    exclude: ["**/node_modules/**", "**/dist/**", "src/__tests__/derived/**", "e2e/**"],
  },
});

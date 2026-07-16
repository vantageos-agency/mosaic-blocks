import { defineConfig, devices } from "@playwright/test";

// ── Real-browser test config (Playwright + Chromium) ──────────────────────────
//
// Deliberately SEPARATE from vitest.config.ts / src/test-setup.ts. Components
// that depend on the native <dialog> element (showModal()/close()) cannot be
// trusted from jsdom: jsdom has no showModal() implementation, so
// src/test-setup.ts installs a polyfill that unconditionally sets the `open`
// attribute — it can never fail, so it can never catch the real-browser
// failure mode (showModal() throwing, dialog never opening).
//
// This config serves the Storybook static build (built from the SAME
// component source, zero extra mounting harness) over an ephemeral HTTP
// server and drives it with a real Chromium instance. No jsdom, no
// src/test-setup.ts, no polyfill in the loop at any point.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  webServer: {
    command: "pnpm build-storybook --quiet && pnpm exec http-server storybook-static -p 6417 -s",
    url: "http://127.0.0.1:6417",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  use: {
    baseURL: "http://127.0.0.1:6417",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
});

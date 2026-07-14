import { expect, test } from "@playwright/test";

// ── Real-browser dialog test — MosaicSelectorModal ────────────────────────────
//
// Reproduces the real-world usage: mount the component via its Storybook
// story (built from the same source as the published bundle, no test-only
// mounting scaffold), click the trigger, and assert that a native <dialog>
// with the implicit role="dialog" is actually visible.
//
// This test loads storybook-static/iframe.html directly. It does NOT import
// vitest.config.ts, does NOT load src/test-setup.ts, and runs in real
// Chromium — so HTMLDialogElement.prototype.showModal() is the browser's own
// implementation, never the jsdom polyfill that can never fail.
const STORY_ID = "components-mosaicselectormodal--default";

test.describe("MosaicSelectorModal — real browser", () => {
  test("opens a visible role=dialog after the trigger is clicked", async ({ page }) => {
    await page.goto(`/iframe.html?id=${STORY_ID}&viewMode=story`);

    const trigger = page.getByRole("button", { name: "Select Frameworks" });
    await expect(trigger).toBeVisible();

    // No dialog before the click.
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await trigger.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText("Select Framework");
  });
});

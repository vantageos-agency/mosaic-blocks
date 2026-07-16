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

  // ── Escape must run the APP's close path, not merely the browser's ────────
  //
  // WHY THE OBVIOUS ASSERTION IS VACUOUS — measured, not reasoned:
  // asserting only "the dialog is gone after Escape" PASSES even when the
  // component's `cancel` -> onClose wiring is severed, because a native modal
  // <dialog> closes itself on Escape regardless. The first version of this test
  // did exactly that and stayed GREEN on a mutant with the listener removed —
  // a test that passes for the wrong reason.
  //
  // The observable difference is REOPENING. The story owns `open` state and the
  // component only calls showModal on an isOpen transition:
  //   listener intact  -> onClose sets open=false; clicking the trigger flips it
  //                       back to true and the dialog REOPENS.
  //   listener severed -> the browser closed the dialog but `open` stayed true;
  //                       clicking the trigger is a no-op transition and the
  //                       dialog NEVER reopens. That is the real user-visible
  //                       bug: the modal becomes permanently unopenable.
  test("Escape runs the app's close path — the dialog can be reopened afterwards", async ({
    page,
  }) => {
    await page.goto(`/iframe.html?id=${STORY_ID}&viewMode=story`);

    const trigger = page.getByRole("button", { name: "Select Frameworks" });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 5_000 });

    // The assertion that actually distinguishes the app's close path from the
    // browser's own: state must have been reset, so this reopens.
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
  });
});

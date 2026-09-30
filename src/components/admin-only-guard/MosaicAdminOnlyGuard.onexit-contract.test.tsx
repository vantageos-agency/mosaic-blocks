/**
 * `onExit` contract: invoked by the exit button's click and by nothing else.
 * The prop doc once promised an automatic call when permissions finish loading;
 * the code never made it. This test makes the documented behaviour enforceable.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicAdminOnlyGuard } from "./MosaicAdminOnlyGuard.js";

function renderDenied(isLoaded: boolean) {
  const onExit = vi.fn();
  const ui = (loaded: boolean) => (
    <MosaicAdminOnlyGuard
      isAdmin={false}
      isLoaded={loaded}
      title="Admin Access Required"
      description="Only administrators."
      requiredRoleLabel="Required role: Admin"
      onExit={onExit}
      exitLabel="Back to Dashboard"
      exitAriaLabel="Back to Dashboard"
    >
      <div>Protected</div>
    </MosaicAdminOnlyGuard>
  );
  const utils = render(ui(isLoaded));
  return { ...utils, onExit, ui };
}

describe("MosaicAdminOnlyGuard onExit contract", () => {
  it("does not call onExit on render of the denied state, and calls it exactly once on click", () => {
    const { onExit } = renderDenied(true);
    expect(onExit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Back to Dashboard" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("does not call onExit when permissions finish loading (loading -> denied transition)", () => {
    const { onExit, rerender, ui } = renderDenied(false);
    expect(onExit).not.toHaveBeenCalled();
    rerender(ui(true));
    expect(screen.getByText("Admin Access Required")).toBeTruthy();
    expect(onExit).not.toHaveBeenCalled();
  });
});

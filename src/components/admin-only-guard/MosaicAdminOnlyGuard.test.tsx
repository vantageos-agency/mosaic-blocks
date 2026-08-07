import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicAdminOnlyGuard } from "./MosaicAdminOnlyGuard.js";

const protectedText = "Protected admin content";

function renderGuard(
  overrides: Partial<{ isAdmin: boolean; isLoaded: boolean }> = {},
  withExit = true,
) {
  const onExit = vi.fn();
  const exitProps = withExit
    ? { onExit, exitLabel: "Back to Dashboard", exitAriaLabel: "Back to Dashboard" }
    : {};
  const utils = render(
    <MosaicAdminOnlyGuard
      isAdmin={overrides.isAdmin ?? true}
      isLoaded={overrides.isLoaded ?? true}
      title="Admin Access Required"
      description="This page is only accessible to organization administrators."
      requiredRoleLabel="Required role: Admin"
      {...exitProps}
    >
      <div>{protectedText}</div>
    </MosaicAdminOnlyGuard>,
  );
  return { ...utils, onExit };
}

describe("MosaicAdminOnlyGuard", () => {
  it("renders children when isAdmin is true and isLoaded is true", () => {
    renderGuard({ isAdmin: true, isLoaded: true });
    expect(screen.getByText(protectedText)).toBeTruthy();
    expect(screen.queryByText("Admin Access Required")).toBeNull();
  });

  it("renders the access-denied card and not children when isAdmin is false", () => {
    renderGuard({ isAdmin: false, isLoaded: true });
    expect(screen.queryByText(protectedText)).toBeNull();
    expect(screen.getByText("Admin Access Required")).toBeTruthy();
    expect(screen.getByText("Required role: Admin")).toBeTruthy();
  });

  it("calls onExit when the exit button is clicked on the denied state", () => {
    const { onExit } = renderGuard({ isAdmin: false, isLoaded: true });
    fireEvent.click(screen.getByRole("button", { name: "Back to Dashboard" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("renders loadingFallback and neither children nor the denied card when isLoaded is false", () => {
    render(
      <MosaicAdminOnlyGuard
        isAdmin={false}
        isLoaded={false}
        title="Admin Access Required"
        description="Denied description"
        requiredRoleLabel="Required role: Admin"
        loadingFallback={<div>Custom loading…</div>}
      >
        <div>{protectedText}</div>
      </MosaicAdminOnlyGuard>,
    );
    expect(screen.getByText("Custom loading…")).toBeTruthy();
    expect(screen.queryByText(protectedText)).toBeNull();
    expect(screen.queryByText("Admin Access Required")).toBeNull();
  });

  it("renders the default spinner fallback when isLoaded is false and no loadingFallback is supplied", () => {
    render(
      <MosaicAdminOnlyGuard
        isAdmin={false}
        isLoaded={false}
        title="Admin Access Required"
        description="Denied description"
        requiredRoleLabel="Required role: Admin"
      >
        <div>{protectedText}</div>
      </MosaicAdminOnlyGuard>,
    );
    expect(screen.getByRole("status", { name: "loading" })).toBeTruthy();
  });

  it("renders no exit button when onExit is not provided (read-only denied state)", () => {
    renderGuard({ isAdmin: false, isLoaded: true }, false);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Admin Access Required")).toBeTruthy();
  });

  it("exposes a distinctive accessible name on the exit button reflecting the host label", () => {
    const onExit = vi.fn();
    render(
      <MosaicAdminOnlyGuard
        isAdmin={false}
        isLoaded={true}
        title="Admin Access Required"
        description="Denied description"
        requiredRoleLabel="Required role: Admin"
        onExit={onExit}
        exitLabel="Retour au tableau de bord"
        exitAriaLabel="Retour au tableau de bord"
      >
        <div>{protectedText}</div>
      </MosaicAdminOnlyGuard>,
    );
    expect(screen.getByRole("button", { name: "Retour au tableau de bord" })).toBeTruthy();
  });
});

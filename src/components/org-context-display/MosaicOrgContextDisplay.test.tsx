import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicOrgContextDisplay } from "./MosaicOrgContextDisplay.js";
import type { MosaicOrgContextInfo } from "./MosaicOrgContextDisplay.js";

const acme: MosaicOrgContextInfo = {
  id: "org-1",
  name: "Acme Corp",
  memberCount: 12,
  role: "admin",
};

const globex: MosaicOrgContextInfo = {
  id: "org-2",
  name: "Globex",
  memberCount: 3,
  role: "member",
};

function wrap(children: React.ReactNode) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

function renderSwitchable(overrides: Partial<{ org: MosaicOrgContextInfo }> = {}) {
  const onSwitchOrg = vi.fn();
  const utils = render(
    wrap(
      <MosaicOrgContextDisplay
        org={overrides.org ?? acme}
        roleLabel="Admin"
        roleDescription="Full access"
        memberCountLabel={(count) => `${count} members`}
        onSwitchOrg={onSwitchOrg}
        switchAriaLabel={`Switch organization, current: ${(overrides.org ?? acme).name}`}
      />,
    ),
  );
  return { ...utils, onSwitchOrg };
}

function renderReadOnly(org: MosaicOrgContextInfo = acme) {
  return render(
    wrap(
      <MosaicOrgContextDisplay
        org={org}
        roleLabel="Admin"
        roleDescription="Full access"
        memberCountLabel={(count) => `${count} members`}
      />,
    ),
  );
}

describe("MosaicOrgContextDisplay", () => {
  it("renders the active organization's name, role label and member count", () => {
    renderSwitchable();
    expect(screen.getByText("Acme Corp")).toBeTruthy();
    expect(screen.getByText("Admin")).toBeTruthy();
    expect(screen.getByText("12 members")).toBeTruthy();
  });

  it("calls onSwitchOrg when the control is activated", () => {
    const { onSwitchOrg } = renderSwitchable();
    fireEvent.click(
      screen.getByRole("button", { name: "Switch organization, current: Acme Corp" }),
    );
    expect(onSwitchOrg).toHaveBeenCalledTimes(1);
  });

  it("exposes a distinctive accessible name reflecting which org is active", () => {
    const { rerender, onSwitchOrg: _unused } = renderSwitchable({ org: acme });
    expect(
      screen.getByRole("button", { name: "Switch organization, current: Acme Corp" }),
    ).toBeTruthy();
    rerender(
      wrap(
        <MosaicOrgContextDisplay
          org={globex}
          roleLabel="Member"
          roleDescription="Standard access"
          memberCountLabel={(count) => `${count} members`}
          onSwitchOrg={vi.fn()}
          switchAriaLabel="Switch organization, current: Globex"
        />,
      ),
    );
    expect(
      screen.getByRole("button", { name: "Switch organization, current: Globex" }),
    ).toBeTruthy();
  });

  it("renders as a non-interactive display when onSwitchOrg is not provided (read-only variant)", () => {
    renderReadOnly();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Acme Corp")).toBeTruthy();
  });

  it("updates the rendered name, role and member count on org switch (host re-renders with new org prop)", () => {
    const { rerender } = renderSwitchable({ org: acme });
    expect(screen.getByText("Acme Corp")).toBeTruthy();
    rerender(
      wrap(
        <MosaicOrgContextDisplay
          org={globex}
          roleLabel="Member"
          roleDescription="Standard access"
          memberCountLabel={(count) => `${count} members`}
          onSwitchOrg={vi.fn()}
          switchAriaLabel="Switch organization, current: Globex"
        />,
      ),
    );
    expect(screen.queryByText("Acme Corp")).toBeNull();
    expect(screen.getByText("Globex")).toBeTruthy();
    expect(screen.getByText("3 members")).toBeTruthy();
    expect(screen.getByText("Member")).toBeTruthy();
  });

  it("marks the role label with a title tooltip via roleDescription", () => {
    renderSwitchable();
    expect(screen.getByTitle("Full access")).toBeTruthy();
  });
});

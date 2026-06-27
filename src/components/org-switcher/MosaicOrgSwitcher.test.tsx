import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MosaicOrgSwitcher } from "./MosaicOrgSwitcher.js";

const orgs = [
  { id: "org-1", name: "Acme Corp", slug: "acme" },
  { id: "org-2", name: "Beta LLC", slug: "beta" },
];

describe("MosaicOrgSwitcher", () => {
  it("renders current org name", () => {
    render(<MosaicOrgSwitcher organizations={orgs} currentOrgId="org-1" onSelectOrg={() => {}} />);
    expect(screen.getByText("Acme Corp")).toBeTruthy();
  });

  it("opens dropdown and shows all orgs on trigger click", async () => {
    render(<MosaicOrgSwitcher organizations={orgs} currentOrgId="org-1" onSelectOrg={() => {}} />);
    const trigger = screen.getByRole("button");
    await userEvent.click(trigger);
    expect(screen.getByText("Beta LLC")).toBeTruthy();
  });

  it("calls onSelectOrg when an org is selected", async () => {
    const onSelect = vi.fn();
    render(<MosaicOrgSwitcher organizations={orgs} currentOrgId="org-1" onSelectOrg={onSelect} />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByText("Beta LLC"));
    expect(onSelect).toHaveBeenCalledWith("org-2");
  });

  it("renders create org button when onCreateOrg provided", async () => {
    render(
      <MosaicOrgSwitcher
        organizations={orgs}
        currentOrgId="org-1"
        onSelectOrg={() => {}}
        onCreateOrg={() => {}}
        createOrgLabel="New Organization"
      />,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("New Organization")).toBeTruthy();
  });

  it("renders without organizations without error", () => {
    expect(() =>
      render(<MosaicOrgSwitcher organizations={[]} onSelectOrg={() => {}} />),
    ).not.toThrow();
  });
});

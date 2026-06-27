import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import {
  MosaicCreateOrgDialog,
  MosaicInviteMemberDialog,
  MosaicMemberList,
  MosaicMultiOrgIndicator,
  MosaicOrgPanel,
  MosaicOrgRoleBadge,
} from "./MosaicOrgPanel.js";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const org = {
  id: "org-1",
  name: "Acme Corp",
  slug: "acme",
  description: "Building amazing things",
  stats: { totalMembers: 12 },
};

const members = [
  { id: "m1", name: "Alice", email: "alice@acme.com", role: "admin" as const },
  { id: "m2", name: "Bob", email: "bob@acme.com", role: "member" as const },
];

describe("MosaicOrgPanel", () => {
  it("renders org name", () => {
    render(
      <Wrapper>
        <MosaicOrgPanel org={org} />
      </Wrapper>,
    );
    expect(screen.getByText("Acme Corp")).toBeTruthy();
  });

  it("renders without crashing with no tabs", () => {
    expect(() =>
      render(
        <Wrapper>
          <MosaicOrgPanel org={org} tabs={[]} />
        </Wrapper>,
      ),
    ).not.toThrow();
  });

  it("renders tab labels when provided", () => {
    render(
      <Wrapper>
        <MosaicOrgPanel
          org={org}
          tabs={[
            { id: "overview", label: "Overview", content: <p>Overview content</p> },
            { id: "members", label: "Members", content: <p>Members content</p> },
          ]}
          defaultTab="overview"
        />
      </Wrapper>,
    );
    expect(screen.getByText("Overview")).toBeTruthy();
    expect(screen.getByText("Members")).toBeTruthy();
  });
});

describe("MosaicOrgRoleBadge", () => {
  it("renders admin badge", () => {
    // biome-ignore lint/a11y/useValidAriaRole: "role" is a MosaicOrgRoleBadge component prop, not an HTML aria role
    render(<MosaicOrgRoleBadge role="admin" />);
    expect(screen.getByText(/admin/i)).toBeTruthy();
  });

  it("renders member badge", () => {
    // biome-ignore lint/a11y/useValidAriaRole: "role" is a MosaicOrgRoleBadge component prop, not an HTML aria role
    render(<MosaicOrgRoleBadge role="member" />);
    expect(screen.getByText(/member/i)).toBeTruthy();
  });

  it("renders owner badge", () => {
    // biome-ignore lint/a11y/useValidAriaRole: "role" is a MosaicOrgRoleBadge component prop, not an HTML aria role
    render(<MosaicOrgRoleBadge role="owner" />);
    expect(screen.getByText(/owner/i)).toBeTruthy();
  });
});

describe("MosaicMultiOrgIndicator", () => {
  it("renders org count text", () => {
    render(<MosaicMultiOrgIndicator orgCount={3} />);
    expect(screen.getByText("3 orgs")).toBeTruthy();
  });

  it("renders nothing when orgCount <= 1", () => {
    const { container } = render(<MosaicMultiOrgIndicator orgCount={1} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("MosaicCreateOrgDialog", () => {
  it("renders form when open", () => {
    render(
      <Wrapper>
        <MosaicCreateOrgDialog open={true} onOpenChange={() => {}} onCreateOrg={() => {}} />
      </Wrapper>,
    );
    // Form should be visible
    const inputs = screen.queryAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });
});

describe("MosaicInviteMemberDialog", () => {
  it("renders email input when open", () => {
    render(
      <Wrapper>
        <MosaicInviteMemberDialog
          open={true}
          onOpenChange={() => {}}
          onInvite={() => Promise.resolve()}
        />
      </Wrapper>,
    );
    const inputs = screen.queryAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });
});

describe("MosaicMemberList", () => {
  it("renders member names", () => {
    render(
      <Wrapper>
        <MosaicMemberList members={members} onRemoveMember={() => {}} onChangeRole={() => {}} />
      </Wrapper>,
    );
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });
});

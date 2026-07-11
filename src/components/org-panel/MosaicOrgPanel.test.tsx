import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import {
  MosaicCreateOrgDialog,
  MosaicInviteMemberDialog,
  MosaicMemberList,
  MosaicMultiOrgIndicator,
  MosaicOrgPanel,
  type MosaicOrgRole,
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
    // "role" here is a MosaicOrgRoleBadge domain prop (admin|member|owner), not an
    // HTML/ARIA role — read via a variable so static analyzers don't misparse the
    // literal as an aria-role attribute value.
    const roleValue: MosaicOrgRole = "admin";
    render(<MosaicOrgRoleBadge role={roleValue} />);
    expect(screen.getByText(/admin/i)).toBeTruthy();
  });

  it("renders member badge", () => {
    const roleValue: MosaicOrgRole = "member";
    render(<MosaicOrgRoleBadge role={roleValue} />);
    expect(screen.getByText(/member/i)).toBeTruthy();
  });

  it("renders owner badge", () => {
    const roleValue: MosaicOrgRole = "owner";
    render(<MosaicOrgRoleBadge role={roleValue} />);
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
        <MosaicCreateOrgDialog
          open={true}
          onOpenChange={() => {}}
          onCreateOrg={() => {}}
          closeAriaLabel="Close dialog"
          orgNameFieldLabel="Organization Name *"
          orgNamePlaceholder="Acme Inc."
          slugFieldLabel="Slug *"
          descriptionFieldLabel="Description"
          descriptionPlaceholder="Optional description…"
          cancelLabel="Cancel"
          creatingLabel="Creating…"
          createLabel="Create Organization"
        />
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
          closeAriaLabel="Close dialog"
          emailFieldLabel="Email address *"
          emailPlaceholder="colleague@example.com"
          roleFieldLabel="Role"
          cancelLabel="Cancel"
          sendingLabel="Sending…"
          sendInvitationLabel="Send Invitation"
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
        <MosaicMemberList
          members={members}
          onRemoveMember={() => {}}
          onChangeRole={() => {}}
          youLabel="You"
          memberActionsAriaLabel="Member actions"
          removeMemberLabel="Remove member"
          emptyMessage="No members found."
          inviteLabel="Invite"
        />
      </Wrapper>,
    );
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });
});

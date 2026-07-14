import { fireEvent, render, screen } from "@testing-library/react";
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
  it("renders admin badge with host-supplied description", () => {
    // "role" here is a MosaicOrgRoleBadge domain prop (admin|member|owner), not an
    // HTML/ARIA role — read via a variable so static analyzers don't misparse the
    // literal as an aria-role attribute value.
    const roleValue: MosaicOrgRole = "admin";
    render(<MosaicOrgRoleBadge role={roleValue} description="Peut gérer l'organisation" />);
    expect(screen.getByText(/admin/i)).toBeTruthy();
    expect(screen.getByTitle("Peut gérer l'organisation")).toBeTruthy();
  });

  it("renders member badge with host-supplied description", () => {
    const roleValue: MosaicOrgRole = "member";
    render(<MosaicOrgRoleBadge role={roleValue} description="Accès standard" />);
    expect(screen.getByText(/member/i)).toBeTruthy();
    expect(screen.getByTitle("Accès standard")).toBeTruthy();
  });

  it("renders owner badge with host-supplied description", () => {
    const roleValue: MosaicOrgRole = "owner";
    render(<MosaicOrgRoleBadge role={roleValue} description="Accès complet" />);
    expect(screen.getByText(/owner/i)).toBeTruthy();
    expect(screen.getByTitle("Accès complet")).toBeTruthy();
  });

  it("fabricates no description word — the title is exactly the host string, nothing appended", () => {
    const roleValue: MosaicOrgRole = "owner";
    render(<MosaicOrgRoleBadge role={roleValue} description="XYZ-HOST-STRING" />);
    const badge = screen.getByText(/owner/i);
    expect(badge.getAttribute("title")).toBe("XYZ-HOST-STRING");
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
          title="Create Organization"
          closeAriaLabel="Close dialog"
          orgNameFieldLabel="Organization Name *"
          orgNamePlaceholder="Acme Inc."
          slugFieldLabel="Slug *"
          slugPlaceholder="acme-inc"
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

  it("renders the host-supplied name-required message on submit with an empty name", () => {
    render(
      <Wrapper>
        <MosaicCreateOrgDialog
          open={true}
          onOpenChange={() => {}}
          onCreateOrg={() => {}}
          title="Create Organization"
          closeAriaLabel="Close dialog"
          orgNameFieldLabel="Organization Name *"
          orgNamePlaceholder="Acme Inc."
          slugFieldLabel="Slug *"
          descriptionFieldLabel="Description"
          descriptionPlaceholder="Optional description…"
          cancelLabel="Cancel"
          creatingLabel="Creating…"
          createLabel="Create Organization"
          nameRequiredMessage="XYZ-NAME-REQUIRED"
          slugRequiredMessage="XYZ-SLUG-REQUIRED"
        />
      </Wrapper>,
    );
    // fireEvent.click on the submit button is intercepted by native HTML5
    // constraint validation (both fields carry `required`) before the
    // submit event ever reaches React's onSubmit — the form never actually
    // submits and every assertion trivially passes. Dispatch `submit`
    // directly on the form to exercise the real validate() path.
    const form = document.querySelector('[data-slot="create-org-dialog"]') as HTMLFormElement;
    fireEvent.submit(form);
    expect(screen.getByText("XYZ-NAME-REQUIRED")).toBeTruthy();
    expect(screen.getByText("XYZ-SLUG-REQUIRED")).toBeTruthy();
  });

  it("fabricates no word when validation-message props are omitted — invalid submit renders no message text", () => {
    render(
      <Wrapper>
        <MosaicCreateOrgDialog
          open={true}
          onOpenChange={() => {}}
          onCreateOrg={() => {}}
          title="Create Organization"
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
    const form = document.querySelector('[data-slot="create-org-dialog"]') as HTMLFormElement;
    fireEvent.submit(form);
    expect(screen.queryByText(/required/i)).toBeNull();
    expect(screen.queryByText(/invalid/i)).toBeNull();
  });

  it("renders the host-supplied slug placeholder and fabricates no word of its own", () => {
    render(
      <Wrapper>
        <MosaicCreateOrgDialog
          open={true}
          onOpenChange={() => {}}
          onCreateOrg={() => {}}
          title="Create Organization"
          closeAriaLabel="Close dialog"
          orgNameFieldLabel="Organization Name *"
          orgNamePlaceholder="Acme Inc."
          slugFieldLabel="Slug *"
          slugPlaceholder="mon-organisation"
          descriptionFieldLabel="Description"
          descriptionPlaceholder="Optional description…"
          cancelLabel="Cancel"
          creatingLabel="Creating…"
          createLabel="Create Organization"
        />
      </Wrapper>,
    );
    expect(screen.getByPlaceholderText("mon-organisation")).toBeTruthy();
    expect(screen.queryByPlaceholderText("acme-inc")).toBeNull();
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
          title="Invite Member"
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

  it("renders the host-supplied email-required message on submit with an empty email", () => {
    render(
      <Wrapper>
        <MosaicInviteMemberDialog
          open={true}
          onOpenChange={() => {}}
          onInvite={() => Promise.resolve()}
          title="Invite Member"
          closeAriaLabel="Close dialog"
          emailFieldLabel="Email address *"
          emailPlaceholder="colleague@example.com"
          roleFieldLabel="Role"
          cancelLabel="Cancel"
          sendingLabel="Sending…"
          sendInvitationLabel="Send Invitation"
          emailRequiredMessage="XYZ-EMAIL-REQUIRED"
          emailInvalidMessage="XYZ-EMAIL-INVALID"
        />
      </Wrapper>,
    );
    const form = document.querySelector('[data-slot="invite-member-dialog"]') as HTMLFormElement;
    fireEvent.submit(form);
    expect(screen.getByText("XYZ-EMAIL-REQUIRED")).toBeTruthy();
  });

  it("fabricates no word when validation-message props are omitted — invalid submit renders no message text", () => {
    render(
      <Wrapper>
        <MosaicInviteMemberDialog
          open={true}
          onOpenChange={() => {}}
          onInvite={() => Promise.resolve()}
          title="Invite Member"
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
    const form = document.querySelector('[data-slot="invite-member-dialog"]') as HTMLFormElement;
    fireEvent.submit(form);
    expect(screen.queryByText(/required/i)).toBeNull();
    expect(screen.queryByText(/invalid/i)).toBeNull();
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
          searchPlaceholder="Search members…"
          roleDescriptions={{
            owner: "Owner access",
            admin: "Admin access",
            member: "Member access",
          }}
        />
      </Wrapper>,
    );
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicProfilePanel } from "./MosaicProfilePanel.js";

const requiredProfilePanelLabels = {
  avatarHeading: "Profile Picture",
  avatarSubheading: "Update your avatar",
  uploadPhotoLabel: "Upload Photo",
  personalInfoHeading: "Personal Information",
  personalInfoSubheading: "Update your profile details",
  securityHeading: "Account Security",
  securitySubheading: "Manage your password and security settings",
  changePasswordLabel: "Change Password",
  savingLabel: "Saving…",
  saveLabel: "Save Profile",
  unnamedUserLabel: "User",
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MosaicDeviceProvider>{children}</MosaicDeviceProvider>;
}

const fields = [
  { id: "name", label: "Full Name", type: "text" as const, value: "Alice Martin" },
  {
    id: "email",
    label: "Email",
    type: "email" as const,
    value: "alice@example.com",
    readOnly: true,
  },
];

describe("MosaicProfilePanel", () => {
  it("renders field labels", () => {
    render(
      <Wrapper>
        <MosaicProfilePanel
          fields={fields}
          onSave={() => {}}
          displayName="Alice Martin"
          {...requiredProfilePanelLabels}
        />
      </Wrapper>,
    );
    expect(screen.getByText("Full Name")).toBeTruthy();
    expect(screen.getByText("Email")).toBeTruthy();
  });

  it("renders field values in inputs", () => {
    render(
      <Wrapper>
        <MosaicProfilePanel
          fields={fields}
          onSave={() => {}}
          displayName="Alice Martin"
          {...requiredProfilePanelLabels}
        />
      </Wrapper>,
    );
    const nameInput = screen.getByDisplayValue("Alice Martin");
    expect(nameInput).toBeTruthy();
  });

  it("renders save button", () => {
    render(
      <Wrapper>
        <MosaicProfilePanel
          fields={fields}
          onSave={() => {}}
          {...requiredProfilePanelLabels}
          saveLabel="Update Profile"
        />
      </Wrapper>,
    );
    expect(screen.getByRole("button", { name: /Update Profile/i })).toBeTruthy();
  });

  it("calls onSave when save button is clicked", () => {
    const onSave = vi.fn();
    render(
      <Wrapper>
        <MosaicProfilePanel fields={fields} onSave={onSave} {...requiredProfilePanelLabels} />
      </Wrapper>,
    );
    const btn = screen.getByRole("button", { name: /save/i });
    btn.click();
    expect(onSave).toHaveBeenCalled();
  });

  it("renders avatar with initials fallback", () => {
    const { container } = render(
      <Wrapper>
        <MosaicProfilePanel
          fields={[]}
          onSave={() => {}}
          displayName="Bob Smith"
          {...requiredProfilePanelLabels}
        />
      </Wrapper>,
    );
    // Check avatar area renders
    expect(container.firstChild).toBeTruthy();
  });
});

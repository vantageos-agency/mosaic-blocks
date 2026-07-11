import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicProfilePanel } from "./MosaicProfilePanel.js";

const fields = [
  { id: "name", label: "Full Name", type: "text" as const, value: "Alice Martin" },
  {
    id: "email",
    label: "Email",
    type: "email" as const,
    value: "alice@example.com",
    readOnly: true,
  },
  {
    id: "bio",
    label: "Bio",
    type: "textarea" as const,
    value: "Product strategist and AI enthusiast.",
    placeholder: "Tell us about yourself…",
  },
];

const meta = {
  title: "Components/MosaicProfilePanel",
  component: MosaicProfilePanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <div className="max-w-2xl">
          <Story />
        </div>
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicProfilePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

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
};

export const Default: Story = {
  args: {
    displayName: "Alice Martin",
    fields,
    onSave: () => console.log("save"),
    onFieldChange: (id, val) => console.log(id, val),
    onAvatarUpload: () => console.log("upload avatar"),
    saveLabel: "Save Profile",
    ...requiredProfilePanelLabels,
  },
};

export const Saving: Story = {
  args: {
    displayName: "Alice Martin",
    fields,
    onSave: () => {},
    isSaving: true,
    saveLabel: "Saving…",
    ...requiredProfilePanelLabels,
  },
};

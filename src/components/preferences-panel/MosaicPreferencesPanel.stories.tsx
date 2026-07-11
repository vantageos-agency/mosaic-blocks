import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import {
  type MosaicPreference,
  type MosaicPreferenceGroup,
  MosaicPreferencesPanel,
} from "./MosaicPreferencesPanel.js";

const groups: MosaicPreferenceGroup[] = [
  {
    id: "appearance",
    title: "Appearance",
    description: "Customize the visual experience",
    preferences: [
      {
        id: "theme",
        label: "Theme",
        description: "Choose your preferred color scheme",
        type: "select" as const,
        value: "system",
        options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "System" },
        ],
      },
      {
        id: "compact",
        label: "Compact Mode",
        description: "Reduce spacing for denser layouts",
        type: "toggle" as const,
        value: false,
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    preferences: [
      {
        id: "email_notifs",
        label: "Email Notifications",
        type: "toggle" as const,
        value: true,
      },
    ],
  },
];

function PrefDemo() {
  const [prefs, setPrefs] = useState<MosaicPreferenceGroup[]>(groups);
  const handleChange = (id: string, value: string | boolean) => {
    setPrefs((gs) =>
      gs.map((g) => ({
        ...g,
        preferences: g.preferences.map((p: MosaicPreference) =>
          p.id === id ? { ...p, value } : p,
        ),
      })),
    );
  };
  return (
    <MosaicDeviceProvider>
      <div className="max-w-2xl">
        <MosaicPreferencesPanel
          groups={prefs}
          onChange={handleChange}
          onSave={() => console.log("saved")}
          saveLabel="Save Preferences"
          savingLabel="Saving…"
        />
      </div>
    </MosaicDeviceProvider>
  );
}

const meta = {
  title: "Components/MosaicPreferencesPanel",
  component: MosaicPreferencesPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <Story />
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicPreferencesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const basePrefArgs = {
  groups,
  onChange: () => {},
  onSave: () => {},
  saveLabel: "Save Preferences",
  savingLabel: "Saving…",
} as const;

export const Default: Story = {
  args: basePrefArgs,
  render: () => <PrefDemo />,
};

export const Saving: Story = {
  args: {
    groups,
    onChange: () => {},
    onSave: () => {},
    isSaving: true,
    saveLabel: "Saving…",
    savingLabel: "Saving…",
  },
};

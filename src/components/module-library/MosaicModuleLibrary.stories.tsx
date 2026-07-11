import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicModuleForm, MosaicModuleLibrary } from "./MosaicModuleLibrary.js";

const items = [
  {
    id: "m1",
    name: "Design Thinking",
    description: "Human-centered problem-solving in 5 stages.",
    icon: "💡",
    tags: ["innovation", "ux"],
    isCustom: false,
  },
  {
    id: "m2",
    name: "Lean Startup",
    description: "Build-Measure-Learn cycle for rapid validation.",
    icon: "🔄",
    tags: ["startup", "agile"],
    isCustom: false,
  },
  {
    id: "m3",
    name: "My Custom Framework",
    description: "A custom framework for our team.",
    icon: "⚙️",
    tags: ["custom"],
    isCustom: true,
  },
];

const meta = {
  title: "Components/MosaicModuleLibrary",
  component: MosaicModuleLibrary,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <MosaicDeviceProvider>
        <Story />
      </MosaicDeviceProvider>
    ),
  ],
} satisfies Meta<typeof MosaicModuleLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

const requiredModuleLibraryLabels = {
  nameFieldLabel: "Name *",
  descriptionFieldLabel: "Description",
  namePlaceholder: "Module name…",
  descriptionPlaceholder: "Describe this module…",
  cancelLabel: "Cancel",
  saveChangesLabel: "Save Changes",
  createItemLabel: "Create",
  itemActionsAriaLabel: "Item actions",
  editItemLabel: "Edit",
  deleteItemLabel: "Delete",
  closeEditorAriaLabel: "Close dialog",
  editModalTitle: (name: string) => `Edit ${name || "Module"}`,
  title: "Module Library",
  createLabel: "New Module",
  searchPlaceholder: "Search modules…",
  emptyMessage: "No modules found.",
  tagListAddPlaceholder: "Add item…",
};

const requiredModuleFormLabels = {
  nameFieldLabel: "Name *",
  descriptionFieldLabel: "Description",
  namePlaceholder: "Module name…",
  descriptionPlaceholder: "Describe this module…",
  cancelLabel: "Cancel",
  saveChangesLabel: "Save Changes",
  createItemLabel: "Create",
  tagListAddPlaceholder: "Add item…",
};

export const Default: Story = {
  args: {
    items,
    onCreateItem: (data) => console.log("create", data),
    onUpdateItem: (id, data) => console.log("update", id, data),
    onDeleteItem: (id) => console.log("delete", id),
    ...requiredModuleLibraryLabels,
    title: "Module Library",
  },
};

const baseLibArgs = {
  items,
  onCreateItem: () => {},
  onUpdateItem: () => {},
  onDeleteItem: () => {},
  ...requiredModuleLibraryLabels,
} as const;

export const CreateForm: Story = {
  args: baseLibArgs,
  render: () => (
    <MosaicDeviceProvider>
      <div className="max-w-lg">
        <MosaicModuleForm
          mode="create"
          onSave={(module) => console.log("save", module)}
          onCancel={() => console.log("cancel")}
          {...requiredModuleFormLabels}
        />
      </div>
    </MosaicDeviceProvider>
  ),
};

export const EditForm: Story = {
  args: baseLibArgs,
  render: () => (
    <MosaicDeviceProvider>
      <div className="max-w-lg">
        <MosaicModuleForm
          mode="edit"
          item={{
            id: "m1",
            name: "Design Thinking",
            description: "Human-centered problem-solving in 5 stages.",
            icon: "💡",
            tags: ["innovation", "ux"],
          }}
          onSave={(module) => console.log("save", module)}
          onCancel={() => console.log("cancel")}
          {...requiredModuleFormLabels}
        />
      </div>
    </MosaicDeviceProvider>
  ),
};

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { MosaicDeviceProvider } from "../device-provider/MosaicDeviceProvider.js";
import { MosaicAdaptiveModal } from "./MosaicAdaptiveModal.js";

function ModalDemo({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <MosaicDeviceProvider>
      <button
        type="button"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        onClick={() => setOpen(true)}
      >
        Open Modal
      </button>
      <MosaicAdaptiveModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={title}
        closeAriaLabel="Close dialog"
      >
        <p className="text-sm text-muted-foreground">
          Modal content goes here. Adapts to a bottom sheet on mobile.
        </p>
      </MosaicAdaptiveModal>
    </MosaicDeviceProvider>
  );
}

const meta = {
  title: "Layout/MosaicAdaptiveModal",
  component: MosaicAdaptiveModal,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicAdaptiveModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    title: "Settings",
    children: null,
    closeAriaLabel: "Close dialog",
  },
  render: () => <ModalDemo title="Settings" />,
};

export const LongContent: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    title: "Details",
    children: null,
    closeAriaLabel: "Close dialog",
  },
  render: () => (
    <MosaicDeviceProvider>
      {(() => {
        const [open, setOpen] = useState(false);
        return (
          <>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => setOpen(true)}
            >
              Open Long Modal
            </button>
            <MosaicAdaptiveModal
              isOpen={open}
              onClose={() => setOpen(false)}
              title="Details"
              closeAriaLabel="Close dialog"
            >
              <p className="mb-3 text-sm text-muted-foreground">
                Paragraph 1 — Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
              <p className="mb-3 text-sm text-muted-foreground">
                Paragraph 2 — Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <p className="mb-3 text-sm text-muted-foreground">
                Paragraph 3 — Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>
              <p className="mb-3 text-sm text-muted-foreground">
                Paragraph 4 — Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.
              </p>
              <p className="mb-3 text-sm text-muted-foreground">
                Paragraph 5 — Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
                officia.
              </p>
            </MosaicAdaptiveModal>
          </>
        );
      })()}
    </MosaicDeviceProvider>
  ),
};

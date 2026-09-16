import type { Meta, StoryObj } from "@storybook/react";

import { MosaicPdfViewer } from "./MosaicPdfViewer.js";

const meta = {
  title: "Blocks/MosaicPdfViewer",
  component: MosaicPdfViewer,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof MosaicPdfViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Lease PDF placeholder — the component performs no fetch of its own (the
// browser's native PDF renderer loads `fileUrl`), so a realistic-looking
// document URL is enough to prove the toolbar/chrome styling.
export const ContratDeBail: Story = {
  name: "Contrat de bail (aperçu)",
  args: {
    fileUrl: "/documents/bail-dubois-12-rue-de-la-paix.pdf",
    currentPage: 3,
    totalPages: 12,
    zoom: 1,
    loadingLabel: "Chargement du document…",
    errorLabel: "Impossible d'afficher ce document.",
  },
  decorators: [
    (Story) => (
      <div style={{ height: 480 }}>
        <Story />
      </div>
    ),
  ],
};

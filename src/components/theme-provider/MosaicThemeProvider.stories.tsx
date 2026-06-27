import type { Meta, StoryObj } from "@storybook/react";

import { MosaicThemeProvider } from "./MosaicThemeProvider.js";

const meta = {
  title: "Providers/MosaicThemeProvider",
  component: MosaicThemeProvider,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicThemeProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
        <p className="font-medium">Theme Provider (no provider injected)</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Renders children inside a data-slot wrapper.
        </p>
      </div>
    ),
  },
};

export const WithMockProvider: Story = {
  args: {
    provider: function MockProvider({
      children,
    }: {
      children: React.ReactNode;
      [k: string]: unknown;
    }) {
      return (
        <div data-testid="mock-provider" style={{ outline: "2px dashed oklch(0.7 0.15 250)" }}>
          {children}
        </div>
      );
    },
    attribute: "class",
    defaultTheme: "system",
    children: (
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="font-medium">With ThemeProvider injected</p>
      </div>
    ),
  },
};

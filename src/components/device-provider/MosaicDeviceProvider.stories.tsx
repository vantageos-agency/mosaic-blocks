import type { Meta, StoryObj } from "@storybook/react";

import { MosaicDeviceProvider, useDevice } from "./MosaicDeviceProvider.js";

function DeviceDisplay() {
  const device = useDevice();
  return (
    <div className="rounded-lg border border-border bg-card p-6 font-mono text-sm">
      <table className="w-full">
        <tbody>
          {Object.entries({
            isMobile: device.isMobile,
            isTablet: device.isTablet,
            isDesktop: device.isDesktop,
            isSmUp: device.isSmUp,
            isMdUp: device.isMdUp,
            isLgUp: device.isLgUp,
            orientation: device.orientation,
            "viewport.width": device.viewport.width,
            "viewport.height": device.viewport.height,
          }).map(([key, value]) => (
            <tr key={key} className="border-b border-border last:border-0">
              <td className="py-1 pr-4 font-medium text-muted-foreground">{key}</td>
              <td className="py-1 text-foreground">{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const meta = {
  title: "Providers/MosaicDeviceProvider",
  component: MosaicDeviceProvider,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof MosaicDeviceProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <DeviceDisplay />,
  },
};

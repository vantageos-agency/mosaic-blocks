import type { Preview } from "@storybook/react";
import * as React from "react";
import "./preview.css";

// ── Theme toggle — light/dark, wired to the [data-theme="dark"] contract ────
//
// src/theme/depth.css and @vantageos/mosaic-tokens both key dark mode off
// `[data-theme="dark"]`. This decorator sets that attribute on <html> (never
// on a wrapper div) so that <body> — themed in preview.css — and every story
// underneath it inherit the same custom-property cascade. Driven by a
// Storybook toolbar global so the operator can flip it live; also settable
// non-interactively via the documented `?globals=theme:dark` URL contract,
// which is what e2e/storybook-theme.spec.ts uses.
function ThemeSync({ theme }: { theme: string }) {
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  return null;
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      config: {},
    },
    // Desktop 1440 + phone 390 — the two viewports the operator approves the
    // showcase against (mission k57b7whw6p3zkvnqb9pqhyyf2n8egy4e T2).
    viewport: {
      viewports: {
        mosaicDesktop1440: {
          name: "Mosaic Desktop 1440",
          styles: { width: "1440px", height: "900px" },
          type: "desktop",
        },
        mosaicPhone390: {
          name: "Mosaic Phone 390",
          styles: { width: "390px", height: "844px" },
          type: "mobile",
        },
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Theme",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    (Story, context) =>
      React.createElement(
        React.Fragment,
        null,
        React.createElement(ThemeSync, { theme: String(context.globals.theme ?? "light") }),
        React.createElement(Story),
      ),
  ],
};

export default preview;

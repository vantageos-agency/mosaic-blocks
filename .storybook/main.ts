import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

// ── Theme pipeline ──────────────────────────────────────────────────────────
//
// The predecessor package's Storybook rendered every component UNSTYLED:
// browser serif font, native checkbox/button, no spacing. Root cause (proven
// RED in e2e/storybook-theme.spec.ts before this fix): the Vite build that
// powers the story iframe had no Tailwind v4 engine at all, so every
// `bg-card` / `rounded-md` / `text-foreground` utility class in the component
// source compiled to nothing — the class name reached the DOM, no CSS rule
// backed it. `@tailwindcss/vite` is the fix: it is the same engine consumers
// of this package wire into their own Next.js/Vite build (per src/styles.css
// header comment), applied here to the Storybook iframe's own bundler.
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  async viteFinal(viteConfig) {
    viteConfig.plugins = viteConfig.plugins ?? [];
    viteConfig.plugins.push(tailwindcss());
    return viteConfig;
  },
};

export default config;

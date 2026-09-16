import type { Meta, StoryObj } from "@storybook/react";

/**
 * Theme depth showcase — surface ladder, elevation, motion presets.
 *
 * Renders the T1 relief + motion token contract (`./depth.css`,
 * `src/__tests__/theme-depth.test.ts`) side by side so the operator's verdict
 * on the HeroUI trials — "flat, a mockup, no relief, no animation" — has a
 * visible counter-example inside this package itself, in both light and dark.
 *
 * Every visual here reads directly from the shipped CSS custom properties;
 * nothing is hardcoded to a literal color/shadow/duration in this file.
 */

function SurfaceLadder() {
  const steps: Array<{ label: string; token: string }> = [
    { label: "Page ground", token: "--mosaic-surface-ground" },
    { label: "Sidebar", token: "--mosaic-surface-sidebar" },
    { label: "Card", token: "--mosaic-surface-card" },
    { label: "Nested well", token: "--mosaic-surface-well" },
  ];
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {steps.map((step) => (
        <div
          key={step.token}
          style={{
            width: 140,
            height: 90,
            borderRadius: 10,
            background: `var(${step.token})`,
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "flex-end",
            padding: 8,
            fontSize: 12,
            color: "var(--foreground)",
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{step.label}</div>
            <code style={{ opacity: 0.7 }}>{step.token}</code>
          </div>
        </div>
      ))}
    </div>
  );
}

function ElevationLevels() {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      {([1, 2, 3] as const).map((level) => (
        <div
          key={level}
          style={{
            width: 140,
            height: 90,
            borderRadius: 10,
            background: "var(--mosaic-surface-card)",
            boxShadow: `var(--mosaic-elevation-${level}-highlight), var(--mosaic-elevation-${level}-shadow)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--foreground)",
          }}
        >
          Elevation {level}
        </div>
      ))}
    </div>
  );
}

function MotionPresets() {
  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
      <div
        className="mosaic-motion-entry"
        style={{
          width: 160,
          height: 90,
          borderRadius: 10,
          background: "var(--mosaic-surface-card)",
          boxShadow: "var(--mosaic-elevation-2-highlight), var(--mosaic-elevation-2-shadow)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          color: "var(--foreground)",
        }}
      >
        .mosaic-motion-entry
        <br />
        (re-mount to replay)
      </div>
      <div
        className="mosaic-motion-hover-lift"
        style={{
          width: 160,
          height: 90,
          borderRadius: 10,
          background: "var(--mosaic-surface-card)",
          boxShadow: "var(--mosaic-elevation-1-highlight), var(--mosaic-elevation-1-shadow)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          color: "var(--foreground)",
          cursor: "default",
        }}
      >
        .mosaic-motion-hover-lift
        <br />
        (hover me)
      </div>
    </div>
  );
}

function SemanticSwatches() {
  const swatches = [
    { label: "accent", token: "--accent" },
    { label: "success", token: "--color-success-500" },
    { label: "danger", token: "--color-danger-500" },
    { label: "warning", token: "--color-warning-500" },
  ];
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {swatches.map((s) => (
        <div
          key={s.token}
          style={{ textAlign: "center", fontSize: 12, color: "var(--foreground)" }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              background: `var(${s.token})`,
              border: "1px solid var(--border)",
              marginBottom: 4,
            }}
          />
          {s.label}
        </div>
      ))}
    </div>
  );
}

function ThemeDepthShowcase({ mode }: { mode: "light" | "dark" }) {
  return (
    <div
      data-theme={mode}
      style={{
        background: "var(--mosaic-surface-ground)",
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 32,
        minHeight: 400,
        fontFamily: "var(--mosaic-font-sans, sans-serif)",
      }}
    >
      <section>
        <h3 style={{ color: "var(--foreground)", marginBottom: 12 }}>Surface ladder</h3>
        <SurfaceLadder />
      </section>
      <section>
        <h3 style={{ color: "var(--foreground)", marginBottom: 12 }}>
          Elevation (shadow + highlight edge)
        </h3>
        <ElevationLevels />
      </section>
      <section>
        <h3 style={{ color: "var(--foreground)", marginBottom: 12 }}>Motion presets</h3>
        <MotionPresets />
      </section>
      <section>
        <h3 style={{ color: "var(--foreground)", marginBottom: 12 }}>Accent + semantic colours</h3>
        <SemanticSwatches />
      </section>
    </div>
  );
}

const meta: Meta<typeof ThemeDepthShowcase> = {
  title: "Theme/Depth",
  component: ThemeDepthShowcase,
};

export default meta;
type Story = StoryObj<typeof ThemeDepthShowcase>;

export const Light: Story = {
  args: { mode: "light" },
};

export const Dark: Story = {
  args: { mode: "dark" },
};

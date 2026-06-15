import { MosaicButton, Placeholder, version } from "@vantageos/mosaic-blocks";

export default function SandboxPage() {
  return (
    <main className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">mosaic-blocks sandbox</h1>
        <p className="text-sm text-gray-500">
          v{version} — T0-ARCH spike: MosaicButton (@base-ui/react, ADR-0001)
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">MosaicButton — variants</h2>
        <div className="flex flex-wrap gap-3">
          <MosaicButton variant="default">Default</MosaicButton>
          <MosaicButton variant="secondary">Secondary</MosaicButton>
          <MosaicButton variant="ghost">Ghost</MosaicButton>
          <MosaicButton variant="destructive">Destructive</MosaicButton>
          <MosaicButton variant="outline">Outline</MosaicButton>
          <MosaicButton variant="link">Link</MosaicButton>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">MosaicButton — sizes</h2>
        <div className="flex flex-wrap items-center gap-3">
          <MosaicButton size="sm">Small</MosaicButton>
          <MosaicButton size="default">Default</MosaicButton>
          <MosaicButton size="lg">Large</MosaicButton>
          <MosaicButton size="icon" aria-label="Icon button">
            +
          </MosaicButton>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">MosaicButton — states</h2>
        <div className="flex flex-wrap gap-3">
          <MosaicButton disabled>Disabled</MosaicButton>
          <MosaicButton variant="secondary" disabled>
            Secondary disabled
          </MosaicButton>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Placeholder (legacy)</h2>
        <Placeholder label="Alpha placeholder — T3 blocks will replace this" />
      </section>
    </main>
  );
}

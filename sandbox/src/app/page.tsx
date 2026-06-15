import { Placeholder, version } from "@vantageos/mosaic-blocks";

export default function SandboxPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">mosaic-blocks sandbox</h1>
      <p className="text-sm text-gray-500 mb-6">
        v{version} — T1 infra only. Real blocks in T3/T4.
      </p>
      <Placeholder label="Alpha placeholder — T3 blocks will replace this" />
    </main>
  );
}

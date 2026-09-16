import { describe, expect, it } from "vitest";

/**
 * showcase-coverage.test.ts — mission k57b7whw6p3zkvnqb9pqhyyf2n8egy4e T2.
 *
 * Every mission block the operator must be able to approve needs a Storybook
 * story rendering it on REALISTIC, POPULATED data — never an empty/zero-data
 * default that proves nothing about the finished look. This suite asserts,
 * per block: a `*.stories.tsx` module exists AND is importable (fail CLOSED —
 * an import error is a real failure, never silently skipped) AND exports at
 * least one story whose `args` carry genuinely populated content (a
 * non-empty array with real entries, a non-zero number, a non-empty string —
 * not booleans/callbacks alone, and not an empty array).
 */

// ── The mission block set (mission k57b7whw6p3zkvnqb9pqhyyf2n8egy4e T2 brief) ─
const MISSION_BLOCKS: Array<{ name: string; storyPath: string }> = [
  { name: "MosaicAppSidebar", storyPath: "../components/app-sidebar/MosaicAppSidebar.stories.tsx" },
  { name: "MosaicStatsGrid", storyPath: "../components/stats-grid/MosaicStatsGrid.stories.tsx" },
  {
    name: "MosaicArtifactChart",
    storyPath: "../components/artifact-chart/MosaicArtifactChart.stories.tsx",
  },
  { name: "MosaicDataTable", storyPath: "../components/data-table/MosaicDataTable.stories.tsx" },
  { name: "MosaicDrawer", storyPath: "../components/drawer/MosaicDrawer.stories.tsx" },
  { name: "MosaicPdfViewer", storyPath: "../components/pdf-viewer/MosaicPdfViewer.stories.tsx" },
  {
    name: "MosaicResizableSplitPane",
    storyPath: "../components/resizable-split-pane/MosaicResizableSplitPane.stories.tsx",
  },
  { name: "MosaicCard", storyPath: "../components/card/MosaicCard.stories.tsx" },
  { name: "MosaicEmptyState", storyPath: "../components/empty-state/MosaicEmptyState.stories.tsx" },
  { name: "MosaicSkeleton", storyPath: "../components/skeleton/MosaicSkeleton.stories.tsx" },
];

// ── Populated-content detector ────────────────────────────────────────────
//
// Generic over prop shape: recurses into arrays/objects/React elements
// (`.props.children`) looking for a non-empty string or a non-zero number.
// Booleans and functions never count on their own — a story whose ONLY args
// are `open: true` / `onClick: () => {}` is not "populated data".
function hasRealContent(value: unknown, depth = 0): boolean {
  if (depth > 6 || value == null) return false;

  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "boolean" || typeof value === "function") return false;

  if (Array.isArray(value)) {
    return value.length > 0 && value.some((item) => hasRealContent(item, depth + 1));
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // React element — look at its props (esp. children), not its internal
    // fields ($$typeof/type/key), which are never "content".
    if ("$$typeof" in obj && "props" in obj) {
      return hasRealContent(obj.props, depth + 1);
    }
    return Object.values(obj).some((v) => hasRealContent(v, depth + 1));
  }

  return false;
}

interface StoryModule {
  default?: unknown;
  [exportName: string]: unknown;
}

function populatedStoryNames(mod: StoryModule): string[] {
  return Object.keys(mod)
    .filter((key) => key !== "default")
    .filter((key) => {
      const story = mod[key] as { args?: unknown } | undefined;
      return (
        story != null && typeof story === "object" && "args" in story && hasRealContent(story.args)
      );
    });
}

describe("showcase coverage — every mission block has a populated-data story", () => {
  for (const block of MISSION_BLOCKS) {
    it(`${block.name} has a *.stories.tsx exporting at least one populated-data story`, async () => {
      // Fail CLOSED: a module that cannot be imported (missing file, syntax
      // error, broken import) throws here and the test fails loudly — no
      // try/catch swallowing it into a silent skip.
      const mod: StoryModule = await import(/* @vite-ignore */ block.storyPath);

      expect(mod.default, `${block.storyPath} must have a default (meta) export`).toBeDefined();

      const populated = populatedStoryNames(mod);
      expect(
        populated.length,
        `${block.storyPath} must export at least one story with populated (non-empty/non-zero) args — found named exports: ${Object.keys(
          mod,
        )
          .filter((k) => k !== "default")
          .join(", ")}`,
      ).toBeGreaterThan(0);
    });
  }
});

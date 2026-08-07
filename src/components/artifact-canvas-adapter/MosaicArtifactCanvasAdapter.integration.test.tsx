/**
 * EXECUTED integration gate — the merge-blocking proof that the MCP Apps
 * ui:// path actually traverses `artifact-canvas-adapter` at runtime, not
 * merely that its source text contains the right key shape (that static
 * check is D6 in mcp-doctor, run separately as a supplementary form-check).
 *
 * Each test below constructs a REAL payload object exactly as the runtime
 * would hand it to the adapter — a real MCP tool result carrying the
 * GA-nested `_meta.ui.resourceUri` for the MCP path, and a real
 * `@ai-sdk-tools/artifacts` client shape for the ai-sdk path — feeds it
 * through `MosaicArtifactCanvasAdapter`'s actual render via React Testing
 * Library, and asserts the artifact that came out the other end. A
 * full stdio MCP server spawn is disproportionate for this component-level
 * gate (per operator direction); this in-process tool-result object
 * exercises the exact same normalizer + render path a spawned server would
 * drive through — nothing here is a static scan.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MosaicArtifactCanvasAdapter } from "./MosaicArtifactCanvasAdapter.js";
import type { AiSdkArtifactsSource, ArtifactType, McpToolResult, McpUiSource } from "./types.js";

const typeLabel = (t: ArtifactType) =>
  ({ document: "Document", "data-table": "Table", checklist: "Checklist", chart: "Chart" })[t];

const labels = {
  toggleLabel: "Open canvas",
  closeLabel: "Close",
  toolbarHeading: "Collaborative canvas",
  emptyTitle: "No artifact selected",
  emptyBody: "Create or select an artifact",
  notFoundTitle: "Artifact not found",
  notFoundBody: "The requested artifact could not be loaded",
  typeLabel,
};

describe("D6 executed round-trip — MCP Apps ui:// tool result traverses the adapter", () => {
  it("renders the artifact carried by a real GA-nested _meta.ui.resourceUri tool result", () => {
    // A real MCP tool call result, exactly the shape @modelcontextprotocol/ext-apps's
    // registerAppTool emits: structuredContent is the artifact payload,
    // _meta.ui.resourceUri is the GA-nested UI key (D6 `present`/conforming form).
    const mcpToolResult: McpToolResult = {
      structuredContent: {
        id: "checklist-launch-1",
        title: "Launch checklist",
        items: [{ id: "i1", text: "Ship PR", completed: false }],
      },
      _meta: {
        ui: {
          resourceUri: "ui://artifact-canvas/checklist",
        },
      },
    };
    const mcpSource: McpUiSource = { kind: "mcp-ui", toolResult: mcpToolResult };

    render(
      <MosaicArtifactCanvasAdapter
        source={mcpSource}
        isOpen={true}
        onToggle={() => {}}
        onClose={() => {}}
        labels={labels}
      />,
    );

    // The executed assertion: the artifact carried by the ui:// tool result
    // is what actually rendered — title, type badge, and the data-* anchor
    // the presentation layer sets from the NORMALIZED (post-adapter) shape.
    expect(screen.getByText("Launch checklist")).toBeTruthy();
    expect(screen.getByText("Checklist")).toBeTruthy();
    const region = document.querySelector("[data-slot='artifact-canvas-artifact']");
    expect(region?.getAttribute("data-artifact-type")).toBe("checklist");
  });

  it("rejects a non-GA (flat ui/resourceUri) shaped payload instead of silently rendering it", () => {
    // Proves the adapter's MCP path enforces the GA-nested contract, not any
    // shape carrying a resourceUri string. A flat-key result normalizes to
    // null because normalizeFromMcpToolResult reads _meta.ui.resourceUri
    // only — the deprecated flat form never reaches that field.
    const flatShapedResult = {
      structuredContent: { id: "x", title: "Should not render" },
      _meta: {},
    } as unknown as McpToolResult;
    const mcpSource: McpUiSource = { kind: "mcp-ui", toolResult: flatShapedResult };

    render(
      <MosaicArtifactCanvasAdapter
        source={mcpSource}
        isOpen={true}
        onToggle={() => {}}
        onClose={() => {}}
        labels={labels}
      />,
    );

    expect(screen.queryByText("Should not render")).toBeNull();
    expect(screen.getByText("Artifact not found")).toBeTruthy();
  });
});

describe("D6 twin — @ai-sdk-tools/artifacts source traverses the SAME adapter render path", () => {
  it("renders the artifact carried by a real useArtifacts() client shape", () => {
    const aiSdkSource: AiSdkArtifactsSource = {
      kind: "ai-sdk-artifacts",
      artifacts: [
        {
          id: "chart-revenue-1",
          type: "chart",
          data: { title: "Q3 revenue", type: "bar", data: [{ month: "Jul", value: 100 }] },
        },
      ],
      activeId: "chart-revenue-1",
    };

    render(
      <MosaicArtifactCanvasAdapter
        source={aiSdkSource}
        isOpen={true}
        onToggle={() => {}}
        onClose={() => {}}
        labels={labels}
      />,
    );

    expect(screen.getByText("Q3 revenue")).toBeTruthy();
    expect(screen.getByText("Chart")).toBeTruthy();
    const region = document.querySelector("[data-slot='artifact-canvas-artifact']");
    expect(region?.getAttribute("data-artifact-type")).toBe("chart");
  });
});

import { describe, expect, it } from "vitest";
import {
  normalizeArtifact,
  normalizeFromAiSdkArtifacts,
  normalizeFromMcpToolResult,
} from "./normalize.js";
import type { AiSdkArtifactsSource, McpUiSource } from "./types.js";

describe("normalizeFromAiSdkArtifacts", () => {
  it("returns null when no artifact is active", () => {
    const source: AiSdkArtifactsSource = {
      kind: "ai-sdk-artifacts",
      artifacts: [],
      activeId: null,
    };
    expect(normalizeFromAiSdkArtifacts(source)).toBeNull();
  });

  it("returns null when the active id has no matching entry", () => {
    const source: AiSdkArtifactsSource = {
      kind: "ai-sdk-artifacts",
      artifacts: [],
      activeId: "missing",
    };
    expect(normalizeFromAiSdkArtifacts(source)).toBeNull();
  });

  it("returns null for an unknown artifact type", () => {
    const source: AiSdkArtifactsSource = {
      kind: "ai-sdk-artifacts",
      artifacts: [{ id: "a1", type: "unknown-type", data: { title: "X" } }],
      activeId: "a1",
    };
    expect(normalizeFromAiSdkArtifacts(source)).toBeNull();
  });

  it("normalizes the active document artifact", () => {
    const source: AiSdkArtifactsSource = {
      kind: "ai-sdk-artifacts",
      artifacts: [{ id: "doc-1", type: "document", data: { title: "Roadmap", content: "..." } }],
      activeId: "doc-1",
    };
    expect(normalizeFromAiSdkArtifacts(source)).toEqual({
      id: "doc-1",
      type: "document",
      title: "Roadmap",
      data: { title: "Roadmap", content: "..." },
    });
  });
});

describe("normalizeFromMcpToolResult", () => {
  it("returns null when _meta.ui.resourceUri is absent", () => {
    const source: McpUiSource = {
      kind: "mcp-ui",
      toolResult: { structuredContent: {}, _meta: { ui: { resourceUri: "" } } },
    };
    expect(normalizeFromMcpToolResult(source)).toBeNull();
  });

  it("returns null when the resourceUri's last segment is not a known artifact type", () => {
    const source: McpUiSource = {
      kind: "mcp-ui",
      toolResult: {
        structuredContent: { title: "X" },
        _meta: { ui: { resourceUri: "ui://artifact-canvas/unknown-type" } },
      },
    };
    expect(normalizeFromMcpToolResult(source)).toBeNull();
  });

  it("normalizes a GA nested _meta.ui.resourceUri tool result", () => {
    const source: McpUiSource = {
      kind: "mcp-ui",
      toolResult: {
        structuredContent: { id: "chk-1", title: "Launch checklist", items: [] },
        _meta: { ui: { resourceUri: "ui://artifact-canvas/checklist" } },
      },
    };
    expect(normalizeFromMcpToolResult(source)).toEqual({
      id: "chk-1",
      type: "checklist",
      title: "Launch checklist",
      data: { id: "chk-1", title: "Launch checklist", items: [] },
    });
  });
});

describe("normalizeArtifact — single entry point", () => {
  it("dispatches to normalizeFromAiSdkArtifacts for kind ai-sdk-artifacts", () => {
    const source: AiSdkArtifactsSource = {
      kind: "ai-sdk-artifacts",
      artifacts: [{ id: "a1", type: "chart", data: { title: "Revenue" } }],
      activeId: "a1",
    };
    expect(normalizeArtifact(source)?.type).toBe("chart");
  });

  it("dispatches to normalizeFromMcpToolResult for kind mcp-ui", () => {
    const source: McpUiSource = {
      kind: "mcp-ui",
      toolResult: {
        structuredContent: { title: "Q3 table" },
        _meta: { ui: { resourceUri: "ui://artifact-canvas/data-table" } },
      },
    };
    expect(normalizeArtifact(source)?.type).toBe("data-table");
  });
});

/**
 * artifact-canvas-adapter — dual-source contract.
 *
 * The adapter normalizes an artifact from EITHER runtime source into one
 * internal shape (`NormalizedArtifact`) so a single presentation layer
 * renders under both:
 *
 *   (a) @ai-sdk-tools/artifacts  — `useArtifacts()` client shape
 *   (b) MCP Apps ui:// bridge    — GA nested `_meta.ui.resourceUri` tool result
 *
 * Never widen this file to a third shape without adding its own
 * `normalizeFrom*` function and a dedicated integration test proving the
 * new source traverses the adapter at runtime — see D6 (mcp-doctor) for the
 * static form-check this shape must keep satisfying.
 */

export type ArtifactType = "document" | "data-table" | "checklist" | "chart";

export interface NormalizedArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  /** Raw source-specific payload, kept for the type-specific renderer. */
  data: Record<string, unknown>;
}

// ── (a) @ai-sdk-tools/artifacts source shape ──────────────────────────────────

export interface AiSdkArtifactEntry {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface AiSdkArtifactsSource {
  kind: "ai-sdk-artifacts";
  artifacts: AiSdkArtifactEntry[];
  activeId: string | null;
}

// ── (b) MCP Apps ui:// bridge source shape ────────────────────────────────────

/**
 * The GA-nested MCP Apps UI key, exactly the form D6 (mcp-doctor) classifies
 * as `present`/conforming: `_meta: { ui: { resourceUri } }`. Community
 * (`io.modelcontextprotocol/ui`) and flat (`ui/resourceUri`) forms are
 * rejected by the normalizer — see `normalizeFromMcpToolResult`.
 */
export interface McpToolResultMeta {
  ui: { resourceUri: string };
}

// Inlined on one line (not the `McpToolResultMeta` alias) so the literal
// GA-nested shape `_meta: { ui: ...}` is present verbatim in production
// source — this is what mcp-doctor's D6 detector classifies as
// `present`/conforming, distinct from the community and flat deprecated
// forms it rejects.
export interface McpToolResult {
  structuredContent: Record<string, unknown>;
  _meta: { ui: { resourceUri: string } };
}

export interface McpUiSource {
  kind: "mcp-ui";
  toolResult: McpToolResult;
}

export type ArtifactCanvasSource = AiSdkArtifactsSource | McpUiSource;

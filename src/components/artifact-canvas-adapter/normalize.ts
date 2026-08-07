import type {
  AiSdkArtifactsSource,
  ArtifactCanvasSource,
  ArtifactType,
  McpUiSource,
  NormalizedArtifact,
} from "./types.js";

const KNOWN_TYPES: readonly ArtifactType[] = ["document", "data-table", "checklist", "chart"];

function isArtifactType(value: string): value is ArtifactType {
  return (KNOWN_TYPES as readonly string[]).includes(value);
}

function titleFromData(data: Record<string, unknown>): string {
  return typeof data.title === "string" ? data.title : "";
}

/** Source (a): @ai-sdk-tools/artifacts `useArtifacts()` shape. */
export function normalizeFromAiSdkArtifacts(
  source: AiSdkArtifactsSource,
): NormalizedArtifact | null {
  if (!source.activeId) return null;
  const entry = source.artifacts.find((a) => a.id === source.activeId);
  if (!entry) return null;
  if (!isArtifactType(entry.type)) return null;
  return {
    id: entry.id,
    type: entry.type,
    title: titleFromData(entry.data),
    data: entry.data,
  };
}

/**
 * Source (b): MCP Apps ui:// bridge. Requires the GA-nested key
 * `_meta.ui.resourceUri` (matches mcp-doctor D6 `present`/conforming state).
 * The artifact type is the last path segment of the resourceUri
 * (`ui://artifact-canvas/document` -> "document"); `structuredContent` is
 * the artifact payload, same shape family as the ai-sdk-artifacts entry.
 */
export function normalizeFromMcpToolResult(source: McpUiSource): NormalizedArtifact | null {
  const resourceUri = source.toolResult?._meta?.ui?.resourceUri;
  if (!resourceUri) return null;

  const segments = resourceUri.split("/").filter(Boolean);
  const typeSegment = segments[segments.length - 1];
  if (!typeSegment || !isArtifactType(typeSegment)) return null;

  const data = source.toolResult.structuredContent ?? {};
  const id = typeof data.id === "string" ? data.id : resourceUri;

  return {
    id,
    type: typeSegment,
    title: titleFromData(data),
    data,
  };
}

/** Single entry point: dispatches to the right normalizer by `source.kind`. */
export function normalizeArtifact(source: ArtifactCanvasSource): NormalizedArtifact | null {
  if (source.kind === "ai-sdk-artifacts") return normalizeFromAiSdkArtifacts(source);
  if (source.kind === "mcp-ui") return normalizeFromMcpToolResult(source);
  return null;
}

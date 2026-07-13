/**
 * MosaicAgentPreview — presentational, controlled preview of an agent
 * configuration before creation is confirmed.
 *
 * Ported from components/agent-config/AgentPreview.tsx (any-debate-ai).
 *
 * Pure presentational — no business data (roles/personas/frameworks/models
 * are host-domain concepts and are NOT baked into this component). The host
 * passes a generic list of `attributes` (label/value pairs) for the
 * "detailed" variant, or a single `tagline` for the "summary" variant.
 *
 * Contract is non-lying: `variant` is a discriminated union — `tagline` +
 * `badgeLabel` only exist on the "summary" shape, `title` + `attributes` only
 * exist on the "detailed" shape. A field is required exactly where it is read.
 */

import { agentPreviewVariants } from "./agent-preview-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicAgentPreviewAttribute {
  id: string;
  label: string;
  value: string;
}

interface MosaicAgentPreviewBaseProps {
  /** The agent's display name. Required — no default, no fallback string. */
  name: string;
  className?: string;
}

export interface MosaicAgentPreviewSummaryProps extends MosaicAgentPreviewBaseProps {
  variant: "summary";
  /** One-line description shown under the name. Required — host-owned. */
  tagline: string;
  /** Label for the trailing badge (e.g. "Custom"). Required — host-owned. */
  badgeLabel: string;
}

export interface MosaicAgentPreviewDetailedProps extends MosaicAgentPreviewBaseProps {
  variant: "detailed";
  /** Card title (e.g. "Configuration Summary"). Required — host-owned. */
  title: string;
  /** Generic label/value rows. Required — no business data baked in. */
  attributes: MosaicAgentPreviewAttribute[];
}

export type MosaicAgentPreviewProps =
  | MosaicAgentPreviewSummaryProps
  | MosaicAgentPreviewDetailedProps;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicAgentPreview — read-only preview of an agent configuration before
 * the host confirms creation.
 *
 * @example
 * <MosaicAgentPreview
 *   variant="summary"
 *   name="StrategyBot"
 *   tagline="Analyst • Formal • Claude Sonnet"
 *   badgeLabel="Custom"
 * />
 *
 * @example
 * <MosaicAgentPreview
 *   variant="detailed"
 *   name="StrategyBot"
 *   title="Configuration Summary"
 *   attributes={[{ id: "role", label: "Role", value: "Strategist" }]}
 * />
 */
export function MosaicAgentPreview(props: MosaicAgentPreviewProps) {
  if (props.variant === "detailed") {
    const { name, title, attributes, className } = props;
    return (
      <div
        data-slot="agent-preview"
        className={cn(agentPreviewVariants({ variant: "detailed" }), className)}
      >
        <div data-slot="agent-preview-header" className="p-4 pb-0">
          <p className="text-base font-semibold leading-none tracking-tight">{title}</p>
        </div>
        <div className="p-4">
          <p className="mb-3 truncate text-sm font-medium">{name}</p>
          {attributes.length > 0 && (
            <ul className="space-y-2">
              {attributes.map((attribute) => (
                <li
                  key={attribute.id}
                  data-slot="agent-preview-attribute"
                  className="flex items-start justify-between gap-3"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {attribute.label}
                  </span>
                  <span className="text-xs font-medium">{attribute.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  const { name, tagline, badgeLabel, className } = props;
  return (
    <div
      data-slot="agent-preview"
      className={cn(agentPreviewVariants({ variant: "summary" }), className)}
    >
      <span
        aria-hidden="true"
        data-slot="agent-preview-avatar"
        className="h-10 w-10 shrink-0 rounded-full bg-primary/10"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{tagline}</p>
      </div>
      <span
        data-slot="agent-preview-badge"
        className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground"
      >
        {badgeLabel}
      </span>
    </div>
  );
}

MosaicAgentPreview.displayName = "MosaicAgentPreview";

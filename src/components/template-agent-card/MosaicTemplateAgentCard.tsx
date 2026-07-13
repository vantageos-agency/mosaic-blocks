"use client";

/**
 * MosaicTemplateAgentCard — agent-type template preview card
 *
 * Ported from any-debate-ai's components/templates/TemplateCard.tsx.
 *
 * What was dropped and why:
 * - `useDevice()` / `isMobile` breakpoint branching — a JS-side responsive
 *   toggle is app-specific plumbing, not a library concern. The host controls
 *   density via `className` / CSS container queries instead.
 * - `conversationIcons` (debate/collaboration/analysis -> lucide icon map) and
 *   the `isPopular`/`isTrending` thresholds derived from `usageCount` — both
 *   are hardcoded business knowledge (a taxonomy of conversation types, and a
 *   "popular" threshold) that does not belong in the component. The host
 *   passes an optional `icon` node and decides its own popularity badges, if
 *   any, via composition around this card.
 * - `framer-motion` hover/tap scale — not a locked dependency here; dropped
 *   with a plain CSS `transition-all` on the CVA root instead.
 * - lucide-react icons — no icon library dependency in this repo; inline SVG
 *   only, same as MosaicAgentCard / MosaicModuleCard / MosaicMemoryCard.
 *
 * a11y fix vs. the source: the source made the whole `<Card>` a `<div
 * onClick>` with nested `<Button>`s for preview/duplicate (stopping click
 * propagation). A `<div onClick>` is not keyboard-actionable, and nesting
 * `<button>` inside a clickable non-button element is fragile. Here the
 * "select" affordance is its own real `<button>` (name + `aria-pressed`
 * driven by the host), and preview/duplicate are SIBLING buttons — never
 * nested inside another interactive element.
 *
 * SIN-01 (bilingual by design): every visible string is a required prop or a
 * required formatter function, no default, no fallback operator, no
 * destructuring default. `agentCountLabel` is the one exception that would
 * look surprising: it is the fully-formatted string ("3 agents"), not a
 * number, because pluralization is a locale rule the library must not own.
 *
 * Pattern: MosaicMemoryCard.tsx (data-slot, cva variants module, manual
 * dropdown-free actions row, inline SVG icons, React 19 ref prop,
 * displayName, JSDoc, formatter props over hardcoded strings).
 * Design tokens: --card, --card-foreground, --border, --primary,
 * --muted-foreground, --muted.
 * No icon library — inline SVGs only.
 */

import type * as React from "react";
import {
  templateAgentCardBadgeVariants,
  templateAgentCardTagVariants,
  templateAgentCardVariants,
} from "./template-agent-card-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicTemplateAgentData {
  id: string;
  name: string;
  description: string;
  /** Number of agents composing this template. Formatted by the host via `agentCountLabel`. */
  agentCount: number;
  /** Raw usage count. Formatted by the host via `formatUsageCount`. */
  usageCount: number;
  /** Free-form category string — host-owned taxonomy, never a library enum. */
  category?: string;
  tags?: string[];
}

export interface MosaicTemplateAgentCardProps {
  template: MosaicTemplateAgentData;
  isSelected?: boolean;
  onSelect: (template: MosaicTemplateAgentData) => void;
  onPreview?: (template: MosaicTemplateAgentData) => void;
  onDuplicate?: (template: MosaicTemplateAgentData) => void;
  /** Optional leading icon — host-owned, no default (no icon-library dependency here). */
  icon?: React.ReactNode;
  /**
   * Accessible name for the card's clickable "select" button. Required —
   * host-owned (e.g. `t("templates.select", { name: template.name })`).
   */
  selectAriaLabel: string;
  /**
   * Fully-formatted agent-count caption (e.g. "3 agents"). Required — the
   * host owns pluralization and language, the library never counts words.
   */
  agentCountLabel: string;
  /**
   * Formatter producing the usage-count caption from `template.usageCount`.
   * Required — always called, even when the count is 0; a host that wants
   * the badge hidden at 0 returns `null` from this formatter itself.
   */
  formatUsageCount: (count: number) => React.ReactNode;
  /**
   * Formatter producing the "+N" overflow caption when a template has more
   * than 3 tags. Required — host-owned (e.g. `(n) => \`+\${n}\`` or a
   * pluralized `t()` call).
   */
  formatMoreTags: (count: number) => React.ReactNode;
  /** aria-label for the preview action. Required, no default. */
  previewAriaLabel: string;
  /** aria-label for the duplicate action. Required, no default. */
  duplicateAriaLabel: string;
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
}

const MAX_VISIBLE_TAGS = 3;

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicTemplateAgentCard — production template preview card for
 * @vantageos/mosaic-blocks. Presentational and controlled: it renders a
 * template's identity and metadata and reports intents (`onSelect`,
 * `onPreview`, `onDuplicate`) — it never decides anything about the data.
 *
 * @example
 * <MosaicTemplateAgentCard
 *   template={template}
 *   isSelected={selectedId === template.id}
 *   onSelect={(t) => setSelectedId(t.id)}
 *   onPreview={(t) => openPreview(t)}
 *   onDuplicate={(t) => duplicateTemplate(t)}
 *   selectAriaLabel={t("templates.select", { name: template.name })}
 *   agentCountLabel={t("templates.agentCount", { count: template.agentCount })}
 *   formatUsageCount={(count) => (count > 0 ? t("templates.uses", { count }) : null)}
 *   formatMoreTags={(count) => `+${count}`}
 *   previewAriaLabel={t("templates.preview")}
 *   duplicateAriaLabel={t("templates.duplicate")}
 * />
 */
export function MosaicTemplateAgentCard({
  template,
  isSelected = false,
  onSelect,
  onPreview,
  onDuplicate,
  icon,
  selectAriaLabel,
  agentCountLabel,
  formatUsageCount,
  formatMoreTags,
  previewAriaLabel,
  duplicateAriaLabel,
  className,
  ref,
}: MosaicTemplateAgentCardProps) {
  const visibleTags = template.tags?.slice(0, MAX_VISIBLE_TAGS) ?? [];
  const hiddenTagCount = (template.tags?.length ?? 0) - visibleTags.length;

  return (
    <div
      ref={ref}
      data-slot="template-agent-card"
      className={cn(templateAgentCardVariants({ selected: isSelected }), "p-4", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onSelect(template)}
          aria-label={selectAriaLabel}
          aria-pressed={isSelected}
          className={cn(
            "flex min-w-0 flex-1 items-start gap-2 rounded-md text-left",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {icon && (
            <span className="mt-0.5 shrink-0 text-primary" aria-hidden="true">
              {icon}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-tight">
              {template.name}
            </span>
            <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">
              {template.description}
            </span>
          </span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {template.category && (
          <span className={cn(templateAgentCardBadgeVariants())}>{template.category}</span>
        )}
        <span className={cn(templateAgentCardBadgeVariants())}>{agentCountLabel}</span>
        {formatUsageCount(template.usageCount) != null && (
          <span className={cn(templateAgentCardBadgeVariants())}>
            {formatUsageCount(template.usageCount)}
          </span>
        )}
        {visibleTags.map((tag) => (
          <span key={tag} className={cn(templateAgentCardTagVariants())}>
            {tag}
          </span>
        ))}
        {hiddenTagCount > 0 && (
          <span className={cn(templateAgentCardTagVariants())}>
            {formatMoreTags(hiddenTagCount)}
          </span>
        )}
      </div>

      {(onPreview || onDuplicate) && (
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-2">
          {onPreview && (
            <button
              type="button"
              onClick={() => onPreview(template)}
              aria-label={previewAriaLabel}
              className={cn(
                "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <EyeIcon />
              {previewAriaLabel}
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(template)}
              aria-label={duplicateAriaLabel}
              className={cn(
                "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <CopyIcon />
              {duplicateAriaLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

MosaicTemplateAgentCard.displayName = "MosaicTemplateAgentCard";

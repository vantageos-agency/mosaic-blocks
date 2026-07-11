"use client";

/**
 * MosaicModuleCard — selected-module display card (PC-11)
 *
 * Ported (source: private upstream) components/agent-composer/ModuleCard.tsx
 *
 * Displays a selected module (role / persona / framework / any custom type)
 * with name, description, optional tags/details string, and edit/remove actions.
 * Used inside AgentComposer Desktop + Mobile variants.
 *
 * Generalized: removed debate-specific types (Role, Persona, ThinkingFramework)
 * in favour of a generic MosaicModuleData interface.
 * Removed useDevice dependency (parent controls layout context).
 *
 * Framer-motion: N/A.
 * Icons: inline SVG (no lucide dep).
 */

import type * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicModuleData {
  name: string;
  description?: string;
  /** Short detail string shown below description (e.g. "3 steps", "Expertise: UX, Research") */
  details?: string;
  /** Optional emoji or short string icon displayed in the card */
  icon?: string;
  /** Optional array of tag strings shown as badges */
  tags?: string[];
}

export type MosaicModuleType = "role" | "persona" | "framework" | string;

export interface MosaicModuleCardProps {
  type: MosaicModuleType;
  module: MosaicModuleData;
  onRemove?: () => void;
  onEdit?: () => void;
  isSelected?: boolean;
  isCustom?: boolean;
  /** Badge label shown when `isCustom` is true. Required, no default. */
  customBadgeLabel: string;
  /** aria-label for the edit button. Required, no default. */
  editAriaLabel: string;
  /** aria-label for the remove button. Required, no default. */
  removeAriaLabel: string;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

// ── Inline icons ──────────────────────────────────────────────────────────────

function EditIcon() {
  return (
    <svg
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
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicModuleCard — filled-state card for a selected module slot.
 * Shows name, description, optional details, icon, tags, and edit/remove actions.
 *
 * @example
 * <MosaicModuleCard
 *   type="role"
 *   module={{ name: "Product Manager", description: "Drives product strategy", tags: ["strategy", "roadmap"] }}
 *   onEdit={() => openRolePicker()}
 *   onRemove={() => clearRole()}
 * />
 */
export function MosaicModuleCard({
  type: _type,
  module,
  onRemove,
  onEdit,
  isSelected = false,
  isCustom = false,
  customBadgeLabel,
  editAriaLabel,
  removeAriaLabel,
  className,
  ref,
}: MosaicModuleCardProps) {
  return (
    <div
      ref={ref}
      data-slot="module-card"
      className={cn(
        "min-h-[80px] rounded-xl border border-border bg-card p-4 transition-all",
        "flex items-start gap-3",
        isSelected && "ring-2 ring-primary bg-primary/5",
        className,
      )}
    >
      {/* Icon */}
      {module.icon && (
        <span className="mt-0.5 shrink-0 text-2xl" aria-hidden="true">
          {module.icon}
        </span>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h4 className="truncate text-sm font-medium text-foreground">{module.name}</h4>
          {isCustom && (
            <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {customBadgeLabel}
            </span>
          )}
        </div>

        {module.description && (
          <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{module.description}</p>
        )}

        {module.details && (
          <p className="truncate text-xs font-medium text-muted-foreground/80">{module.details}</p>
        )}

        {module.tags && module.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {module.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {(onEdit || onRemove) && (
        <div className="flex shrink-0 items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={editAriaLabel}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <EditIcon />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={removeAriaLabel}
              className="flex h-8 w-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RemoveIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

MosaicModuleCard.displayName = "MosaicModuleCard";

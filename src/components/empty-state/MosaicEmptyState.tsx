/**
 * MosaicEmptyState — centered vertical stack for empty/zero-data states
 *
 * Presentational atom. No icon library dependency — caller passes any ReactNode.
 * Design tokens: text-foreground, text-muted-foreground, gap-4.
 * Pattern: Button.tsx (data-slot, inline cn, React 19 ref prop, displayName, JSDoc).
 *
 * @example
 * <MosaicEmptyState
 *   icon={<InboxIcon className="size-10 text-muted-foreground" />}
 *   title="No messages yet"
 *   description="Send your first message to get started."
 *   action={<MosaicButton>New message</MosaicButton>}
 * />
 */

import type * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface MosaicEmptyStateProps {
  /** Optional icon node rendered at the top, above the title. */
  icon?: React.ReactNode;
  /** Primary heading — required. */
  title: React.ReactNode;
  /** Supporting description text rendered below the title. */
  description?: React.ReactNode;
  /** Optional CTA rendered at the bottom (a button, link, or any node). */
  action?: React.ReactNode;
  /** Additional Tailwind classes for the root container. */
  className?: string;
  /** React 19 ref prop — no forwardRef wrapper needed. */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * MosaicEmptyState — empty / zero-data state atom for @vantageos/mosaic-blocks.
 *
 * Renders a centered vertical stack: icon → title → description → action.
 * All slots except `title` are optional. Caller owns the icon node (no icon
 * library bundled). Accessible: uses semantic heading inside.
 *
 * @example
 * <MosaicEmptyState
 *   icon={<FolderOpenIcon className="size-10 text-muted-foreground" />}
 *   title="No projects"
 *   description="Create your first project to get started."
 *   action={<button type="button">New project</button>}
 * />
 */
export function MosaicEmptyState({
  icon,
  title,
  description,
  action,
  className,
  ref,
}: MosaicEmptyStateProps) {
  return (
    <div
      ref={ref}
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-4 py-12 text-center",
        className,
      )}
    >
      {icon != null && (
        <div
          data-slot="empty-state-icon"
          className="flex items-center justify-center text-muted-foreground"
        >
          {icon}
        </div>
      )}

      <div data-slot="empty-state-text" className="flex flex-col gap-1.5">
        <h3 data-slot="empty-state-title" className="text-base font-medium text-foreground">
          {title}
        </h3>

        {description != null && (
          <p data-slot="empty-state-description" className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {action != null && (
        <div data-slot="empty-state-action" className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}

MosaicEmptyState.displayName = "MosaicEmptyState";

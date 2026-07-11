"use client";

/**
 * MosaicAgentCard — generic agent/resource card with status toggle
 *
 * Ported from components/agent-management/AgentCard.tsx
 *
 * Features:
 * - Status indicator bar (top) + colored dot (model type)
 * - Active/inactive badge + toggle button
 * - 3-dot dropdown menu (activate/deactivate, edit, delete)
 * - Accent dot color per agent type via props
 *
 * Framer-motion replaced with CSS transitions.
 * toast/router removed — all actions are callbacks.
 * next/navigation removed.
 */

import * as React from "react";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MosaicAgentData {
  id: string;
  name: string;
  description?: string;
  type?: string;
  isActive?: boolean;
  createdAt?: string | Date;
  /** Tailwind bg class for the accent dot (e.g. "bg-green-500") */
  accentColor?: string;
  /** Whether edit/delete actions are available */
  isEditable?: boolean;
}

export interface MosaicAgentCardProps {
  agent: MosaicAgentData;
  onToggleStatus?: (agentId: string) => void;
  onDelete?: (agentId: string) => void;
  onEdit?: (agentId: string) => void;
  /** Whether a toggle/save action is in progress */
  isLoading?: boolean;
  /**
   * Label shown in the "active" badge next to the agent name. Required —
   * the host owns the language (e.g. `t('AgentCard.active')`). No default.
   */
  activeBadgeLabel: string;
  /**
   * aria-label for the 3-dot actions menu trigger. Required — host-owned,
   * no default.
   */
  agentActionsAriaLabel: string;
  /** Label for the "deactivate" menu item. Required — host-owned, no default. */
  deactivateLabel: string;
  /** Label for the "activate" menu item. Required — host-owned, no default. */
  activateLabel: string;
  /** Label for the "edit" menu item. Required — host-owned, no default. */
  editLabel: string;
  /** Label for the "delete" menu item. Required — host-owned, no default. */
  deleteLabel: string;
  /** Label for the "pause" toggle button. Required — host-owned, no default. */
  pauseLabel: string;
  /** Label for the "start" toggle button. Required — host-owned, no default. */
  startLabel: string;
  /**
   * Formatter for the "Created <date>" caption. Required — the host owns
   * the language (e.g. `(date) => t('AgentCard.created', { date })`).
   */
  createdLabel: (date: string) => string;
  className?: string;
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────

function MoreVertIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

function PlayIcon() {
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
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
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
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function EditIcon() {
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
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MosaicAgentCard({
  agent,
  onToggleStatus,
  onDelete,
  onEdit,
  isLoading = false,
  activeBadgeLabel,
  agentActionsAriaLabel,
  deactivateLabel,
  activateLabel,
  editLabel,
  deleteLabel,
  pauseLabel,
  startLabel,
  createdLabel,
  className,
}: MosaicAgentCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const formattedDate = agent.createdAt
    ? new Date(agent.createdAt).toLocaleDateString()
    : undefined;

  // Close menu on outside click
  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div
      data-slot="agent-card"
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        "transition-shadow hover:shadow-md",
        agent.isActive && "ring-2 ring-primary",
        className,
      )}
    >
      {/* Status bar */}
      <div
        className={cn(
          "absolute left-0 top-0 h-1 w-full",
          agent.isActive ? "bg-primary" : "bg-muted",
        )}
      />

      <div className="p-4 pt-5">
        <div className="flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {agent.accentColor && (
              <span
                className={cn("h-3 w-3 shrink-0 rounded-full", agent.accentColor)}
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-semibold">{agent.name}</p>
                {agent.isActive && (
                  <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {activeBadgeLabel}
                  </span>
                )}
              </div>
              {agent.description && (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{agent.description}</p>
              )}
            </div>
          </div>

          {/* 3-dot menu */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              aria-label={agentActionsAriaLabel}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreVertIcon />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className={cn(
                  "absolute right-0 top-full z-50 mt-1 min-w-[140px] rounded-md border border-border",
                  "bg-popover py-1 shadow-md",
                )}
              >
                {onToggleStatus && (
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isLoading}
                    onClick={() => {
                      onToggleStatus(agent.id);
                      setMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground",
                      "hover:bg-accent hover:text-accent-foreground",
                      "disabled:pointer-events-none disabled:opacity-50",
                    )}
                  >
                    {agent.isActive ? <PauseIcon /> : <PlayIcon />}
                    {agent.isActive ? deactivateLabel : activateLabel}
                  </button>
                )}
                {agent.isEditable && onEdit && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onEdit(agent.id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <EditIcon />
                    {editLabel}
                  </button>
                )}
                {agent.isEditable && onDelete && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onDelete(agent.id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <TrashIcon />
                    {deleteLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {agent.type && (
              <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium">
                {agent.type}
              </span>
            )}
            {formattedDate && (
              <span className="text-xs text-muted-foreground">{createdLabel(formattedDate)}</span>
            )}
          </div>

          {onToggleStatus && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onToggleStatus(agent.id)}
              className={cn(
                "inline-flex h-7 items-center justify-center rounded-md px-3 text-xs font-medium",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-50",
                agent.isActive
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {agent.isActive ? pauseLabel : startLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

MosaicAgentCard.displayName = "MosaicAgentCard";

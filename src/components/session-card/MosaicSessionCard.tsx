"use client";

/**
 * MosaicSessionCard — a single work-in-progress session at a glance
 * (default / compact variants)
 *
 * A "session" is host data: a piece of work in progress (e.g. a mandate),
 * carrying an id, a title, a host-defined status, and a last-updated
 * timestamp. The card renders exactly that state — it never fetches,
 * derives, or infers anything of its own.
 *
 * Two density variants, modeled as ONE component with a `variant` prop
 * (not two components) — same doctrine as MosaicMemoryCard:
 * - `"default"` (default): full card, includes a labelled "last updated"
 *   footer caption, produced by `formatUpdatedAt`.
 * - `"compact"`: single dense row, drops the "last updated" footer
 *   entirely and never calls `formatUpdatedAt` — so it is NOT required on
 *   this variant (no-lying-prop-contract: a prop is required exactly on
 *   the branch that reads it).
 *
 * Selection is opt-in and travels as a pair: `onSelect` and `selectLabel`
 * are either both present or both absent. Absent (default) — the root is
 * a plain, non-interactive container: no `role="button"`, no
 * `aria-label`. Present — the root becomes a keyboard-operable
 * button-role element (Enter/Space activate it, same as a native
 * `<button>`), with `aria-label={selectLabel}` required and host-owned
 * (SIN-01 — no fallback word).
 *
 * Composed from this repo's own primitives: `MosaicCard` (root/header/
 * content/footer) + `MosaicBadge` (status chip) — not re-implemented.
 *
 * Pattern: MosaicMemoryCard.tsx (data-slot, inline utility `cn`, React 19
 * ref prop, displayName, JSDoc, discriminated-union variant props).
 * Design tokens: --card, --card-foreground, --border, --muted-foreground,
 * --ring (via MosaicCard / MosaicBadge — no ad-hoc colors here).
 * Bilingual (SIN-01): zero user-facing strings hardcoded. `formatStatus` /
 * `formatUpdatedAt` / `selectLabel` are all host-owned, no default.
 * Zero I/O — the card never fetches; all state is host-supplied.
 *
 * @example
 * // Default variant — full card, "last updated" footer
 * <MosaicSessionCard
 *   session={session}
 *   formatStatus={(status) => t(`session.status.${status}`)}
 *   formatUpdatedAt={(updatedAt) => t("session.updatedAt", { value: formatRelative(updatedAt) })}
 * />
 *
 * @example
 * // Compact variant — no footer, no formatUpdatedAt call at all
 * <MosaicSessionCard
 *   session={session}
 *   variant="compact"
 *   formatStatus={(status) => t(`session.status.${status}`)}
 * />
 *
 * @example
 * // Selectable — onSelect + selectLabel travel together
 * <MosaicSessionCard
 *   session={session}
 *   formatStatus={(status) => t(`session.status.${status}`)}
 *   formatUpdatedAt={(updatedAt) => formatRelative(updatedAt)}
 *   onSelect={(id) => openSession(id)}
 *   selectLabel={t("session.open", { title: session.title })}
 * />
 */

import type * as React from "react";
import { MosaicBadge } from "../badge/MosaicBadge.js";
import {
  MosaicCard,
  MosaicCardContent,
  MosaicCardFooter,
  MosaicCardHeader,
} from "../card/MosaicCard.js";
import { sessionCardVariants } from "./session-card-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MosaicSessionStatus = "active" | "waiting" | "blocked" | "done";

export interface MosaicSessionData {
  id: string;
  title: string;
  status: MosaicSessionStatus;
  /** Epoch milliseconds. */
  updatedAt: number;
}

/** Props read unconditionally regardless of `variant` or selectability. */
export interface MosaicSessionCardBaseProps {
  session: MosaicSessionData;
  /**
   * Formatter mapping `session.status` to its displayed label. Required —
   * the host owns the language (e.g. `(status) => t(\`session.status.\${status}\`)`).
   */
  formatStatus: (status: MosaicSessionStatus) => React.ReactNode;
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * Discriminated union on `variant` — `formatUpdatedAt` is required EXACTLY
 * on the `"default"` member (the only one that renders a "last updated"
 * footer). The `"compact"` member never renders that footer and never
 * calls `formatUpdatedAt` — requiring it there would force every host to
 * supply a value the library never displays (a "lying prop contract").
 */
export type MosaicSessionCardVariantProps =
  | {
      /**
       * Full card layout with a labelled "last updated" footer.
       * Default when omitted.
       * @default "default"
       */
      variant?: "default";
      /**
       * Formatter producing the "last updated" caption from
       * `session.updatedAt`. Only ever rendered in the `"default"`
       * variant — required here, not on `"compact"`. Host-owned.
       */
      formatUpdatedAt: (updatedAt: number) => React.ReactNode;
    }
  | {
      /** Dense single-row layout — no "last updated" footer, no call. */
      variant: "compact";
    };

/**
 * Discriminated union on selectability — `onSelect` and `selectLabel`
 * travel together. Absent by default: the root stays a plain,
 * non-interactive container. Present: the root becomes a keyboard-operable
 * `role="button"` element and `selectLabel` (required, host-owned, no
 * default) becomes its `aria-label`.
 */
export type MosaicSessionCardInteractionProps =
  | { onSelect?: undefined; selectLabel?: undefined }
  | {
      /** Called with `session.id` on click / Enter / Space. */
      onSelect: (sessionId: string) => void;
      /** aria-label for the selectable root. Required — host-owned, no default. */
      selectLabel: string;
    };

export type MosaicSessionCardProps = MosaicSessionCardBaseProps &
  MosaicSessionCardVariantProps &
  MosaicSessionCardInteractionProps;

const ACTIVATION_KEYS = new Set(["Enter", " "]);

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicSessionCard — production single-session card for
 * @vantageos/mosaic-blocks.
 *
 * One component, two density variants (`default` default / `compact`),
 * opt-in selectability — see file JSDoc for the exact prop contract.
 */
export function MosaicSessionCard(props: MosaicSessionCardProps) {
  const { session, formatStatus, className, ref, onSelect, selectLabel } = props;
  const selectable = Boolean(onSelect);

  function activate() {
    onSelect?.(session.id);
  }

  const interactionProps = selectable
    ? {
        role: "button" as const,
        tabIndex: 0,
        "aria-label": selectLabel,
        onClick: activate,
        onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
          if (ACTIVATION_KEYS.has(event.key)) {
            event.preventDefault();
            activate();
          }
        },
      }
    : {};

  const statusBadge = (
    <MosaicBadge data-slot="session-card-status">{formatStatus(session.status)}</MosaicBadge>
  );

  if (props.variant === "compact") {
    return (
      <MosaicCard
        ref={ref}
        data-slot="session-card"
        data-variant="compact"
        className={cn(sessionCardVariants({ variant: "compact", selectable }), className)}
        {...interactionProps}
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{session.title}</span>
        {statusBadge}
      </MosaicCard>
    );
  }

  return (
    <MosaicCard
      ref={ref}
      data-slot="session-card"
      data-variant="default"
      className={cn(sessionCardVariants({ variant: "default", selectable }), className)}
      {...interactionProps}
    >
      <MosaicCardHeader className="flex-row items-center justify-between gap-3 p-0">
        <h3 className="line-clamp-1 text-base font-semibold">{session.title}</h3>
        {statusBadge}
      </MosaicCardHeader>
      <MosaicCardContent className="p-0 pt-3">
        <MosaicCardFooter
          data-slot="session-card-updated-at"
          className="p-0 pt-2 text-xs text-muted-foreground"
        >
          {props.formatUpdatedAt(session.updatedAt)}
        </MosaicCardFooter>
      </MosaicCardContent>
    </MosaicCard>
  );
}

MosaicSessionCard.displayName = "MosaicSessionCard";

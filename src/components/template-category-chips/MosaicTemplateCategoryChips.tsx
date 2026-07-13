/**
 * MosaicTemplateCategoryChips — presentational horizontal chip row filtering
 * agent-templates by category.
 *
 * Ported from any-debate-ai `components/templates/shared/
 * TemplateCategoryChips.tsx` (source read verbatim via `gh api repos/
 * elpiarthera/any-debate-ai/contents/components/templates/shared/
 * TemplateCategoryChips.tsx`). That source hardcodes the `"All"` sentinel
 * string in its prop type (`TemplateCategory | "All"`) and imports a closed
 * `TemplateCategory` union from `@/lib/templates/types` — both a business
 * taxonomy AND a business copy string baked into the component. It also
 * omits scroll-fade / arrow chrome handling from this port (that is
 * presentation-shell concern, not the filter atom itself) and drops the
 * `useDevice()` mobile/desktop branch — a single responsive `flex-wrap` row
 * covers both, since this library never assumes a host's device-detection
 * context exists.
 *
 * Differentiator (the whole point of this component): the category
 * catalogue — including any "All" / "Tous" pseudo-category — is 100%
 * host-supplied DATA (`categories` prop). This library has never heard of a
 * single business category name; a client with a different vertical (legal,
 * healthcare, e-commerce) supplies its own list without touching this
 * package.
 *
 * Controlled component: no internal selection state. `selected` +
 * `onSelect` are host-owned; the host re-renders with the new selection
 * after handling the callback.
 *
 * No "use client" — prepend-use-client.mjs adds it to dist.
 * Design tokens: --primary, --primary-foreground, --background,
 * --foreground, --border, --muted, --ring.
 * a11y: every chip is a real `<button>` (keyboard-activatable natively —
 * Enter/Space), and the selected chip announces `aria-pressed="true"` so
 * screen-reader users get the selection state without relying on color
 * alone.
 * Bilingual: every category label is host-supplied data — zero hardcoded
 * copy, zero default (including the "All" / "Tous" sentinel).
 *
 * @example
 * <MosaicTemplateCategoryChips
 *   categories={[
 *     { id: "all", label: "Toutes" },
 *     { id: "business", label: "Business" },
 *     { id: "creative", label: "Créatif" },
 *   ]}
 *   selected={selectedCategoryId}
 *   onSelect={(id) => setSelectedCategoryId(id)}
 * />
 */

import type * as React from "react";
import { templateCategoryChipVariants } from "./template-category-chips-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * One selectable category. The library knows nothing about any category by
 * name — including the "show everything" pseudo-category, which is just
 * another host-supplied entry (e.g. `{ id: "all", label: "All" }`).
 */
export interface MosaicTemplateCategory {
  /** Stable identifier, matched against `selected` and passed to `onSelect`. */
  id: string;
  /** Host-supplied, host-localized display label. No built-in taxonomy. */
  label: string;
}

export interface MosaicTemplateCategoryChipsProps {
  /** Full open catalogue of categories — a PROP, never a library constant. */
  categories: MosaicTemplateCategory[];
  /** Currently selected category id. Controlled by the host. */
  selected: string;
  /** Called with the category id when a chip is activated. */
  onSelect: (id: string) => void;
  /** Additional Tailwind classes on the root element. */
  className?: string;
  /** React 19 ref prop — forwarded to the root element. */
  ref?: React.Ref<HTMLDivElement>;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicTemplateCategoryChips — production template-filter atom for
 * @vantageos/mosaic-blocks.
 *
 * Purely presentational: renders one real `<button>` per host-supplied
 * category, reports every activation via `onSelect`. No network call, no
 * internal state, no hardcoded category catalogue.
 */
export function MosaicTemplateCategoryChips({
  categories,
  selected,
  onSelect,
  className,
  ref,
}: MosaicTemplateCategoryChipsProps) {
  return (
    <div
      ref={ref}
      data-slot="template-category-chips"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {categories.map((category) => {
        const isSelected = category.id === selected;
        return (
          <button
            key={category.id}
            type="button"
            data-slot="template-category-chip"
            aria-pressed={isSelected}
            onClick={() => onSelect(category.id)}
            className={templateCategoryChipVariants({ selected: isSelected })}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

MosaicTemplateCategoryChips.displayName = "MosaicTemplateCategoryChips";

/**
 * MosaicMatchInput — autocomplete carrying a match state
 *
 * Composes MosaicCombobox (no autocomplete re-implementation) and adds a
 * match-state indicator. `matchState` and `stateLabels` are REQUIRED
 * props: the four match states are match semantics, never business
 * logic, and the host owns every label — no English fallback.
 *
 * data-slot="match-input" on the wrapper div.
 */

import {
  MosaicCombobox,
  type MosaicComboboxItem,
  type MosaicComboboxProps,
} from "../combobox/MosaicCombobox.js";
import { matchStateSignal, matchStateVariants } from "./match-input-variants.js";

// ── Utility ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MosaicMatchInputState = "exact" | "partial" | "ambiguous" | "none";

export interface MosaicMatchInputStateLabels {
  exact: string;
  partial: string;
  ambiguous: string;
  none: string;
}

export interface MosaicMatchInputProps extends Omit<MosaicComboboxProps, "disabled" | "className"> {
  /** Required — the four match states are match semantics, never inferred. */
  matchState: MosaicMatchInputState;
  /** Required — the host owns every label, no default copy is generated. */
  stateLabels: MosaicMatchInputStateLabels;
  /** Locked mode: the input becomes read-only/disabled. */
  locked?: boolean;
  className?: string;
}

export type { MosaicComboboxItem };

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * MosaicMatchInput — combobox + match-state indicator.
 *
 * @example
 * <MosaicMatchInput
 *   items={items}
 *   matchState="ambiguous"
 *   stateLabels={{
 *     exact: t('MatchInput.exact'),
 *     partial: t('MatchInput.partial'),
 *     ambiguous: t('MatchInput.ambiguous'),
 *     none: t('MatchInput.none'),
 *   }}
 *   emptyMessage={t('MatchInput.empty')}
 * />
 */
export function MosaicMatchInput({
  matchState,
  stateLabels,
  locked,
  className,
  ...comboboxProps
}: MosaicMatchInputProps) {
  const { role, ariaLive } = matchStateSignal(matchState);
  const label = stateLabels[matchState];

  return (
    <div data-slot="match-input" className={cn("flex flex-col gap-1", className)}>
      <MosaicCombobox {...comboboxProps} disabled={locked} />
      <span
        role={role}
        aria-live={ariaLive}
        data-match-state={matchState}
        className={matchStateVariants({ matchState })}
      >
        {label}
      </span>
    </div>
  );
}

MosaicMatchInput.displayName = "MosaicMatchInput";

export { matchStateVariants };

/**
 * matchStateVariants — pure CVA variant function for the match-state
 * indicator rendered by MosaicMatchInput.
 *
 * Each match state maps to a distinct visual + accessible role so
 * "ambiguous" is never confusable with "none" — the two must warn the
 * user differently (see MosaicMatchInput.test.tsx negative-pole test).
 *
 * Zero browser / React runtime dependencies — safe in RSC / Node.js.
 */

import { cva } from "class-variance-authority";

export const matchStateVariants = cva(["text-xs font-medium"], {
  variants: {
    matchState: {
      exact: "text-success-700",
      partial: "text-warning-700",
      ambiguous: "text-warning-700",
      none: "text-destructive",
    },
  },
  defaultVariants: {
    matchState: "none",
  },
});

/**
 * Accessible role per match state. "ambiguous" and "none" both need the
 * user's attention, but ambiguous is a status (there IS a candidate,
 * pick one) while none is an alert (nothing matched at all).
 */
export function matchStateRole(
  matchState: "exact" | "partial" | "ambiguous" | "none",
): "status" | "alert" {
  return matchState === "none" ? "alert" : "status";
}

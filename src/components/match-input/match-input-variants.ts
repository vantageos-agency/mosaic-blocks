/**
 * matchStateVariants — pure CVA variant function for the match-state
 * indicator rendered by MosaicMatchInput.
 *
 * Each match state maps to a distinct visual + accessible signal so the
 * four states are mutually distinguishable BY THE COMPONENT, independent
 * of whatever label text the host passes in
 * (see MosaicMatchInput.test.tsx negative-pole tests, which pass an
 * IDENTICAL label for all four states on purpose).
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

export type MosaicMatchInputMatchState = "exact" | "partial" | "ambiguous" | "none";

export interface MatchStateSignal {
  role: "status" | "alert";
  ariaLive: "off" | "polite" | "assertive";
}

/**
 * Accessible (role, aria-live) pair per match state. Every one of the four
 * states carries a DIFFERENT pair, so any two states are distinguishable
 * from each other purely from these DOM attributes — never from the
 * label text, which the host controls and must not be relied upon.
 *
 * - exact:     status / off       — resolved, nothing to announce
 * - partial:   status / polite     — informational, low urgency
 * - ambiguous: alert  / assertive  — the dangerous state: a wrong
 *              candidate could be silently accepted, so it is the MOST
 *              urgent signal, distinct from both "partial" (role) and
 *              "none" (aria-live)
 * - none:      alert  / polite     — terminal, no decision pending, so
 *              alert without the assertive urgency of "ambiguous"
 */
export function matchStateSignal(matchState: MosaicMatchInputMatchState): MatchStateSignal {
  switch (matchState) {
    case "exact":
      return { role: "status", ariaLive: "off" };
    case "partial":
      return { role: "status", ariaLive: "polite" };
    case "ambiguous":
      return { role: "alert", ariaLive: "assertive" };
    case "none":
      return { role: "alert", ariaLive: "polite" };
  }
}

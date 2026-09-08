import type { Decision, GateState, JourneyStage } from "./types";

/**
 * Layer 8 — Experience decision.
 *
 * Consumes the responsible gate result plus session signals and returns the
 * single decision the PSK UI may act on. Never produces urgency or promotion.
 */

export type DecisionInput = {
  gate: GateState;
  friction: number;
  emptySearches: number;
  searches: number;
  interactions: number;
  selectionCount: number;
  hasPlacement: boolean;
};

export function decideExperience(input: DecisionInput): { decision: Decision; why: string } {
  if (input.gate === "SILENCE")
    return { decision: "NONE", why: "Responsible gate suppressed interventions" };
  if (input.hasPlacement && input.selectionCount === 0)
    return { decision: "NONE", why: "User journey completed" };
  if (input.gate === "ADAPT" || input.friction >= 20 || input.emptySearches > 0)
    return { decision: "SIMPLIFY", why: "Friction signals suggest reducing choice" };
  if (input.selectionCount > 0)
    return { decision: "CONTINUE", why: "Active selection — stay out of the way" };
  if (input.interactions >= 4 && input.searches === 0)
    return { decision: "DISCOVER", why: "Broad browsing without a clear target" };
  return { decision: "NONE", why: "No signal strong enough to act on" };
}

/** Aggregated journey stage — ENTRY → DISCOVERY → MATCH → DECISION → ACTION → COMPLETION. */
export function journeyStage(input: {
  searches: number;
  lastViewedMatchId: string | null;
  marketExpansions: number;
  selectionCount: number;
  hasPlacement: boolean;
}): JourneyStage {
  if (input.hasPlacement && input.selectionCount === 0) return "completion";
  if (input.selectionCount > 0) return "action";
  if (input.lastViewedMatchId && input.marketExpansions > 0) return "decision";
  if (input.lastViewedMatchId) return "match";
  if (input.searches > 0) return "discovery";
  return "entry";
}

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
  exited: boolean;
  /** A search resolved to a clear target through correction (e.g. Madird). */
  corrected: boolean;
  /** Intent confidence, 0-1, from the intent engine. */
  intentConfidence: number;
  /** An event is established as the session context. */
  hasContext: boolean;
  /** The context event was already opened earlier in this session. */
  returning: boolean;
  /** An active search with usable results. */
  activeSearchResults: boolean;
};

export const COMPLETION_REASON =
  "Journey completed successfully. No additional intervention required.";

export function decideExperience(input: DecisionInput): { decision: Decision; why: string } {
  if (input.exited) return { decision: "NONE", why: COMPLETION_REASON };
  if (input.hasPlacement && input.selectionCount === 0)
    return { decision: "NONE", why: COMPLETION_REASON };
  if (input.gate === "SILENCE")
    return { decision: "NONE", why: "Responsible gate suppressed interventions" };
  if (input.gate === "ADAPT" || input.friction >= 20 || input.emptySearches > 0)
    return { decision: "SIMPLIFY", why: "Friction signals suggest reducing choice" };
  if (input.corrected && input.intentConfidence >= 0.6)
    return { decision: "SIMPLIFY", why: "Query resolved to a clear target — lead with it" };
  if (input.selectionCount > 0)
    return { decision: "CONTINUE", why: "Active selection — stay out of the way" };
  if (input.returning && input.hasContext)
    return { decision: "CONTINUE", why: "Returning to a previously viewed event" };
  if (input.activeSearchResults)
    return { decision: "DISCOVER", why: "Active search with relevant results" };
  if (input.interactions >= 4 && input.searches === 0)
    return { decision: "DISCOVER", why: "Broad browsing without a clear target" };
  return { decision: "NONE", why: "No signal strong enough to act on" };
}

export type StageInput = {
  searches: number;
  intentConfidence: number;
  hasIntent: boolean;
  lastViewedMatchId: string | null;
  marketExpansions: number;
  selectionCount: number;
  betslipEngaged: boolean;
  transactionStarted: boolean;
  hasPlacement: boolean;
  exited: boolean;
  interactions: number;
};

/**
 * Aggregated journey stage. Every transition follows a real interaction that
 * has already been recorded in the session — nothing is timed or simulated.
 */
export function journeyStage(input: StageInput): JourneyStage {
  if (input.exited) return "exit";
  if (input.hasPlacement) return "completion";
  if (input.transactionStarted) return "transaction";
  if (input.selectionCount > 0 && input.betslipEngaged) return "action";
  if (input.selectionCount > 0) return "decision";
  if (input.lastViewedMatchId && input.marketExpansions > 0) return "exploration";
  if (input.lastViewedMatchId) return "context";
  if (input.hasIntent && input.intentConfidence >= 0.6) return "intent";
  // Genuine browsing only — the session's own bookkeeping is not an interaction.
  if (input.searches > 0 || input.interactions >= 3) return "discovery";
  return "entry";
}

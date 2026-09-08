import { FRICTION_REASONS } from "./friction-engine";
import type { Decision, FrictionLevel, GateState, JourneyStage } from "./types";

/**
 * Layer 8 — Experience decision.
 *
 * Consumes the responsible gate result plus session signals and returns the
 * single decision the PSK UI may act on. Never produces urgency or promotion.
 */

export type DecisionInput = {
  gate: GateState;
  friction: number;
  /** Banded friction state from the friction engine. */
  frictionLevel: FrictionLevel;
  /** Plain-language reason behind that state. */
  frictionReason: string;
  /** A plausible target was reached (event opened / selection made). */
  targetDiscovered: boolean;
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

export const COMPLETION_REASON = "Journey completed successfully.";

/** Concise, judge-readable explanations for each decision path. */
export const DECISION_WHY = {
  completed: COMPLETION_REASON,
  silence: "Responsible gate active — interventions suppressed.",
  adapt: "Responsible adaptation — existing choice set reduced.",
  simplify: "Repeated unsuccessful discovery → narrow the existing choice set.",
  discover: "Search intent detected → prioritised relevant existing content.",
  browsing: "Broad browsing without a clear target → surface relevant events.",
  context: "Active event context → continue current journey.",
  selection: "Active selection → stay out of the way.",
  none: "Normal exploration — no adaptation required.",
} as const;

/**
 * Priority: responsible gate → friction → active context → search intent → none.
 * The gate is independent and is never overridden by optimisation logic.
 */
export function decideExperience(input: DecisionInput): { decision: Decision; why: string } {
  if (input.exited) return { decision: "NONE", why: DECISION_WHY.completed };
  if (input.hasPlacement && input.selectionCount === 0)
    return { decision: "NONE", why: DECISION_WHY.completed };

  // 1 — Responsible gate.
  if (input.gate === "SILENCE") return { decision: "NONE", why: DECISION_WHY.silence };
  if (input.gate === "ADAPT")
    return {
      decision: "SIMPLIFY",
      why:
        input.frictionLevel === "LOW"
          ? DECISION_WHY.adapt
          : `Responsible adaptation · ${input.frictionReason} → choice set narrowed.`,
    };

  // 2 — Friction. Repeated unproductive discovery narrows the existing choice
  // set: ordering only, never a prompt, never a promotion.
  if (input.frictionLevel === "HIGH")
    return { decision: "SIMPLIFY", why: `${input.frictionReason} → choice set narrowed.` };
  if (input.frictionLevel === "MEDIUM") {
    const strongTarget = input.hasContext || (input.corrected && input.intentConfidence >= 0.6);
    return strongTarget
      ? { decision: "DISCOVER", why: `${input.frictionReason} → surfaced the relevant event.` }
      : { decision: "SIMPLIFY", why: `${input.frictionReason} → choice set narrowed.` };
  }

  // 3 — Active context.
  if (input.selectionCount > 0) return { decision: "CONTINUE", why: DECISION_WHY.selection };
  if (input.hasContext && (input.returning || input.targetDiscovered))
    return {
      decision: "CONTINUE",
      why: input.targetDiscovered && !input.returning
        ? `${FRICTION_REASONS.discovered} → continue current journey.`
        : DECISION_WHY.context,
    };

  // 4 — Search intent.
  if (input.activeSearchResults || (input.corrected && input.intentConfidence >= 0.6))
    return { decision: "DISCOVER", why: DECISION_WHY.discover };
  if (input.interactions >= 4 && input.searches === 0)
    return { decision: "DISCOVER", why: DECISION_WHY.browsing };

  // 5 — Nothing worth acting on.
  return { decision: "NONE", why: DECISION_WHY.none };
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

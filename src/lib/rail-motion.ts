import { useSession } from "@/lib/session-context";

/**
 * Presentation-only helper.
 *
 * Decides whether a calm, discrete horizontal step on a *content* rail is
 * appropriate right now. It only ever reads existing session-intelligence
 * state — it never creates interventions, urgency or promotion, and it can
 * only ever slow motion down, never speed it up.
 */
export type RailMotionState = {
  allowed: boolean;
  /** Short, truthful reason for the judge trace. */
  reason: string;
};

export function useRailMotion(): RailMotionState {
  const { state, sessionContext, intelligence, responsibleGate } = useSession();

  if (state.exited || state.lastPlacement)
    return { allowed: false, reason: "Journey completed — content motion stopped" };
  if (responsibleGate.state === "SILENCE")
    return { allowed: false, reason: "Responsible gate SILENCE — content motion stopped" };
  if (intelligence.frictionLevel === "HIGH")
    return { allowed: false, reason: "HIGH friction — content motion stopped" };
  if (intelligence.frictionLevel === "MEDIUM")
    return { allowed: false, reason: "MEDIUM friction — content motion suppressed" };
  if (state.selections.length > 0 || state.betslipOpen || state.transactionStarted)
    return { allowed: false, reason: "Active selection or transaction — content motion paused" };
  if (state.searchContext || sessionContext.journeyStage === "intent")
    return { allowed: false, reason: "Clear intent in progress — content motion paused" };
  const busy: string[] = ["context", "exploration", "decision", "decision_ready", "action", "transaction", "completion", "exit"];
  if (busy.includes(sessionContext.journeyStage))
    return { allowed: false, reason: "Active task context — content motion paused" };

  return { allowed: true, reason: "Passive browsing, LOW friction — subtle content motion allowed" };
}

import type { GateState } from "./types";

/**
 * Layer 7 — Responsible gate.
 *
 * Always evaluated BEFORE the experience decision. The gate can only
 * restrict interventions, never create them.
 */

export type GateResult = { state: GateState; reason: string; pass: boolean };

export function evaluateGate(stake: number, friction: number): GateResult {
  const result = (state: GateState, reason: string): GateResult => ({
    state,
    reason,
    pass: state !== "SILENCE",
  });
  if (stake > 100)
    return result("SILENCE", "Stake above demo session ceiling — no interventions");
  if (friction >= 60)
    return result("SILENCE", "High friction signals — suppress all interventions");
  if (friction >= 30) return result("ADAPT", "Elevated friction — only simplifying help allowed");
  return result("PASS", "Session within prototype play limits");
}

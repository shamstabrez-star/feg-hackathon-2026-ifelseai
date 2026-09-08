import type { FrictionLevel, FrictionSignal } from "./types";

/**
 * Layer 6 — Friction engine.
 *
 * Candidate friction signals only, all transparent and additive.
 * Nothing here claims to be a model.
 */

export type FrictionInput = {
  frictionSignals: FrictionSignal[];
  emptySearches: number;
  marketExpansions: number;
  reformulations: number;
};

export function frictionScore(input: FrictionInput) {
  const signals = input.frictionSignals.reduce((acc, s) => acc + s.weight, 0);
  const searchStrain = input.emptySearches * 8;
  const browseStrain = input.marketExpansions > 3 ? (input.marketExpansions - 3) * 4 : 0;
  // Repeated reformulation without opening a match is a candidate friction signal.
  const loopStrain = input.reformulations >= 2 ? (input.reformulations - 1) * 9 : 0;
  return Math.max(0, Math.min(100, signals + searchStrain + browseStrain + loopStrain));
}

/**
 * Conservative banding. Ordinary navigation, including Back, is never
 * friction — only the signals above can raise the level.
 */
export function frictionLevel(score: number): FrictionLevel {
  if (score >= 50) return "HIGH";
  if (score >= 20) return "MEDIUM";
  return "LOW";
}

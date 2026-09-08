import type { FrictionLevel, FrictionSignal } from "./types";

/**
 * Layer 6 — Friction engine.
 *
 * Core principle: not every extra interaction is friction. Ordinary
 * sportsbook behaviour (Back, opening markets, browsing several events,
 * scrolling, filtering) never raises the level. Only repeated, unproductive
 * evidence does — and it is released again as soon as the customer finds a
 * target. Everything here is transparent and additive: no model inference.
 */

export type FrictionInput = {
  frictionSignals: FrictionSignal[];
  emptySearches: number;
  marketExpansions: number;
  reformulations: number;
  /** Sports → event → Sports round trips with no progress in between. */
  lobbyLoops: number;
  /** An event was opened, or a selection made, since the last dead end. */
  targetDiscovered: boolean;
  selectionCount: number;
  hasPlacement: boolean;
  exited: boolean;
};

export type FrictionResult = {
  score: number;
  level: FrictionLevel;
  reason: string;
};

export const FRICTION_REASONS = {
  completed: "Journey completed successfully",
  discovered: "Target discovered",
  normal: "Normal exploration",
  reformulation: "Repeated search reformulation",
  empty: "Repeated searches without a usable result",
  navigation: "Repeated navigation without progress",
  unsuccessful: "Repeated unsuccessful discovery",
} as const;

function band(score: number): FrictionLevel {
  if (score >= 50) return "HIGH";
  if (score >= 20) return "MEDIUM";
  return "LOW";
}

export function evaluateFriction(input: FrictionInput): FrictionResult {
  if (input.exited || input.hasPlacement)
    return { score: 0, level: "LOW", reason: FRICTION_REASONS.completed };

  const seeded = input.frictionSignals.reduce((acc, s) => acc + s.weight, 0);

  // One failed search is never strong evidence; repeats are.
  const emptyStrain = input.emptySearches >= 2 ? (input.emptySearches - 1) * 12 : 0;
  // Genuine reformulation loops only — a second different query starts to count.
  const loopStrain = input.reformulations >= 2 ? (input.reformulations - 1) * 11 : 0;
  // Ping-pong between Sports and an event with nothing achieved in between.
  const navStrain = input.lobbyLoops >= 3 ? (input.lobbyLoops - 2) * 10 : 0;

  // Recovery: the customer found what they were after. Accumulated search and
  // navigation strain is released — a session is never permanently labelled.
  if (input.targetDiscovered || input.selectionCount > 0) {
    const score = Math.min(100, seeded);
    return {
      score,
      level: band(score),
      reason: score >= 20 ? FRICTION_REASONS.unsuccessful : FRICTION_REASONS.discovered,
    };
  }

  const raw = seeded + emptyStrain + loopStrain + navStrain;

  // HIGH needs combined repeated evidence, never one category alone and never
  // time or click count.
  const categories = [emptyStrain, loopStrain, navStrain].filter((v) => v > 0).length;
  const strongEvidence = seeded >= 50 || (categories >= 2 && raw >= 50);
  const score = Math.max(0, Math.min(strongEvidence ? 100 : 49, raw));
  const level = band(score);

  let reason: string = FRICTION_REASONS.normal;
  if (level === "HIGH") reason = FRICTION_REASONS.unsuccessful;
  else if (level === "MEDIUM") {
    const top = Math.max(emptyStrain, loopStrain, navStrain, seeded);
    reason =
      top === loopStrain && loopStrain > 0
        ? FRICTION_REASONS.reformulation
        : top === emptyStrain && emptyStrain > 0
          ? FRICTION_REASONS.empty
          : top === navStrain && navStrain > 0
            ? FRICTION_REASONS.navigation
            : FRICTION_REASONS.reformulation;
  }

  return { score, level, reason };
}

/** Kept for callers that only need the numeric prototype score. */
export function frictionScore(input: FrictionInput) {
  return evaluateFriction(input).score;
}

export function frictionLevel(score: number): FrictionLevel {
  return band(score);
}

import realMadridAsset from "@/assets/sports-hero/real-madrid.jpg.asset.json";
import freeBetAsset from "@/assets/sports-hero/free-bet.jpg.asset.json";
import matchMasterAsset from "@/assets/sports-hero/match-master.jpg.asset.json";
import oddsBoosterAsset from "@/assets/sports-hero/odds-booster.jpg.asset.json";
import type { SessionState } from "@/core";
import type { GateState, JourneyStage } from "@/core";

export type SportsHeroItem = {
  id: string;
  label: string;
  src: string;
  eventId?: string;
  terms: string[];
};

export const sportsHeroItems: SportsHeroItem[] = [
  {
    id: "free-bet",
    label: "Free bet",
    src: freeBetAsset.url,
    terms: ["football", "sport"],
  },
  {
    id: "real-madrid",
    label: "Golden market · Real Madrid - Inter M.",
    src: realMadridAsset.url,
    eventId: "rma-int",
    terms: ["real madrid", "madrid", "inter", "football", "champions league"],
  },
  {
    id: "match-master",
    label: "Match master",
    src: matchMasterAsset.url,
    terms: ["football", "sport", "match"],
  },
  {
    id: "odds-booster",
    label: "Odds booster",
    src: oddsBoosterAsset.url,
    terms: ["football", "sport", "odds"],
  },
];

export type ContentIntelligenceState = {
  decision: "SHOW" | "PRIORITISE" | "NONE";
  reason: string;
  detail: string;
  motion: "ACTIVE" | "PAUSED" | "OFF";
  loading: "Initial priority asset loaded" | "Additional assets deferred" | "Intent-aware prefetch";
  priorityId: string;
};

const quietStages = new Set<JourneyStage>([
  "decision",
  "decision_ready",
  "action",
  "transaction",
  "completion",
  "exit",
]);

export function sportsHeroDecision(state: SessionState, gate: GateState): ContentIntelligenceState {
  if (state.lastPlacement || state.exited) {
    return {
      decision: "NONE",
      reason: "Journey completed successfully — no further promotion introduced.",
      detail: "COMPLETION → EXIT",
      motion: "OFF",
      loading: "Additional assets deferred",
      priorityId: "real-madrid",
    };
  }

  const query = `${state.intent?.normalisedQuery ?? ""} ${state.intent?.query ?? ""}`.toLowerCase();
  const realMadridIntent =
    (state.intent?.confidence ?? 0) >= 0.75 &&
    (query.includes("real madrid") || query.includes("madird") || state.intent?.entityId === "rma-int");
  const activeRealMadrid = !state.contextCleared && state.lastViewedMatchId === "rma-int";
  const stage = state.transactionStarted
    ? "transaction"
    : state.selections.length
      ? "decision_ready"
      : activeRealMadrid
        ? "context"
        : realMadridIntent
          ? "intent"
          : "discovery";

  if (gate !== "PASS" || quietStages.has(stage)) {
    return {
      decision: state.selections.length ? "PRIORITISE" : "NONE",
      reason:
        gate !== "PASS"
          ? "Responsible gate overrides content movement."
          : "Decision in progress — competing content reduced.",
      detail: state.selections.length ? "Selected event context retained without motion." : "Hero held quiet.",
      motion: "OFF",
      loading: "Additional assets deferred",
      priorityId: activeRealMadrid || realMadridIntent ? "real-madrid" : "free-bet",
    };
  }

  if (activeRealMadrid) {
    return {
      decision: "PRIORITISE",
      reason: "Active event context → competing content reduced.",
      detail: "Relevant existing PSK content prioritised; unrelated content deferred.",
      motion: "PAUSED",
      loading: "Intent-aware prefetch",
      priorityId: "real-madrid",
    };
  }

  if (realMadridIntent) {
    return {
      decision: "PRIORITISE",
      reason: "Real Madrid intent detected",
      detail: "Relevant existing PSK content moved into the user's path.",
      motion: "PAUSED",
      loading: "Intent-aware prefetch",
      priorityId: "real-madrid",
    };
  }

  return {
    decision: "SHOW",
    reason: "No strong intent — preserving normal PSK discovery.",
    detail: "Normal PSK hero rotation retained.",
    motion: "ACTIVE",
    loading: "Initial priority asset loaded",
    priorityId: "free-bet",
  };
}
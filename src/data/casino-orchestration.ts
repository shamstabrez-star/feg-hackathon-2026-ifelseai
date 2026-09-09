import type { SessionContextModel } from "@/core";
import type { CasinoSection } from "./casino-games";

export type CasinoContentDecision = "SHOW" | "PRIORITISE" | "DEFER" | "SILENCE";

export function casinoContentDecision(context: SessionContextModel, query = "") {
  if (
    context.responsibleGate === "SILENCE" ||
    context.journeyStage === "completion" ||
    context.journeyStage === "exit"
  ) {
    return {
      state: "SILENCE" as const,
      reason: "Responsible or completed state suppresses unrelated Casino discovery.",
    };
  }
  if (context.frictionLevel === "HIGH")
    return {
      state: "SILENCE" as const,
      reason: "HIGH friction keeps only the active task visible.",
    };
  if (context.responsibleGate === "ADAPT" || context.frictionLevel === "MEDIUM")
    return {
      state: "DEFER" as const,
      reason: "Competing Casino content is reduced while the customer regains direction.",
    };
  if (query.trim())
    return {
      state: "PRIORITISE" as const,
      reason: `Active Casino intent prioritises matching ${query.trim()} content.`,
    };
  return {
    state: "SHOW" as const,
    reason: "LOW-friction passive browsing keeps the normal curated Casino order.",
  };
}

export function orderCasinoSections(sections: CasinoSection[], query: string) {
  const q = query.toLowerCase();
  const preferred = q.includes("diamond")
    ? "new"
    : q.includes("playtech")
      ? "provider-week"
      : q.includes("blackjack")
        ? "table"
        : null;
  if (!preferred) return sections;
  return [...sections].sort((a, b) => Number(b.id === preferred) - Number(a.id === preferred));
}

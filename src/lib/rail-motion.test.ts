import { describe, expect, it, vi } from "vitest";

const useSession = vi.fn();
vi.mock("@/lib/session-context", () => ({ useSession: () => useSession() }));

import { useRailMotion } from "@/lib/rail-motion";

type Overrides = {
  state?: Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
  intelligence?: Record<string, unknown>;
  responsibleGate?: Record<string, unknown>;
};

/** Minimal, explicit session shape — only the fields the motion rule reads. */
function session(overrides: Overrides = {}) {
  useSession.mockReturnValue({
    state: {
      exited: false,
      lastPlacement: null,
      selections: [],
      betslipOpen: false,
      transactionStarted: false,
      searchContext: null,
      ...overrides.state,
    },
    sessionContext: { journeyStage: "discovery", ...overrides.sessionContext },
    intelligence: { frictionLevel: "LOW", ...overrides.intelligence },
    responsibleGate: { state: "PASS", ...overrides.responsibleGate },
  });
}

describe("useRailMotion eligibility", () => {
  it("allows subtle motion during passive, low-friction browsing", () => {
    session();
    expect(useRailMotion()).toEqual({
      allowed: true,
      reason: expect.stringContaining("Passive browsing"),
    });
  });

  it.each([
    ["completed journey", { state: { lastPlacement: { id: "x" } } }],
    ["exited session", { state: { exited: true } }],
    ["responsible gate SILENCE", { responsibleGate: { state: "SILENCE" } }],
    ["HIGH friction", { intelligence: { frictionLevel: "HIGH" } }],
    ["MEDIUM friction", { intelligence: { frictionLevel: "MEDIUM" } }],
    ["an active selection", { state: { selections: [{ key: "a" }] } }],
    ["an open betslip", { state: { betslipOpen: true } }],
    ["a started transaction", { state: { transactionStarted: true } }],
    ["active search context", { state: { searchContext: { query: "book" } } }],
    ["resolved intent", { sessionContext: { journeyStage: "intent" } }],
    ["decision stage", { sessionContext: { journeyStage: "decision" } }],
    ["decision ready stage", { sessionContext: { journeyStage: "decision_ready" } }],
    ["action stage", { sessionContext: { journeyStage: "action" } }],
    ["transaction stage", { sessionContext: { journeyStage: "transaction" } }],
    ["completion stage", { sessionContext: { journeyStage: "completion" } }],
    ["exit stage", { sessionContext: { journeyStage: "exit" } }],
    ["exploration stage", { sessionContext: { journeyStage: "exploration" } }],
    ["context stage", { sessionContext: { journeyStage: "context" } }],
  ])("stops motion for %s", (_label, overrides) => {
    session(overrides as Overrides);
    const motion = useRailMotion();
    expect(motion.allowed).toBe(false);
    expect(motion.reason.length).toBeGreaterThan(0);
  });

  it("never allows motion once a bet has been placed, even at LOW friction", () => {
    session({ state: { lastPlacement: { id: "p1" } }, intelligence: { frictionLevel: "LOW" } });
    expect(useRailMotion().allowed).toBe(false);
  });
});

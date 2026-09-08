import { createContext, useContext } from "react";
import type { Match, Market, Outcome } from "@/data/psk-data";
import type { EvidenceItem } from "@/data/evidence";
import type { SessionState } from "@/core";
import type {
  Decision,
  DemoPath,
  Engagement,
  EventKind,
  FrictionLevel,
  FrictionSignal,
  GateState,
  JourneyStage,
  MarketTier,
  Placement,
  SearchContext,
  SessionContextModel,
  SessionIntent,
} from "@/core";

/**
 * Context + hook live in their own module (no components) so React Fast Refresh
 * can never swap the context identity out from under an already-mounted provider.
 */
export type Ctx = {
  state: SessionState;
  log: (
    kind: EventKind,
    label: string,
    detail?: string,
    interest?: string[],
    meta?: Record<string, string | number>,
  ) => void;
  toggleSelection: (match: Match, market: Market, outcome: Outcome) => void;
  removeSelection: (key: string) => void;
  setStake: (stake: number) => void;
  friction: (label: string, amount?: number) => void;
  place: () => Placement | null;
  setTrace: (open: boolean) => void;
  setBetslip: (open: boolean) => void;
  viewMatch: (matchId: string) => void;
  setMarketTier: (matchId: string, tier: MarketTier) => void;
  setSearchContext: (context: SearchContext | null) => void;
  /** Resolved session intent — plain label plus prototype confidence. */
  setIntent: (intent: SessionIntent | null, resolved: boolean) => void;
  /** Confirm pressed — the transaction stage begins. */
  beginTransaction: () => void;
  /** Done pressed after a completed journey — the session exits. */
  exitSession: () => void;
  /** Records a real browser measurement; never used for invented values. */
  measure: (patch: { searchMs?: number; interactionMs?: number }) => void;
  resetSession: (path?: DemoPath) => void;
  runDemoPath: (path: Exclude<DemoPath, "none">) => void;
  totalOdds: number;
  potentialReturn: number;
  intelligence: {
    sessionRef: string;
    topInterest: string[];
    engagement: Engagement;
    frictionScore: number;
    frictionSignals: FrictionSignal[];
    searches: number;
    interactions: number;
    sessionSeconds: number;
    decision: Decision;
    decisionWhy: string;
    journeyStage: JourneyStage;
    frictionLevel: FrictionLevel;
  };
  /** The single privacy-safe session context object (judge-facing only). */
  sessionContext: SessionContextModel;
  responsibleGate: { state: GateState; reason: string; pass: boolean };
  /** Live Challenge 1 business metrics, measured in this session. */
  businessMetrics: EvidenceItem[];
  /** Measured browser performance values (never fabricated). */
  performanceMetrics: EvidenceItem[];
};

export const SessionContext = createContext<Ctx | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionIntelligenceProvider");
  return ctx;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { Match, Market, Outcome } from "@/data/psk-data";
import type { EvidenceItem } from "@/data/evidence";
import {
  buildPlacement,
  businessMetrics as buildBusinessMetrics,
  deriveSession,
  makeInitialSession,
  performanceMetrics as buildPerformanceMetrics,
  sessionReducer,
  type SessionState,
} from "@/core";
import type {
  Decision,
  DemoPath,
  Engagement,
  EventKind,
  FrictionSignal,
  GateState,
  JourneyStage,
  MarketTier,
  Placement,
  SearchContext,
  Selection,
} from "@/core";

/**
 * Layer 1 binding — React adapter over the framework-agnostic core.
 *
 * This file contains no product logic: it wires the pure reducer, selectors
 * and engines in src/core into React context. Swapping the UI framework means
 * rewriting only this adapter.
 */

export type { Selection, Placement, TraceEvent, FrictionSignal, GateState, Decision, DemoPath } from "@/core";

type Ctx = {
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
  };
  responsibleGate: { state: GateState; reason: string; pass: boolean };
  /** Live Challenge 1 business metrics, measured in this session. */
  businessMetrics: EvidenceItem[];
  /** Measured browser performance values (never fabricated). */
  performanceMetrics: EvidenceItem[];
};

const SessionContext = createContext<Ctx | null>(null);

export function SessionIntelligenceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, undefined, () => makeInitialSession());
  const lastDecision = useRef<Decision | null>(null);

  const log = useCallback<Ctx["log"]>(
    (kind, label, detail, interest, meta) =>
      dispatch({ type: "log", kind, label, detail, interest, meta }),
    [],
  );

  // Real browser measurements — Performance API only, no invented numbers.
  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (nav) dispatch({ type: "perf", patch: { navMs: Math.round(nav.duration) } });
    if (typeof PerformanceObserver === "undefined") return;
    let count = 0;
    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        count += list.getEntries().length;
        dispatch({ type: "perf", patch: { longTasks: count } });
      });
      observer.observe({ type: "longtask", buffered: true });
    } catch {
      observer = null;
    }
    return () => observer?.disconnect();
  }, []);

  const toggleSelection = useCallback((match: Match, market: Market, outcome: Outcome) => {
    dispatch({
      type: "toggleSelection",
      selection: {
        key: `${match.id}:${market.id}:${outcome.id}`,
        matchId: match.id,
        matchLabel: `${match.home} - ${match.away}`,
        marketName: market.name,
        outcomeLabel: outcome.label,
        odds: outcome.odds,
      } satisfies Selection,
    });
  }, []);

  const derived = useMemo(() => deriveSession(state), [state]);

  // Log decision changes so the trace reflects a live engine, not fixed text.
  useEffect(() => {
    if (lastDecision.current === derived.decision) return;
    lastDecision.current = derived.decision;
    dispatch({
      type: "log",
      kind: "decision",
      label: `${derived.gate.state} → ${derived.decision}`,
      detail: derived.decisionWhy,
      meta: { friction: derived.friction },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derived.decision, derived.gate.state]);

  const place = useCallback((): Placement | null => {
    if (state.stake > 100) {
      dispatch({
        type: "log",
        kind: "responsible_gate",
        label: "SILENCE",
        detail: "Stake above demo session ceiling — placement stopped",
      });
      return null;
    }
    const placement = buildPlacement(state);
    if (!placement) return null;
    dispatch({
      type: "log",
      kind: "responsible_gate",
      label: derived.gate.state,
      detail: derived.gate.reason,
    });
    dispatch({ type: "place", placement });
    return placement;
  }, [state, derived.gate]);

  const resetSession = useCallback((path: DemoPath = "none") => {
    lastDecision.current = null;
    dispatch({ type: "reset", demoPath: path });
  }, []);

  const runDemoPath = useCallback((path: Exclude<DemoPath, "none">) => {
    lastDecision.current = null;
    dispatch({ type: "reset", demoPath: path });
    if (path === "success") {
      dispatch({
        type: "log",
        kind: "demo",
        label: "Demo path: successful journey",
        detail: "Clean session — search, match, selection, confirmation",
      });
      return;
    }
    dispatch({
      type: "log",
      kind: "demo",
      label: "Demo path: friction journey",
      detail: "Seeded prototype friction signals",
    });
    dispatch({
      type: "log",
      kind: "search",
      label: '"grimsbi towne"',
      detail: "0 result(s)",
      meta: { results: 0 },
    });
    dispatch({ type: "friction", amount: 12, label: "Search returned no results (prototype signal)" });
    dispatch({ type: "friction", amount: 14, label: "Repeated market scrolling without selection" });
  }, []);

  const value: Ctx = {
    state,
    log,
    toggleSelection,
    removeSelection: (key) => dispatch({ type: "removeSelection", key }),
    setStake: (stake) => dispatch({ type: "setStake", stake }),
    friction: (label, amount = 15) => dispatch({ type: "friction", label, amount }),
    place,
    setTrace: (open) => dispatch({ type: "setTrace", open }),
    setBetslip: (open) => dispatch({ type: "setBetslip", open }),
    viewMatch: (matchId) => dispatch({ type: "viewMatch", matchId }),
    setMarketTier: (matchId, tier) => dispatch({ type: "setMarketTier", matchId, tier }),
    setSearchContext: (context) => dispatch({ type: "searchContext", context }),
    resetSession,
    runDemoPath,
    totalOdds: derived.totalOdds,
    potentialReturn: derived.potentialReturn,
    intelligence: {
      sessionRef: state.sessionRef,
      topInterest: derived.topInterest,
      engagement: derived.engagement,
      frictionScore: derived.friction,
      frictionSignals: state.frictionSignals,
      searches: state.searches,
      interactions: state.interactions,
      sessionSeconds: derived.sessionSeconds,
      decision: derived.decision,
      decisionWhy: derived.decisionWhy,
      journeyStage: derived.stage,
    },
    responsibleGate: {
      state: derived.gate.state,
      reason: derived.gate.reason,
      pass: derived.gate.pass,
    },
    businessMetrics: buildBusinessMetrics(state),
    performanceMetrics: buildPerformanceMetrics(state, derived.sessionSeconds),
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionIntelligenceProvider");
  return ctx;
}

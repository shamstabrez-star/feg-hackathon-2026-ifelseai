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

/* ------------------------------------------------------------------ */
/* Anonymised session / event model                                     */
/* ------------------------------------------------------------------ */

export type EventKind =
  | "search"
  | "navigation"
  | "market_expand"
  | "selection"
  | "selection_removed"
  | "stake"
  | "friction"
  | "responsible_gate"
  | "decision"
  | "placement"
  | "demo";

/**
 * A single anonymised session event. Carries only sanitized metadata:
 * no player ids, tokens, transaction references or personal data.
 */
export type TraceEvent = {
  id: number;
  /** Milliseconds since session start — relative, never a wall clock identity. */
  offsetMs: number;
  kind: EventKind;
  label: string;
  detail?: string | undefined;
  /** Sanitized metadata bag (content ids and prototype scores only). */
  meta?: Record<string, string | number> | undefined;
};

export type Selection = {
  key: string;
  matchId: string;
  matchLabel: string;
  marketName: string;
  outcomeLabel: string;
  odds: number;
};

export type Placement = {
  ref: string;
  selections: Selection[];
  stake: number;
  totalOdds: number;
  potentialReturn: number;
};

export type FrictionSignal = {
  id: number;
  label: string;
  weight: number;
};

/** Responsible gate runs BEFORE any experience decision. */
export type GateState = "PASS" | "ADAPT" | "SILENCE";
/** Experience decision the customer UI may act on. */
export type Decision = "SIMPLIFY" | "DISCOVER" | "CONTINUE" | "NONE";
export type DemoPath = "none" | "success" | "friction";

type State = {
  /** Anonymous, per-tab session label. Not linked to any account. */
  sessionRef: string;
  startedAt: number;
  events: TraceEvent[];
  nextId: number;
  selections: Selection[];
  stake: number;
  interest: Record<string, number>;
  searches: number;
  emptySearches: number;
  marketExpansions: number;
  frictionSignals: FrictionSignal[];
  lastPlacement: Placement | null;
  traceOpen: boolean;
  betslipOpen: boolean;
  demoPath: DemoPath;
  interactions: number;
  /** In-session continuity: last match opened and the ones already seen. */
  lastViewedMatchId: string | null;
  viewedMatches: string[];
  /** Markets already unfolded per match, restored when the user comes back. */
  marketTier: Record<string, 1 | 2 | 3>;
  /** Preserved search-to-match context (sanitized query text only). */
  searchContext: { query: string; corrected?: string; matchId?: string } | null;
  /** Recent normalized queries, used to spot genuine reformulation loops. */
  recentQueries: string[];
  reformulations: number;
  /** Measured browser timings, filled from the Performance API. */
  perf: { firstSelectionMs: number | null; longTasks: number; navMs: number | null };
};

type Action =
  | {
      type: "log";
      kind: EventKind;
      label: string;
      detail?: string | undefined;
      interest?: string[] | undefined;
      meta?: Record<string, string | number> | undefined;
    }
  | { type: "toggleSelection"; selection: Selection }
  | { type: "removeSelection"; key: string }
  | { type: "setStake"; stake: number }
  | { type: "friction"; amount: number; label: string }
  | { type: "place"; placement: Placement }
  | { type: "reset"; demoPath: DemoPath }
  | { type: "setTrace"; open: boolean }
  | { type: "setBetslip"; open: boolean }
  | { type: "perf"; patch: Partial<State["perf"]> }
  | { type: "viewMatch"; matchId: string }
  | { type: "setMarketTier"; matchId: string; tier: 1 | 2 | 3 }
  | {
      type: "searchContext";
      context: { query: string; corrected?: string; matchId?: string } | null;
    };

function newSessionRef() {
  return `S-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function makeInitial(demoPath: DemoPath = "none"): State {
  return {
    sessionRef: newSessionRef(),
    startedAt: Date.now(),
    events: [],
    nextId: 1,
    selections: [],
    stake: 10,
    interest: {},
    searches: 0,
    emptySearches: 0,
    marketExpansions: 0,
    frictionSignals: [],
    lastPlacement: null,
    traceOpen: false,
    betslipOpen: false,
    demoPath,
    interactions: 0,
    perf: { firstSelectionMs: null, longTasks: 0, navMs: null },
    lastViewedMatchId: null,
    viewedMatches: [],
    marketTier: {},
    searchContext: null,
    recentQueries: [],
    reformulations: 0,
  };
}

function withEvent(
  state: State,
  kind: EventKind,
  label: string,
  detail?: string,
  interestKeys?: string[],
  meta?: Record<string, string | number>,
): State {
  const interest = { ...state.interest };
  for (const k of interestKeys ?? []) interest[k] = (interest[k] ?? 0) + 1;
  return {
    ...state,
    interest,
    nextId: state.nextId + 1,
    interactions: state.interactions + 1,
    events: [
      {
        id: state.nextId,
        offsetMs: Date.now() - state.startedAt,
        kind,
        label,
        detail,
        meta,
      },
      ...state.events,
    ].slice(0, 80),
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "log": {
      const next = withEvent(
        state,
        action.kind,
        action.label,
        action.detail,
        action.interest,
        action.meta,
      );
      if (action.kind === "search") {
        const empty = Number(action.meta?.["results"] ?? 1) === 0;
        const q = action.label.replace(/"/g, "").trim().toLowerCase();
        const prev = state.recentQueries[0];
        // Genuine reformulation: a different query typed right after another
        // one, with no match opened in between.
        const reformulated =
          !!prev && prev !== q && !state.lastViewedMatchId && state.selections.length === 0;
        return {
          ...next,
          searches: next.searches + 1,
          emptySearches: next.emptySearches + (empty ? 1 : 0),
          recentQueries: [q, ...state.recentQueries].slice(0, 6),
          reformulations: next.reformulations + (reformulated ? 1 : 0),
        };
      }
      if (action.kind === "market_expand")
        return { ...next, marketExpansions: next.marketExpansions + 1 };
      return next;
    }
    case "toggleSelection": {
      const exists = state.selections.some((s) => s.key === action.selection.key);
      if (exists) {
        const next = withEvent(
          state,
          "selection_removed",
          `Removed ${action.selection.outcomeLabel}`,
          action.selection.matchLabel,
        );
        return {
          ...next,
          selections: next.selections.filter((s) => s.key !== action.selection.key),
        };
      }
      const next = withEvent(
        state,
        "selection",
        `${action.selection.marketName}: ${action.selection.outcomeLabel} @ ${action.selection.odds.toFixed(2)}`,
        action.selection.matchLabel,
        [action.selection.matchId, action.selection.marketName],
        { odds: action.selection.odds },
      );
      return {
        ...next,
        selections: [...next.selections, action.selection],
        betslipOpen: true,
        perf: {
          ...next.perf,
          firstSelectionMs: next.perf.firstSelectionMs ?? Date.now() - next.startedAt,
        },
      };
    }
    case "removeSelection": {
      const sel = state.selections.find((s) => s.key === action.key);
      const next = withEvent(
        state,
        "selection_removed",
        `Removed ${sel?.outcomeLabel ?? "selection"}`,
        sel?.matchLabel,
      );
      return { ...next, selections: next.selections.filter((s) => s.key !== action.key) };
    }
    case "setStake":
      return { ...state, stake: action.stake };
    case "friction": {
      const next = withEvent(state, "friction", action.label, `prototype signal · +${action.amount}`);
      return {
        ...next,
        frictionSignals: [
          { id: next.nextId, label: action.label, weight: action.amount },
          ...next.frictionSignals,
        ].slice(0, 12),
      };
    }
    case "place": {
      const next = withEvent(
        state,
        "placement",
        `Bet placed · ref ${action.placement.ref}`,
        `${action.placement.selections.length} selection(s) · ${action.placement.stake.toFixed(2)} €`,
      );
      // Keep the betslip open so the confirmation stays visible on mobile.
      return { ...next, lastPlacement: action.placement, selections: [] };
    }
    case "reset": {
      const fresh = makeInitial(action.demoPath);
      return { ...fresh, traceOpen: state.traceOpen };
    }
    case "setTrace":
      return { ...state, traceOpen: action.open };
    case "setBetslip":
      return { ...state, betslipOpen: action.open };
    case "perf":
      return { ...state, perf: { ...state.perf, ...action.patch } };
    case "viewMatch":
      return {
        ...state,
        lastViewedMatchId: action.matchId,
        viewedMatches: [action.matchId, ...state.viewedMatches.filter((x) => x !== action.matchId)].slice(
          0,
          8,
        ),
        searchContext: state.searchContext
          ? { ...state.searchContext, matchId: action.matchId }
          : state.searchContext,
      };
    case "setMarketTier":
      return { ...state, marketTier: { ...state.marketTier, [action.matchId]: action.tier } };
    case "searchContext":
      return { ...state, searchContext: action.context };
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Derived live model                                                   */
/* ------------------------------------------------------------------ */

function frictionScore(state: State) {
  const signals = state.frictionSignals.reduce((acc, s) => acc + s.weight, 0);
  const searchStrain = state.emptySearches * 8;
  const browseStrain = state.marketExpansions > 3 ? (state.marketExpansions - 3) * 4 : 0;
  // Repeated reformulation without opening a match is a candidate friction signal.
  const loopStrain = state.reformulations >= 2 ? (state.reformulations - 1) * 9 : 0;
  return Math.max(0, Math.min(100, signals + searchStrain + browseStrain + loopStrain));
}

function gateFor(stake: number, friction: number): { state: GateState; reason: string } {
  if (stake > 100)
    return { state: "SILENCE", reason: "Stake above demo session ceiling — no interventions" };
  if (friction >= 60)
    return { state: "SILENCE", reason: "High friction signals — suppress all interventions" };
  if (friction >= 30)
    return { state: "ADAPT", reason: "Elevated friction — only simplifying help allowed" };
  return { state: "PASS", reason: "Session within prototype play limits" };
}

function decisionFor(state: State, gate: GateState, friction: number): { decision: Decision; why: string } {
  if (gate === "SILENCE") return { decision: "NONE", why: "Responsible gate suppressed interventions" };
  if (state.lastPlacement && state.selections.length === 0)
    return { decision: "NONE", why: "User journey completed" };
  if (gate === "ADAPT" || friction >= 20 || state.emptySearches > 0)
    return { decision: "SIMPLIFY", why: "Friction signals suggest reducing choice" };
  if (state.selections.length > 0)
    return { decision: "CONTINUE", why: "Active selection — stay out of the way" };
  if (state.interactions >= 4 && state.searches === 0)
    return { decision: "DISCOVER", why: "Broad browsing without a clear target" };
  return { decision: "NONE", why: "No signal strong enough to act on" };
}

/* ------------------------------------------------------------------ */
/* Context                                                              */
/* ------------------------------------------------------------------ */

type Ctx = {
  state: State;
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
  setMarketTier: (matchId: string, tier: 1 | 2 | 3) => void;
  setSearchContext: (
    context: { query: string; corrected?: string; matchId?: string } | null,
  ) => void;
  resetSession: (path?: DemoPath) => void;
  runDemoPath: (path: Exclude<DemoPath, "none">) => void;
  totalOdds: number;
  potentialReturn: number;
  intelligence: {
    sessionRef: string;
    topInterest: string[];
    engagement: "browsing" | "focused" | "committed";
    frictionScore: number;
    frictionSignals: FrictionSignal[];
    searches: number;
    interactions: number;
    sessionSeconds: number;
    decision: Decision;
    decisionWhy: string;
  };
  responsibleGate: { state: GateState; reason: string; pass: boolean };
  /** Live Challenge 1 business metrics, measured in this session. */
  businessMetrics: EvidenceItem[];
  /** Measured browser performance values (never fabricated). */
  performanceMetrics: EvidenceItem[];
};

const SessionContext = createContext<Ctx | null>(null);

export function SessionIntelligenceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => makeInitial());
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
      },
    });
  }, []);

  const totalOdds = state.selections.reduce((acc, s) => acc * s.odds, 1);
  const potentialReturn = state.selections.length ? totalOdds * state.stake : 0;

  const friction = useMemo(() => frictionScore(state), [state]);
  const gate = useMemo(() => gateFor(state.stake, friction), [state.stake, friction]);
  const decision = useMemo(() => decisionFor(state, gate.state, friction), [state, gate.state, friction]);

  // Log decision changes so the trace reflects a live engine, not fixed text.
  useEffect(() => {
    if (lastDecision.current === decision.decision) return;
    lastDecision.current = decision.decision;
    dispatch({
      type: "log",
      kind: "decision",
      label: `${gate.state} → ${decision.decision}`,
      detail: decision.why,
      meta: { friction },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decision.decision, gate.state]);

  const engagement: "browsing" | "focused" | "committed" =
    state.selections.length > 0 ? "committed" : state.interactions > 4 ? "focused" : "browsing";

  const topInterest = useMemo(
    () =>
      Object.entries(state.interest)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k]) => k),
    [state.interest],
  );

  const place = useCallback((): Placement | null => {
    if (!state.selections.length) return null;
    if (state.stake > 100) {
      dispatch({
        type: "log",
        kind: "responsible_gate",
        label: "SILENCE",
        detail: "Stake above demo session ceiling — placement stopped",
      });
      return null;
    }
    const odds = state.selections.reduce((acc, s) => acc * s.odds, 1);
    const placement: Placement = {
      ref: `PSK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      selections: state.selections,
      stake: state.stake,
      totalOdds: odds,
      potentialReturn: odds * state.stake,
    };
    dispatch({ type: "log", kind: "responsible_gate", label: gate.state, detail: gate.reason });
    dispatch({ type: "place", placement });
    return placement;
  }, [state.selections, state.stake, gate]);

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
    dispatch({ type: "log", kind: "search", label: '"grimsbi towne"', detail: "0 result(s)", meta: { results: 0 } });
    dispatch({ type: "friction", amount: 12, label: "Search returned no results (prototype signal)" });
    dispatch({ type: "friction", amount: 14, label: "Repeated market scrolling without selection" });
  }, []);

  const sessionSeconds = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000));

  const businessMetrics: EvidenceItem[] = [
    {
      id: "bm-search-success",
      label: "Search resolution rate",
      value: state.searches
        ? `${Math.round(((state.searches - state.emptySearches) / state.searches) * 100)}%`
        : "no searches yet",
      source: "measured",
      note: "This session: searches returning at least one match",
    },
    {
      id: "bm-time-to-selection",
      label: "Time to first selection",
      value: state.perf.firstSelectionMs ? `${(state.perf.firstSelectionMs / 1000).toFixed(1)} s` : "—",
      source: "measured",
      note: "Measured from session start to first odd selected",
    },
    {
      id: "bm-markets-expanded",
      label: "Market expansions",
      value: String(state.marketExpansions),
      source: "measured",
      note: "Progressive disclosure steps taken this session",
    },
    {
      id: "bm-completion",
      label: "Journey completion",
      value: state.lastPlacement ? "completed" : "in progress",
      source: "measured",
      note: "Search → match → selection → confirmation",
    },
  ];

  const performanceMetrics: EvidenceItem[] = [
    {
      id: "perf-nav",
      label: "Page load duration",
      value: state.perf.navMs !== null ? `${state.perf.navMs} ms` : "unavailable",
      source: "measured",
      note: "Browser Navigation Timing API",
    },
    {
      id: "perf-longtasks",
      label: "Long tasks observed",
      value: String(state.perf.longTasks),
      source: "measured",
      note: "PerformanceObserver longtask entries (0 where unsupported)",
    },
    {
      id: "perf-session",
      label: "Session duration",
      value: `${sessionSeconds} s`,
      source: "measured",
      note: "Wall time since this anonymous session started",
    },
  ];

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
    totalOdds,
    potentialReturn,
    intelligence: {
      sessionRef: state.sessionRef,
      topInterest,
      engagement,
      frictionScore: friction,
      frictionSignals: state.frictionSignals,
      searches: state.searches,
      interactions: state.interactions,
      sessionSeconds,
      decision: decision.decision,
      decisionWhy: decision.why,
    },
    responsibleGate: { state: gate.state, reason: gate.reason, pass: gate.state !== "SILENCE" },
    businessMetrics,
    performanceMetrics,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionIntelligenceProvider");
  return ctx;
}

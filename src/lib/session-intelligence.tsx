import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Match, Market, Outcome } from "@/data/psk-data";

export type TraceEvent = {
  id: number;
  at: number;
  kind:
    | "search"
    | "navigation"
    | "market_expand"
    | "selection"
    | "selection_removed"
    | "stake"
    | "friction"
    | "responsible_gate"
    | "placement";
  label: string;
  detail?: string | undefined;
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

type Interest = Record<string, number>;

type State = {
  events: TraceEvent[];
  nextId: number;
  selections: Selection[];
  stake: number;
  interest: Interest;
  searches: number;
  frictionScore: number;
  lastPlacement: Placement | null;
  traceOpen: boolean;
  betslipOpen: boolean;
  perf: { interactions: number; slowFrames: number; startedAt: number };
};

type Action =
  | { type: "log"; kind: TraceEvent["kind"]; label: string; detail?: string | undefined; interest?: string[] | undefined }
  | { type: "toggleSelection"; selection: Selection }
  | { type: "removeSelection"; key: string }
  | { type: "setStake"; stake: number }
  | { type: "friction"; amount: number; label: string }
  | { type: "place"; placement: Placement }
  | { type: "reset" }
  | { type: "setTrace"; open: boolean }
  | { type: "setBetslip"; open: boolean };

const initial: State = {
  events: [],
  nextId: 1,
  selections: [],
  stake: 10,
  interest: {},
  searches: 0,
  frictionScore: 0,
  lastPlacement: null,
  traceOpen: false,
  betslipOpen: false,
  perf: { interactions: 0, slowFrames: 0, startedAt: Date.now() },
};

function withEvent(
  state: State,
  kind: TraceEvent["kind"],
  label: string,
  detail?: string,
  interestKeys?: string[],
): State {
  const interest = { ...state.interest };
  for (const k of interestKeys ?? []) interest[k] = (interest[k] ?? 0) + 1;
  return {
    ...state,
    interest,
    nextId: state.nextId + 1,
    perf: { ...state.perf, interactions: state.perf.interactions + 1 },
    events: [
      { id: state.nextId, at: Date.now(), kind, label, detail },
      ...state.events,
    ].slice(0, 60),
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "log": {
      const next = withEvent(state, action.kind, action.label, action.detail, action.interest);
      return action.kind === "search" ? { ...next, searches: next.searches + 1 } : next;
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
        return { ...next, selections: next.selections.filter((s) => s.key !== action.selection.key) };
      }
      const next = withEvent(
        state,
        "selection",
        `${action.selection.marketName}: ${action.selection.outcomeLabel} @ ${action.selection.odds.toFixed(2)}`,
        action.selection.matchLabel,
        [action.selection.matchId, action.selection.marketName],
      );
      return { ...next, selections: [...next.selections, action.selection], betslipOpen: true };
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
      const next = withEvent(state, "friction", action.label);
      return { ...next, frictionScore: Math.min(100, next.frictionScore + action.amount) };
    }
    case "place": {
      const next = withEvent(
        state,
        "placement",
        `Bet placed · ref ${action.placement.ref}`,
        `${action.placement.selections.length} selection(s) · ${action.placement.stake.toFixed(2)} €`,
      );
      return { ...next, lastPlacement: action.placement, selections: [], betslipOpen: false };
    }
    case "reset":
      return { ...initial, traceOpen: state.traceOpen, startedAtKeep: undefined } as State;
    case "setTrace":
      return { ...state, traceOpen: action.open };
    case "setBetslip":
      return { ...state, betslipOpen: action.open };
    default:
      return state;
  }
}

type Ctx = {
  state: State;
  log: (
    kind: TraceEvent["kind"],
    label: string,
    detail?: string,
    interest?: string[],
  ) => void;
  toggleSelection: (match: Match, market: Market, outcome: Outcome) => void;
  removeSelection: (key: string) => void;
  setStake: (stake: number) => void;
  friction: (label: string, amount?: number) => void;
  place: () => Placement | null;
  setTrace: (open: boolean) => void;
  setBetslip: (open: boolean) => void;
  totalOdds: number;
  potentialReturn: number;
  /** Sanitized session-intelligence read model used by the UI. */
  intelligence: {
    topInterest: string[];
    engagement: "browsing" | "focused" | "committed";
    frictionScore: number;
    searches: number;
    interactions: number;
    sessionSeconds: number;
  };
  responsibleGate: { pass: boolean; reason: string };
};

const SessionContext = createContext<Ctx | null>(null);

export function SessionIntelligenceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  const log = useCallback<Ctx["log"]>(
    (kind, label, detail, interest) => dispatch({ type: "log", kind, label, detail, interest }),
    [],
  );

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

  const engagement: "browsing" | "focused" | "committed" =
    state.selections.length > 0 ? "committed" : state.perf.interactions > 4 ? "focused" : "browsing";

  const topInterest = useMemo(
    () =>
      Object.entries(state.interest)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k]) => k),
    [state.interest],
  );

  const responsibleGate = useMemo(() => {
    if (state.stake > 100)
      return { pass: false, reason: "Stake above demo session limit (100 €)" };
    if (state.frictionScore > 60)
      return { pass: false, reason: "Elevated friction signals — cool-off suggested" };
    return { pass: true, reason: "Session within demo play limits" };
  }, [state.stake, state.frictionScore]);

  const place = useCallback((): Placement | null => {
    if (!state.selections.length) return null;
    if (!responsibleGate.pass) {
      dispatch({ type: "log", kind: "responsible_gate", label: "BLOCK", detail: responsibleGate.reason });
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
    dispatch({ type: "log", kind: "responsible_gate", label: "PASS", detail: responsibleGate.reason });
    dispatch({ type: "place", placement });
    return placement;
  }, [state.selections, state.stake, responsibleGate]);

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
    totalOdds,
    potentialReturn,
    intelligence: {
      topInterest,
      engagement,
      frictionScore: state.frictionScore,
      searches: state.searches,
      interactions: state.perf.interactions,
      sessionSeconds: Math.round((Date.now() - state.perf.startedAt) / 1000),
    },
    responsibleGate,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionIntelligenceProvider");
  return ctx;
}

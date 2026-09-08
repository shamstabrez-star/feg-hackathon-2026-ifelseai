import { frictionScore } from "./friction-engine";
import { evaluateGate, type GateResult } from "./responsible-gate";
import { decideExperience, journeyStage } from "./experience-decision";
import type {
  Decision,
  DemoPath,
  Engagement,
  EventKind,
  FrictionSignal,
  JourneyStage,
  MarketTier,
  PerfState,
  Placement,
  SearchContext,
  Selection,
  TraceEvent,
} from "./types";

/**
 * Layer 2 — Session state.
 *
 * A plain reducer plus pure selectors: no React, no store library. Any UI
 * layer (current React binding, a future Vue store) can own this state by
 * dispatching the same actions and reading the same derived model.
 */

export type SessionState = {
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
  marketTier: Record<string, MarketTier>;
  /** Preserved search-to-match context (sanitized query text only). */
  searchContext: SearchContext | null;
  /** Recent normalized queries, used to spot genuine reformulation loops. */
  recentQueries: string[];
  reformulations: number;
  /** Measured browser timings, filled from the Performance API. */
  perf: PerfState;
};

export type SessionAction =
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
  | { type: "perf"; patch: Partial<PerfState> }
  | { type: "viewMatch"; matchId: string }
  | { type: "setMarketTier"; matchId: string; tier: MarketTier }
  | { type: "searchContext"; context: SearchContext | null };

function newSessionRef() {
  return `S-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function makeInitialSession(demoPath: DemoPath = "none"): SessionState {
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
    perf: {
      firstSelectionMs: null,
      longTasks: 0,
      navMs: null,
      searchMs: null,
      interactionMs: null,
      requests: null,
    },
    lastViewedMatchId: null,
    viewedMatches: [],
    marketTier: {},
    searchContext: null,
    recentQueries: [],
    reformulations: 0,
  };
}

function withEvent(
  state: SessionState,
  kind: EventKind,
  label: string,
  detail?: string,
  interestKeys?: string[],
  meta?: Record<string, string | number>,
): SessionState {
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

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
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
      const next = withEvent(
        state,
        "friction",
        action.label,
        `prototype signal · +${action.amount}`,
      );
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
      const fresh = makeInitialSession(action.demoPath);
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
        viewedMatches: [
          action.matchId,
          ...state.viewedMatches.filter((x) => x !== action.matchId),
        ].slice(0, 8),
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
/* Pure selectors — the live derived model                             */
/* ------------------------------------------------------------------ */

export type DerivedSession = {
  totalOdds: number;
  potentialReturn: number;
  topInterest: string[];
  engagement: Engagement;
  sessionSeconds: number;
  friction: number;
  gate: GateResult;
  decision: Decision;
  decisionWhy: string;
  stage: JourneyStage;
};

export function totalOdds(state: SessionState) {
  return state.selections.reduce((acc, s) => acc * s.odds, 1);
}

export function deriveSession(state: SessionState, now = Date.now()): DerivedSession {
  const odds = totalOdds(state);
  const friction = frictionScore(state);
  const gate = evaluateGate(state.stake, friction);
  const { decision, why } = decideExperience({
    gate: gate.state,
    friction,
    emptySearches: state.emptySearches,
    searches: state.searches,
    interactions: state.interactions,
    selectionCount: state.selections.length,
    hasPlacement: !!state.lastPlacement,
  });

  return {
    totalOdds: odds,
    potentialReturn: state.selections.length ? odds * state.stake : 0,
    topInterest: Object.entries(state.interest)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k),
    engagement:
      state.selections.length > 0 ? "committed" : state.interactions > 4 ? "focused" : "browsing",
    sessionSeconds: Math.max(1, Math.round((now - state.startedAt) / 1000)),
    friction,
    gate,
    decision,
    decisionWhy: why,
    stage: journeyStage({
      searches: state.searches,
      lastViewedMatchId: state.lastViewedMatchId,
      marketExpansions: state.marketExpansions,
      selectionCount: state.selections.length,
      hasPlacement: !!state.lastPlacement,
    }),
  };
}

/** Builds a placement from current state — pure, the caller dispatches it. */
export function buildPlacement(state: SessionState): Placement | null {
  if (!state.selections.length) return null;
  const odds = totalOdds(state);
  return {
    ref: `PSK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    selections: state.selections,
    stake: state.stake,
    totalOdds: odds,
    potentialReturn: odds * state.stake,
  };
}

import { evaluateFriction } from "./friction-engine";
import { evaluateGate, type GateResult } from "./responsible-gate";
import { COMPLETION_REASON, decideExperience, journeyStage } from "./experience-decision";
import { contextConfidence, contextMatch, contextState } from "./context-engine";
import { matchById } from "@/data/psk-data";
import { PRODUCTS, type ProductKey } from "./product-context";
import type {
  Decision,
  DemoPath,
  Engagement,
  EventKind,
  FrictionLevel,
  FrictionSignal,
  IntentConfidence,
  JourneyStage,
  MarketTier,
  PerfState,
  Placement,
  SearchContext,
  Selection,
  SessionContextModel,
  SessionIntent,
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
  /** Resolved intent for this session, plain label plus prototype confidence. */
  intent: SessionIntent | null;
  /** Search results existed for the current query. */
  intentResolved: boolean;
  /** The customer engaged with the betslip itself (stake, open, place). */
  betslipEngaged: boolean;
  /** Confirm pressed — placement in flight. */
  transactionStarted: boolean;
  /** Done pressed after a completed journey. */
  exited: boolean;
  /** Stage before the current one, for the judge trace only. */
  previousStage: JourneyStage | null;
  /** Last market an outcome was selected from. */
  lastSelectedMarket: string | null;
  /** Last market group the customer opened/expanded on a match page. */
  lastViewedMarket: string | null;
  /** Event the session was anchored on before the current one. */
  previousMatchId: string | null;
  /** The customer clearly changed task (opened a different event). */
  contextSwitched: boolean;
  /** The customer came back to an event already seen in this session. */
  contextRestored: boolean;
  /** Active journey context cleared after the customer chose Done. */
  contextCleared: boolean;
  /** Sports → event → Sports round trips with no progress in between. */
  lobbyLoops: number;
  /** Something meaningful happened since the current event was opened. */
  progressSinceEvent: boolean;
  /** The customer reached a plausible target (event opened / selection made). */
  targetDiscovered: boolean;
  /** Measured browser timings, filled from the Performance API. */
  perf: PerfState;
  /** Existing PSK product the customer is currently in. */
  activeProduct: ProductKey;
  /** Product the session was in before this one. */
  previousProduct: ProductKey | null;
  /** Context label held in that previous product (history only). */
  previousProductContext: string | null;
  /** Last context reached inside each non-sport product, for continuity. */
  productMemory: Partial<Record<ProductKey, string>>;
  /** Live query inside the current non-sport product (sanitized text only). */
  productQuery: string | null;
  /** Result count for that query — measured, never invented. */
  productResults: number | null;
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
  | { type: "viewMarket"; marketName: string }
  | { type: "searchContext"; context: SearchContext | null }
  | { type: "intent"; intent: SessionIntent | null; resolved: boolean }
  | { type: "betslipEngaged" }
  | { type: "beginTransaction" }
  | { type: "exit" }
  | { type: "enterProduct"; product: ProductKey }
  | { type: "productSearch"; query: string; results: number; topResult?: string | undefined }
  | { type: "productSelect"; label: string }
  | { type: "stage"; stage: JourneyStage };

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
    intent: null,
    intentResolved: false,
    betslipEngaged: false,
    transactionStarted: false,
    exited: false,
    previousStage: null,
    lastSelectedMarket: null,
    lastViewedMarket: null,
    previousMatchId: null,
    contextSwitched: false,
    contextRestored: false,
    contextCleared: false,
    lobbyLoops: 0,
    progressSinceEvent: false,
    targetDiscovered: false,
    activeProduct: "SPORT",
    previousProduct: null,
    previousProductContext: null,
    productMemory: {},
    productQuery: null,
    productResults: null,
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
          // A dead end reopens the question of whether a target was found.
          targetDiscovered: empty ? false : next.targetDiscovered,
        };
      }
      if (action.kind === "market_expand")
        return {
          ...next,
          marketExpansions: next.marketExpansions + 1,
          progressSinceEvent: true,
        };
      if (action.kind === "navigation" && action.label === "Sports lobby") {
        // Sports → event → Sports with nothing achieved in between.
        const unproductive = !!state.lastViewedMatchId && !state.progressSinceEvent;
        return {
          ...next,
          lobbyLoops: next.lobbyLoops + (unproductive ? 1 : 0),
          progressSinceEvent: false,
        };
      }
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
        lastSelectedMarket: action.selection.marketName,
        selections: [...next.selections, action.selection],
        betslipOpen: true,
        progressSinceEvent: true,
        targetDiscovered: true,
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
      return { ...state, stake: action.stake, betslipEngaged: true };
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
      return {
        ...next,
        lastPlacement: action.placement,
        selections: [],
        transactionStarted: false,
      };
    }
    case "reset": {
      const fresh = makeInitialSession(action.demoPath);
      return { ...fresh, traceOpen: state.traceOpen };
    }
    case "setTrace":
      return { ...state, traceOpen: action.open };
    case "setBetslip":
      return { ...state, betslipOpen: action.open, betslipEngaged: state.betslipEngaged || action.open };
    case "intent": {
      if (
        state.intent?.label === action.intent?.label &&
        state.intentResolved === action.resolved
      )
        return state;
      return { ...state, intent: action.intent, intentResolved: action.resolved };
    }
    case "betslipEngaged":
      return state.betslipEngaged ? state : { ...state, betslipEngaged: true };
    case "beginTransaction":
      return { ...state, transactionStarted: true, betslipEngaged: true };
    case "exit":
      // Task complete — PSK lets go of the active journey context.
      return state.exited
        ? state
        : {
            ...state,
            exited: true,
            contextCleared: true,
            contextSwitched: false,
            contextRestored: false,
            searchContext: null,
            intent: null,
            intentResolved: false,
            lastViewedMatchId: null,
            lastViewedMarket: null,
            lastSelectedMarket: null,
            previousMatchId: null,
            frictionSignals: [],
            lobbyLoops: 0,
            progressSinceEvent: false,
            targetDiscovered: false,
          };
    case "enterProduct": {
      if (state.activeProduct === action.product) return state;
      const leaving = currentProductContextLabel(state);
      const next = withEvent(
        state,
        "navigation",
        `Product: ${PRODUCTS[action.product].label}`,
        `Previous context: ${leaving}`,
      );
      return {
        ...next,
        activeProduct: action.product,
        previousProduct: state.activeProduct,
        previousProductContext: leaving,
        // Context never crosses products: a new product starts with its own.
        productQuery: null,
        productResults: null,
      };
    }
    case "productSearch": {
      const label = PRODUCTS[state.activeProduct].label;
      const next = withEvent(
        state,
        "search",
        `"${action.query}"`,
        `${label} · ${action.results} result(s)`,
        undefined,
        { results: action.results },
      );
      return {
        ...next,
        productQuery: action.query,
        productResults: action.results,
        productMemory: action.topResult
          ? { ...state.productMemory, [state.activeProduct]: `${label} · ${action.topResult}` }
          : state.productMemory,
      };
    }
    case "productSelect": {
      const label = PRODUCTS[state.activeProduct].label;
      const next = withEvent(state, "navigation", `${label}: ${action.label}`);
      return {
        ...next,
        productMemory: { ...state.productMemory, [state.activeProduct]: `${label} · ${action.label}` },
      };
    }
    case "stage":
      return state.previousStage === action.stage ? state : { ...state, previousStage: action.stage };
    case "perf":
      return { ...state, perf: { ...state.perf, ...action.patch } };
    case "viewMatch": {
      // Re-reaching the same event still counts as finding the target, so any
      // strain picked up since then is released.
      if (state.lastViewedMatchId === action.matchId)
        return { ...state, contextSwitched: false, targetDiscovered: true };
      const switched = !!state.lastViewedMatchId && state.lastViewedMatchId !== action.matchId;
      return {
        ...state,
        previousMatchId: switched ? state.lastViewedMatchId : state.previousMatchId,
        contextSwitched: switched,
        contextRestored: state.viewedMatches.includes(action.matchId),
        lastViewedMatchId: action.matchId,
        viewedMatches: [
          action.matchId,
          ...state.viewedMatches.filter((x) => x !== action.matchId),
        ].slice(0, 8),
        searchContext: state.searchContext
          ? { ...state.searchContext, matchId: action.matchId }
          : state.searchContext,
        // Reaching an event is a plausible target — release accumulated strain.
        targetDiscovered: true,
        progressSinceEvent: false,
      };
    }
    case "viewMarket":
      return state.lastViewedMarket === action.marketName
        ? { ...state, progressSinceEvent: true }
        : { ...state, lastViewedMarket: action.marketName, progressSinceEvent: true };
    case "setMarketTier":
      return { ...state, marketTier: { ...state.marketTier, [action.matchId]: action.tier } };
    case "searchContext":
      // A search that hands off to an event is a found target: strain picked
      // up during the unsuccessful attempts is released.
      return {
        ...state,
        searchContext: action.context,
        targetDiscovered: action.context ? true : state.targetDiscovered,
      };
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
  frictionLevel: FrictionLevel;
  frictionReason: string;
  /** Plain-language description of how the experience responds. */
  experienceResponse: string;
  gate: GateResult;
  decision: Decision;
  decisionWhy: string;
  stage: JourneyStage;
  /** The single privacy-safe session context object. */
  context: SessionContextModel;
};

function matchLabel(id: string) {
  const m = matchById(id);
  return m ? `${m.home} - ${m.away}` : null;
}

export function totalOdds(state: SessionState) {
  return state.selections.reduce((acc, s) => acc * s.odds, 1);
}

function confidenceBand(value: number): IntentConfidence {
  if (value >= 0.75) return "high";
  if (value >= 0.5) return "medium";
  if (value > 0) return "low";
  return "none";
}

/** How the experience answers the current decision — judge-facing wording. */
function experienceResponse(decision: Decision): string {
  switch (decision) {
    case "SIMPLIFY":
      return "Prioritise relevant result";
    case "DISCOVER":
      return "Surface relevant events";
    case "CONTINUE":
      return "Preserve context, stay out of the way";
    default:
      return "No intervention";
  }
}

export function deriveSession(state: SessionState, now = Date.now()): DerivedSession {
  const odds = totalOdds(state);
  const frictionResult = evaluateFriction({
    frictionSignals: state.frictionSignals,
    emptySearches: state.emptySearches,
    marketExpansions: state.marketExpansions,
    reformulations: state.reformulations,
    lobbyLoops: state.lobbyLoops,
    targetDiscovered: state.targetDiscovered,
    selectionCount: state.selections.length,
    hasPlacement: !!state.lastPlacement,
    exited: state.exited,
  });
  const friction = frictionResult.score;
  const gate = evaluateGate(state.stake, friction);
  const focus = state.contextCleared
    ? undefined
    : contextMatch({
    interest: state.interest,
    viewedMatches: state.viewedMatches,
    lastViewedMatchId: state.lastViewedMatchId,
        searchContext: state.searchContext,
      });
  const previousEvent = state.previousMatchId
    ? matchLabel(state.previousMatchId)
    : null;
  const ctxConfidence = contextConfidence({
    focus,
    interest: state.interest,
    searchMatched: !!state.searchContext?.matchId && state.searchContext.matchId === focus?.id,
    selections: state.selections.length,
    returning: !!focus && state.viewedMatches.filter((id) => id === focus.id).length > 0,
  });
  const confidence = state.intent?.confidence ?? 0;
  const stage = journeyStage({
    searches: state.searches,
    intentConfidence: confidence,
    hasIntent: !!state.intent,
    lastViewedMatchId: state.lastViewedMatchId,
    marketExpansions: state.marketExpansions,
    selectionCount: state.selections.length,
    betslipEngaged: state.betslipEngaged,
    transactionStarted: state.transactionStarted,
    hasPlacement: !!state.lastPlacement,
    exited: state.exited,
    interactions: state.interactions,
  });
  const { decision, why } = decideExperience({
    gate: gate.state,
    friction,
    frictionLevel: frictionResult.level,
    frictionReason: frictionResult.reason,
    targetDiscovered: state.targetDiscovered,
    emptySearches: state.emptySearches,
    searches: state.searches,
    interactions: state.interactions,
    selectionCount: state.selections.length,
    hasPlacement: !!state.lastPlacement,
    exited: state.exited,
    corrected: !!state.searchContext?.corrected,
    intentConfidence: confidence,
    hasContext: !!focus,
    returning: !!focus && state.contextRestored && !state.contextSwitched,
    // A live query with usable results counts, even before the customer has
    // opened one of them.
    activeSearchResults: (!!state.searchContext || !!state.intent) && state.intentResolved,
  });

  const outcome = state.exited
    ? "Journey completed successfully"
    : state.lastPlacement
      ? "Bet accepted"
      : state.transactionStarted
        ? "Placement in progress"
        : state.selections.length
          ? "Selection added"
          : focus
            ? "Match opened"
            : state.intent
              ? "Intent understood"
              : "Session active";

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
    frictionLevel: frictionResult.level,
    frictionReason: frictionResult.reason,
    experienceResponse: experienceResponse(decision),
    gate,
    decision,
    decisionWhy: why,
    stage,
    context: {
      sessionId: state.sessionRef,
      journeyStage: stage,
      previousStage: state.previousStage,
      intent: state.intent?.label ?? "Browse the offer",
      intentConfidence: confidenceBand(confidence),
      activeSport: focus ? "Football" : null,
      activeEvent: focus ? `${focus.home} - ${focus.away}` : null,
      activeCompetition: focus?.competition ?? null,
      activeSearch: state.searchContext?.query ?? null,
      lastViewedEvent: state.lastViewedMatchId ? matchLabel(state.lastViewedMatchId) : null,
      lastViewedMarket: state.lastViewedMarket,
      lastSelectedMarket: state.lastSelectedMarket,
      previousEvent,
      contextConfidence: ctxConfidence,
      contextSwitched: state.contextSwitched,
      contextState: contextState({
        cleared: state.contextCleared,
        switched: state.contextSwitched,
        restored: state.contextRestored,
        hasFocus: !!focus,
        viewedCount: state.viewedMatches.length,
      }),
      frictionLevel: frictionResult.level,
      frictionReason: frictionResult.reason,
      experienceResponse: experienceResponse(decision),
      responsibleGate: gate.state,
      experienceDecision: decision,
      outcome,
      reason: state.lastPlacement || state.exited ? COMPLETION_REASON : why,
    },
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

/**
 * Layer 0 — shared domain types.
 *
 * Framework-agnostic: nothing in src/core imports React or any UI library.
 * These types are the contract between the PSK UI layer and the engines
 * (session state, intent, context, relevance, friction, responsible gate,
 * experience decision, evidence/metrics).
 */

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

/** Sanitized search-to-match context (query text only, no identifiers). */
export type SearchContext = {
  query: string;
  corrected?: string;
  matchId?: string;
};

/** Resolved session intent — plain text label only, never personal data. */
export type SessionIntent = {
  /** e.g. "Find Real Madrid". */
  label: string;
  /** Prototype confidence, 0-1, from the transparent intent scoring. */
  confidence: number;
  /** Raw query the customer typed. */
  query?: string;
  /** Entity the query most plausibly refers to (e.g. "Real Madrid"). */
  normalisedQuery?: string;
  /** UNKNOWN | SPORT | TEAM | COMPETITION | EVENT | PLAYER | GENERAL_SEARCH */
  intentType?: string;
  entityType?: string | null;
  entityId?: string;
  /** exact | partial | variation | context | none */
  source?: string;
};


export type IntentConfidence = "none" | "low" | "medium" | "high";

/** Confidence in the short-lived active session context. */
export type ContextConfidence = "LOW" | "MEDIUM" | "HIGH";

/** Lifecycle of the active session context. */
export type ContextState =
  | "none"
  | "established"
  | "retained"
  | "restored"
  | "switched"
  | "cleared";

/** Banded friction state — conservative thresholds over the prototype score. */
export type FrictionLevel = "LOW" | "MEDIUM" | "HIGH";

/** Responsible gate runs BEFORE any experience decision. */
export type GateState = "PASS" | "ADAPT" | "SILENCE";
/** Experience decision the customer UI may act on. */
export type Decision = "SIMPLIFY" | "DISCOVER" | "CONTINUE" | "NONE";
export type DemoPath = "none" | "success" | "friction";
export type Engagement = "browsing" | "focused" | "committed";

/** Where the session sits in the Challenge 1 journey. */
export type JourneyStage =
  | "entry"
  | "discovery"
  | "intent"
  | "context"
  | "exploration"
  | "decision"
  /** Intended event and outcome chosen, exploration over, before any action. */
  | "decision_ready"
  | "action"
  | "transaction"
  | "completion"
  | "exit";

/**
 * The privacy-safe session context object. Prototype values only: no player
 * identifiers, tokens, cookies, URLs or personal data of any kind.
 */
export type SessionContextModel = {
  sessionId: string;
  /** Existing PSK product the customer is actually in (judge-facing label). */
  activeProduct: string;
  /** Product-scoped active context label — never steered by another product. */
  activeContext: string;
  /** Product the session was in before the current one. */
  previousProduct: string | null;
  /** Context held in that previous product, kept only as history. */
  previousContext: string | null;
  journeyStage: JourneyStage;
  previousStage: JourneyStage | null;
  intent: string;
  intentConfidence: IntentConfidence;
  activeSport: string | null;
  activeEvent: string | null;
  activeCompetition: string | null;
  activeSearch: string | null;
  lastViewedEvent: string | null;
  lastViewedMarket: string | null;
  lastSelectedMarket: string | null;
  /** Event the session was anchored on before the current one, if any. */
  previousEvent: string | null;
  /** Confidence in the active context — only strong context adapts the UI. */
  contextConfidence: ContextConfidence;
  /** True when the customer clearly moved to a different task. */
  contextSwitched: boolean;
  /** Lifecycle of the active context, for the judge trace only. */
  contextState: ContextState;
  frictionLevel: FrictionLevel;
  /** Plain-language explanation of the friction state, judge-facing only. */
  frictionReason: string;
  /** How the experience responds to the current decision, judge-facing only. */
  experienceResponse: string;
  responsibleGate: GateState;
  experienceDecision: Decision;
  outcome: string;
  /** Plain-language reason behind the current experience decision. */
  reason: string;
};

export type MarketTier = 1 | 2 | 3;

export type PerfState = {
  firstSelectionMs: number | null;
  longTasks: number;
  navMs: number | null;
  /** Last measured search response time, input settled → results rendered. */
  searchMs: number | null;
  /** Last measured UI interaction latency (click → state committed). */
  interactionMs: number | null;
  /** Network requests observed by the browser Resource Timing API. */
  requests: number | null;
};

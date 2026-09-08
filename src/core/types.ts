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
  | "match"
  | "decision"
  | "action"
  | "completion";

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

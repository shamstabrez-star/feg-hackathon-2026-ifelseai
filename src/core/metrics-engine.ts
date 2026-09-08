import type { EvidenceItem } from "@/data/evidence";
import type { SessionState } from "./session-state";

/**
 * Layer 9 — Evidence / metrics.
 *
 * Only values actually measured in the live session. Dataset-derived and
 * illustrative evidence lives in src/data/evidence.ts; nothing here is
 * invented or estimated.
 */

export function businessMetrics(state: SessionState): EvidenceItem[] {
  return [
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
      value: state.perf.firstSelectionMs
        ? `${(state.perf.firstSelectionMs / 1000).toFixed(1)} s`
        : "—",
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
}

export function performanceMetrics(state: SessionState, sessionSeconds: number): EvidenceItem[] {
  return [
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
}

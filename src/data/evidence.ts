/**
 * Evidence model for the judge-facing trace.
 *
 * Two strictly separated classes of numbers:
 *  - "dataset"      : aggregated, anonymised metrics derived from the supplied
 *                     challenge datasets. Only cohort-level aggregates are ever
 *                     stored here — never PlayerIDs, tokens, transaction ids or
 *                     any personal data.
 *  - "illustrative" : prototype assumptions used to make the demo readable.
 *                     They are NOT measurements and are always labelled as such.
 *
 * A third class, "measured", is produced live at runtime by the session engine
 * (browser Performance API + real interaction counters) and never hardcoded.
 */

export type EvidenceSource = "dataset" | "measured" | "illustrative";

export type EvidenceItem = {
  id: string;
  label: string;
  value: string;
  source: EvidenceSource;
  note: string;
};

/** Datasets supplied to this prototype (kept as project assets, never parsed at runtime). */
export const suppliedDatasets = [
  "top_casino_users_event_logs_v2.xlsx",
  "hackathon_casino_trends.xlsx",
] as const;

/** Datasets requested but not supplied. No figures are inferred for these. */
export const missingDatasets = ["top_sport_users_event_logs.csv", "CA_Player.csv"] as const;

/** Kept for backwards compatibility with earlier trace copy. */
export const expectedDatasets = [...suppliedDatasets, ...missingDatasets] as const;

const DERIVED = "Derived from supplied challenge dataset.";

/**
 * Aggregated, anonymised evidence computed offline from the supplied workbooks.
 *
 * Cohort-level aggregates only: no PlayerIDs, hashes, session tokens, betslip
 * numbers, fixture/selection identifiers or any personal data are stored here.
 */
export const datasetEvidence: EvidenceItem[] = [
  {
    id: "ds-scale",
    label: "Anonymised events analysed",
    value: "332,119 across 13,260 sessions",
    source: "dataset",
    note: `${DERIVED} top_casino_users_event_logs_v2.xlsx, cohort aggregate only`,
  },
  {
    id: "ds-mobile",
    label: "Mobile-origin events",
    value: "71.6%",
    source: "dataset",
    note: `${DERIVED} Share of events from mobile platforms`,
  },
  {
    id: "ds-football",
    label: "Football share of betslip additions",
    value: "87.3%",
    source: "dataset",
    note: `${DERIVED} Supports a football-first Sports journey`,
  },
  {
    id: "ds-match-entry",
    label: "Additions from a match page",
    value: "30.4%",
    source: "dataset",
    note: `${DERIVED} Largest single entry point for selections`,
  },
  {
    id: "ds-conversion",
    label: "Sessions with an addition that placed",
    value: "83.3% (1,374 of 1,649)",
    source: "dataset",
    note: `${DERIVED} Betslip completion rate at session level`,
  },
  {
    id: "ds-depth",
    label: "Median events per session",
    value: "7 (p90 56)",
    source: "dataset",
    note: `${DERIVED} Motivates progressive market disclosure`,
  },
  {
    id: "ds-trend-length",
    label: "Median session length, 12-month trend",
    value: "683 s (CASA, Sep 2025 – Aug 2026)",
    source: "dataset",
    note: `${DERIVED} hackathon_casino_trends.xlsx, monthly market aggregate`,
  },
  {
    id: "ds-trend-frequency",
    label: "Average sessions per player per month",
    value: "12.1 (CASA)",
    source: "dataset",
    note: `${DERIVED} hackathon_casino_trends.xlsx, monthly market aggregate`,
  },
];

export const datasetsAvailable = datasetEvidence.length > 0;


/** Prototype assumptions — clearly separated, never presented as measurements. */
export const illustrativeEvidence: EvidenceItem[] = [
  {
    id: "assume-market-depth",
    label: "Relevant markets per match",
    value: "3 core, 12 extended",
    source: "illustrative",
    note: "Prototype content model, not a production offer size",
  },
  {
    id: "assume-friction-threshold",
    label: "Friction ADAPT threshold",
    value: "score 30",
    source: "illustrative",
    note: "Prototype tuning value chosen for demo readability",
  },
  {
    id: "assume-silence-threshold",
    label: "Friction SILENCE threshold",
    value: "score 60",
    source: "illustrative",
    note: "Prototype tuning value; production would be policy-owned",
  },
  {
    id: "assume-stake-limit",
    label: "Demo session stake ceiling",
    value: "100 €",
    source: "illustrative",
    note: "Prototype guardrail, not a PSK limit",
  },
];

/**
 * Downstream validation only. D30/D90 are outcome measures that cannot be
 * observed inside a prototype session, so they carry no numbers here.
 */
export const downstreamValidation: EvidenceItem[] = [
  {
    id: "d30",
    label: "D30 retention delta",
    value: "not measurable in prototype",
    source: "illustrative",
    note: "Downstream validation metric — requires a live A/B cohort",
  },
  {
    id: "d90",
    label: "D90 retention delta",
    value: "not measurable in prototype",
    source: "illustrative",
    note: "Downstream validation metric — requires a live A/B cohort",
  },
];

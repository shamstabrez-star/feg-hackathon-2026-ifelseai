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

/** Datasets this prototype can ingest. Presence is checked at build time. */
export const expectedDatasets = [
  "top_sport_users_event_logs.csv",
  "top_casino_users_event_logs_v2.xlsx",
  "CA_Player.csv",
] as const;

/**
 * Aggregated dataset-derived evidence.
 *
 * Empty until the challenge dataset files are added to the project. Nothing is
 * invented here: if no dataset is present, the trace shows the datasets as
 * "not supplied" rather than displaying fabricated aggregates.
 */
export const datasetEvidence: EvidenceItem[] = [];

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

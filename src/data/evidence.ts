/**
 * Judge-facing evidence model.
 *
 * Three strictly separated classes of numbers:
 *  - "dataset"      : anonymised cohort aggregates derived offline from the
 *                     supplied challenge sources. Only counts, rates and
 *                     distributions — never PlayerID, session/token values,
 *                     transaction or betslip identifiers, fixture/selection
 *                     ids, page URLs or any personal data.
 *  - "measured"     : produced live at runtime by the session engine
 *                     (browser Performance API + real interaction counters).
 *  - "illustrative" : prototype assumptions, never presented as measurements.
 *
 * Anything the supplied sources cannot support is marked explicitly as
 * "Not directly measurable from supplied dataset." — no figure is invented.
 */

export type EvidenceSource = "dataset" | "measured" | "illustrative";

export type EvidenceCategory =
  | "SESSION QUALITY"
  | "DISCOVERY"
  | "ACTION"
  | "FRICTION"
  | "VALUE"
  | "RESPONSIBLE GUARDRAILS";

export type EvidenceItem = {
  id: string;
  label: string;
  value: string;
  source: EvidenceSource;
  note: string;
  /** How this figure connects to Core Challenge 1. */
  challenge1?: string;
  category?: EvidenceCategory;
};

/** Sources supplied to this prototype and preserved as project assets. */
export const suppliedDatasets = [
  "top_casino_users_event_logs_v2.xlsx",
  "hackathon_casino_trends.xlsx",
] as const;

/** Sources requested but not supplied. No figures are inferred for these. */
export const missingDatasets = ["top_sport_users_event_logs.csv", "CA_Player.csv"] as const;

export const expectedDatasets = [...suppliedDatasets, ...missingDatasets] as const;

const DERIVED = "Derived from supplied challenge dataset";
const NOT_MEASURABLE = "Not directly measurable from supplied dataset.";

export const datasetEvidence: EvidenceItem[] = [
  // ---------------------------------------------------------------- SESSION
  {
    id: "sq-scale",
    label: "Anonymised events analysed",
    value: "332,119 events · 13,260 sessions",
    source: "dataset",
    note: `${DERIVED} — cohort aggregate only, no identifiers retained`,
    challenge1: "Establishes the behavioural base the journey model is tuned against.",
    category: "SESSION QUALITY",
  },
  {
    id: "sq-sports",
    label: "Sessions with a sports-context screen",
    value: "4,663 of 13,260 (35.2%)",
    source: "dataset",
    note: `${DERIVED} — screen-level aggregate`,
    challenge1: "Sizes the Challenge 1 population inside the supplied cohort.",
    category: "SESSION QUALITY",
  },
  {
    id: "sq-depth",
    label: "Median events per sports session",
    value: "14 (all sessions: 7, p90 56)",
    source: "dataset",
    note: `${DERIVED} — session-depth distribution`,
    challenge1: "Long tails motivate progressive market disclosure over a wall of odds.",
    category: "SESSION QUALITY",
  },
  {
    id: "sq-shallow",
    label: "Single-event sessions",
    value: "1,619 of 13,260 (12.2%)",
    source: "dataset",
    note: `${DERIVED} — supported session-quality floor`,
    challenge1: "Shallow entries need an immediately relevant first screen.",
    category: "SESSION QUALITY",
  },
  {
    id: "sq-duration",
    label: "Per-session dwell time",
    value: NOT_MEASURABLE,
    source: "dataset",
    note: "Supplied event log carries no usable per-event time base",
    challenge1: "Timing claims are therefore taken only from live browser measurement.",
    category: "SESSION QUALITY",
  },

  // -------------------------------------------------------------- DISCOVERY
  {
    id: "dc-search",
    label: "Sessions using search",
    value: "573 of 4,663 sports sessions (12.3%)",
    source: "dataset",
    note: `${DERIVED} — discovery-surface aggregate`,
    challenge1: "Search is a real but under-converting entry into the Sports journey.",
    category: "DISCOVERY",
  },
  {
    id: "dc-search-match",
    label: "Search sessions reaching a match page",
    value: "0 of 573 (0.0%)",
    source: "dataset",
    note: `${DERIVED} — search-to-match conversion`,
    challenge1: "Directly motivates search that resolves to the intended match in one step.",
    category: "DISCOVERY",
  },
  {
    id: "dc-entry",
    label: "Largest selection entry point",
    value: "Match detail odds — 7,418 additions",
    source: "dataset",
    note: `${DERIVED} — entry-point distribution of betslip additions`,
    challenge1: "Confirms the match page as the decision surface to optimise.",
    category: "DISCOVERY",
  },
  {
    id: "dc-football",
    label: "Football share of betslip additions",
    value: "87.3%",
    source: "dataset",
    note: `${DERIVED} — sport-level aggregate`,
    challenge1: "Supports a football-first relevance model in search and markets.",
    category: "DISCOVERY",
  },

  // ----------------------------------------------------------------- ACTION
  {
    id: "ac-match-add",
    label: "Match-page sessions adding a selection",
    value: "1,223 of 1,513 (80.8%)",
    source: "dataset",
    note: `${DERIVED} — match-to-action conversion`,
    challenge1: "Once the right match is reached, action rate is already high.",
    category: "ACTION",
  },
  {
    id: "ac-place",
    label: "Sessions with a selection that completed",
    value: "981 of 1,248 (78.6%)",
    source: "dataset",
    note: `${DERIVED} — final-step completion rate`,
    challenge1: "Sets the baseline the confirmation step must not degrade.",
    category: "ACTION",
  },

  // --------------------------------------------------------------- FRICTION
  {
    id: "fr-abandon",
    label: "Selection abandoned before completion",
    value: "267 of 1,248 (21.4%)",
    source: "dataset",
    note: `${DERIVED} — candidate friction signal, not a proven cause`,
    challenge1: "Justifies a short, low-noise betslip and confirmation step.",
    category: "FRICTION",
  },
  {
    id: "fr-repeat",
    label: "Repeated discovery without an action",
    value: "417 of 573 search sessions (72.8%)",
    source: "dataset",
    note: `${DERIVED} — candidate friction signal: 3+ search events, no selection`,
    challenge1: "The strongest supported case for reducing discovery friction.",
    category: "FRICTION",
  },
  {
    id: "fr-cause",
    label: "Cause of abandonment",
    value: NOT_MEASURABLE,
    source: "dataset",
    note: "Event log records sequence, not intent — patterns stay candidate signals",
    category: "FRICTION",
  },

  // ------------------------------------------------------------------ VALUE
  {
    id: "vl-mobile",
    label: "Mobile-origin events",
    value: "71.6%",
    source: "dataset",
    note: `${DERIVED} — platform aggregate`,
    challenge1: "Mobile-first layout and thumb-reach betslip are the default, not an option.",
    category: "VALUE",
  },
  {
    id: "vl-cross",
    label: "Sessions spanning sports and casino contexts",
    value: "664 of 13,260 (5.0%)",
    source: "dataset",
    note: `${DERIVED} — cross-context aggregate; casino used only as generalisation evidence`,
    challenge1: "Shows the same discovery architecture applies across existing PSK contexts.",
    category: "VALUE",
  },
  {
    id: "vl-trend-length",
    label: "Median session length, 12-month trend",
    value: "683 s (Sep 2025 – Aug 2026)",
    source: "dataset",
    note: `${DERIVED} — hackathon_casino_trends.xlsx, monthly market aggregate`,
    challenge1: "Contextual only — a casino trend, not a Sports journey measurement.",
    category: "VALUE",
  },
  {
    id: "vl-trend-frequency",
    label: "Average sessions per player per month",
    value: "12.1",
    source: "dataset",
    note: `${DERIVED} — hackathon_casino_trends.xlsx, monthly market aggregate`,
    challenge1: "Frequency context for downstream retention validation.",
    category: "VALUE",
  },
  {
    id: "vl-player",
    label: "Player activity, product mix and value bands",
    value: NOT_MEASURABLE,
    source: "dataset",
    note: "CA_Player.csv was not supplied to this prototype — no figures inferred",
    category: "VALUE",
  },

  // --------------------------------------------------- RESPONSIBLE GUARDRAILS
  {
    id: "rg-anon",
    label: "Identifier fields carried into the app",
    value: "0",
    source: "dataset",
    note: `${DERIVED} — PlayerID, session, betslip, fixture, selection and page URL fields dropped at aggregation`,
    challenge1: "Evidence layer is privacy-safe by construction.",
    category: "RESPONSIBLE GUARDRAILS",
  },
  {
    id: "rg-gate",
    label: "Gate order",
    value: "Responsible gate runs before every experience decision",
    source: "illustrative",
    note: "Prototype architecture rule, enforced in the live session engine",
    challenge1: "No adaptation reaches the customer without passing the gate first.",
    category: "RESPONSIBLE GUARDRAILS",
  },
];

export const datasetsAvailable = datasetEvidence.length > 0;

/** Aggregated journey flow — only stages the supplied sources can support. */
export type FlowStage = {
  id: string;
  stage: string;
  value: string;
  supported: boolean;
};

export const journeyFlow: FlowStage[] = [
  { id: "f-entry", stage: "ENTRY", value: "4,663 sports-context sessions", supported: true },
  { id: "f-disc", stage: "DISCOVERY", value: "573 used search (12.3%)", supported: true },
  { id: "f-match", stage: "MATCH / CONTENT", value: "0 of 573 search sessions arrived", supported: true },
  { id: "f-decision", stage: "DECISION", value: NOT_MEASURABLE, supported: false },
  { id: "f-action", stage: "ACTION", value: "1,223 of 1,513 match sessions added (80.8%)", supported: true },
  { id: "f-complete", stage: "COMPLETION", value: "981 of 1,248 placed (78.6%) · 21.4% drop-off", supported: true },
];

/** Prototype assumptions — clearly separated, never presented as measurements. */
export const illustrativeEvidence: EvidenceItem[] = [
  {
    id: "assume-market-depth",
    label: "Relevant markets per match",
    value: "3 core, 12 extended",
    source: "illustrative",
    note: "Illustrative prototype assumption — not a production offer size",
    category: "DISCOVERY",
  },
  {
    id: "assume-friction-threshold",
    label: "Friction ADAPT threshold",
    value: "score 30",
    source: "illustrative",
    note: "Illustrative prototype assumption — tuning value for demo readability",
    category: "FRICTION",
  },
  {
    id: "assume-silence-threshold",
    label: "Friction SILENCE threshold",
    value: "score 60",
    source: "illustrative",
    note: "Illustrative prototype assumption — production would be policy-owned",
    category: "RESPONSIBLE GUARDRAILS",
  },
  {
    id: "assume-stake-limit",
    label: "Demo session stake ceiling",
    value: "100 €",
    source: "illustrative",
    note: "Illustrative prototype assumption — not a PSK limit",
    category: "RESPONSIBLE GUARDRAILS",
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
    value: NOT_MEASURABLE,
    source: "illustrative",
    note: "Downstream validation metric — requires a live A/B cohort",
  },
  {
    id: "d90",
    label: "D90 retention delta",
    value: NOT_MEASURABLE,
    source: "illustrative",
    note: "Downstream validation metric — requires a live A/B cohort",
  },
];

/**
 * Evidence the live trace cites when explaining the current decision.
 * Transparent prototype reasoning — no model or ML claim is made.
 */
export const decisionEvidence: Record<string, { reasoning: string; cites: string[] }> = {
  DISCOVER: {
    reasoning:
      "Observed search-to-match behaviour → prioritise the relevant match → reduce discovery friction",
    cites: ["dc-search-match", "fr-repeat"],
  },
  SIMPLIFY: {
    reasoning:
      "Repeated discovery without an action → narrow the choice set → protect the final step",
    cites: ["fr-repeat", "fr-abandon"],
  },
  CONTINUE: {
    reasoning:
      "Match-page sessions already convert well → stay out of the way once a selection exists",
    cites: ["ac-match-add", "ac-place"],
  },
  NONE: {
    reasoning: "No supported signal, or the journey is complete — intervene with nothing",
    cites: ["rg-gate"],
  },
};

export const evidenceById = new Map(
  [...datasetEvidence, ...illustrativeEvidence].map((e) => [e.id, e]),
);

export const evidenceCategories: EvidenceCategory[] = [
  "SESSION QUALITY",
  "DISCOVERY",
  "ACTION",
  "FRICTION",
  "VALUE",
  "RESPONSIBLE GUARDRAILS",
];

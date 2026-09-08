import { Activity, ChevronDown } from "lucide-react";
import { useSession } from "@/lib/session-intelligence";
import {
  datasetEvidence,
  datasetsAvailable,
  downstreamValidation,
  expectedDatasets,
  illustrativeEvidence,
  type EvidenceItem,
} from "@/data/evidence";

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0 rounded-sm bg-surface-2 p-2">
      <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`truncate text-sm font-bold ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

function EvidenceList({ title, items, tag }: { title: string; items: EvidenceItem[]; tag: string }) {
  if (!items.length) return null;
  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {title} <span className="ml-1 rounded-sm bg-surface-2 px-1 py-0.5 normal-case">{tag}</span>
      </p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-[11px]">
            <span className="min-w-0">
              <span className="block truncate">{item.label}</span>
              <span className="block truncate text-muted-foreground">{item.note}</span>
            </span>
            <span className="shrink-0 font-semibold">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Judge-facing, unobtrusive trace of the live session intelligence model. */
export function IntelligenceTrace() {
  const { state, setTrace, intelligence, responsibleGate, businessMetrics, performanceMetrics, runDemoPath, resetSession } =
    useSession();

  const gateTone =
    responsibleGate.state === "PASS"
      ? "text-emerald-400"
      : responsibleGate.state === "ADAPT"
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-40 w-[min(22rem,calc(100vw-1.5rem))]">
      <div className="pointer-events-auto overflow-hidden rounded-md border border-border bg-popover/95 shadow-xl backdrop-blur">
        <button
          onClick={() => setTrace(!state.traceOpen)}
          className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-left"
          aria-expanded={state.traceOpen}
        >
          <Activity className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 truncate text-xs font-bold">
            Intelligence trace · {intelligence.sessionRef}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${state.traceOpen ? "rotate-180" : ""}`}
          />
        </button>

        {state.traceOpen ? (
          <div className="max-h-[60vh] overflow-y-auto border-t border-border p-3">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Engagement" value={intelligence.engagement} />
              <Stat label="Responsible gate" value={responsibleGate.state} tone={gateTone} />
              <Stat label="Decision" value={intelligence.decision} />
              <Stat label="Friction score" value={`${intelligence.frictionScore}/100`} />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Gate: {responsibleGate.reason}. Decision: {intelligence.decisionWhy}.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => runDemoPath("success")}
                className="rounded-sm bg-surface-2 px-2 py-1 text-[11px] font-semibold hover:bg-surface"
              >
                Demo: successful flow
              </button>
              <button
                onClick={() => runDemoPath("friction")}
                className="rounded-sm bg-surface-2 px-2 py-1 text-[11px] font-semibold hover:bg-surface"
              >
                Demo: friction flow
              </button>
              <button
                onClick={() => resetSession("none")}
                className="rounded-sm bg-surface-2 px-2 py-1 text-[11px] font-semibold hover:bg-surface"
              >
                Reset session
              </button>
            </div>

            {intelligence.frictionSignals.length ? (
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Friction signals <span className="normal-case">(prototype signals)</span>
                </p>
                <ul className="mt-1 space-y-1">
                  {intelligence.frictionSignals.map((s) => (
                    <li
                      key={s.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-[11px] text-muted-foreground"
                    >
                      <span className="min-w-0 truncate">{s.label}</span>
                      <span className="shrink-0">+{s.weight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <details className="mt-3 rounded-sm bg-surface-2/60 p-2">
              <summary className="cursor-pointer text-[11px] font-bold">Evidence (judges)</summary>

              <EvidenceList
                title="Live session metrics"
                items={businessMetrics}
                tag="measured"
              />
              <EvidenceList
                title="Browser performance"
                items={performanceMetrics}
                tag="measured"
              />

              {datasetsAvailable ? (
                <>
                  <EvidenceList
                    title="Challenge dataset aggregates"
                    items={datasetEvidence}
                    tag="dataset"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Anonymised cohort aggregates only. Not supplied to this prototype:{" "}
                    {missingDatasets.join(", ")} — no figures are inferred for those sources.
                  </p>
                </>
              ) : (
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Challenge dataset aggregates <span className="normal-case">(dataset)</span>
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Not supplied to this prototype ({expectedDatasets.join(", ")}). No
                    dataset-derived figures are shown, and none are inferred.
                  </p>
                </div>
              )}


              <EvidenceList
                title="Prototype assumptions"
                items={illustrativeEvidence}
                tag="illustrative"
              />
              <EvidenceList
                title="Downstream validation"
                items={downstreamValidation}
                tag="illustrative"
              />
            </details>

            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Session events
              </p>
              <ul className="mt-1 space-y-1">
                {state.events.slice(0, 12).map((e) => (
                  <li key={e.id} className="text-[11px]">
                    <span className="text-muted-foreground">
                      +{(e.offsetMs / 1000).toFixed(1)}s · {e.kind}
                    </span>{" "}
                    <span className="font-semibold">{e.label}</span>
                    {e.detail ? (
                      <span className="block truncate text-muted-foreground">{e.detail}</span>
                    ) : null}
                  </li>
                ))}
                {state.events.length === 0 ? (
                  <li className="text-[11px] text-muted-foreground">No events yet.</li>
                ) : null}
              </ul>
            </div>

            <p className="mt-3 text-[10px] text-muted-foreground">
              Anonymised prototype session model. No player identifiers, tokens, transaction
              references or personal data are stored or displayed.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

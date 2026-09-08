import { useEffect, useState } from "react";
import { Activity, ChevronDown } from "lucide-react";
import { contextMatch } from "@/core";
import { useSession } from "@/lib/session-intelligence";
import {
  datasetEvidence,
  datasetsAvailable,
  decisionEvidence,
  downstreamValidation,
  evidenceById,
  evidenceCategories,
  expectedDatasets,
  journeyFlow,
  missingDatasets,
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

function EvidenceRow({ item }: { item: EvidenceItem }) {
  return (
    <li className="border-l border-border pl-2 text-[11px]">
      <span className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <span className="min-w-0 break-words">{item.label}</span>
        <span className="shrink-0 text-right font-semibold">{item.value}</span>
      </span>
      <span className="mt-0.5 block break-words text-[10px] text-muted-foreground">
        {item.source === "illustrative" ? "Illustrative prototype assumption" : item.note}
      </span>
      {item.challenge1 ? (
        <span className="mt-0.5 block break-words text-[10px] text-primary">
          C1: {item.challenge1}
        </span>
      ) : null}
    </li>
  );
}

function EvidenceList({ title, items, tag }: { title: string; items: EvidenceItem[]; tag: string }) {
  if (!items.length) return null;
  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {title} <span className="ml-1 rounded-sm bg-surface-2 px-1 py-0.5 normal-case">{tag}</span>
      </p>
      <ul className="mt-1 space-y-1.5">
        {items.map((item) => (
          <EvidenceRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

function JourneyFlow() {
  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Aggregated journey flow <span className="normal-case">(dataset)</span>
      </p>
      <ul className="mt-1 space-y-1">
        {journeyFlow.map((s) => (
          <li key={s.id} className="rounded-sm bg-surface-2 px-2 py-1 text-[11px]">
            <span className="block font-bold">{s.stage}</span>
            <span
              className={`block break-words ${s.supported ? "text-foreground" : "text-muted-foreground"}`}
            >
              {s.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Judge-facing, unobtrusive trace of the live session intelligence model. */
export function IntelligenceTrace() {
  const {
    state,
    setTrace,
    intelligence,
    responsibleGate,
    sessionContext,
    businessMetrics,
    performanceMetrics,
    runDemoPath,
    resetSession,
  } = useSession();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const cited = decisionEvidence[intelligence.decision];

  const gateTone =
    responsibleGate.state === "PASS"
      ? "text-emerald-400"
      : responsibleGate.state === "ADAPT"
        ? "text-amber-400"
        : "text-red-400";

  const completed = !!state.lastPlacement;
  const focus = state.contextCleared
    ? undefined
    : contextMatch({
        interest: state.interest,
        viewedMatches: state.viewedMatches,
        lastViewedMatchId: state.lastViewedMatchId,
        searchContext: state.searchContext,
      });
  const context = focus
    ? `${focus.competition} · ${focus.live ? "Live" : "Upcoming"}`
    : "Football · Offer";
  const journey = sessionContext.previousStage
    ? `${sessionContext.previousStage.toUpperCase()} → ${sessionContext.journeyStage.toUpperCase()}`
    : sessionContext.journeyStage.toUpperCase();


  return (
    <section
      aria-label="PSK Intelligence judge panel"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 sm:right-auto sm:bottom-3 sm:left-3 sm:w-[22rem]"
    >
      <div className="pointer-events-auto overflow-hidden rounded-t-xl border border-border bg-popover/95 shadow-xl backdrop-blur sm:rounded-md">
        <button
          onClick={() => setTrace(!state.traceOpen)}
          className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-expanded={state.traceOpen}
          aria-controls="psk-intelligence-panel"
        >
          <Activity className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 truncate text-xs font-bold">
            ⌁ PSK Intelligence · Session active
            {mounted ? (
              <span className="ml-1 font-normal text-muted-foreground">
                {intelligence.sessionRef}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${state.traceOpen ? "rotate-180" : ""}`}
          />
        </button>

        {state.traceOpen ? (
          <div
            id="psk-intelligence-panel"
            className="max-h-[70vh] overflow-y-auto border-t border-border p-3 sm:max-h-[60vh]"
          >
            <h2
              id="psk-live-session"
              className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase"
            >
              Live session
            </h2>
            <p className="text-[10px] text-muted-foreground">Live prototype session signal</p>
            {state.exited ? (
              <div className="mt-2 rounded-sm border border-emerald-500/40 bg-surface-2 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Session
                </p>
                <p className="text-sm font-bold text-emerald-400">CLOSED</p>
                <ul className="mt-1 space-y-0.5 text-[11px]">
                  <li>Journey: COMPLETION → EXIT</li>
                  <li>Friction: LOW</li>
                  <li>Decision: NONE</li>
                  <li>Responsible gate: PASS</li>
                  <li>Outcome: Journey completed successfully</li>
                </ul>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  No further intervention required.
                </p>
              </div>
            ) : null}
            <div className="mt-2 grid grid-cols-2 gap-2" aria-labelledby="psk-live-session">
              <Stat label="Session" value={mounted ? intelligence.sessionRef : "—"} />
              <Stat
                label="Intent"
                value={`${sessionContext.intent} · ${sessionContext.intentConfidence}`}
              />
              {sessionContext.activeProduct === "Sport" && state.intent?.query ? (
                <>
                  <Stat label="Query" value={`"${state.intent.query}"`} />
                  <Stat
                    label="Interpretation"
                    value={`${state.intent.normalisedQuery ?? "—"} · ${state.intent.intentType ?? "UNKNOWN"}`}
                  />
                </>
              ) : null}
              {sessionContext.activeProduct !== "Sport" && sessionContext.activeSearch ? (
                <Stat label="Query" value={`"${sessionContext.activeSearch}"`} />
              ) : null}
              <Stat label="Active product" value={sessionContext.activeProduct} />
              <Stat label="Active intent" value={sessionContext.intent} />
              <Stat label="Active context" value={sessionContext.activeContext} />
              <Stat
                label="Previous context"
                value={
                  sessionContext.previousContext
                    ? `${sessionContext.previousProduct ?? "—"} · ${sessionContext.previousContext}`
                    : "—"
                }
              />
              {sessionContext.activeProduct === "Sport" ? (
                <>
                  <Stat label="Sport context" value={context} />
                  <Stat label="Active event" value={sessionContext.activeEvent ?? "—"} />
                </>
              ) : null}
              {sessionContext.previousEvent ? (
                <Stat label="Previous event" value={sessionContext.previousEvent} />
              ) : null}
              <Stat label="Context confidence" value={sessionContext.contextConfidence} />
              <Stat
                label="Context"
                value={`${sessionContext.contextState.toUpperCase()}${
                  sessionContext.contextSwitched ? " · switch YES" : ""
                }`}
              />
              {sessionContext.lastViewedMarket ? (
                <Stat label="Last market" value={sessionContext.lastViewedMarket} />
              ) : null}
              <Stat label="Journey" value={journey} />


              <Stat label="Friction" value={sessionContext.frictionLevel} />
              <Stat label="Friction reason" value={sessionContext.frictionReason} />
              <Stat label="Decision" value={intelligence.decision} />
              <Stat label="Response" value={sessionContext.experienceResponse} />
              <Stat label="Responsible gate" value={responsibleGate.state} tone={gateTone} />
              <Stat label="Outcome" value={sessionContext.outcome} />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Prototype responsible-control state. Responsible controls are evaluated independently
              of experience optimisation. This does not replace FEG production controls.
            </p>
            <div className="mt-2 rounded-sm bg-surface-2 p-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Why this decision
              </p>
              <p className="mt-0.5 break-words text-[11px]">{intelligence.decisionWhy}</p>
            </div>
            {completed ? (
              <div className="mt-2 rounded-sm bg-surface-2 p-2">
                <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                  Experience decision
                </p>
                <p className="text-sm font-bold">NONE</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Journey completed successfully. No additional intervention required.
                </p>
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Gate: {responsibleGate.reason}. Decision: {intelligence.decisionWhy}.
              </p>
            )}
            {cited && sessionContext.activeProduct === "Sport" ? (
              <div className="mt-2 rounded-sm bg-surface-2 p-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Reasoning for this decision
                </p>
                <p className="mt-0.5 break-words text-[11px]">{cited.reasoning}</p>
                <ul className="mt-1 space-y-0.5">
                  {cited.cites
                    .map((id) => evidenceById.get(id))
                    .filter((e): e is EvidenceItem => Boolean(e))
                    .map((e) => (
                      <li key={e.id} className="break-words text-[10px] text-muted-foreground">
                        · {e.label}: <span className="font-semibold">{e.value}</span>
                      </li>
                    ))}
                </ul>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Transparent prototype rules over live session state — no model inference.
                </p>
              </div>
            ) : null}


            <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Prototype demo controls
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <button
                onClick={() => runDemoPath("success")}
                className="rounded-sm bg-surface-2 px-2 py-1 text-[11px] font-semibold hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Demo: successful flow
              </button>
              <button
                onClick={() => runDemoPath("friction")}
                className="rounded-sm bg-surface-2 px-2 py-1 text-[11px] font-semibold hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Demo: friction flow
              </button>
              <button
                onClick={() => resetSession("none")}
                className="rounded-sm bg-surface-2 px-2 py-1 text-[11px] font-semibold hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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

            <details className="mt-3 rounded-sm bg-surface-2/60 p-2" aria-label="Dataset evidence section">
              <summary className="cursor-pointer text-[11px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Evidence — derived from supplied challenge dataset
              </summary>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Prototype uses supplied challenge datasets for baseline evidence. Production
                deployment would consume PSK event streams in real time. Dataset figures are fixed
                and do not change as you click through this demo.
              </p>

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
                  <JourneyFlow />
                  {evidenceCategories.map((cat) => (
                    <EvidenceList
                      key={cat}
                      title={cat}
                      items={[...datasetEvidence, ...illustrativeEvidence].filter(
                        (e) => e.category === cat,
                      )}
                      tag="dataset + illustrative"
                    />
                  ))}
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Anonymised cohort aggregates only — no PlayerID, session, token, transaction,
                    betslip, fixture or URL values are read or shown. Not supplied to this
                    prototype: {missingDatasets.join(", ")} — no figures are inferred for those
                    sources. Casino figures appear only as evidence the architecture generalises.
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
                title="Downstream validation"
                items={downstreamValidation}
                tag="illustrative"
              />
            </details>

            <details className="mt-2 rounded-sm bg-surface-2/60 p-2" aria-label="Production target architecture section">
              <summary className="cursor-pointer text-[11px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Production target architecture — not connected
              </summary>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Production target architecture — not connected in this prototype
              </p>
              <p className="mt-1 break-words text-[10px] text-muted-foreground">
                Cross-product: PSK → Sports · Live · Casino · Live Casino · Lotto · Virtuals ·
                Forum · PSK Arena — each existing product feeds the same shared interaction-event
                and session-intelligence architecture. Context stays scoped to the active product.
              </p>
              <ol className="mt-1 space-y-0.5 text-[11px]">
                {[
                  ["PSK interaction events", "All existing products, web / app interaction events"],
                  ["Kafka / event stream", "Kafka topics behind NGINX-fronted API services"],
                  ["Session Engine", "Short-lived session state (Redis)"],
                  ["Intent + Context + Friction", "Elasticsearch-backed entity resolution"],
                  ["Responsible Gate", "Evaluated independently of optimisation"],
                  ["Experience Decision", "NONE / CONTINUE / DISCOVER / SIMPLIFY"],
                  ["Existing PSK experience", "Ordering and emphasis only, PostgreSQL of record"],
                ].map(([stage, detail], i, arr) => (
                  <li key={stage} className="break-words">
                    <span className="font-semibold">{stage}</span>
                    <span className="block text-[10px] text-muted-foreground">{detail}</span>
                    {i < arr.length - 1 ? (
                      <span aria-hidden="true" className="block text-muted-foreground">
                        ↓
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
              <ul className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
                <li>
                  <span className="font-semibold">Frontend:</span> Vue.js
                </li>
                <li>
                  <span className="font-semibold">Services:</span> Java / Python / .NET
                </li>
                <li>
                  <span className="font-semibold">Integration:</span> NGINX / Kafka / RabbitMQ
                </li>
                <li>
                  <span className="font-semibold">Data:</span> PostgreSQL / Redis / MongoDB /
                  Elasticsearch
                </li>
              </ul>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Prototype implementation is simplified; production integration would connect these
                intelligence services to the PSK event architecture.
              </p>
            </details>

            <div className="mt-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Session trace <span className="normal-case">(this prototype interaction)</span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                Generated by your actions just now; timings are measured from session start.
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
    </section>
  );
}

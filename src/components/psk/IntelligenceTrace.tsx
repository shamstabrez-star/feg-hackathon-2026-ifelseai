import { Activity, ChevronDown } from "lucide-react";
import { useSession } from "@/lib/session-intelligence";

/** Judge-facing, unobtrusive trace of the session intelligence model. */
export function IntelligenceTrace() {
  const { state, setTrace, intelligence, responsibleGate } = useSession();

  return (
    <div className="pointer-events-none fixed right-3 bottom-3 z-40 flex max-w-[calc(100vw-1.5rem)] flex-col items-end">
      {state.traceOpen ? (
        <div className="pointer-events-auto mb-2 w-[320px] max-w-full overflow-hidden rounded-md border border-border bg-popover shadow-xl">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-3 py-2">
            <span className="truncate text-xs font-bold tracking-wide">
              Session intelligence trace
            </span>
            <button
              className="shrink-0 text-muted-foreground"
              onClick={() => setTrace(false)}
              aria-label="Collapse trace"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 px-3 py-2 text-[11px]">
            <dt className="text-muted-foreground">Engagement</dt>
            <dd className="text-right font-semibold">{intelligence.engagement}</dd>
            <dt className="text-muted-foreground">Top interest</dt>
            <dd className="truncate text-right font-semibold">
              {intelligence.topInterest.join(", ") || "—"}
            </dd>
            <dt className="text-muted-foreground">Friction signal</dt>
            <dd className="text-right font-semibold">{intelligence.frictionScore}</dd>
            <dt className="text-muted-foreground">Searches</dt>
            <dd className="text-right font-semibold">{intelligence.searches}</dd>
            <dt className="text-muted-foreground">Interactions</dt>
            <dd className="text-right font-semibold">{intelligence.interactions}</dd>
            <dt className="text-muted-foreground">Responsible gate</dt>
            <dd
              className={
                "text-right font-semibold " +
                (responsibleGate.pass ? "text-live" : "text-destructive")
              }
            >
              {responsibleGate.pass ? "PASS" : "BLOCK"}
            </dd>
          </dl>

          <div className="max-h-56 overflow-y-auto border-t border-border">
            {state.events.length === 0 ? (
              <p className="px-3 py-3 text-[11px] text-muted-foreground">
                No signals yet — browse, search or select an odd.
              </p>
            ) : (
              <ul>
                {state.events.map((e) => (
                  <li key={e.id} className="border-b border-border/60 px-3 py-2 text-[11px]">
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                      <span className="shrink-0 rounded-sm bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {e.kind}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{e.label}</span>
                        {e.detail ? (
                          <span className="block truncate text-muted-foreground">{e.detail}</span>
                        ) : null}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
            Demo session model only — sanitized, in-memory, no personal data.
          </p>
        </div>
      ) : null}

      <button
        onClick={() => setTrace(!state.traceOpen)}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-popover/90 px-3 py-2 text-[11px] font-semibold text-muted-foreground shadow-lg backdrop-blur hover:text-foreground"
      >
        <Activity className="h-3.5 w-3.5" />
        Intelligence trace
      </button>
    </div>
  );
}

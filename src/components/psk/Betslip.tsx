import { useState } from "react";
import { CheckCircle2, ShieldCheck, Trash2, X } from "lucide-react";
import { useSession, type Placement } from "@/lib/session-intelligence";
import { cn } from "@/lib/utils";

function Confirmation({ placement, onDone }: { placement: Placement; onDone: () => void }) {
  return (
    <div className="p-4 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-live" strokeWidth={1.5} />
      <h3 className="mt-3 text-base font-bold">Bet accepted</h3>
      <p className="mt-1 text-xs text-muted-foreground">Ticket {placement.ref}</p>
      <dl className="mt-4 space-y-1 text-left text-sm">
        {placement.selections.map((s) => (
          <div key={s.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <dt className="truncate text-muted-foreground">
              {s.matchLabel} · {s.outcomeLabel}
            </dt>
            <dd className="shrink-0 font-semibold">{s.odds.toFixed(2)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-md bg-surface-2 p-3 text-sm">
        <span className="text-muted-foreground">Stake</span>
        <span className="text-right font-semibold">{placement.stake.toFixed(2)} €</span>
        <span className="text-muted-foreground">Total odds</span>
        <span className="text-right font-semibold">{placement.totalOdds.toFixed(2)}</span>
        <span className="text-muted-foreground">Potential return</span>
        <span className="text-right font-semibold">{placement.potentialReturn.toFixed(2)} €</span>
      </div>
      <button
        onClick={onDone}
        className="mt-4 w-full rounded-md bg-primary py-2.5 text-sm font-bold text-primary-foreground"
      >
        Continue betting
      </button>
    </div>
  );
}

export function BetslipBody({ onClose }: { onClose?: () => void }) {
  // onClose is used by the confirmation "Continue betting" action on mobile.
  const {
    state,
    removeSelection,
    setStake,
    totalOdds,
    potentialReturn,
    place,
    responsibleGate,
    friction,
  } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<Placement | null>(null);

  if (done) {
    return (
      <Confirmation
        placement={done}
        onDone={() => {
          setDone(null);
          onClose?.();
        }}
      />
    );
  }

  if (state.selections.length === 0) {
    return (
      <div className="px-6 pt-8 pb-10 text-center">
        <h3 className="text-lg font-bold">Your betslip is empty</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          If you want to add a bet to the ticket, browse our rate offer and choose a bet as you wish
        </p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <ul className="space-y-2">
        {state.selections.map((s) => (
          <li key={s.key} className="rounded-md bg-surface-2 p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{s.outcomeLabel}</div>
                <div className="truncate text-xs text-muted-foreground">{s.marketName}</div>
                <div className="truncate text-xs text-muted-foreground">{s.matchLabel}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-bold">{s.odds.toFixed(2)}</span>
                <button
                  onClick={() => removeSelection(s.key)}
                  aria-label={`Remove ${s.outcomeLabel}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <label htmlFor="stake" className="text-sm text-muted-foreground">
          Stake (€)
        </label>
        <input
          id="stake"
          type="number"
          min={1}
          max={500}
          value={state.stake}
          onChange={(e) => setStake(Math.max(0, Number(e.target.value) || 0))}
          onBlur={() => {
            if (state.stake > 100) friction("Stake above demo limit entered", 25);
          }}
          className="w-28 rounded-md bg-surface-2 px-3 py-2 text-right text-sm outline-none"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-md bg-surface-2 p-3 text-sm">
        <span className="text-muted-foreground">Total odds</span>
        <span className="text-right font-semibold">{totalOdds.toFixed(2)}</span>
        <span className="text-muted-foreground">Potential return</span>
        <span className="text-right font-semibold">{potentialReturn.toFixed(2)} €</span>
      </div>

      <div
        className={cn(
          "mt-3 flex items-start gap-2 rounded-md p-3 text-xs",
          responsibleGate.pass ? "bg-surface-2 text-muted-foreground" : "bg-destructive/15 text-destructive",
        )}
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="min-w-0">
          Responsible play check: <b>{responsibleGate.pass ? "PASS" : "BLOCK"}</b> —{" "}
          {responsibleGate.reason}
        </span>
      </div>

      {confirming ? (
        <div className="mt-3 rounded-md bg-surface-2 p-3">
          <p className="text-sm">
            Place {state.selections.length} selection(s) for {state.stake.toFixed(2)} €?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              className="flex-1 rounded-md bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
              disabled={!responsibleGate.pass}
              onClick={() => {
                const placement = place();
                setConfirming(false);
                if (placement) setDone(placement);
              }}
            >
              Confirm
            </button>
            <button
              className="rounded-md border border-border px-4 py-2 text-sm"
              onClick={() => {
                setConfirming(false);
                friction("Confirmation cancelled");
              }}
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <button
          className="mt-3 w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground"
          onClick={() => setConfirming(true)}
        >
          Place bet · {potentialReturn.toFixed(2)} €
        </button>
      )}
    </div>
  );
}

/** Desktop right-hand rail. */
export function BetslipRail({ className }: { className?: string }) {
  const { state } = useSession();
  return (
    <aside className={cn("w-[340px] shrink-0 overflow-y-auto p-3", className)}>
      <div className="overflow-hidden rounded-md bg-surface">
        <div className="grid grid-cols-5 border-b border-border">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={cn(
                "py-2.5 text-sm font-semibold",
                n === 1 ? "bg-surface-2 text-foreground" : "text-muted-foreground",
              )}
            >
              {n}
              {n === 1 && state.selections.length ? (
                <span className="ml-1 text-xs text-primary">({state.selections.length})</span>
              ) : null}
            </button>
          ))}
        </div>
        <BetslipBody />
      </div>
    </aside>
  );
}

/** Mobile / tablet bottom sheet. */
export function BetslipSheet() {
  const { state, setBetslip } = useSession();
  const count = state.selections.length;

  return (
    <div className="xl:hidden">
      {count > 0 && !state.betslipOpen ? (
        <button
          onClick={() => setBetslip(true)}
          className="fixed inset-x-3 bottom-16 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-primary px-4 py-3 text-primary-foreground shadow-xl"
        >
          <span className="truncate text-sm font-bold">Betslip · {count} selection(s)</span>
          <span className="shrink-0 text-sm font-bold">Open</span>
        </button>
      ) : null}

      {state.betslipOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60">
          <div
            className="absolute inset-0"
            onClick={() => setBetslip(false)}
            role="presentation"
          />
          <div className="relative max-h-[85vh] overflow-y-auto rounded-t-xl bg-popover">
            <div className="sticky top-0 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-popover px-4 py-3">
              <h2 className="truncate text-sm font-bold">Betslip</h2>
              <button onClick={() => setBetslip(false)} aria-label="Close betslip">
                <X className="h-5 w-5" />
              </button>
            </div>
            <BetslipBody onClose={() => setBetslip(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

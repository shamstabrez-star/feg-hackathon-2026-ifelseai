import { CalendarDays, ChevronDown, Pin, Settings2, Trash2, TicketX } from "lucide-react";
import { cn } from "@/lib/utils";

export function BetslipRail({ className }: { className?: string }) {
  return (
    <aside className={cn("w-[340px] shrink-0 p-3", className)}>
      <div className="overflow-hidden rounded-md bg-surface">
        <div className="grid grid-cols-[repeat(5,1fr)_auto_auto] items-center border-b border-border">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={cn(
                "py-2.5 text-sm font-semibold",
                n === 1 ? "bg-surface-2 text-foreground" : "text-muted-foreground",
              )}
            >
              {n}
            </button>
          ))}
          <button className="px-2 text-muted-foreground" aria-label="Scheduled slips">
            <CalendarDays className="h-4 w-4" />
          </button>
          <button className="px-2 text-muted-foreground" aria-label="Pin betslip">
            <Pin className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 p-3">
          <button className="flex w-40 items-center justify-between rounded-md bg-surface-2 px-3 py-2 text-sm">
            Simple
            <ChevronDown className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Settings2 className="h-4 w-4" />
            <Trash2 className="h-4 w-4" />
          </div>
        </div>

        <div className="px-6 pt-6 pb-10 text-center">
          <TicketX className="mx-auto h-16 w-16 text-muted-foreground" strokeWidth={1.25} />
          <h3 className="mt-5 text-lg font-bold">Your betslip is empty</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            If you want to add a bet to the ticket, browse our rate offer and choose a bet as you
            wish
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-md bg-surface p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="text-base font-bold">Play while you wait</div>
            <div className="truncate text-sm text-muted-foreground">Top slots • Live casino</div>
          </div>
          <button className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
            PLAY NOW
          </button>
        </div>
      </div>
    </aside>
  );
}

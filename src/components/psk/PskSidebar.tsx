import { cn } from "@/lib/utils";

const recommended = [
  "Real Madrid - Inter M.",
  "Porto - Man.City",
  "Bor.Dortmund - Villarreal",
  "US Open (m)",
  "US Open (ž)",
];

const sports = [
  { label: "BetBuilder", count: 124 },
  { label: "SafeBet", count: 6 },
  { label: "PSK TV", count: 220 },
  { label: "All Sports", count: 796 },
  { label: "Bonus Tip", count: 8 },
  { label: "TOP OFFER", count: 8 },
  { label: "Football", count: 201 },
  { label: "Basketball", count: 15 },
  { label: "Tennis", count: 246 },
  { label: "Ice Hockey", count: 12 },
  { label: "Handball", count: 9 },
];

export function PskSidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "w-[280px] shrink-0 overflow-y-auto bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <section className="px-5 py-4">
        <h2 className="text-lg font-bold text-foreground">We recommend</h2>
        <ul className="mt-2">
          {recommended.map((item) => (
            <li
              key={item}
              className="flex cursor-pointer items-center gap-3 border-b border-sidebar-border py-3 text-sm transition-colors hover:text-foreground"
            >
              <span className="h-4 w-4 shrink-0 rounded-full bg-surface-2" aria-hidden />
              <span className="truncate">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-5 pb-8">
        <h2 className="pt-2 text-lg font-bold text-foreground">Sports</h2>
        <ul className="mt-2">
          {sports.map((item) => (
            <li
              key={item.label}
              className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-sidebar-border py-3 text-sm transition-colors hover:text-foreground"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="h-4 w-4 shrink-0 rounded-sm bg-surface-2" aria-hidden />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{item.count}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

import { Link } from "@tanstack/react-router";
import { contextMatch, relatedMatches } from "@/core";
import { matches } from "@/data/psk-data";
import { useSession } from "@/lib/session-intelligence";
import { cn } from "@/lib/utils";

const staticRecommended = [
  "Real Madrid - Inter M.",
  "Porto - Man.City",
  "Bor.Dortmund - Villarreal",
  "US Open (m)",
  "US Open (ž)",
];

const sportsGroups: { title: string; items: { label: string; count: number }[] }[] = [
  {
    title: "Sports",
    items: [
      { label: "BetBuilder", count: 124 },
      { label: "SafeBet", count: 6 },
      { label: "PSK TV", count: 220 },
    ],
  },
  {
    title: "Discover",
    items: [
      { label: "All Sports", count: 796 },
      { label: "Bonus Tip", count: 8 },
      { label: "TOP OFFER", count: 8 },
    ],
  },
  {
    title: "Sports",
    items: [
      { label: "Football", count: 201 },
      { label: "Basketball", count: 15 },
      { label: "Tennis", count: 246 },
      { label: "Ice Hockey", count: 12 },
      { label: "Handball", count: 9 },
    ],
  },
];

/**
 * The rail stays the ordinary PSK component. Only its heading and the order
 * of the existing events respond to live session context — and when there is
 * no meaningful reason to adapt, it does nothing.
 */
function useRecommendRail() {
  const { state, sessionContext } = useSession();
  const focus = state.contextCleared
    ? undefined
    : contextMatch({
        interest: state.interest,
        viewedMatches: state.viewedMatches,
        lastViewedMatchId: state.lastViewedMatchId,
        searchContext: state.searchContext,
      });

  // Weak context never changes the ordinary PSK rail.
  if (!focus || sessionContext.contextConfidence === "LOW")
    return { title: "We recommend", items: staticRecommended };

  const title = state.viewedMatches.includes(focus.id)
    ? "Continue where you left off"
    : state.searchContext
      ? "Related to your search"
      : sessionContext.contextConfidence === "HIGH"
        ? "Relevant to you"
        : "We recommend";



  const around = [focus, ...relatedMatches(focus, 2)];
  const rest = matches.filter((m) => !around.some((a) => a.id === m.id)).slice(0, 2);
  return {
    title,
    items: [...around, ...rest].map((m) => ({ id: m.id, label: `${m.home} - ${m.away}` })),
  };
}

export function PskSidebar({ className }: { className?: string }) {
  const rail = useRecommendRail();

  return (
    <aside
      className={cn(
        "w-[280px] shrink-0 overflow-y-auto bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <section className="px-5 py-4">
        <h2 className="text-lg font-bold text-foreground">{rail.title}</h2>
        <ul className="mt-2">
          {rail.items.map((item) =>
            typeof item === "string" ? (
              <li
                key={item}
                className="flex cursor-pointer items-center gap-3 border-b border-sidebar-border py-3 text-sm transition-colors hover:text-foreground"
              >
                <span className="h-4 w-4 shrink-0 rounded-full bg-surface-2" aria-hidden />
                <span className="truncate">{item}</span>
              </li>
            ) : (
              <li key={item.id} className="border-b border-sidebar-border">
                <Link
                  to="/match/$matchId"
                  params={{ matchId: item.id }}
                  className="flex items-center gap-3 py-3 text-sm transition-colors hover:text-foreground"
                >
                  <span className="h-4 w-4 shrink-0 rounded-full bg-surface-2" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ),
          )}
        </ul>
      </section>

      <section className="px-5 pb-8">
        {sportsGroups.map((group, i) => (
          <div key={`${group.title}-${i}`} className={i === 0 ? "" : "mt-5"}>
            <h2 className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
              {group.title}
            </h2>
            <ul className="mt-1">
              {group.items.map((item) => (
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
          </div>
        ))}
      </section>
    </aside>
  );
}

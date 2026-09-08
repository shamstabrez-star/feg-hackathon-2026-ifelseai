import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/psk/AppShell";
import { matches } from "@/data/psk-data";
import { categorise } from "@/lib/contextual";
import { useSession } from "@/lib/session-intelligence";
import { cn } from "@/lib/utils";

const filters = ["LIVE", "TODAY", "1H", "3H", "TOMORROW", "ALL"] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PSK Sport — football odds and live betting" },
      {
        name: "description",
        content:
          "PSK sport lobby: European football matches, live offer, odds and betslip in one place.",
      },
      { property: "og:title", content: "PSK Sport — football odds and live betting" },
      {
        property: "og:description",
        content: "European football matches, live offer and odds on PSK.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("TODAY");
  const [category, setCategory] = useState<string>("all");
  const { toggleSelection, state, log } = useSession();
  const selectedKeys = new Set(state.selections.map((s) => s.key));

  const visible = matches.filter((m) => (filter === "LIVE" ? m.live : true));

  const groups = useMemo(
    () =>
      categorise(
        {
          interest: state.interest,
          viewedMatches: state.viewedMatches,
          lastViewedMatchId: state.lastViewedMatchId,
          searchContext: state.searchContext,
        },
        visible,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.interest, state.viewedMatches, state.lastViewedMatchId, state.searchContext, filter],
  );

  const shown = groups.filter((g) => category === "all" || g.id === category);


  return (
    <AppShell>
      <div className="rounded-md bg-surface">
        <div className="flex items-stretch overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                log("navigation", `Offer filter · ${f}`);
              }}
              className={cn(
                "shrink-0 border-b-2 px-6 py-4 text-sm font-semibold tracking-wide",
                f === filter
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <h1 className="mt-5 text-xl font-bold">Football</h1>

      <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {[{ id: "all", title: "All events" }, ...groups.map((g) => ({ id: g.id, title: g.title }))].map(
          (c) => (
            <button
              key={c.id}
              onClick={() => {
                setCategory(c.id);
                log("navigation", `Category · ${c.title}`);
              }}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                category === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-2 text-muted-foreground hover:text-foreground",
              )}
            >
              {c.title}
            </button>
          ),
        )}
      </div>

      <div className="mt-4 space-y-6">
        {shown.length === 0 ? (
          <p className="rounded-md bg-surface p-6 text-center text-sm text-muted-foreground">
            No events in this category right now.
          </p>
        ) : null}

        {shown.map((group) => (
          <section key={group.id}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <h2 className="truncate text-sm font-bold tracking-wide text-muted-foreground uppercase">
                {group.title}
              </h2>
              {group.tag ? (
                <span className="shrink-0 rounded-sm bg-surface-2 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
                  {group.tag}
                </span>
              ) : null}
            </div>

            <div className="mt-2 space-y-2">
              {group.matches.map((match) => {
                const main = match.markets[0]!;
                return (
                  <article
                    key={match.id}
                    className="rounded-md bg-surface p-3 transition-colors hover:bg-surface-2/60 sm:p-4"
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[11px] font-semibold tracking-wide text-muted-foreground">
                          {match.competition} ·{" "}
                          {match.live ? (
                            <span className="text-live">{match.minute} LIVE</span>
                          ) : (
                            match.startsIn
                          )}
                        </div>
                        <Link
                          to="/match/$matchId"
                          params={{ matchId: match.id }}
                          className="mt-1 block truncate text-sm font-bold hover:text-primary"
                        >
                          {match.home} - {match.away}
                          {match.score ? (
                            <span className="ml-2 text-muted-foreground">
                              {match.score[0]}:{match.score[1]}
                            </span>
                          ) : null}
                        </Link>
                      </div>
                      <Link
                        to="/match/$matchId"
                        params={{ matchId: match.id }}
                        className="shrink-0 rounded-sm bg-surface-2 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        {match.betCount}+ bets
                      </Link>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {main.outcomes.map((o) => {
                        const key = `${match.id}:${main.id}:${o.id}`;
                        const active = selectedKeys.has(key);
                        return (
                          <button
                            key={o.id}
                            onClick={() => toggleSelection(match, main, o)}
                            className={cn(
                              "min-w-0 rounded-md py-2.5 text-center transition-colors sm:py-3",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "bg-odds text-odds-foreground hover:bg-surface-2",
                            )}
                          >
                            <div className="truncate text-[11px] text-muted-foreground">{o.label}</div>
                            <div className="text-sm font-bold">{o.odds.toFixed(2)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}

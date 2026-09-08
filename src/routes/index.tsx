import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/psk/AppShell";
import { matches } from "@/data/psk-data";
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
  const { toggleSelection, state, log } = useSession();
  const selectedKeys = new Set(state.selections.map((s) => s.key));

  const visible = matches.filter((m) => (filter === "LIVE" ? m.live : true));

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

      <div className="mt-3 space-y-3">
        {visible.map((match) => {
          const main = match.markets[0]!;
          return (
            <article key={match.id} className="rounded-md bg-surface p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-semibold tracking-wide text-muted-foreground">
                    {match.competition} · {match.live ? `${match.minute} LIVE` : match.startsIn}
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
                        "rounded-md py-3 text-center transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-odds text-odds-foreground hover:bg-surface-2",
                      )}
                    >
                      <div className="text-[11px] text-muted-foreground">{o.label}</div>
                      <div className="text-sm font-bold">{o.odds.toFixed(2)}</div>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}

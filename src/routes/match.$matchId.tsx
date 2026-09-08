import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { AppShell } from "@/components/psk/AppShell";
import { matchById } from "@/data/psk-data";
import { useSession } from "@/lib/session-intelligence";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/match/$matchId")({
  loader: ({ params }) => {
    const match = matchById(params.matchId);
    if (!match) throw notFound();
    return { match };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Match unavailable — PSK" }, { name: "robots", content: "noindex" }],
      };
    }
    const { match } = loaderData;
    const title = `${match.home} - ${match.away} odds — PSK`;
    const description = `${match.competition}: ${match.home} vs ${match.away} betting markets on PSK.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: MatchPage,
});

function MatchPage() {
  const { match } = Route.useLoaderData();
  const { toggleSelection, state, log, friction } = useSession();
  const [tier, setTier] = useState<1 | 2 | 3>(1);
  const dwell = useRef(Date.now());

  useEffect(() => {
    log("navigation", `Viewing ${match.home} - ${match.away}`, match.competition, [match.id]);
    dwell.current = Date.now();
    const t = setTimeout(() => {
      friction("Long dwell without selection on match page", 10);
    }, 45000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  const visible = useMemo(() => match.markets.filter((mk) => mk.tier <= tier), [match, tier]);
  const selectedKeys = new Set(state.selections.map((s) => s.key));

  return (
    <AppShell>
      <section className="rounded-md bg-surface p-4 sm:p-5">
        <p className="truncate text-xs font-semibold tracking-wide text-muted-foreground">
          {match.competition} · {match.kickoff}
        </p>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">
          {match.home} <span className="text-muted-foreground">-</span> {match.away}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {match.live ? (
            <span className="rounded-sm bg-live/20 px-2 py-1 font-bold text-live">
              LIVE {match.minute} · {match.score?.[0]}:{match.score?.[1]}
            </span>
          ) : (
            <span className="rounded-sm bg-surface-2 px-2 py-1 text-muted-foreground">
              {match.startsIn}
            </span>
          )}
          <span className="rounded-sm bg-surface-2 px-2 py-1 text-muted-foreground">
            {match.betCount}+ BETS
          </span>
        </div>
      </section>

      <ExperienceHint className="mt-3" />

      <div className="mt-4 space-y-3">
        {visible.map((market) => (
          <section key={market.id} className="rounded-md bg-surface p-4">
            <h2 className="text-sm font-semibold text-muted-foreground">{market.name}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {market.outcomes.map((o) => {
                const key = `${match.id}:${market.id}:${o.id}`;
                const active = selectedKeys.has(key);
                return (
                  <button
                    key={o.id}
                    onClick={() => toggleSelection(match, market, o)}
                    className={cn(
                      "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md px-3 py-3 text-left transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-odds text-odds-foreground hover:bg-surface-2",
                    )}
                  >
                    <span className="truncate text-xs">{o.label}</span>
                    <span className="shrink-0 text-sm font-bold">{o.odds.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {tier < 3 ? (
        <button
          onClick={() => {
            const next = (tier + 1) as 2 | 3;
            setTier(next);
            log("market_expand", `Showing more markets (tier ${next})`, `${match.home} - ${match.away}`, [
              match.id,
            ]);
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-surface py-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Show more markets
          <ChevronDown className="h-4 w-4" />
        </button>
      ) : null}
    </AppShell>
  );
}

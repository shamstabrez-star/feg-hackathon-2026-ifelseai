import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { AppShell } from "@/components/psk/AppShell";
import { ExperienceHint } from "@/components/psk/ExperienceHint";
import { matchById } from "@/data/psk-data";
import { orderMarkets, relatedMatches } from "@/lib/contextual";
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
  const { toggleSelection, state, log, friction, viewMatch, setMarketTier } = useSession();
  // In-session continuity: markets already unfolded for this match come back.
  const [tier, setTier] = useState<1 | 2 | 3>(state.marketTier[match.id] ?? 1);
  const dwell = useRef(Date.now());
  // Captured before this visit is recorded, so it only fires on a real return.
  const returningRef = useRef(false);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    log("navigation", `Viewing ${match.home} - ${match.away}`, match.competition, [match.id]);
    viewMatch(match.id);
    setTier(state.marketTier[match.id] ?? 1);
    dwell.current = Date.now();
    const t = setTimeout(() => {
      friction("Long dwell without selection on match page", 10);
    }, 45000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id]);

  const ordered = useMemo(
    () =>
      orderMarkets(
        match.markets.filter((mk) => mk.tier <= tier),
        {
          query: state.searchContext?.query,
          usedMarketNames: state.selections.map((s) => s.marketName),
        },
      ),
    [match, tier, state.searchContext, state.selections],
  );
  const related = useMemo(() => relatedMatches(match), [match]);
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

      {returning ? (
        <p className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
          Continue · your markets for this match are still open.
        </p>
      ) : null}

      <ExperienceHint className="mt-3" />

      <div className="mt-4 space-y-3">
        {ordered.map(({ market, relevant }) => (
          <section key={market.id} className="rounded-md bg-surface p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-muted-foreground">{market.name}</h2>
              {relevant ? (
                <span className="shrink-0 rounded-sm bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Based on this match
                </span>
              ) : null}
            </div>
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
            setMarketTier(match.id, next);
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

      {related.length ? (
        <section className="mt-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <h2 className="truncate text-sm font-bold tracking-wide text-muted-foreground uppercase">
              Other events in {match.competition}
            </h2>
            <span className="shrink-0 rounded-sm bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Related
            </span>
          </div>
          <div className="mt-2 space-y-2">
            {related.map((r) => (
              <Link
                key={r.id}
                to="/match/$matchId"
                params={{ matchId: r.id }}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-surface p-3 transition-colors hover:bg-surface-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {r.home} - {r.away}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {r.live ? `${r.minute} LIVE` : r.startsIn}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{r.betCount}+ bets</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

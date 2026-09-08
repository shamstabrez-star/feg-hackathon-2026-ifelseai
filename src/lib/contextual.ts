import { matches as allMatches, type Market, type Match } from "@/data/psk-data";

/**
 * Smart categorisation for the existing Sports offer.
 * Pure ordering/grouping of content that already exists — no new products,
 * no recommendation feed, no promotional content.
 */

export type ContextInput = {
  /** Match ids the session already engaged with, most engaged first. */
  interest: Record<string, number>;
  viewedMatches: string[];
  lastViewedMatchId: string | null;
  searchContext: { query: string; corrected?: string; matchId?: string } | null;
};

export type Group = {
  id: string;
  title: string;
  /** Subtle label shown on cards inside this group, if any. */
  tag?: "Relevant" | "Continue" | "Related";
  matches: Match[];
};

function contextMatch(ctx: ContextInput): Match | undefined {
  const id = ctx.searchContext?.matchId ?? ctx.lastViewedMatchId ?? ctx.viewedMatches[0];
  return id ? allMatches.find((m) => m.id === id) : undefined;
}

/** Transparent prototype relevance score, 0-100. No model, just session context. */
export function relevanceScore(match: Match, ctx: ContextInput) {
  let score = Math.min(30, Math.round(match.betCount / 20));
  const focus = contextMatch(ctx);
  if (focus) {
    if (focus.id === match.id) score += 60;
    else if (focus.competition === match.competition) score += 25;
    if (
      focus.id !== match.id &&
      [focus.home, focus.away].some((t) => t === match.home || t === match.away)
    )
      score += 20;
  }
  score += Math.min(20, (ctx.interest[match.id] ?? 0) * 8);
  if (match.live) score += 6;
  return Math.max(1, Math.min(100, score));
}

/**
 * Groups the existing offer into subtle contextual categories.
 * Order of groups reacts to live session context.
 */
export function categorise(ctx: ContextInput, source: Match[] = allMatches): Group[] {
  const focus = contextMatch(ctx);
  const used = new Set<string>();
  const groups: Group[] = [];
  const take = (list: Match[]) => list.filter((m) => !used.has(m.id));
  const claim = (list: Match[]) => {
    for (const m of list) used.add(m.id);
    return list;
  };

  if (focus && source.some((m) => m.id === focus.id)) {
    groups.push({
      id: "continue",
      title: "Continue where you left off",
      tag: "Continue",
      matches: claim([focus]),
    });

    const sameCompetition = take(
      source
        .filter((m) => m.competition === focus.competition)
        .sort((a, b) => relevanceScore(b, ctx) - relevanceScore(a, ctx)),
    );
    if (sameCompetition.length)
      groups.push({
        id: "competition",
        title: focus.competition,
        tag: "Relevant",
        matches: claim(sameCompetition),
      });
  }

  const live = take(source.filter((m) => m.live));
  if (live.length) groups.push({ id: "live", title: "Live now", matches: claim(live) });

  const upcoming = take(
    source
      .filter((m) => !m.live)
      .sort((a, b) => relevanceScore(b, ctx) - relevanceScore(a, ctx)),
  );
  if (upcoming.length)
    groups.push({ id: "upcoming", title: "Upcoming matches", matches: claim(upcoming.slice(0, 4)) });

  const rest = take(source);
  if (rest.length) groups.push({ id: "other", title: "Other events", matches: claim(rest) });

  return groups;
}

/** Related existing events for a match page — same competition or shared team. */
export function relatedMatches(match: Match, limit = 3) {
  return allMatches
    .filter(
      (m) =>
        m.id !== match.id &&
        (m.competition === match.competition ||
          [m.home, m.away].some((t) => t === match.home || t === match.away)),
    )
    .slice(0, limit);
}

/**
 * Orders existing markets for a match using live session context.
 * Complete market data is preserved — only the sequence changes.
 */
export function orderMarkets(
  markets: Market[],
  opts: { query?: string | undefined; usedMarketNames?: string[] },
): { market: Market; relevant: boolean }[] {
  const q = (opts.query ?? "").toLowerCase();
  const used = new Set(opts.usedMarketNames ?? []);
  const scored = markets.map((market, index) => {
    let score = 100 - index;
    if (used.has(market.name)) score += 40;
    if (q && market.id === "scorer" && /[a-z]{4,}/.test(q) && q.split(" ").length > 0) {
      // A player-shaped query lifts the player market.
      const players = market.outcomes.map((o) => o.label.toLowerCase()).join(" ");
      if (q.split(" ").some((t) => t.length >= 4 && players.includes(t))) score += 60;
    }
    return { market, score, index };
  });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  const top = scored[0]?.score ?? 0;
  return scored.map(({ market, score }) => ({ market, relevant: score > 100 && score === top }));
}

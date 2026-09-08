import type { Market, Match } from "@/data/psk-data";

/**
 * Layer 5 — Relevance engine.
 *
 * Transparent prototype scoring over content that already exists.
 * No model, no recommendation feed: only ordering derived from live
 * session context.
 */

export type RelevanceContext = {
  /** Match ids the session already engaged with, with engagement counts. */
  interest: Record<string, number>;
  /** The match the session is currently anchored on, if any. */
  focus?: Match | undefined;
};

/** Transparent prototype relevance score, 0-100. */
export function relevanceScore(match: Match, ctx: RelevanceContext) {
  let score = Math.min(30, Math.round(match.betCount / 20));
  const focus = ctx.focus;
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

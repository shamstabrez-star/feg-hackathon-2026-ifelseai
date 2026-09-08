import { matches as allMatches, type Match } from "@/data/psk-data";
import { relevanceScore } from "./relevance-engine";
import type { SearchContext } from "./types";

/**
 * Layer 4 — Context engine.
 *
 * Smart categorisation of the existing Sports offer: pure grouping and
 * ordering of content that already exists. No new products, no
 * recommendation feed, no promotional content.
 */

export type ContextInput = {
  /** Match ids the session already engaged with, most engaged first. */
  interest: Record<string, number>;
  viewedMatches: string[];
  lastViewedMatchId: string | null;
  searchContext: SearchContext | null;
};

export type Group = {
  id: string;
  title: string;
  /** Subtle label shown on cards inside this group, if any. */
  tag?: "Relevant" | "Continue" | "Related";
  matches: Match[];
};

/** The match the session is currently anchored on, from live context only. */
export function contextMatch(ctx: ContextInput): Match | undefined {
  const id = ctx.searchContext?.matchId ?? ctx.lastViewedMatchId ?? ctx.viewedMatches[0];
  return id ? allMatches.find((m) => m.id === id) : undefined;
}

function scoreFor(ctx: ContextInput) {
  const focus = contextMatch(ctx);
  return (match: Match) => relevanceScore(match, { interest: ctx.interest, focus });
}

/**
 * Groups the existing offer into subtle contextual categories.
 * Order of groups reacts to live session context.
 */
export function categorise(ctx: ContextInput, source: Match[] = allMatches): Group[] {
  const focus = contextMatch(ctx);
  const score = scoreFor(ctx);
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
        .sort((a, b) => score(b) - score(a)),
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

  const upcoming = take(source.filter((m) => !m.live).sort((a, b) => score(b) - score(a)));
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

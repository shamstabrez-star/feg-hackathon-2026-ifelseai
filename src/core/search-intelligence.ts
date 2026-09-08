import { matches as allMatches, type Match } from "@/data/psk-data";
import { editDistance, normalize } from "./intent-engine";

/**
 * Layer 3 — Search interpretation.
 *
 * "Understand what the user is trying to find, not just what they typed."
 * Transparent, rule-based interpretation over the existing Sports offer:
 * entity awareness, typo tolerance, partial intent and context-aware ranking.
 * No model inference, no external service, no customer-facing AI language.
 */

export type IntentType =
  | "UNKNOWN"
  | "SPORT"
  | "TEAM"
  | "COMPETITION"
  | "EVENT"
  | "PLAYER"
  | "GENERAL_SEARCH";

export type EntityType = "SPORT" | "TEAM" | "COMPETITION" | "EVENT" | "PLAYER" | null;

/** How the interpretation was reached — judge-facing wording only. */
export type IntentSource = "exact" | "partial" | "variation" | "context" | "none";

export type SearchIntent = {
  query: string;
  /** The entity the query most plausibly refers to, or the trimmed query. */
  normalisedQuery: string;
  intentType: IntentType;
  entityType: EntityType;
  entityId?: string;
  /** Prototype confidence, 0-1, from transparent scoring. */
  confidence: number;
  source: IntentSource;
};

export type EntityHit = {
  id: string;
  name: string;
  type: Exclude<EntityType, null>;
  score: number;
  source: IntentSource;
  /** Best existing event for this entity, when one exists. */
  eventId?: string;
};

export type EventHit = {
  match: Match;
  score: number;
  reason: string;
  source: IntentSource;
};

export type SearchGroup = {
  id: "teams" | "events" | "competitions" | "players";
  title: string;
  entries: {
    key: string;
    /** Match to open when the entry is selected. */
    matchId: string;
    primary: string;
    secondary: string;
    badge: string;
  }[];
};

export type SearchResult = {
  intent: SearchIntent;
  events: EventHit[];
  entities: EntityHit[];
  groups: SearchGroup[];
  /** Total useful results across all groups. */
  count: number;
};

export type SearchContextInput = {
  activeSport?: string | null;
  activeCompetition?: string | null;
  /** Match ids the session already engaged with. */
  recentInterest?: string[];
};

/* ------------------------------------------------------------------ */
/* Entity index — derived from the existing offer, nothing invented     */
/* ------------------------------------------------------------------ */

type Entity = {
  id: string;
  name: string;
  type: Exclude<EntityType, null>;
  matchIds: string[];
  /** Alternate spellings that already exist in the data (short codes etc.). */
  aliases: string[];
};

function buildIndex(source: Match[]): Entity[] {
  const map = new Map<string, Entity>();
  const add = (
    type: Exclude<EntityType, null>,
    name: string,
    matchId: string,
    aliases: string[] = [],
  ) => {
    const id = `${type.toLowerCase()}:${normalize(name)}`;
    const existing = map.get(id);
    if (existing) {
      if (!existing.matchIds.includes(matchId)) existing.matchIds.push(matchId);
      for (const a of aliases) if (!existing.aliases.includes(a)) existing.aliases.push(a);
      return;
    }
    map.set(id, { id, name, type, matchIds: [matchId], aliases });
  };

  for (const match of source) {
    add("TEAM", match.home, match.id);
    add("TEAM", match.away, match.id);
    add("COMPETITION", match.competition, match.id, [match.competitionShort]);
    add("EVENT", `${match.home} - ${match.away}`, match.id);
    for (const p of match.players) add("PLAYER", p, match.id);
    // The prototype offer is football only; the sport entity mirrors that.
    add("SPORT", "Football", match.id, ["nogomet", "soccer"]);
  }
  return [...map.values()];
}

const index = buildIndex(allMatches);

/* ------------------------------------------------------------------ */
/* Scoring                                                             */
/* ------------------------------------------------------------------ */

function bagSimilarity(a: string, b: string) {
  const count = (s: string) => {
    const m = new Map<string, number>();
    for (const c of s) m.set(c, (m.get(c) ?? 0) + 1);
    return m;
  };
  const ca = count(a);
  const cb = count(b);
  let shared = 0;
  for (const [c, n] of ca) shared += Math.min(n, cb.get(c) ?? 0);
  return shared / Math.max(a.length, b.length, 1);
}

type Scored = { score: number; source: IntentSource };

/** Scores one normalized query against one normalized entity label. */
function scoreLabel(q: string, label: string): Scored | null {
  if (!q || !label) return null;
  if (q === label) return { score: 100, source: "exact" };
  if (label.startsWith(q) && q.length >= 3) return { score: 82, source: "partial" };
  if (label.includes(q) && q.length >= 4) return { score: 70, source: "partial" };

  const words = label.split(" ").filter(Boolean);
  const tokens = q.split(" ").filter(Boolean);
  let total = 0;
  let matched = 0;
  let source: IntentSource = "partial";

  for (const token of tokens) {
    let best: Scored | null = null;
    for (const word of words) {
      let scored: Scored | null = null;
      if (word === token) scored = { score: 78, source: "exact" };
      else if (word.startsWith(token) && token.length >= 3)
        scored = { score: 64, source: "partial" };
      else if (token.length >= 4 && editDistance(word, token) <= 2)
        scored = { score: 84 - editDistance(word, token) * 4, source: "variation" };
      else if (token.length >= 5 && bagSimilarity(word, token) >= 0.8)
        scored = { score: 70, source: "variation" };
      if (scored && (!best || scored.score > best.score)) best = scored;
    }
    if (!best) continue;
    matched += 1;
    total += best.score;
    if (best.source === "variation") source = "variation";
  }

  if (!matched) return null;
  // Average of matched tokens, reduced when part of the query went unmatched.
  const coverage = matched / tokens.length;
  return { score: Math.round((total / matched) * (0.55 + 0.45 * coverage)), source };
}

function scoreEntity(q: string, entity: Entity): Scored | null {
  const labels = [entity.name, ...entity.aliases].map(normalize);
  let best: Scored | null = null;
  for (const label of labels) {
    const scored = scoreLabel(q, label);
    if (scored && (!best || scored.score > best.score)) best = scored;
  }
  return best;
}

const TYPED_THRESHOLD = 56;
const GENERAL_THRESHOLD = 42;

/**
 * Interprets a raw query into an intent plus context-ranked results.
 * When nothing scores well enough, the intent stays UNKNOWN — the system is
 * allowed to say "I don't know yet" rather than force an interpretation.
 */
export function interpretSearch(rawQuery: string, ctx: SearchContextInput = {}): SearchResult {
  const query = rawQuery.trim();
  const q = normalize(query);
  const empty: SearchResult = {
    intent: {
      query,
      normalisedQuery: query,
      intentType: "UNKNOWN",
      entityType: null,
      confidence: 0,
      source: "none",
    },
    events: [],
    entities: [],
    groups: [],
    count: 0,
  };
  if (q.length < 2) return empty;

  const recent = ctx.recentInterest ?? [];

  // 1. Score entities.
  const entities: EntityHit[] = [];
  for (const entity of index) {
    const scored = scoreEntity(q, entity);
    if (!scored) continue;
    let score = scored.score;
    // Context lift: never hides results, only orders the useful ones first.
    if (ctx.activeCompetition && entity.type === "COMPETITION" && entity.name === ctx.activeCompetition)
      score += 6;
    if (entity.matchIds.some((id) => recent.includes(id))) score += 8;
    if (ctx.activeSport && entity.type === "SPORT" && entity.name === ctx.activeSport) score += 4;
    const hit: EntityHit = {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      score: Math.min(120, score),
      source: scored.source,
    };
    const eventId = entity.matchIds[0];
    if (eventId) hit.eventId = eventId;
    entities.push(hit);
  }
  entities.sort((a, b) => b.score - a.score);

  // 2. Score events, inheriting the strength of the entities they contain.
  const events: EventHit[] = [];
  for (const match of allMatches) {
    const candidates: { score: number; reason: string; source: IntentSource }[] = [];
    const push = (scored: Scored | null, reason: string, weight = 1) => {
      if (scored) candidates.push({ score: scored.score * weight, reason, source: scored.source });
    };
    push(scoreLabel(q, normalize(`${match.home} ${match.away}`)), "Event");
    push(scoreLabel(q, normalize(match.home)), `Team · ${match.home}`, 0.98);
    push(scoreLabel(q, normalize(match.away)), `Team · ${match.away}`, 0.98);
    push(scoreLabel(q, normalize(match.competition)), `Competition · ${match.competition}`, 0.82);
    push(scoreLabel(q, normalize(match.competitionShort)), `Competition · ${match.competition}`, 0.8);
    for (const p of match.players) push(scoreLabel(q, normalize(p)), `Player · ${p}`, 0.85);
    push(scoreLabel(q, "football"), "Sport · Football", 0.6);
    if (!candidates.length) continue;

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0]!;
    let score = best.score;
    let reason = best.reason;
    if (recent.includes(match.id)) {
      score += 8;
      reason += " · recent context";
    }
    if (ctx.activeCompetition && match.competition === ctx.activeCompetition) score += 4;
    if (match.live) score += 2;
    events.push({
      match,
      score: Math.round(score),
      reason,
      source: best.source,
    });
  }
  events.sort((a, b) => b.score - a.score);

  const topEntity = entities[0];
  const topEvent = events[0];
  const bestScore = Math.max(topEntity?.score ?? 0, topEvent?.score ?? 0);

  if (bestScore < GENERAL_THRESHOLD || !topEvent) return empty;

  const usable = events.filter((e) => e.score >= GENERAL_THRESHOLD - 6);
  const usableEntities = entities.filter((e) => e.score >= GENERAL_THRESHOLD);

  // 3. Build the intent object. Only a strong entity produces a typed intent.
  let intent: SearchIntent;
  if (topEntity && topEntity.score >= TYPED_THRESHOLD) {
    intent = {
      query,
      normalisedQuery: topEntity.name,
      intentType: topEntity.type,
      entityType: topEntity.type,
      confidence: Math.min(0.99, Math.round(Math.min(topEntity.score, 100)) / 100),
      source: topEntity.source,
    };
    if (topEntity.eventId) intent.entityId = topEntity.eventId;
  } else {
    intent = {
      query,
      normalisedQuery: query,
      intentType: "GENERAL_SEARCH",
      entityType: null,
      confidence: Math.min(0.55, Math.round(Math.min(bestScore, 100)) / 100),
      source: topEvent.source,
    };
  }

  // 4. Natural grouping — only when it genuinely helps.
  const groups: SearchGroup[] = [];
  const groupFor = (
    id: SearchGroup["id"],
    title: string,
    type: Exclude<EntityType, null>,
    limit: number,
  ) => {
    const entries = usableEntities
      .filter((e) => e.type === type && e.eventId)
      .slice(0, limit)
      .map((e) => {
        const match = allMatches.find((m) => m.id === e.eventId)!;
        return {
          key: e.id,
          matchId: e.eventId!,
          primary: e.name,
          secondary:
            type === "COMPETITION"
              ? `${match.home} - ${match.away}`
              : `${match.home} - ${match.away} · ${match.kickoff}`,
          badge: match.live ? "LIVE" : match.competitionShort,
        };
      });
    if (entries.length) groups.push({ id, title, entries });
  };

  groupFor("teams", "Teams", "TEAM", 3);
  if (usable.length)
    groups.push({
      id: "events",
      title: "Events",
      entries: usable.slice(0, 8).map((e) => ({
        key: e.match.id,
        matchId: e.match.id,
        primary: `${e.match.home} - ${e.match.away}`,
        secondary: `${e.reason} · ${e.match.kickoff}`,
        badge: e.match.live ? "LIVE" : e.match.competitionShort,
      })),
    });
  groupFor("competitions", "Competitions", "COMPETITION", 2);
  groupFor("players", "Players", "PLAYER", 3);

  return {
    intent,
    events: usable,
    entities: usableEntities,
    groups,
    count: groups.reduce((acc, g) => acc + g.entries.length, 0),
  };
}

/** Plain-language intent label for the judge trace (never shown to customers). */
export function intentLabel(intent: SearchIntent) {
  switch (intent.intentType) {
    case "TEAM":
    case "PLAYER":
    case "EVENT":
      return `Find ${intent.normalisedQuery}`;
    case "COMPETITION":
      return `Browse ${intent.normalisedQuery}`;
    case "SPORT":
      return `Browse ${intent.normalisedQuery}`;
    case "GENERAL_SEARCH":
      return `Search "${intent.query}"`;
    default:
      return "Not established yet";
  }
}

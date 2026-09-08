import { matches, type Match } from "@/data/psk-data";

export type IntentKind =
  | "exact_team"
  | "partial_team"
  | "typo_team"
  | "competition"
  | "player"
  | "context"
  | "unresolved";

export type SearchHit = {
  match: Match;
  /** Transparent prototype relevance score, 0-100. */
  relevance: number;
  reason: string;
  intent: IntentKind;
};

export type IntentResult = {
  query: string;
  intent: IntentKind;
  /** Prototype confidence, 0-1, derived from the scoring below. */
  confidence: number;
  corrected?: string;
  hits: SearchHit[];
};

export function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance, bounded for speed. */
export function editDistance(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 3) return 99;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = tmp;
    }
  }
  return prev[b.length]!;
}

/** Character-bag similarity, catches transpositions such as "Madird". */
function bagSimilarity(a: string, b: string) {
  const count = (s: string) => {
    const map = new Map<string, number>();
    for (const c of s) map.set(c, (map.get(c) ?? 0) + 1);
    return map;
  };
  const ca = count(a);
  const cb = count(b);
  let shared = 0;
  for (const [c, n] of ca) shared += Math.min(n, cb.get(c) ?? 0);
  return shared / Math.max(a.length, b.length, 1);
}

type Scored = { score: number; reason: string; intent: IntentKind; corrected?: string };

function scoreToken(token: string, word: string): Scored | null {
  if (word === token) return { score: 60, reason: "exact term", intent: "exact_team" };
  if (word.startsWith(token) && token.length >= 3)
    return { score: 45, reason: "partial term", intent: "partial_team" };
  const d = editDistance(word, token);
  if (d <= 2 && token.length >= 4)
    return { score: 38 - d * 4, reason: `variation of "${word}"`, intent: "typo_team", corrected: word };
  if (token.length >= 5 && bagSimilarity(word, token) >= 0.8)
    return { score: 32, reason: `variation of "${word}"`, intent: "typo_team", corrected: word };
  return null;
}

/**
 * Context-aware intent inference over teams, competitions and players.
 * Recent interest (match ids the session already engaged with) lifts relevance.
 */
export function inferIntent(rawQuery: string, recentInterest: string[] = []): IntentResult {
  const query = rawQuery.trim();
  const q = normalize(query);
  if (q.length < 2) return { query, intent: "unresolved", confidence: 0, hits: [] };
  const tokens = q.split(" ").filter(Boolean);

  const hits: SearchHit[] = [];
  let bestCorrection: string | undefined;

  for (const match of matches) {
    const fields: { text: string; weight: number; kind: IntentKind; label: string }[] = [
      { text: `${match.home} ${match.away}`, weight: 1, kind: "exact_team", label: "Team" },
      {
        text: `${match.competition} ${match.competitionShort}`,
        weight: 0.75,
        kind: "competition",
        label: "Competition",
      },
      { text: match.players.join(" "), weight: 0.8, kind: "player", label: "Player" },
    ];

    let total = 0;
    let reason = "";
    let intent: IntentKind = "unresolved";

    for (const token of tokens) {
      let best: (Scored & { weight: number; label: string; kind: IntentKind }) | null = null;
      for (const field of fields) {
        for (const word of normalize(field.text).split(" ")) {
          const scored = scoreToken(token, word);
          if (scored && (!best || scored.score * field.weight > best.score * best.weight)) {
            best = { ...scored, weight: field.weight, label: field.label, kind: field.kind };
          }
        }
      }
      if (!best) continue;
      total += best.score * best.weight;
      if (!reason) {
        const source = best.kind === "exact_team" || best.kind === "partial_team" ? "Team" : best.label;
        reason = `${source} · ${best.reason}`;
        intent = best.intent === "exact_team" ? best.kind : best.intent;
        if (best.kind === "competition") intent = "competition";
        if (best.kind === "player") intent = "player";
      }
      if (best.corrected && !bestCorrection) bestCorrection = best.corrected;
    }

    if (total <= 0) continue;

    // Context lift: matches the session already engaged with rank slightly higher.
    if (recentInterest.includes(match.id)) {
      total += 12;
      reason += " · recent context";
      if (intent === "unresolved") intent = "context";
    }
    if (match.live) total += 4;

    hits.push({
      match,
      relevance: Math.max(1, Math.min(100, Math.round(total))),
      reason,
      intent,
    });
  }

  hits.sort((a, b) => b.relevance - a.relevance);
  const top = hits[0];
  const confidence = top ? Math.min(0.99, Math.round((top.relevance / 100) * 100) / 100) : 0;

  const result: IntentResult = {
    query,
    intent: top?.intent ?? "unresolved",
    confidence,
    hits: hits.slice(0, 8),
  };
  if (bestCorrection && top && top.intent === "typo_team") result.corrected = bestCorrection;
  return result;
}

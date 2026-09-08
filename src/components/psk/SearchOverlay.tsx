import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { inferIntent } from "@/lib/intent";
import { useSession } from "@/lib/session-intelligence";

/** Kept for compatibility: tolerant match lookup used elsewhere. */
export function searchMatches(query: string) {
  return inferIntent(query).hits;
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [typing, setTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { log, state, friction, setSearchContext, intelligence, responsibleGate } = useSession();
  const recentInterest = Object.keys(state.interest);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  useEffect(() => {
    setTyping(true);
    const t = setTimeout(() => {
      setDebounced(query);
      setTyping(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const intent = useMemo(
    () => inferIntent(debounced, recentInterest),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debounced],
  );
  // SIMPLIFY tightens result density and keeps the closest matches on top.
  const simplify = intelligence.decision === "SIMPLIFY" && responsibleGate.pass;
  const results = simplify ? intent.hits.slice(0, 4) : intent.hits;

  useEffect(() => {
    if (debounced.trim().length >= 2) {
      log(
        "search",
        `"${debounced.trim()}"`,
        `${results.length} result(s) · intent ${intent.intent} · confidence ${intent.confidence.toFixed(2)}`,
        ["search"],
        { results: results.length, confidence: intent.confidence },
      );
      if (results.length === 0) friction("Search returned no results (prototype signal)", 12);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 p-4 sm:p-10"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-lg bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border p-4">
          <h2 className="truncate text-lg font-bold">Search</h2>
          <button onClick={onClose} aria-label="Close search" className="shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 rounded-md bg-surface-2 px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              maxLength={60}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Look for matches, competitions or players..."
              className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {["Real Madrid", "Real", "Madird", "Champions League", "Mbappe"].map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="rounded-full bg-surface-2 px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-4 max-h-[50vh] overflow-y-auto">
            {typing && query.trim().length >= 2 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Searching…</p>
            ) : null}
            {!typing && debounced.trim().length >= 2 && results.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No matches found. Try a team, competition or player name.
              </p>
            ) : null}
            {!typing && simplify && results.length ? (
              <p className="pb-2 text-xs text-muted-foreground">Closest matches first</p>
            ) : null}
            {!typing && intent.corrected && results.length ? (
              <p className="pb-2 text-xs text-muted-foreground">
                Showing results for <span className="font-semibold text-foreground">{intent.corrected}</span>
              </p>
            ) : null}
            <ul>
              {!typing &&
                results.map(({ match, reason }) => (
                  <li key={match.id}>
                    <button
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-1 py-3 text-left hover:bg-surface-2"
                      onClick={() => {
                        log("navigation", `Opened ${match.home} - ${match.away}`, "from search", [
                          match.id,
                        ]);
                        // Preserve search-to-match context for ordering.
                        setSearchContext({
                          query: debounced.trim(),
                          ...(intent.corrected ? { corrected: intent.corrected } : {}),
                          matchId: match.id,
                        });
                        onClose();
                        navigate({ to: "/match/$matchId", params: { matchId: match.id } });
                      }}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">
                          {match.home} - {match.away}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {reason} · {match.kickoff}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-sm bg-surface-2 px-2 py-1 text-[11px] text-muted-foreground">
                        {match.live ? "LIVE" : match.competitionShort}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

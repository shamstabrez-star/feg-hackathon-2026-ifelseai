import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { inferIntent } from "@/core";
import { useSession } from "@/lib/session-intelligence";
import { cn } from "@/lib/utils";

/** Kept for compatibility: tolerant match lookup used elsewhere. */
export function searchMatches(query: string) {
  return inferIntent(query).hits;
}

function ResultSkeleton() {
  return (
    <ul aria-hidden="true" className="space-y-2 py-2">
      {[0, 1, 2].map((i) => (
        <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2">
          <span className="min-w-0 space-y-2">
            <span className="skeleton block h-3.5 w-2/3" />
            <span className="skeleton block h-3 w-1/3" />
          </span>
          <span className="skeleton block h-6 w-12 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [typing, setTyping] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchStart = useRef<number | null>(null);
  const navigate = useNavigate();
  const { log, state, friction, setSearchContext, intelligence, responsibleGate, measure } =
    useSession();
  const recentInterest = Object.keys(state.interest);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else {
      setQuery("");
      setDebounced("");
      setActive(0);
    }
  }, [open]);

  // Debounced input: one settled query, never a request per keystroke.
  useEffect(() => {
    setTyping(true);
    searchStart.current = performance.now();
    const t = setTimeout(() => {
      setDebounced(query);
      setTyping(false);
      setActive(0);
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
      if (searchStart.current !== null) {
        measure({ searchMs: Math.round(performance.now() - searchStart.current) });
      }
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

  const openMatch = useCallback(
    (matchId: string, label: string) => {
      log("navigation", `Opened ${label}`, "from search", [matchId]);
      // Preserve search-to-match context for ordering.
      setSearchContext({
        query: debounced.trim(),
        ...(intent.corrected ? { corrected: intent.corrected } : {}),
        matchId,
      });
      onClose();
      navigate({ to: "/match/$matchId", params: { matchId } });
    },
    [debounced, intent.corrected, log, navigate, onClose, setSearchContext],
  );

  if (!open) return null;

  const showSkeleton = typing && query.trim().length >= 2;
  const showEmpty = !typing && debounced.trim().length >= 2 && results.length === 0;

  const status = showSkeleton
    ? "Searching"
    : showEmpty
      ? "No matches found"
      : results.length
        ? `${results.length} result${results.length === 1 ? "" : "s"}`
        : "";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 p-4 sm:p-10"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search matches, competitions and players"
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-lg bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
            return;
          }
          if (!results.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % results.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i - 1 + results.length) % results.length);
          } else if (e.key === "Enter" && e.target === inputRef.current) {
            e.preventDefault();
            const hit = results[active];
            if (hit) openMatch(hit.match.id, `${hit.match.home} - ${hit.match.away}`);
          }
        }}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border p-4">
          <h2 className="truncate text-lg font-bold">Search</h2>
          <button
            onClick={onClose}
            aria-label="Close search"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-md hover:bg-surface-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <label htmlFor="psk-search" className="sr-only">
            Search matches, competitions or players
          </label>
          <div className="flex items-center gap-3 rounded-md bg-surface-2 px-3 focus-within:ring-2 focus-within:ring-ring">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              id="psk-search"
              ref={inputRef}
              type="search"
              value={query}
              maxLength={60}
              autoComplete="off"
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
                className="min-h-9 rounded-full bg-surface-2 px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>

          <p aria-live="polite" className="sr-only">
            {status}
          </p>

          <div className="mt-4 max-h-[50vh] overflow-y-auto">
            {showSkeleton ? <ResultSkeleton /> : null}
            {showEmpty ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No matches found. Try a team, competition or player name.
              </p>
            ) : null}
            {!typing && simplify && results.length ? (
              <p className="pb-2 text-xs text-muted-foreground">Closest matches first</p>
            ) : null}
            {!typing && intent.corrected && results.length ? (
              <p className="pb-2 text-xs text-muted-foreground">
                Showing results for{" "}
                <span className="font-semibold text-foreground">{intent.corrected}</span>
              </p>
            ) : null}
            <ul>
              {!typing &&
                results.map(({ match, reason }, index) => (
                  <li key={match.id}>
                    <button
                      className={cn(
                        "grid min-h-12 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-2 py-3 text-left transition-colors hover:bg-surface-2",
                        index === active && "bg-surface-2",
                      )}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => openMatch(match.id, `${match.home} - ${match.away}`)}
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

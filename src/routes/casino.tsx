import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/psk/AppShell";
import { useSession } from "@/lib/session-intelligence";
import { casinoGames, searchCasinoGames } from "@/data/casino-games";

export const Route = createFileRoute("/casino")({
  head: () => ({
    meta: [
      { title: "Casino — PSK Intelligence prototype" },
      {
        name: "description",
        content:
          "PSK Intelligence prototype: existing Casino section with game search used as a cross-product architecture-reuse proof.",
      },
      { property: "og:title", content: "Casino — PSK Intelligence prototype" },
      {
        property: "og:description",
        content: "PSK Intelligence prototype: existing Casino section with game search.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { productSearch, productSelect, state } = useSession();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const lastLogged = useRef<string>("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => searchCasinoGames(debounced), [debounced]);

  useEffect(() => {
    if (!debounced || lastLogged.current === debounced) return;
    lastLogged.current = debounced;
    productSearch(debounced, results.length, results[0]?.name);
  }, [debounced, results, productSearch]);

  const shown = debounced ? results : casinoGames;
  const selected = state.productMemory.CASINO ?? null;

  return (
    <AppShell>
      <section className="rounded-md bg-surface p-4 sm:p-6">
        <h1 className="text-2xl font-bold">Casino</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse casino games or search the existing catalogue.
        </p>

        <label htmlFor="casino-search" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Search casino games
        </label>
        <input
          id="casino-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Book"
          className="mt-1 w-full max-w-md rounded-sm border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />

        <p aria-live="polite" className="mt-2 text-xs text-muted-foreground">
          {debounced
            ? `${results.length} game${results.length === 1 ? "" : "s"} for "${debounced}"`
            : `${casinoGames.length} games`}
        </p>

        {selected ? (
          <p className="mt-2 text-xs text-muted-foreground">Last opened: {selected}</p>
        ) : null}

        {shown.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No games match that search. Try a shorter word.
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((game) => (
              <li key={game.id}>
                <button
                  type="button"
                  onClick={() => productSelect(game.name)}
                  className="min-h-11 w-full rounded-sm bg-surface-2 px-3 py-3 text-left text-sm font-semibold hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="block truncate">{game.name}</span>
                  <span className="block truncate text-[11px] font-normal text-muted-foreground">
                    {game.group}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

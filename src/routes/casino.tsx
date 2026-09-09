import { useEffect, useMemo, useRef, useState } from "react";
import { casinoAssetUrls } from "@/data/casino-assets";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/psk/AppShell";
import {
  CasinoGameCard,
  CasinoGameRail,
  CasinoHero,
  CasinoNavigation,
  CasinoProviders,
  CasinoSearch,
  DeferredCasinoSection,
} from "@/components/psk/CasinoLobby";
import { useSession } from "@/lib/session-intelligence";
import { casinoGames, casinoSections, searchCasinoGames } from "@/data/casino-games";
import { casinoContentDecision, orderCasinoSections } from "@/data/casino-orchestration";

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
    links: [
      {
        rel: "preload",
        as: "image",
        href: casinoAssetUrls["hero-playtech"],
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { productSearch, productSelect, state, sessionContext } = useSession();
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

  const selected = state.productMemory.CASINO ?? null;
  const contentDecision = casinoContentDecision(sessionContext, debounced);
  const orderedSections = useMemo(
    () => orderCasinoSections(casinoSections, debounced),
    [debounced],
  );
  const visibleSections =
    contentDecision.state === "SILENCE"
      ? orderedSections.slice(0, 1)
      : contentDecision.state === "DEFER"
        ? orderedSections.slice(0, 3)
        : orderedSections;

  return (
    <AppShell>
      <main id="casino-lobby" className="min-w-0 overflow-hidden rounded-md bg-surface">
        <h1 className="sr-only">PSK Casino</h1>
        <CasinoHero
          hidden={contentDecision.state === "SILENCE" || contentDecision.state === "DEFER"}
        />
        <div className="mt-3">
          <CasinoNavigation />
        </div>
        <CasinoSearch query={query} onQuery={setQuery} />

        <p aria-live="polite" className="px-4 pt-2 text-xs text-muted-foreground">
          {debounced
            ? `${results.length} game${results.length === 1 ? "" : "s"} for "${debounced}"`
            : `${casinoGames.length} games`}
        </p>

        {selected ? (
          <p className="px-4 pt-1 text-xs text-muted-foreground">Last opened: {selected}</p>
        ) : null}

        {debounced && results.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted-foreground">
            No games match that search. Try a shorter word.
          </p>
        ) : debounced ? (
          <section aria-labelledby="casino-results-title" className="p-4">
            <h2 id="casino-results-title" className="mb-3 text-base font-bold">
              Search results
            </h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {results.map((game) => (
                <li key={game.id}>
                  <CasinoGameCard
                    game={game}
                    selected={selected?.endsWith(game.name) ?? false}
                    onOpen={productSelect}
                    eager
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className="space-y-7 p-4">
            {visibleSections.map((section, index) =>
              index < 2 ? (
                <CasinoGameRail
                  key={section.id}
                  section={section}
                  selected={selected}
                  onOpen={productSelect}
                  {...(index === 0 ? { label: "Slots games" } : {})}
                  eager={index === 0}
                />
              ) : (
                <DeferredCasinoSection key={section.id} label={`${section.title} loading region`}>
                  <CasinoGameRail section={section} selected={selected} onOpen={productSelect} />
                </DeferredCasinoSection>
              ),
            )}
            {contentDecision.state !== "SILENCE" ? (
              <DeferredCasinoSection label="Casino providers loading region">
                <CasinoProviders />
              </DeferredCasinoSection>
            ) : null}
          </div>
        )}
      </main>
    </AppShell>
  );
}

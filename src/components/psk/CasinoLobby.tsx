import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { ContentRail } from "./ContentRail";
import type { CasinoGame, CasinoSection } from "@/data/casino-games";
import { casinoAssetUrls } from "@/data/casino-assets";

const casinoTabs = [
  ["⌂", "Lobby"],
  ["♣", "Providers"],
  ["♛", "Jackpots"],
  ["▦", "Themes"],
  ["★", "PSK Favorites"],
  ["●", "New Games"],
  ["●", "Popular"],
  ["♟", "Game Shows"],
] as const;

const casinoTabTargets: Partial<Record<(typeof casinoTabs)[number][1], string>> = {
  Lobby: "casino-lobby",
  Providers: "casino-providers",
  Jackpots: "casino-jackpots",
  "PSK Favorites": "casino-favorites",
  "New Games": "casino-new",
  Popular: "casino-popular",
  "Game Shows": "casino-instant",
};

export function CasinoNavigation() {
  return (
    <nav aria-label="Casino categories" className="scroll-x border-b border-border bg-surface px-1">
      <ul className="flex min-w-max items-center gap-1 pr-3">
        {casinoTabs.map(([icon, label], index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => {
                const targetId = casinoTabTargets[label];
                const target = targetId ? document.getElementById(targetId) : null;
                target?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`min-h-12 whitespace-nowrap border-b-2 px-3 text-[13px] font-semibold ${index === 0 ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <span aria-hidden="true" className="mr-1">
                {icon}
              </span>
              {label}
            </button>
          </li>
        ))}
        <li className="px-2 text-xs font-semibold text-muted-foreground">+ 12 more</li>
      </ul>
    </nav>
  );
}

export function CasinoHero({ hidden = false }: { hidden?: boolean }) {
  if (hidden) return null;
  return (
    <section
      aria-label="Featured Casino promotion"
      className="overflow-hidden rounded-md bg-surface"
    >
      <img
        src={casinoAssetUrls["hero-playtech"]}
        alt="Playtech games tournament, 10,000 euro"
        width={1013}
        height={279}
        fetchPriority="high"
        className="aspect-[3.63/1] w-full object-cover"
      />
    </section>
  );
}

export function CasinoSearch({
  query,
  onQuery,
}: {
  query: string;
  onQuery: (query: string) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-y border-border bg-surface px-3 py-2">
      <label className="relative block min-w-0">
        <span className="sr-only">Search casino games</span>
        <Search
          aria-hidden="true"
          className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id="casino-search"
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Find your game"
          className="min-h-11 w-full rounded-full border border-border bg-background pr-3 pl-10 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </label>
      <button
        type="button"
        className="grid min-h-11 grid-cols-[auto_auto] items-center gap-2 rounded-sm bg-surface-2 px-3 text-xs font-bold"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">FILTERS</span>
        <span className="sr-only sm:hidden">Filters</span>
      </button>
    </div>
  );
}

export function CasinoGameCard({
  game,
  selected,
  onOpen,
  eager = false,
}: {
  game: CasinoGame;
  selected: boolean;
  onOpen: (name: string) => void;
  eager?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(game.name)}
      aria-pressed={selected}
      aria-label={`${game.name}, ${game.provider}`}
      className={`group block w-full overflow-hidden rounded-sm border text-left transition-colors ${selected ? "border-primary" : "border-transparent hover:border-border"}`}
    >
      <span className="relative block aspect-square overflow-hidden bg-surface-2">
        <img
          src={game.image}
          alt=""
          width={199}
          height={199}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover"
        />
        {game.badge ? (
          <span className="absolute top-1 left-1 max-w-[90%] truncate rounded-sm bg-badge-new px-1.5 py-0.5 text-[9px] font-bold text-header-foreground">
            {game.badge}
          </span>
        ) : null}
      </span>
      <span className="block bg-surface-2 px-2 py-2">
        <span className="block truncate text-xs font-bold">{game.name}</span>
        <span className="block truncate text-[10px] text-muted-foreground">{game.provider}</span>
      </span>
    </button>
  );
}

export function CasinoGameRail({
  section,
  selected,
  onOpen,
  label,
  eager = false,
}: {
  section: CasinoSection;
  selected: string | null;
  onOpen: (name: string) => void;
  label?: string;
  eager?: boolean;
}) {
  return (
    <div id={`casino-${section.id}`} className="scroll-mt-32">
      <ContentRail
        title={
          <>
            <span aria-hidden="true" className="mr-1.5 text-primary">
              {section.icon}
            </span>
            {section.title}
          </>
        }
        label={label ?? `${section.title} games`}
      >
        {section.games.map((game, index) => (
          <div key={game.id} data-rail-item className="w-36 shrink-0 snap-start sm:w-40 lg:w-44">
            <CasinoGameCard
              game={game}
              selected={selected?.endsWith(game.name) ?? false}
              onOpen={onOpen}
              // Only the cards that are actually on screen load immediately.
              eager={eager && index < 3}
            />
          </div>
        ))}
      </ContentRail>
    </div>
  );
}

export function DeferredCasinoSection({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} aria-label={label} className="min-h-56">
      {visible ? children : <div className="skeleton h-56 w-full" aria-hidden="true" />}
    </div>
  );
}

const providerAssets = [
  ["TLB Exclusive", casinoAssetUrls["provider-tlb"]],
  ["7777 Gaming", casinoAssetUrls["provider-7777"]],
  ["Barbara Bang", casinoAssetUrls["provider-barbara-bang"]],
  ["XGames", casinoAssetUrls["provider-xgames"]],
  ["Playtech", casinoAssetUrls["provider-playtech"]],
] as const;

export function CasinoProviders() {
  return (
    <section
      id="casino-providers"
      className="scroll-mt-32"
      aria-labelledby="casino-providers-title"
    >
      <h2 id="casino-providers-title" className="text-sm font-bold">
        Explore all providers
      </h2>
      <ul className="scroll-x mt-2 flex gap-2 pb-1">
        {providerAssets.map(([name, image]) => (
          <li key={name} className="w-36 shrink-0 sm:w-40">
            <div className="aspect-[2.25/1] overflow-hidden rounded-sm bg-surface-2">
              <img
                src={image}
                alt={name}
                width={189}
                height={84}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

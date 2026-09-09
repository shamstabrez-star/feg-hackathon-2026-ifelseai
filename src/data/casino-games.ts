import { casinoAssetUrls } from "./casino-assets";

/** Screenshot-backed Casino content. No player data or supplier feed is used. */
export type CasinoGame = {
  id: string;
  name: string;
  group: string;
  provider: string;
  image: string;
  badge?: "NEW" | "JACKPOT" | "EXCLUSIVE" | "GAME OF THE DAY";
  tags?: string[];
};

export type CasinoSection = { id: string; title: string; icon: string; games: CasinoGame[] };

const game = (
  id: string,
  name: string,
  group: string,
  provider: string,
  badge?: CasinoGame["badge"],
  tags: string[] = [],
): CasinoGame => ({
  id,
  name,
  group,
  provider,
  ...(badge ? { badge } : {}),
  tags,
  image: casinoAssetUrls[id as keyof typeof casinoAssetUrls],
});

export const casinoSections: CasinoSection[] = [
  {
    id: "favorites",
    title: "PSK Favorites",
    icon: "★",
    games: [
      game("multiplay-81", "Multiplay 81", "PSK Favorites", "Playtech", "NEW"),
      game("frozzy-fruits", "Frozzy Fruits", "PSK Favorites", "Playtech", "NEW"),
      game("hunters-dream", "Hunter's 2 Dream", "PSK Favorites", "Playtech"),
      game("golden-fate", "Golden Fate x1000", "PSK Favorites", "Playtech", "JACKPOT"),
      game("dynamite-splash-20", "Dynamite Splash 20", "PSK Favorites", "Playtech", "JACKPOT"),
    ],
  },
  {
    id: "new",
    title: "New Games",
    icon: "●",
    games: [
      game("cougar-blitz", "Cougar Blitz", "New Games", "Playtech", "GAME OF THE DAY"),
      game("dynamite-splash-5", "Dynamite Splash 5", "New Games", "Playtech", "JACKPOT"),
      game("15-diamonds", "15 Diamonds", "New Games", "Playtech", "JACKPOT", ["diamonds"]),
      game("bufona-alegre", "Bufona Alegre 10", "New Games", "Pateplay", "JACKPOT"),
      game("3-supercharged-diamonds", "3 Supercharged Diamonds", "New Games", "Playson", "NEW", [
        "diamonds",
      ]),
    ],
  },
  {
    id: "provider-week",
    title: "Provider of the Week",
    icon: "▣",
    games: [
      game("double-game", "Double Game", "Provider of the Week", "Playtech"),
      game("savanna-sunrise", "Savanna Sunrise", "Provider of the Week", "Playtech"),
      game("wild-scatters", "Wild Scatters", "Provider of the Week", "Playtech", "NEW"),
      game("black-pearl", "Black Pearl", "Provider of the Week", "Playtech"),
      game("after-dark", "After Dark", "Provider of the Week", "Playtech"),
    ],
  },
  {
    id: "fazi",
    title: "Fazi",
    icon: "▰",
    games: [
      game("psk-hot-40", "PSK Hot 40", "Fazi", "Fazi", "EXCLUSIVE"),
      game("very-hots", "Very Hots Extreme", "Fazi", "Fazi", "JACKPOT"),
      game("wild-hot-40", "Wild Hot 40", "Fazi", "Fazi", "JACKPOT"),
      game("chilli-respin", "Chilli Respin", "Fazi", "Fazi", "JACKPOT"),
      game("golden-crown", "Golden Crown", "Fazi", "Fazi", "JACKPOT"),
    ],
  },
  {
    id: "popular",
    title: "Popular",
    icon: "●",
    games: [
      game("buffalo-king", "Buffalo King Megaways", "Popular", "Pragmatic Play"),
      game("5-fruits", "5 Fruits", "Popular", "Pragmatic Play"),
      game("majestic-megaways", "Majestic Megaways", "Popular", "Pragmatic Play"),
      game("big-bass-bonanza", "Big Bass Bonanza Megaways", "Popular", "Pragmatic Play"),
      game("wild-woof", "Wild Woof Returns", "Popular", "Pragmatic Play"),
    ],
  },
  {
    id: "jackpots",
    title: "Jackpots",
    icon: "♛",
    games: [
      game("x-ride", "X Ride", "Jackpots", "Playtech", "JACKPOT"),
      game("book-of-realm", "Book of Realm", "Jackpots", "Playtech", "JACKPOT", ["book"]),
      game("extra-stars", "Extra Stars", "Jackpots", "Playtech", "JACKPOT"),
      game("glossy-hot", "5 Glossy Hot", "Jackpots", "Fazi", "JACKPOT"),
    ],
  },
  {
    id: "instant",
    title: "Instant Games",
    icon: "◒",
    games: [
      game("burning-board", "Burning Board 9 Coins", "Instant Games", "7777 Gaming", "NEW"),
      game("hood-hoops", "Hood Hoops", "Instant Games", "XGames"),
      game("plushie-peril", "Plushie Peril", "Instant Games", "Barbara Bang"),
      game("sicbo-thunder", "SicBo Thunder", "Instant Games", "Playtech", "NEW"),
      game("bad-bass", "Bad Bass Cash Towers", "Instant Games", "Pragmatic Play"),
    ],
  },
  {
    id: "table",
    title: "Table Games",
    icon: "♠",
    games: [
      game("blackjack-thunder", "Blackjack Thunder", "Table Games", "Playtech", "NEW", [
        "blackjack",
      ]),
      game("baccbo", "BaccBo", "Table Games", "Playtech"),
      game("andar-bahar", "Andar Bahar", "Table Games", "Playtech", "NEW"),
      game("vip-roulette", "VIP Roulette", "Table Games", "Playtech", "NEW"),
      game("dragon-tiger", "Dragon Tiger", "Table Games", "Playtech"),
    ],
  },
];

export const casinoGames = casinoSections.flatMap((section) => section.games);

export function searchCasinoGames(query: string): CasinoGame[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return casinoGames
    .map((item) => {
      const name = item.name.toLowerCase();
      const provider = item.provider.toLowerCase();
      const tags = item.tags?.join(" ").toLowerCase() ?? "";
      const score = name.startsWith(q)
        ? 4
        : name.includes(q)
          ? 3
          : provider.startsWith(q)
            ? 2
            : provider.includes(q) || tags.includes(q)
              ? 1
              : 0;
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

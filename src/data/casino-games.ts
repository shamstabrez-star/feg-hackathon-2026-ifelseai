/**
 * Sanitized demo content for the existing Casino section of the prototype.
 * Illustrative prototype titles only — no supplier feed, no player data.
 */
export type CasinoGame = {
  id: string;
  name: string;
  group: string;
};

export const casinoGames: CasinoGame[] = [
  { id: "cg-1", name: "Book of Fortune", group: "Slots" },
  { id: "cg-2", name: "Book of Gold", group: "Slots" },
  { id: "cg-3", name: "Sizzling Fruits", group: "Slots" },
  { id: "cg-4", name: "Golden Sevens", group: "Slots" },
  { id: "cg-5", name: "Wild Diamonds", group: "Slots" },
  { id: "cg-6", name: "European Roulette", group: "Table games" },
  { id: "cg-7", name: "Blackjack Classic", group: "Table games" },
  { id: "cg-8", name: "Baccarat", group: "Table games" },
  { id: "cg-9", name: "Jackpot Bells", group: "Jackpots" },
  { id: "cg-10", name: "Mega Jackpot Reels", group: "Jackpots" },
];

export function searchCasinoGames(query: string): CasinoGame[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const starts = casinoGames.filter((g) => g.name.toLowerCase().startsWith(q));
  const contains = casinoGames.filter(
    (g) => !starts.includes(g) && g.name.toLowerCase().includes(q),
  );
  return [...starts, ...contains];
}

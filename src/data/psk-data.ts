/**
 * Sanitized demo content for the PSK Intelligence prototype.
 * No real customer data, no raw datasets, no external identifiers.
 */

export type Outcome = {
  id: string;
  label: string;
  odds: number;
};

export type Market = {
  id: string;
  name: string;
  /** Progressive disclosure group: core markets show first. */
  tier: 1 | 2 | 3;
  outcomes: Outcome[];
};

export type Match = {
  id: string;
  competition: string;
  competitionShort: string;
  home: string;
  away: string;
  kickoff: string;
  startsIn: string;
  live: boolean;
  minute?: string;
  score?: [number, number];
  betCount: number;
  players: string[];
  markets: Market[];
};

function m(
  id: string,
  name: string,
  tier: 1 | 2 | 3,
  outcomes: [string, number][],
): Market {
  return {
    id,
    name,
    tier,
    outcomes: outcomes.map(([label, odds], i) => ({ id: `${id}-${i}`, label, odds })),
  };
}

function standardMarkets(home: string, away: string, base: [number, number, number]): Market[] {
  const [h, d, a] = base;
  return [
    m("1x2", "Osnovna ponuda", 1, [
      ["1", h],
      ["X", d],
      ["2", a],
    ]),
    m("dc", "Double chance", 1, [
      ["1X", +(1 / (1 / h + 1 / d) + 0.06).toFixed(2)],
      ["12", +(1 / (1 / h + 1 / a) + 0.06).toFixed(2)],
      ["X2", +(1 / (1 / d + 1 / a) + 0.06).toFixed(2)],
    ]),
    m("goals", "Total goals", 1, [
      ["under 2.5", 1.95],
      ["over 2.5", 1.85],
    ]),
    m("btts", "Both teams to score", 2, [
      ["GG", 1.72],
      ["NG", 2.05],
    ]),
    m("ht", "1. poluvrijeme", 2, [
      ["1", +(h * 1.45).toFixed(2)],
      ["X", 2.1],
      ["2", +(a * 1.4).toFixed(2)],
    ]),
    m("hcp", "Handicap", 2, [
      [`${home} -1`, +(h * 2.1).toFixed(2)],
      [`${away} +1`, +(a * 0.62).toFixed(2)],
    ]),
    m("corners", "Corners", 3, [
      ["under 9.5", 1.8],
      ["over 9.5", 1.95],
    ]),
    m("cards", "Cards", 3, [
      ["under 3.5", 1.7],
      ["over 3.5", 2.0],
    ]),
  ];
}

export const matches: Match[] = [
  {
    id: "rma-int",
    competition: "Champions League",
    competitionShort: "UCL",
    home: "Real Madrid",
    away: "Inter Milano",
    kickoff: "tomorrow 00:30",
    startsIn: "STARTS IN 5H",
    live: false,
    betCount: 405,
    players: ["Kylian Mbappe", "Vinicius Jr", "Jude Bellingham", "Lautaro Martinez"],
    markets: [
      ...standardMarkets("Real Madrid", "Inter Milano", [1.65, 4.7, 5.5]),
      m("scorer", "Player to score anytime", 2, [
        ["Kylian Mbappe", 1.75],
        ["Vinicius Jr", 2.1],
        ["Jude Bellingham", 3.2],
        ["Lautaro Martinez", 3.4],
      ]),
    ],
  },
  {
    id: "por-mci",
    competition: "Champions League",
    competitionShort: "UCL",
    home: "Porto",
    away: "Man.City",
    kickoff: "tomorrow 00:30",
    startsIn: "STARTS IN 5H",
    live: false,
    betCount: 232,
    players: ["Erling Braut Haaland", "Phil Foden", "Samu Aghehowa"],
    markets: [
      ...standardMarkets("Porto", "Man.City", [4.1, 3.8, 1.85]),
      m("scorer", "Player to score anytime", 2, [
        ["Erling Braut Haaland", 1.6],
        ["Phil Foden", 2.6],
        ["Samu Aghehowa", 3.1],
      ]),
    ],
  },
  {
    id: "dor-vil",
    competition: "Champions League",
    competitionShort: "UCL",
    home: "Dortmund",
    away: "Villarreal",
    kickoff: "tomorrow 00:30",
    startsIn: "STARTS IN 3H",
    live: false,
    betCount: 198,
    players: ["Serhou Guirassy", "Karim Adeyemi", "Ayoze Perez"],
    markets: standardMarkets("Dortmund", "Villarreal", [1.9, 4.2, 4.3]),
  },
  {
    id: "aek-lsk",
    competition: "Europa League",
    competitionShort: "UEL",
    home: "AEK Atena",
    away: "LASK Linz",
    kickoff: "today 21:00",
    startsIn: "STARTS IN 3H",
    live: false,
    betCount: 141,
    players: ["Lovro Majer", "Anastasios Bakasetas"],
    markets: standardMarkets("AEK Atena", "LASK Linz", [1.72, 3.9, 5.3]),
  },
  {
    id: "bra-can",
    competition: "World Cup U20-women",
    competitionShort: "WC U20",
    home: "Brazil U20",
    away: "Canada U20",
    kickoff: "live",
    startsIn: "1. poluvrijeme - 45m",
    live: true,
    minute: "45'",
    score: [1, 0],
    betCount: 64,
    players: [],
    markets: standardMarkets("Brazil U20", "Canada U20", [1.5, 4.1, 4.8]),
  },
  {
    id: "ben-arg",
    competition: "World Cup U20-women",
    competitionShort: "WC U20",
    home: "Benin U20",
    away: "Argentina U20",
    kickoff: "live",
    startsIn: "1. poluvrijeme - 45m",
    live: true,
    minute: "45'",
    score: [0, 2],
    betCount: 52,
    players: [],
    markets: standardMarkets("Benin U20", "Argentina U20", [4.2, 4.0, 1.6]),
  },
  {
    id: "bla-wre",
    competition: "England amateur-Central League Cup",
    competitionShort: "ENG CLC",
    home: "Blackpool Reserves",
    away: "Wrexham Reserves",
    kickoff: "live",
    startsIn: "2. poluvrijeme - 89m",
    live: true,
    minute: "89'",
    score: [2, 0],
    betCount: 21,
    players: [],
    markets: standardMarkets("Blackpool Reserves", "Wrexham Reserves", [1.25, 5.5, 9.0]),
  },
  {
    id: "din-haj",
    competition: "Liga prvaka - HR",
    competitionShort: "HNL",
    home: "Dinamo Zagreb",
    away: "Hajduk Split",
    kickoff: "Saturday 19:00",
    startsIn: "STARTS IN 2D",
    live: false,
    betCount: 176,
    players: ["Bruno Petkovic", "Marko Livaja"],
    markets: [
      ...standardMarkets("Dinamo Zagreb", "Hajduk Split", [2.05, 3.4, 3.5]),
      m("scorer", "Player to score anytime", 2, [
        ["Bruno Petkovic", 2.4],
        ["Marko Livaja", 2.2],
      ]),
    ],
  },
];

export const competitions = Array.from(new Set(matches.map((x) => x.competition)));

export function matchById(id: string) {
  return matches.find((x) => x.id === id);
}

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/psk/AppShell";

const filters = ["LIVE", "TODAY", "1H", "3H", "TOMORROW", "ALL"];

const quickLinks = [
  "Promo",
  "Aviator",
  "MM",
  "Misije",
  "Casino",
  "eNogomet",
  "eKošarka",
  "Loto",
  "PSK Klub Prvaka",
  "Live Casino",
  "PSK Arena",
  "Forum",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PSK Intelligence — Sport" },
      {
        name: "description",
        content:
          "PSK Intelligence prototype shell: PSK sport lobby with offer filters, quick links and betslip.",
      },
      { property: "og:title", content: "PSK Intelligence — Sport" },
      {
        property: "og:description",
        content: "PSK Intelligence prototype shell for the PSK sport lobby.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AppShell>
      <div className="rounded-md bg-surface">
        <div className="flex items-stretch overflow-x-auto">
          {filters.map((f, i) => (
            <button
              key={f}
              className={
                "shrink-0 border-b-2 px-6 py-4 text-sm font-semibold tracking-wide " +
                (i === 1
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {["GOLDEN MARKET FREE BET", "SNAJPER NA ZADATKU", "20% ODDS BOOSTER", "OSVOJI NOVI PLUS"].map(
          (promo) => (
            <article key={promo} className="overflow-hidden rounded-md bg-surface">
              <div className="flex h-32 items-center bg-header/80 p-4 text-lg leading-tight font-extrabold text-header-foreground">
                {promo}
              </div>
              <div className="truncate px-4 py-3 text-sm">{promo}</div>
            </article>
          ),
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-6 lg:grid-cols-12">
        {quickLinks.map((link) => (
          <button key={link} className="group flex flex-col items-center gap-2">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-surface-2" aria-hidden />
            <span className="w-full truncate text-center text-xs text-muted-foreground group-hover:text-foreground">
              {link}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        {[
          { match: "GOLDEN MARKET / REAL MADRID - INTER M.", starts: "STARTS IN 5H", odd: "3.30" },
          { match: "PORTO - MAN.CITY", starts: "STARTS IN 5H", odd: "2.35" },
          { match: "AEK ATENA - LASK LINZ", starts: "STARTS IN 3H", odd: "5.30" },
        ].map((c) => (
          <article key={c.match} className="rounded-md bg-surface p-4">
            <div className="text-[11px] font-semibold text-muted-foreground">{c.starts}</div>
            <h3 className="mt-2 truncate text-sm font-bold">{c.match}</h3>
            <div className="mt-3 rounded-md bg-odds py-3 text-center text-lg font-bold text-odds-foreground">
              {c.odd}
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

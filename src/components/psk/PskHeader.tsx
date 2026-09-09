import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, EyeOff, Menu, Moon, Search, User, X } from "lucide-react";
import pskLogo from "@/assets/psk-logo.svg.asset.json";
import { cn } from "@/lib/utils";

export const primaryNav = [
  { label: "SPORT", to: "/" as const },
  { label: "LIVE", to: "/live" as const },
  { label: "CASINO", to: "/casino" as const },
  { label: "LIVE CASINO", to: "/live-casino" as const, badge: "NEW" },
  { label: "LOTO", to: "/loto" as const },
  { label: "VIRTUALS", to: "/virtuals" as const },
  { label: "FORUM", to: "/forum" as const },
  { label: "PSK ARENA", to: "/psk-arena" as const },
  { label: "PROMO", to: "/promo" as const },
  { label: "SWIPE & BET", to: "/swipe-and-bet" as const, badge: "NEW" },
];

export const subNav = [
  "Mobile app",
  "Results",
  "Statistics",
  "News",
  "Show your heart",
  "Klub prvaka",
  "Help",
  "Shops",
];

function useActiveProduct() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname.startsWith("/match/")) return "SPORT";
  const hit = primaryNav.find((n) => n.to !== "/" && pathname.startsWith(n.to));
  return hit?.label ?? "SPORT";
}

/** Compact mobile navigation panel — same products, same names, same order. */
function MobileNavPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} role="presentation" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="PSK navigation"
        className="absolute inset-y-0 left-0 flex w-[86%] max-w-[20rem] flex-col bg-popover"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-4 py-3">
          <img src={pskLogo.url} alt="PSK" className="h-6 w-auto" />
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="grid h-11 w-11 place-items-center rounded-md hover:bg-surface-2"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          <p className="px-2 pb-1 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
            Products
          </p>
          <ul>
            {primaryNav.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  onClick={onClose}
                  className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors hover:bg-surface-2"
                  activeProps={{ className: "bg-surface-2 text-primary" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  <span className="truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="shrink-0 rounded-sm bg-badge-new px-1.5 text-[9px] leading-4 font-bold text-header-foreground">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 px-2 pb-1 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
            More
          </p>
          <ul>
            {subNav.map((item) => (
              <li
                key={item}
                className="flex min-h-11 cursor-pointer items-center rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <span className="truncate">{item}</span>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function PskHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeProduct = useActiveProduct();

  return (
    <header className="sticky top-0 z-40 bg-header text-header-foreground">
      {/* Mobile / tablet: compact bar, no sideways scrolling. */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 lg:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open navigation"
          aria-expanded={menuOpen}
          className="grid h-11 w-11 place-items-center rounded-md hover:bg-white/10"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <Link to="/" className="flex min-w-0 items-center gap-2" aria-label="PSK home">
          <span className="grid shrink-0 place-items-center rounded-sm bg-background px-2 py-1.5">
            <img src={pskLogo.url} alt="PSK" className="h-5 w-auto" />
          </span>
          <span className="truncate text-[13px] font-bold tracking-wide">{activeProduct}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <span className="hidden rounded-sm bg-white/15 px-2 py-1 text-[12px] font-bold sm:block">
            0.00 €
          </span>
          <button className="min-h-11 rounded-md px-2 text-[13px] font-bold tracking-wide hover:bg-white/10">
            DEPOSIT
          </button>
          <button
            aria-label="Account"
            className="grid h-11 w-11 place-items-center rounded-md hover:bg-white/10"
          >
            <User className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Desktop: unchanged PSK header. */}
      <div className="hidden grid-cols-[auto_minmax(0,1fr)_auto] items-stretch lg:grid">
        <Link
          to="/"
          className="flex shrink-0 items-center bg-background px-5 py-3 sm:px-8"
          aria-label="PSK home"
        >
          <img src={pskLogo.url} alt="PSK" className="h-6 w-auto sm:h-7" />
        </Link>

        <nav className="scroll-x flex min-w-0 items-stretch">
          {primaryNav.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="relative flex shrink-0 items-center px-3 text-[13px] font-semibold tracking-wide whitespace-nowrap transition-colors hover:bg-white/10 lg:px-4"
              activeProps={{ className: "bg-white/15" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
              {item.badge ? (
                <span className="absolute top-1 right-1 rounded-sm bg-badge-new px-1 text-[9px] leading-4 font-bold">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3 px-3 sm:gap-5 sm:px-5">
          <button className="relative hidden sm:block" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-badge-new text-[10px] font-bold">
              2
            </span>
          </button>
          <button className="text-[13px] font-bold tracking-wide">DEPOSIT</button>
          <User className="hidden h-5 w-5 sm:block" />
          <div className="hidden leading-tight md:block">
            <div className="text-[13px] font-bold">HackathonTest01</div>
            <div className="text-right text-[13px]">0.00 €</div>
          </div>
          <EyeOff className="hidden h-5 w-5 opacity-70 lg:block" />
        </div>
      </div>

      <MobileNavPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

/** Mobile search entry — sits directly under the header. */
export function PskMobileSearch({ onSearch }: { onSearch?: () => void }) {
  return (
    <div className="bg-subnav px-3 py-2 lg:hidden">
      <button
        onClick={onSearch}
        aria-label="Search matches"
        className="grid min-h-11 w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-md bg-surface-2 px-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">Search matches, competitions, players</span>
      </button>
    </div>
  );
}

export function PskSubNav({
  className,
  onSearch,
}: {
  className?: string;
  onSearch?: () => void;
}) {
  return (
    <div className={cn("hidden bg-subnav lg:block", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 sm:px-5">
        <nav className="scroll-x flex min-w-0 items-center gap-1">
          {subNav.map((item) => (
            <span
              key={item}
              className="shrink-0 cursor-pointer px-3 py-3 text-[13px] whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
            >
              {item}
            </span>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onSearch}
            aria-label="Search matches"
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
          <button className="flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground">
            <Moon className="h-4 w-4" />
            DARK
          </button>
        </div>
      </div>
    </div>
  );
}

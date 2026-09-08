import { Link } from "@tanstack/react-router";
import { Bell, EyeOff, Moon, Search, User } from "lucide-react";
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

export function PskHeader() {
  return (
    <header className="sticky top-0 z-40 bg-header text-header-foreground">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-stretch">
        <Link
          to="/"
          className="flex shrink-0 items-center bg-background px-5 py-3 sm:px-8"
          aria-label="PSK home"
        >
          <img src={pskLogo.url} alt="PSK" className="h-6 w-auto sm:h-7" />
        </Link>

        <nav className="flex min-w-0 items-stretch overflow-x-auto">
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
    </header>
  );
}

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

export function PskSubNav({
  className,
  onSearch,
}: {
  className?: string;
  onSearch?: () => void;
}) {
  return (
    <div className={cn("bg-subnav", className)}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 sm:px-5">
        <nav className="flex min-w-0 items-center gap-1 overflow-x-auto">
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

import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { productFromPath } from "@/core";
import { useSession } from "@/lib/session-intelligence";
import { PskHeader, PskMobileSearch, PskSubNav } from "./PskHeader";
import { PskSidebar } from "./PskSidebar";
import { BetslipRail, BetslipSheet } from "./Betslip";
import { SearchOverlay } from "./SearchOverlay";
import { IntelligenceTrace } from "./IntelligenceTrace";
import { SportsHero } from "./SportsHero";

export function AppShell({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { enterProduct } = useSession();
  const sportsSurface = pathname === "/" || pathname.startsWith("/match/");
  // Casino surfaces carry their own game search, so the generic mobile search
  // bar is not repeated there.
  const hasOwnSearch = pathname.startsWith("/casino") || pathname.startsWith("/live-casino");

  // Product recognition follows real navigation only — no simulated moves.
  useEffect(() => {
    enterProduct(productFromPath(pathname));
  }, [pathname, enterProduct]);

  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-background">
      <PskHeader />
      <PskMobileSearch onSearch={() => setSearchOpen(true)} />
      <PskSubNav onSearch={() => setSearchOpen(true)} />
      <div className="flex min-h-0 w-full min-w-0 flex-1 items-start">
        <PskSidebar className="sticky top-[104px] hidden max-h-[calc(100vh-104px)] lg:block" />
        <main className="min-w-0 flex-1 px-3 pt-4 pb-32 sm:px-5 xl:pb-8">
          {sportsSurface ? <SportsHero /> : null}
          {children}
        </main>
        <BetslipRail className="sticky top-[104px] hidden max-h-[calc(100vh-104px)] xl:block" />
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <BetslipSheet />
      <IntelligenceTrace />
    </div>
  );
}

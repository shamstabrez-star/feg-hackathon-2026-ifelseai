import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { productFromPath } from "@/core";
import { useSession } from "@/lib/session-intelligence";
import { PskHeader, PskMobileSearch, PskSubNav } from "./PskHeader";
import { PskSidebar } from "./PskSidebar";
import { BetslipRail, BetslipSheet } from "./Betslip";
import { SportsHero } from "./SportsHero";

// Non-critical surfaces: the search overlay only exists once opened and the
// judge panel is loaded after the page is idle, keeping the first paint light.
const SearchOverlay = lazy(() =>
  import("./SearchOverlay").then((m) => ({ default: m.SearchOverlay })),
);
const IntelligenceTrace = lazy(() =>
  import("./IntelligenceTrace").then((m) => ({ default: m.IntelligenceTrace })),
);

export function AppShell({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [traceReady, setTraceReady] = useState(false);

  useEffect(() => {
    const idle = (
      window as unknown as { requestIdleCallback?: (cb: () => void) => number }
    ).requestIdleCallback;
    if (idle) {
      idle(() => setTraceReady(true));
      return;
    }
    const t = window.setTimeout(() => setTraceReady(true), 300);
    return () => window.clearTimeout(t);
  }, []);

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
      {hasOwnSearch ? null : <PskMobileSearch onSearch={() => setSearchOpen(true)} />}
      <PskSubNav onSearch={() => setSearchOpen(true)} />
      <div className="flex min-h-0 w-full min-w-0 flex-1 items-start">
        <PskSidebar className="sticky top-[104px] hidden max-h-[calc(100vh-104px)] lg:block" />
        <main className="min-w-0 flex-1 px-3 pt-4 pb-32 sm:px-5 xl:pb-8">
          {sportsSurface ? <SportsHero /> : null}
          {children}
        </main>
        <BetslipRail className="sticky top-[104px] hidden max-h-[calc(100vh-104px)] xl:block" />
      </div>
      {searchOpen ? (
        <Suspense fallback={null}>
          <SearchOverlay open onClose={() => setSearchOpen(false)} />
        </Suspense>
      ) : null}
      <BetslipSheet />
      {traceReady ? (
        <Suspense fallback={null}>
          <IntelligenceTrace />
        </Suspense>
      ) : null}
    </div>
  );
}

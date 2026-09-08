import { useState, type ReactNode } from "react";
import { PskHeader, PskSubNav } from "./PskHeader";
import { PskSidebar } from "./PskSidebar";
import { BetslipRail, BetslipSheet } from "./Betslip";
import { SearchOverlay } from "./SearchOverlay";
import { IntelligenceTrace } from "./IntelligenceTrace";

export function AppShell({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PskHeader />
      <PskSubNav onSearch={() => setSearchOpen(true)} />
      <div className="flex min-h-0 flex-1 items-start">
        <PskSidebar className="sticky top-[104px] hidden max-h-[calc(100vh-104px)] lg:block" />
        <main className="min-w-0 flex-1 px-3 pt-4 pb-28 sm:px-5 xl:pb-8">{children}</main>
        <BetslipRail className="sticky top-[104px] hidden max-h-[calc(100vh-104px)] xl:block" />
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <BetslipSheet />
      <IntelligenceTrace />
    </div>
  );
}

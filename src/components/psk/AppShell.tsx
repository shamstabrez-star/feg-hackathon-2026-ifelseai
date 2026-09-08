import type { ReactNode } from "react";
import { PskHeader, PskSubNav } from "./PskHeader";
import { PskSidebar } from "./PskSidebar";
import { BetslipRail } from "./BetslipRail";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PskHeader />
      <PskSubNav />
      <div className="flex min-h-0 flex-1 items-start">
        <PskSidebar className="sticky top-[104px] hidden max-h-[calc(100vh-104px)] lg:block" />
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-5">{children}</main>
        <BetslipRail className="sticky top-[104px] hidden xl:block" />
      </div>
    </div>
  );
}

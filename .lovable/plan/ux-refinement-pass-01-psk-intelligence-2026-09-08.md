# UX Refinement Pass 01 — PSK Intelligence

A refinement of the existing implementation. No rebuild, no framework change, no new products. PSK logo, colours, product names, navigation, event cards, odds layout and the Sports → Search → Match → Selection → Betslip → Confirmation journey stay as they are.

## 1. Mobile recomposition (highest priority)

Header (`PskHeader.tsx`)
- Phone view: PSK logo, current product name, account balance chip and a menu button. Full product list moves into a slide-out panel (the same items, same names, same order) instead of a sideways-scrolling bar.
- Secondary row (Mobile app, Results, Statistics, …) becomes a compact "More" menu on phones; unchanged on desktop.
- Search gets a proper place directly under the header on mobile.

Sports page order on mobile: header → search → Live/Today/1H/3H/Tomorrow → Football → category chips → event groups.

Scrolling rules
- No page-level sideways scrolling at any width.
- Sideways scrolling kept only for filter chips, market tabs and dense odds rows, styled deliberately (hidden scrollbar, edge fade, snap) so it reads as intentional.

## 2. Information-rich, better organised

Sidebar (`PskSidebar.tsx`) gains three quiet section headings, keeping every existing item:
- Sports — BetBuilder, SafeBet, PSK TV
- Discover — All Sports, Bonus Tip, TOP OFFER
- Sports — Football, Basketball, Tennis, Ice Hockey, Handball

Spacing, grouping and progressive disclosure improve; nothing is removed.

## 3. "We recommend" reacts to the session

Same component and styling; only the heading and ordering respond to live context:
- no context → "We recommend"
- previously viewed match → "Continue where you left off"
- active search context → "Related to your search"
- strong context → "Relevant to you"

No badges, no explanations, no AI wording. When there is no reason to adapt, it stays the ordinary rail.

## 4. Search and match

- Typo handling stays: Madird resolves to Real Madrid with no correction popup; intent stays available as session context.
- Match page keeps "Relevant markets" first (1X2, Double Chance, Goals as context dictates) with "More markets" holding the complete offer behind progressive disclosure.

## 5. Betslip

- Desktop right rail unchanged.
- Mobile sheet: clean open/close, inner scrolling, Confirm always reachable above the safe area, comfortable tap targets, clear selection state.
- Customer wording changes from "Responsible play check: PASS — Session within prototype play limits" to "✓ Responsible play check passed". The full reasoning stays in the judge trace only.

## 6. Completion as success

After "Bet accepted": ticket details stay, primary action becomes "View ticket", secondary "Return to Sports". "Continue betting" is no longer the dominant action. No follow-up suggestions, no engagement loop.

## 7. Intelligence trace (judge-only)

- Collapsed: "⌁ PSK Intelligence · Session active", session reference kept subtle.
- Mobile: opens as a clean bottom sheet, never overlapping the betslip.
- Expanded: Session, Intent, Context, Journey stage, Friction, Decision, Responsible Gate, Performance (measured values only, otherwise "Not measured"), Outcome.
- After confirmation: Experience Decision NONE — "Journey completed successfully. No additional intervention required."
- Presentation stays evidence-like, not a control panel. Existing evidence sections are retained.

## 8. Microinteractions

Restrained polish only on odds selected/pressed state, keyboard focus, betslip update, search loading and match transition. Reduced-motion respected.

## 9. Not included

No urgency, scarcity, streaks, gamification, keep-playing prompts or countdowns. No invented performance numbers. No changes to Casino, Live Casino, Loto, Forum, PSK Arena, and no payment/KYC/registration/chatbot work.

## Technical notes

- Files touched: `PskHeader.tsx`, `PskSidebar.tsx`, `AppShell.tsx`, `Betslip.tsx`, `IntelligenceTrace.tsx`, `SearchOverlay.tsx`, `src/routes/index.tsx`, `src/routes/match.$matchId.tsx`, `src/styles.css`.
- Mobile menu and trace sheet are local UI state in the existing shell; no new routes, no new dependencies.
- The recommend-rail heading and ordering read the existing session context/relevance layers in `src/core`; no new engine.
- Layout uses `grid-cols-[minmax(0,1fr)_auto]` + `min-w-0` / `shrink-0` patterns to guarantee no overflow.

## Verification

Playwright run of the full journey (search Madird → Real Madrid → match → relevant markets → selection → betslip → Confirm → Bet accepted → trace NONE) at 1440px, 834px and 390px, checking zero horizontal overflow, no clipped navigation or buttons, reachable Confirm, non-overlapping trace and no console errors.

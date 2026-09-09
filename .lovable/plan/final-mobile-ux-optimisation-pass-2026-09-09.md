# Final mobile + UX optimisation pass

Polish only. No new features, no redesign, no engine changes. Verified on device now: no page-level horizontal overflow at 375 or 430 on Sports or Casino, and no console errors. The issues below are what the audit actually found.

## What gets fixed

### 1. Touch targets (Sports, 22 undersized controls at 375/430)
The time-filter strip (LIVE / TODAY / 1H / 3H / TOMORROW), the category chips, the hero dots, and the rail arrows are under a comfortable tap size on phones. Raise all of them to a minimum 44px touch height with adequate spacing so neighbouring chips can't be hit by accident. Visual size stays close to today's — the tappable area grows via padding, not by enlarging text.

### 2. Duplicated / mislabelled search on Casino mobile
On Casino at phone width the page shows two search fields: the shell's "Search matches, competitions, players" bar and the Casino "Find your game" field. Fix by making the shell's mobile search bar product-aware — it reads "Find your game" and opens Casino search on Casino, and the Casino page drops its own duplicate field on phones only (it stays on tablet and desktop where there is room). One obvious search entry per screen.

### 3. Casino category strip on phones
The Lobby / Providers / Jackpots / Themes strip is cramped and its labels are small. Increase row height and label size, add edge padding so the last tab is reachable, and keep the active tab underline clearly visible. Remains a horizontally scrollable strip — that is intentional and allowed.

### 4. Stacking of bottom-anchored surfaces
Confirm the collapsed betslip bar, the mobile bottom sheet, and the collapsed judge panel never overlap each other or the last row of content at 375/390/430. Add the bottom spacing needed so the final content row is fully reachable and Confirm is never behind the judge bar.

### 5. Selected-odds state not colour-only
Selected odds already change colour; add a non-colour cue (border weight plus a checkmark or bold outline) so selection is clear without relying on colour, and ensure the change causes no layout shift.

### 6. Breakpoint sanity sweep
Walk 375, 390, 430, 768, 834, 1024 and 1440 and correct anything clipped, cramped, or awkwardly stretched — mainly the odds row, event card meta line, hero height, and Casino card labels. 430 gets slightly wider cards than 375 rather than the same layout scaled up.

## Explicitly not touched

Session Engine, Intent, typo correction, Context Memory, Friction, Experience Decision, Responsible Gate, Decision Ready, betslip logic and confirm flow, Casino content orchestration (SHOW / PRIORITISE / DEFER / SILENCE), hero decision logic, carousel timing and pause rules, lazy loading and deferred rows, judge panel contents, evidence and provenance.

No urgency, no auto-place, no post-completion promotion, no recommendation UI, no fabricated metrics.

## Validation

- Typecheck, lint, Prettier.
- Component tests (39) and `bun run test:e2e` — must stay green, including the existing carousel snapshots. If a snapshot changes only because a tapped strip got taller, the baseline is updated deliberately and noted.
- Real-browser walk at 375 and 430 of: Sports → search "Madird" → Real Madrid → open match → select outcome → open betslip → Selection / Odds / Stake / Potential return / Payment method → Confirm → Bet accepted → Done → COMPLETION/EXIT, decision NONE.
- Casino at 375: hero and real PSK content, search "diamonds" prioritises Diamond titles, scroll loads rows progressively, carousel stays calm and pauses on touch.
- Checks each pass: no console errors, no page-level horizontal scroll, no broken images, no clipped text, no undersized controls.

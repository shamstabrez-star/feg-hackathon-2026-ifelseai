# Friction Intelligence

Extend the existing friction layer so PSK Intelligence can tell the difference between a customer exploring and a customer struggling. No new screens, no popups, no rebuild.

## What changes for the customer

Nothing visible is added. When the system detects real difficulty, the existing experience simply becomes easier: the known target is prioritised in search and on the Sports rail, and search context is preserved. Full offer stays available — ordering changes only, nothing is removed.

## What changes for judges

The trace gains a plain-language friction explanation that updates live from real interactions:

- Friction LOW · Reason "Normal exploration" · Decision NONE
- Friction MEDIUM · Reason "Repeated search reformulation" · Decision SIMPLIFY · Response "Prioritise relevant result"
- Friction LOW · Reason "Target discovered" · Decision CONTINUE

## Behaviour rules

Normal sportsbook behaviour stays LOW: one Back click, opening several markets, moving between an event and Sports, browsing competitions, expanding/collapsing, scrolling, filters, viewing multiple events.

MEDIUM only on conservative repeated evidence:
- two or more genuinely different queries in a short window with no event opened
- two or more empty-result searches
- three or more return trips between Sports and an event with no market opened, no selection, no new event

HIGH only when several of those hold together (repeated failed searches AND repeated navigation AND no target discovered). Never from time alone, never from click count alone.

Recovery is explicit: as soon as a target is discovered (an event opened, a query resolved with usable results, or a selection made), accumulated search/navigation strain is released and friction returns to LOW with reason "Target discovered". A session is never permanently labelled.

Decision mapping: LOW + clear intent → NONE or CONTINUE; MEDIUM + repeated search → SIMPLIFY; MEDIUM + strong target → DISCOVER; HIGH + clear target → SIMPLIFY; completed journey → NONE. Responsible gate stays independent — SILENCE suppresses any optimisation, ADAPT keeps the existing responsible adaptation.

## Technical notes

- `src/core/friction-engine.ts`: return `{ score, level, reason }` from a single `evaluateFriction(input)`. Add productive-progress detection (`markets opened`, `event opened after search`, `selection made`) that decays search/navigation strain instead of accumulating it. Keep bands LOW <20, MEDIUM 20–49, HIGH ≥50 and keep the additive, transparent scoring.
- `src/core/session-state.ts`: track the small extra counters needed for loop detection — Sports↔event round trips (increment when the lobby is re-entered after an event with no progress in between), unresolved search cycles, and a `targetDiscovered` flag reset on context switch. Reset all strain on `exit`. Surface `frictionReason` on the derived model and on `SessionContextModel`.
- `src/core/experience-decision.ts`: replace the raw `friction >= 20 || emptySearches > 0` branch with level + reason aware rules per the mapping above, including MEDIUM + strong target → DISCOVER and the recovery path → CONTINUE.
- `src/routes/index.tsx` (Sports lobby): log the lobby re-entry event that feeds round-trip detection. No visual change.
- `src/components/psk/IntelligenceTrace.tsx`: add Friction reason and Response rows next to the existing Friction/Decision stats; judge-only.
- SIMPLIFY response continues to run through the existing relevance/contextual layer — no new UI component.

## Verification

Playwright at 1440 / 834 / 430 / 375 px:
1. Recovery scenario: ambiguous query → reformulation → `Madird` → Real Madrid – Inter Milano. Expect LOW → MEDIUM → LOW, decision CONTINUE or DISCOVER, no customer-visible warning.
2. Exploration scenario: match → several markets → Back → another event → Sports. Expect friction stays LOW, reason "Normal exploration", no intervention.
3. Completion scenario: selection → Place bet → Confirm → Bet accepted → Done. Expect LOW, decision NONE, completion reason, context cleared.
4. No horizontal overflow, no console errors, no regression to search, typo handling, intent, context switching, markets, betslip, confirmation or completion.
